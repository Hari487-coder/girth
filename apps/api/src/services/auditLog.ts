import type { Prisma } from '@prisma/client'
import type { Tx } from '../lib/prisma.js'
import type { AuthUser } from '../plugins/auth.js'

export interface AuditEntry {
  actor: AuthUser | null
  action: string
  entityType: string
  entityId: string
  previousState?: unknown
  newState?: unknown
  reason?: string | null
  requestId?: string
  ip?: string
}

/** Decimals and Dates become plain JSON so snapshots are stable and readable. */
function snapshot(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

/** Append one immutable line to the audit log. Always call inside the same transaction as the change. */
export async function recordAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorId: entry.actor?.id ?? null,
      actorRole: entry.actor?.role ?? 'SYSTEM',
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      previousState: snapshot(entry.previousState),
      newState: snapshot(entry.newState),
      reason: entry.reason ?? null,
      requestId: entry.requestId ?? null,
      ip: entry.ip ?? null,
    },
  })
}
