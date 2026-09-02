import type { NotificationChannel, Prisma } from '@prisma/client'
import type { Tx } from '../lib/prisma.js'

export const EVENT = {
  TREE_PLANTED: 'TREE_PLANTED',
  MEASUREMENT_SUBMITTED: 'MEASUREMENT_SUBMITTED',
  MEASUREMENT_VERIFIED: 'MEASUREMENT_VERIFIED',
  MEASUREMENT_FLAGGED: 'MEASUREMENT_FLAGGED',
  TREE_NEEDS_ATTENTION: 'TREE_NEEDS_ATTENTION',
  TREE_CONFIRMED_DEAD: 'TREE_CONFIRMED_DEAD',
  TREE_REPLACED: 'TREE_REPLACED',
  PAYMENT_ELIGIBLE: 'PAYMENT_ELIGIBLE',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  SPONSORSHIP_STARTED: 'SPONSORSHIP_STARTED',
  SPONSORSHIP_EXPIRING: 'SPONSORSHIP_EXPIRING',
  AUDIT_SCHEDULED: 'AUDIT_SCHEDULED',
} as const

export type EventType = (typeof EVENT)[keyof typeof EVENT]

/**
 * Outbox pattern: the event is written in the same transaction as the change,
 * and a delivery worker sends it later over whichever channel the recipient
 * uses. Nothing here talks to email/SMS/WhatsApp directly.
 */
export async function enqueueEvent(
  tx: Tx,
  event: {
    eventType: EventType
    entityType: string
    entityId: string
    recipientUserIds?: (string | null | undefined)[]
    payload: Record<string, unknown>
    channel?: NotificationChannel
  },
): Promise<void> {
  const recipients = [...new Set((event.recipientUserIds ?? []).filter((id): id is string => !!id))]
  const rows = (recipients.length ? recipients : [null]).map((recipientUserId) => ({
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId,
    recipientUserId,
    channel: event.channel ?? 'IN_APP',
    payload: event.payload as Prisma.InputJsonValue,
  }))
  await tx.notificationEvent.createMany({ data: rows })
}
