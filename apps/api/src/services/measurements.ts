import type { Measurement, MeasurementStatus, TreeStatus } from '@prisma/client'
import {
  canTransition,
  isAlive,
  runMeasurementChecks,
  type ReviewMeasurementInput,
  type SubmitMeasurementInput,
} from '@girth/domain'
import type { Env } from '../config/env.js'
import type { Db, Tx } from '../lib/prisma.js'
import { forbidden, notFound, unprocessable } from '../lib/errors.js'
import type { AuthUser } from '../plugins/auth.js'
import { recordAudit } from './auditLog.js'
import { maybeScheduleAudit } from './audits.js'
import { enqueueEvent, EVENT } from './notifications.js'
import { createLedgerForVerification } from './payments.js'
import { storePhoto, type UploadedFile } from './photos.js'
import type { Storage } from './storage.js'
import { findTreeByPublicId, type RequestMeta } from './trees.js'

const MEASUREMENT_INCLUDE = { checks: true, photos: true } as const

export async function latestVerifiedBefore(tx: Db | Tx, treeId: string, before?: Date) {
  return tx.measurement.findFirst({
    where: {
      treeId,
      verificationStatus: 'VERIFIED',
      ...(before ? { measurementDate: { lt: before } } : {}),
    },
    orderBy: [{ measurementDate: 'desc' }, { submittedAt: 'desc' }],
  })
}

function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Accepts a reading, runs the automated checks, stores the evidence and puts
 * the measurement in the review queue. Facts are written once; they never change.
 */
export async function submitMeasurement(
  db: Db,
  storage: Storage,
  actor: AuthUser,
  treePublicId: string,
  input: SubmitMeasurementInput,
  photo: UploadedFile | undefined,
  meta: RequestMeta = {},
) {
  const tree = await findTreeByPublicId(db, treePublicId)
  if (actor.role === 'FARMER' && tree.farmerId !== actor.farmerId) {
    throw forbidden('You can only measure trees on your own farm')
  }
  if (!['FARMER', 'FIELD_AUDITOR', 'ADMIN'].includes(actor.role)) throw forbidden()

  // Offline clients retry; the same submission id returns the same record.
  if (input.clientSubmissionId) {
    const existing = await db.measurement.findUnique({
      where: { treeId_clientSubmissionId: { treeId: tree.id, clientSubmissionId: input.clientSubmissionId } },
      include: MEASUREMENT_INCLUDE,
    })
    if (existing) return { measurement: existing, duplicate: true as const }
  }

  const previous = await latestVerifiedBefore(db, tree.id)
  const day = startOfDay(input.measurementDate)
  const sameDay = await db.measurement.findFirst({
    where: {
      treeId: tree.id,
      measurementDate: { gte: day, lt: new Date(day.getTime() + 86_400_000) },
      verificationStatus: { notIn: ['SUPERSEDED', 'FLAGGED', 'REMEASURE_REQUIRED'] },
    },
  })

  const outcome = runMeasurementChecks({
    tree: {
      publicId: tree.publicId,
      status: tree.status,
      plantingDate: tree.plantingDate,
      latitude: tree.latitude,
      longitude: tree.longitude,
    },
    previous: previous
      ? { girthCm: previous.girthCm.toNumber(), measurementDate: previous.measurementDate }
      : null,
    submission: {
      measurementDate: input.measurementDate,
      measurementHeightCm: input.measurementHeightCm,
      girthCm: input.girthCm,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      hasPhoto: !!photo,
      submittedAt: new Date(),
    },
    duplicateOfDate: !!sameDay,
  })
  if (outcome.hardFailure) {
    throw unprocessable(outcome.summary, outcome.checks)
  }

  const measurement = await db.$transaction(async (tx) => {
    const created = await tx.measurement.create({
      data: {
        treeId: tree.id,
        submittedById: actor.id,
        measurementDate: input.measurementDate,
        measurementHeightCm: input.measurementHeightCm,
        girthCm: input.girthCm,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        distanceFromTreeM: outcome.distanceFromTreeM,
        deviceMetadata: input.deviceMetadata ?? null,
        clientSubmissionId: input.clientSubmissionId ?? null,
        notes: input.notes ?? null,
        verificationStatus: 'PENDING_REVIEW',
        anomaly: outcome.anomaly,
        checks: {
          create: outcome.checks.map((c) => ({
            key: c.key,
            passed: c.passed,
            severity: c.severity,
            detail: c.detail,
          })),
        },
      },
    })
    if (photo) {
      await storePhoto(tx, storage, photo, {
        treeId: tree.id,
        measurementId: created.id,
        uploadedById: actor.id,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      })
    }
    await recordAudit(tx, {
      actor,
      action: 'measurement.submitted',
      entityType: 'Measurement',
      entityId: created.id,
      newState: {
        treeId: tree.publicId,
        girthCm: input.girthCm,
        measurementDate: input.measurementDate,
        anomaly: outcome.anomaly,
        summary: outcome.summary,
      },
      ...meta,
    })
    await enqueueEvent(tx, {
      eventType: EVENT.MEASUREMENT_SUBMITTED,
      entityType: 'Measurement',
      entityId: created.id,
      payload: { treeId: tree.publicId, girthCm: input.girthCm, anomaly: outcome.anomaly },
    })
    return tx.measurement.findUniqueOrThrow({ where: { id: created.id }, include: MEASUREMENT_INCLUDE })
  })

  return { measurement, duplicate: false as const }
}

const REVIEWABLE: MeasurementStatus[] = ['PENDING_REVIEW', 'FLAGGED', 'REMEASURE_REQUIRED']

/** Human decision on a submitted reading. Only reviewers; never the submitter of that reading. */
export async function reviewMeasurement(
  db: Db,
  env: Env,
  actor: AuthUser,
  measurementId: string,
  input: ReviewMeasurementInput,
  meta: RequestMeta = {},
) {
  if (!['FIELD_AUDITOR', 'ADMIN'].includes(actor.role)) throw forbidden()

  return db.$transaction(async (tx) => {
    const measurement = await tx.measurement.findUnique({
      where: { id: measurementId },
      include: { tree: { include: { farmer: { select: { id: true, userId: true } } } }, photos: true },
    })
    if (!measurement) throw notFound('Measurement not found')
    if (!REVIEWABLE.includes(measurement.verificationStatus)) {
      throw unprocessable(`Measurement is ${measurement.verificationStatus} and cannot be reviewed`)
    }
    if (measurement.submittedById === actor.id && actor.role !== 'ADMIN') {
      throw forbidden('A reading cannot be verified by the person who submitted it')
    }

    const tree = measurement.tree
    const previousStatus = measurement.verificationStatus
    const now = new Date()

    if (input.decision === 'VERIFIED') {
      const previous = await latestVerifiedBefore(tx, tree.id, measurement.measurementDate)
      const growthCm = previous
        ? Math.round((measurement.girthCm.toNumber() - previous.girthCm.toNumber()) * 10) / 10
        : null

      await tx.measurement.update({
        where: { id: measurement.id },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedById: actor.id,
          verifiedAt: now,
          verificationNotes: input.notes ?? null,
        },
      })
      await tx.photo.updateMany({
        where: { measurementId: measurement.id },
        data: { verificationStatus: 'VERIFIED', isPublic: true },
      })

      const newestVerified = await latestVerifiedBefore(tx, tree.id)
      const isNewest = !newestVerified || newestVerified.measurementDate <= measurement.measurementDate
      let treeStatus: TreeStatus = tree.status
      if (isAlive(tree.status) && tree.status !== 'ACTIVE' && canTransition(tree.status, 'ACTIVE')) {
        treeStatus = 'ACTIVE'
      }
      await tx.tree.update({
        where: { id: tree.id },
        data: {
          status: treeStatus,
          ...(isNewest
            ? { currentGirthCm: measurement.girthCm, currentGirthDate: measurement.measurementDate }
            : {}),
        },
      })
      if (treeStatus !== tree.status) {
        await tx.treeStatusHistory.create({
          data: {
            treeId: tree.id,
            fromStatus: tree.status,
            toStatus: treeStatus,
            changedById: actor.id,
            reason: `Measurement ${measurement.id} verified`,
          },
        })
      }

      await recordAudit(tx, {
        actor,
        action: 'measurement.verified',
        entityType: 'Measurement',
        entityId: measurement.id,
        previousState: { verificationStatus: previousStatus },
        newState: { verificationStatus: 'VERIFIED', girthCm: measurement.girthCm, growthCm },
        reason: input.notes,
        ...meta,
      })

      let payout = { totalPaise: 0, count: 0 }
      if (tree.farmer) {
        payout = await createLedgerForVerification(
          tx,
          actor,
          {
            farmerId: tree.farmer.id,
            farmerUserId: tree.farmer.userId,
            treeId: tree.id,
            treePublicId: tree.publicId,
            measurementId: measurement.id,
            treeAlive: isAlive(treeStatus),
            growthCm,
          },
          meta,
        )
      }

      const fresh = await tx.measurement.findUniqueOrThrow({ where: { id: measurement.id } })
      const auditScheduled = await maybeScheduleAudit(tx, env, actor, fresh, meta)

      const sponsors = await tx.sponsorship.findMany({ where: { treeId: tree.id }, select: { customerId: true } })
      await enqueueEvent(tx, {
        eventType: EVENT.MEASUREMENT_VERIFIED,
        entityType: 'Measurement',
        entityId: measurement.id,
        recipientUserIds: [tree.farmer?.userId, ...sponsors.map((s) => s.customerId)],
        payload: { treeId: tree.publicId, girthCm: measurement.girthCm.toNumber(), growthCm },
      })

      return {
        measurement: await tx.measurement.findUniqueOrThrow({ where: { id: measurement.id }, include: MEASUREMENT_INCLUDE }),
        growthCm,
        payout,
        auditScheduled,
      }
    }

    const nextStatus: MeasurementStatus = input.decision === 'FLAGGED' ? 'FLAGGED' : 'REMEASURE_REQUIRED'
    await tx.measurement.update({
      where: { id: measurement.id },
      data: {
        verificationStatus: nextStatus,
        verifiedById: actor.id,
        verifiedAt: now,
        verificationNotes: input.notes ?? null,
      },
    })
    const treeTarget: TreeStatus = input.decision === 'FLAGGED' ? 'FLAGGED' : 'NEEDS_ATTENTION'
    if (tree.status !== treeTarget && canTransition(tree.status, treeTarget)) {
      await tx.tree.update({ where: { id: tree.id }, data: { status: treeTarget } })
      await tx.treeStatusHistory.create({
        data: {
          treeId: tree.id,
          fromStatus: tree.status,
          toStatus: treeTarget,
          changedById: actor.id,
          reason: `Measurement ${measurement.id} ${nextStatus.toLowerCase()}`,
        },
      })
    }
    await recordAudit(tx, {
      actor,
      action: input.decision === 'FLAGGED' ? 'measurement.flagged' : 'measurement.remeasure_requested',
      entityType: 'Measurement',
      entityId: measurement.id,
      previousState: { verificationStatus: previousStatus },
      newState: { verificationStatus: nextStatus },
      reason: input.notes,
      ...meta,
    })
    await enqueueEvent(tx, {
      eventType: input.decision === 'FLAGGED' ? EVENT.MEASUREMENT_FLAGGED : EVENT.TREE_NEEDS_ATTENTION,
      entityType: 'Measurement',
      entityId: measurement.id,
      recipientUserIds: [tree.farmer?.userId],
      payload: { treeId: tree.publicId, decision: input.decision, notes: input.notes ?? null },
    })

    return {
      measurement: await tx.measurement.findUniqueOrThrow({ where: { id: measurement.id }, include: MEASUREMENT_INCLUDE }),
      growthCm: null,
      payout: { totalPaise: 0, count: 0 },
      auditScheduled: false,
    }
  })
}

export function listQueue(db: Db) {
  return db.measurement.findMany({
    where: { verificationStatus: { in: ['PENDING_REVIEW', 'FLAGGED', 'REMEASURE_REQUIRED'] } },
    orderBy: [{ anomaly: 'desc' }, { submittedAt: 'asc' }],
    include: {
      ...MEASUREMENT_INCLUDE,
      tree: { select: { publicId: true, species: true, status: true, currentGirthCm: true } },
      submittedBy: { select: { name: true, role: true } },
    },
  })
}

export type MeasurementWithEvidence = Measurement & {
  checks: { key: string; passed: boolean; severity: string; detail: string }[]
}
