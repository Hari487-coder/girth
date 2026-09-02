import type { PaymentConfig } from '@prisma/client'
import { computePayoutLines, sumPaise, type PaymentConfigInputDto } from '@girth/domain'
import type { Db, Tx } from '../lib/prisma.js'
import { notFound, unprocessable } from '../lib/errors.js'
import type { AuthUser } from '../plugins/auth.js'
import { recordAudit } from './auditLog.js'
import { enqueueEvent, EVENT } from './notifications.js'
import type { RequestMeta } from './trees.js'

export function getActivePaymentConfig(db: Db | Tx): Promise<PaymentConfig | null> {
  return db.paymentConfig.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })
}

export async function setPaymentConfig(
  db: Db,
  actor: AuthUser,
  input: PaymentConfigInputDto,
  meta: RequestMeta = {},
) {
  return db.$transaction(async (tx) => {
    const previous = await getActivePaymentConfig(tx)
    if (previous) await tx.paymentConfig.update({ where: { id: previous.id }, data: { isActive: false } })
    const { reason, ...data } = input
    const config = await tx.paymentConfig.create({
      data: { ...data, isActive: true, createdById: actor.id },
    })
    await recordAudit(tx, {
      actor,
      action: 'payment_config.changed',
      entityType: 'PaymentConfig',
      entityId: config.id,
      previousState: previous,
      newState: config,
      reason,
      ...meta,
    })
    return config
  })
}

/**
 * Called when a measurement is verified. Writes ELIGIBLE ledger lines for the
 * farmer under the active config; nothing is written without a config.
 */
export async function createLedgerForVerification(
  tx: Tx,
  actor: AuthUser,
  input: {
    farmerId: string
    farmerUserId: string
    treeId: string
    treePublicId: string
    measurementId: string
    treeAlive: boolean
    growthCm: number | null
  },
  meta: RequestMeta = {},
): Promise<{ totalPaise: number; count: number }> {
  const config = await getActivePaymentConfig(tx)
  if (!config) return { totalPaise: 0, count: 0 }

  const lines = computePayoutLines(
    {
      currency: config.currency,
      basePaise: config.basePaise,
      survivalPaise: config.survivalPaise,
      growthBonusPaise: config.growthBonusPaise,
      minGrowthCmForBonus: config.minGrowthCmForBonus.toNumber(),
      deadPaise: config.deadPaise,
    },
    { treeAlive: input.treeAlive, growthCm: input.growthCm },
  )
  if (lines.length === 0) return { totalPaise: 0, count: 0 }

  const entries = await Promise.all(
    lines.map((line) =>
      tx.paymentLedger.create({
        data: {
          farmerId: input.farmerId,
          treeId: input.treeId,
          measurementId: input.measurementId,
          paymentConfigId: config.id,
          amountPaise: line.amountPaise,
          currency: config.currency,
          reason: line.reason,
          description: line.description,
          status: 'ELIGIBLE',
          createdById: actor.id,
        },
      }),
    ),
  )
  for (const entry of entries) {
    await recordAudit(tx, {
      actor,
      action: 'ledger.entry_created',
      entityType: 'PaymentLedger',
      entityId: entry.id,
      newState: { amountPaise: entry.amountPaise, reason: entry.reason, status: entry.status },
      ...meta,
    })
  }
  const totalPaise = sumPaise(lines)
  await enqueueEvent(tx, {
    eventType: EVENT.PAYMENT_ELIGIBLE,
    entityType: 'Tree',
    entityId: input.treeId,
    recipientUserIds: [input.farmerUserId],
    payload: { treeId: input.treePublicId, amountPaise: totalPaise, currency: config.currency },
  })
  return { totalPaise, count: entries.length }
}

/** Audit discrepancies cancel unpaid eligibility or record a negative adjustment. */
export async function reverseLedgerForMeasurement(
  tx: Tx,
  actor: AuthUser,
  measurementId: string,
  reason: string,
  meta: RequestMeta = {},
): Promise<void> {
  const entries = await tx.paymentLedger.findMany({ where: { measurementId, reason: { not: 'ADJUSTMENT' } } })
  for (const entry of entries) {
    if (entry.status === 'PAID') {
      const adjustment = await tx.paymentLedger.create({
        data: {
          farmerId: entry.farmerId,
          treeId: entry.treeId,
          measurementId: entry.measurementId,
          paymentConfigId: entry.paymentConfigId,
          amountPaise: -entry.amountPaise,
          currency: entry.currency,
          reason: 'ADJUSTMENT',
          description: `Reversal of ${entry.reason.toLowerCase()} payment: ${reason}`,
          status: 'ELIGIBLE',
          createdById: actor.id,
        },
      })
      await recordAudit(tx, {
        actor,
        action: 'ledger.adjustment_created',
        entityType: 'PaymentLedger',
        entityId: adjustment.id,
        previousState: { reverses: entry.id, amountPaise: entry.amountPaise },
        newState: { amountPaise: adjustment.amountPaise },
        reason,
        ...meta,
      })
    } else if (entry.status !== 'CANCELLED') {
      await tx.paymentLedger.update({ where: { id: entry.id }, data: { status: 'CANCELLED' } })
      await recordAudit(tx, {
        actor,
        action: 'ledger.entry_cancelled',
        entityType: 'PaymentLedger',
        entityId: entry.id,
        previousState: { status: entry.status },
        newState: { status: 'CANCELLED' },
        reason,
        ...meta,
      })
    }
  }
}

export async function markLedgerPaid(
  db: Db,
  actor: AuthUser,
  ledgerId: string,
  input: { externalPaymentId: string; paidAt?: Date; reason?: string },
  meta: RequestMeta = {},
) {
  return db.$transaction(async (tx) => {
    const entry = await tx.paymentLedger.findUnique({ where: { id: ledgerId }, include: { farmer: true } })
    if (!entry) throw notFound('Ledger entry not found')
    if (entry.status === 'PAID') throw unprocessable('Entry is already paid')
    if (entry.status === 'CANCELLED') throw unprocessable('Cancelled entries cannot be paid')
    const paidAt = input.paidAt ?? new Date()
    const updated = await tx.paymentLedger.update({
      where: { id: entry.id },
      data: { status: 'PAID', paidAt, externalPaymentId: input.externalPaymentId },
    })
    await recordAudit(tx, {
      actor,
      action: 'ledger.marked_paid',
      entityType: 'PaymentLedger',
      entityId: entry.id,
      previousState: { status: entry.status },
      newState: { status: 'PAID', externalPaymentId: input.externalPaymentId, paidAt },
      reason: input.reason,
      ...meta,
    })
    await enqueueEvent(tx, {
      eventType: EVENT.PAYMENT_COMPLETED,
      entityType: 'PaymentLedger',
      entityId: entry.id,
      recipientUserIds: [entry.farmer.userId],
      payload: { amountPaise: entry.amountPaise, currency: entry.currency, externalPaymentId: input.externalPaymentId },
    })
    return updated
  })
}

export async function farmerPaymentSummary(db: Db, farmerId: string) {
  const entries = await db.paymentLedger.findMany({
    where: { farmerId },
    orderBy: { createdAt: 'desc' },
    include: { tree: { select: { publicId: true, species: true } } },
  })
  const pendingPaise = entries
    .filter((e) => e.status === 'ELIGIBLE' || e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amountPaise, 0)
  const paidPaise = entries.filter((e) => e.status === 'PAID').reduce((sum, e) => sum + e.amountPaise, 0)
  return {
    pendingPaise,
    paidPaise,
    entries: entries.map((e) => ({
      id: e.id,
      tree: e.tree ? { publicId: e.tree.publicId, species: e.tree.species } : null,
      measurementId: e.measurementId,
      amountPaise: e.amountPaise,
      currency: e.currency,
      reason: e.reason,
      description: e.description,
      status: e.status,
      createdAt: e.createdAt,
      paidAt: e.paidAt,
      externalPaymentId: e.externalPaymentId,
    })),
  }
}
