import type { Tree, TreeStatus } from '@prisma/client'
import { assertTransition, formatTreeId, type CreateTreeInput } from '@girth/domain'
import type { Db, Tx } from '../lib/prisma.js'
import { badRequest, conflict, notFound, unprocessable } from '../lib/errors.js'
import type { AuthUser } from '../plugins/auth.js'
import { recordAudit } from './auditLog.js'
import { enqueueEvent, EVENT } from './notifications.js'

export interface RequestMeta {
  requestId?: string
  ip?: string
}

/** Allocates the next never-recycled sequence number from the database. */
async function nextTreeSeq(tx: Tx): Promise<number> {
  const rows = await tx.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('"Tree_seq_seq"')`
  const value = rows[0]?.nextval
  if (value === undefined) throw new Error('Tree sequence unavailable')
  return Number(value)
}

export async function findTreeByPublicId(db: Db | Tx, publicId: string) {
  const tree = await db.tree.findUnique({
    where: { publicId: publicId.toUpperCase() },
    include: { tags: { where: { status: 'ACTIVE' } } },
  })
  if (!tree) throw notFound(`Tree ${publicId} not found`)
  return tree
}

export async function createTree(
  db: Db,
  actor: AuthUser,
  input: CreateTreeInput,
  meta: RequestMeta = {},
) {
  return db.$transaction(async (tx) => {
    if (input.farmerId && !(await tx.farmer.findUnique({ where: { id: input.farmerId } }))) {
      throw badRequest('Farmer not found')
    }
    if (input.clusterId && !(await tx.treeCluster.findUnique({ where: { id: input.clusterId } }))) {
      throw badRequest('Cluster not found')
    }
    if (input.landPlotId && !(await tx.landPlot.findUnique({ where: { id: input.landPlotId } }))) {
      throw badRequest('Land plot not found')
    }

    let original: Tree | null = null
    if (input.replacementForTreeId) {
      original = await tx.tree.findUnique({ where: { id: input.replacementForTreeId } })
      if (!original) throw badRequest('Original tree not found')
      if (original.status !== 'DEAD') {
        throw unprocessable(`Only a DEAD tree can be replaced; ${original.publicId} is ${original.status}`)
      }
      if (original.replacementForId === undefined) throw new Error('unreachable')
    }

    const seq = await nextTreeSeq(tx)
    const tree = await tx.tree.create({
      data: {
        seq,
        publicId: formatTreeId(seq),
        clusterId: input.clusterId ?? null,
        farmerId: input.farmerId ?? original?.farmerId ?? null,
        organisationId: input.organisationId ?? original?.organisationId ?? null,
        landPlotId: input.landPlotId ?? original?.landPlotId ?? null,
        species: input.species,
        variety: input.variety ?? null,
        plantingDate: input.plantingDate ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        status: input.status,
        ownershipStatus: input.ownershipStatus,
        replacementForId: original?.id ?? null,
      },
      include: { tags: true },
    })

    await tx.treeStatusHistory.create({
      data: { treeId: tree.id, fromStatus: null, toStatus: tree.status, changedById: actor.id, reason: 'Registered' },
    })

    if (input.tagCode) {
      const existing = await tx.treeTag.findUnique({ where: { tagCode: input.tagCode } })
      if (existing) throw conflict(`Tag ${input.tagCode} is already attached to another tree`)
      await tx.treeTag.create({ data: { treeId: tree.id, tagCode: input.tagCode } })
    }

    if (original) {
      assertTransition(original.status, 'REPLACED')
      await tx.tree.update({ where: { id: original.id }, data: { status: 'REPLACED' } })
      await tx.treeStatusHistory.create({
        data: {
          treeId: original.id,
          fromStatus: original.status,
          toStatus: 'REPLACED',
          changedById: actor.id,
          reason: `Replaced by ${tree.publicId}`,
        },
      })
      await recordAudit(tx, {
        actor,
        action: 'tree.replaced',
        entityType: 'Tree',
        entityId: original.id,
        previousState: { status: original.status },
        newState: { status: 'REPLACED', replacedBy: tree.publicId },
        ...meta,
      })
      const sponsors = await tx.sponsorship.findMany({ where: { treeId: original.id }, select: { customerId: true } })
      await enqueueEvent(tx, {
        eventType: EVENT.TREE_REPLACED,
        entityType: 'Tree',
        entityId: original.id,
        recipientUserIds: sponsors.map((s) => s.customerId),
        payload: { originalTreeId: original.publicId, replacementTreeId: tree.publicId },
      })
    }

    await recordAudit(tx, {
      actor,
      action: 'tree.created',
      entityType: 'Tree',
      entityId: tree.id,
      newState: { publicId: tree.publicId, species: tree.species, status: tree.status, farmerId: tree.farmerId },
      ...meta,
    })

    const farmerUser = tree.farmerId
      ? await tx.farmer.findUnique({ where: { id: tree.farmerId }, select: { userId: true } })
      : null
    await enqueueEvent(tx, {
      eventType: EVENT.TREE_PLANTED,
      entityType: 'Tree',
      entityId: tree.id,
      recipientUserIds: [farmerUser?.userId],
      payload: { treeId: tree.publicId, species: tree.species },
    })

    return tree
  })
}

export async function changeTreeStatus(
  db: Db,
  actor: AuthUser,
  publicId: string,
  to: TreeStatus,
  reason: string,
  meta: RequestMeta = {},
) {
  return db.$transaction(async (tx) => {
    const tree = await findTreeByPublicId(tx, publicId)
    assertTransition(tree.status, to)
    const updated = await tx.tree.update({ where: { id: tree.id }, data: { status: to }, include: { tags: true } })
    await tx.treeStatusHistory.create({
      data: { treeId: tree.id, fromStatus: tree.status, toStatus: to, changedById: actor.id, reason },
    })
    await recordAudit(tx, {
      actor,
      action: 'tree.status_changed',
      entityType: 'Tree',
      entityId: tree.id,
      previousState: { status: tree.status },
      newState: { status: to },
      reason,
      ...meta,
    })
    if (to === 'DEAD' || to === 'NEEDS_ATTENTION') {
      const sponsors = await tx.sponsorship.findMany({ where: { treeId: tree.id }, select: { customerId: true } })
      const farmer = tree.farmerId
        ? await tx.farmer.findUnique({ where: { id: tree.farmerId }, select: { userId: true } })
        : null
      await enqueueEvent(tx, {
        eventType: to === 'DEAD' ? EVENT.TREE_CONFIRMED_DEAD : EVENT.TREE_NEEDS_ATTENTION,
        entityType: 'Tree',
        entityId: tree.id,
        recipientUserIds: [...sponsors.map((s) => s.customerId), farmer?.userId],
        payload: { treeId: tree.publicId, status: to, reason },
      })
    }
    return updated
  })
}

export async function attachTag(
  db: Db,
  actor: AuthUser,
  publicId: string,
  tagCode: string,
  reason: string | undefined,
  meta: RequestMeta = {},
) {
  return db.$transaction(async (tx) => {
    const tree = await findTreeByPublicId(tx, publicId)
    const clash = await tx.treeTag.findUnique({ where: { tagCode } })
    if (clash) throw conflict(`Tag ${tagCode} is already in use`)
    const current = await tx.treeTag.findFirst({ where: { treeId: tree.id, status: 'ACTIVE' } })
    const tag = await tx.treeTag.create({ data: { treeId: tree.id, tagCode, notes: reason ?? null } })
    if (current) {
      await tx.treeTag.update({
        where: { id: current.id },
        data: { status: 'REPLACED', replacedAt: new Date(), replacedByTagId: tag.id },
      })
    }
    await recordAudit(tx, {
      actor,
      action: 'tree.tag_attached',
      entityType: 'Tree',
      entityId: tree.id,
      previousState: { tagCode: current?.tagCode ?? null },
      newState: { tagCode },
      reason,
      ...meta,
    })
    return tag
  })
}
