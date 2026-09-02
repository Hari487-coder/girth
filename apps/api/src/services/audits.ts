import type { Measurement, TreeStatus } from '@prisma/client'
import {
  assertTransition,
  canTransition,
  classifyDiscrepancy,
  shouldSelectForAudit,
  type RecordAuditResultInput,
} from '@girth/domain'
import type { Env } from '../config/env.js'
import type { Db, Tx } from '../lib/prisma.js'
import { notFound, unprocessable } from '../lib/errors.js'
import type { AuthUser } from '../plugins/auth.js'
import { recordAudit } from './auditLog.js'
import { enqueueEvent, EVENT } from './notifications.js'
import { reverseLedgerForMeasurement } from './payments.js'
import { storePhoto, type UploadedFile } from './photos.js'
import { getNumberSetting, SETTING } from './settings.js'
import type { Storage } from './storage.js'
import type { RequestMeta } from './trees.js'

/** Runs on every verification: a configurable share of readings gets a field visit. */
export async function maybeScheduleAudit(
  tx: Tx,
  env: Env,
  actor: AuthUser,
  measurement: Measurement,
  meta: RequestMeta = {},
): Promise<boolean> {
  const rate = await getNumberSetting(tx, SETTING.AUDIT_SAMPLING_RATE)
  if (!shouldSelectForAudit(measurement.id, env.AUDIT_SAMPLING_SALT, rate)) return false
  return scheduleAudit(tx, actor, measurement, 'Random sample', meta)
}

export async function scheduleAudit(
  tx: Tx,
  actor: AuthUser,
  measurement: Measurement,
  reason: string,
  meta: RequestMeta = {},
): Promise<boolean> {
  if (measurement.auditStatus !== 'NONE') return false
  const audit = await tx.audit.create({
    data: {
      measurementId: measurement.id,
      treeId: measurement.treeId,
      reportedGirthCm: measurement.girthCm,
    },
  })
  await tx.measurement.update({ where: { id: measurement.id }, data: { auditStatus: 'SELECTED' } })
  await recordAudit(tx, {
    actor,
    action: 'audit.scheduled',
    entityType: 'Audit',
    entityId: audit.id,
    newState: { measurementId: measurement.id, reportedGirthCm: measurement.girthCm },
    reason,
    ...meta,
  })
  await enqueueEvent(tx, {
    eventType: EVENT.AUDIT_SCHEDULED,
    entityType: 'Audit',
    entityId: audit.id,
    payload: { measurementId: measurement.id, treeId: measurement.treeId },
  })
  return true
}

/**
 * Records what the auditor found. The original measurement is never edited:
 * the discrepancy lives on the audit, the tree is flagged, and unpaid
 * eligibility for a materially wrong reading is cancelled.
 */
export async function recordAuditResult(
  db: Db,
  storage: Storage,
  actor: AuthUser,
  auditId: string,
  input: RecordAuditResultInput,
  photo: UploadedFile | undefined,
  meta: RequestMeta = {},
) {
  return db.$transaction(async (tx) => {
    const audit = await tx.audit.findUnique({ where: { id: auditId }, include: { measurement: true, tree: true } })
    if (!audit) throw notFound('Audit not found')
    if (audit.result !== 'PENDING') throw unprocessable('This audit already has a result')
    if (input.observedGirthCm === undefined && !input.observedStatus) {
      throw unprocessable('Record an observed girth or an observed tree status')
    }

    let result: 'PASS' | 'MINOR_DISCREPANCY' | 'MAJOR_DISCREPANCY' | 'FRAUD_SUSPECTED' = 'PASS'
    let differenceCm: number | null = null
    if (input.observedGirthCm !== undefined) {
      const classified = classifyDiscrepancy(audit.reportedGirthCm.toNumber(), input.observedGirthCm)
      differenceCm = classified.differenceCm
      result = classified.result
    }
    if (input.observedStatus === 'DEAD') result = result === 'PASS' ? 'MAJOR_DISCREPANCY' : result
    if (input.fraudSuspected) result = 'FRAUD_SUSPECTED'

    const updated = await tx.audit.update({
      where: { id: audit.id },
      data: {
        auditorId: actor.id,
        performedAt: new Date(),
        observedGirthCm: input.observedGirthCm ?? null,
        observedStatus: (input.observedStatus as TreeStatus | undefined) ?? null,
        differenceCm,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        result,
        notes: input.notes ?? null,
      },
    })
    await tx.measurement.update({ where: { id: audit.measurementId }, data: { auditStatus: 'COMPLETED' } })

    if (photo) {
      await storePhoto(tx, storage, photo, {
        treeId: audit.treeId,
        auditId: audit.id,
        uploadedById: actor.id,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      })
    }

    await recordAudit(tx, {
      actor,
      action: 'audit.result_recorded',
      entityType: 'Audit',
      entityId: audit.id,
      previousState: { result: 'PENDING', reportedGirthCm: audit.reportedGirthCm },
      newState: { result, observedGirthCm: input.observedGirthCm ?? null, differenceCm },
      reason: input.notes,
      ...meta,
    })

    const material = result === 'MAJOR_DISCREPANCY' || result === 'FRAUD_SUSPECTED'
    if (material) {
      await reverseLedgerForMeasurement(
        tx,
        actor,
        audit.measurementId,
        `Audit ${result.toLowerCase().replace('_', ' ')}: reported ${audit.reportedGirthCm} cm, observed ${input.observedGirthCm ?? 'n/a'} cm`,
        meta,
      )
      const tree = audit.tree
      const target: TreeStatus = input.observedStatus === 'DEAD' ? 'DEAD' : 'FLAGGED'
      if (canTransition(tree.status, target)) {
        assertTransition(tree.status, target)
        await tx.tree.update({ where: { id: tree.id }, data: { status: target } })
        await tx.treeStatusHistory.create({
          data: {
            treeId: tree.id,
            fromStatus: tree.status,
            toStatus: target,
            changedById: actor.id,
            reason: `Audit ${audit.id}: ${result}`,
          },
        })
        await recordAudit(tx, {
          actor,
          action: 'tree.status_changed',
          entityType: 'Tree',
          entityId: tree.id,
          previousState: { status: tree.status },
          newState: { status: target },
          reason: `Audit ${result}`,
          ...meta,
        })
        const sponsors = await tx.sponsorship.findMany({ where: { treeId: tree.id }, select: { customerId: true } })
        await enqueueEvent(tx, {
          eventType: target === 'DEAD' ? EVENT.TREE_CONFIRMED_DEAD : EVENT.MEASUREMENT_FLAGGED,
          entityType: 'Tree',
          entityId: tree.id,
          recipientUserIds: sponsors.map((s) => s.customerId),
          payload: { treeId: tree.publicId, auditResult: result },
        })
      }
    }

    return updated
  })
}
