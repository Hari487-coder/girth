import { growthSummary, isAlive } from '@girth/domain'
import type { Db } from '../lib/prisma.js'
import { notFound } from '../lib/errors.js'

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Planned',
  PLANTED: 'Planted, awaiting first verified measurement',
  ACTIVE: 'Alive & Growing',
  NEEDS_ATTENTION: 'Needs attention',
  FLAGGED: 'Under verification review',
  DEAD: 'Did not survive',
  REPLACED: 'Did not survive; replaced',
  RETIRED: 'No longer in the program',
}

/**
 * What a QR scan shows. Only verified facts, no farmer identity, no exact
 * coordinates. This is the emotional product and the privacy boundary.
 */
export async function publicTreeProfile(db: Db, publicId: string) {
  const tree = await db.tree.findUnique({
    where: { publicId: publicId.toUpperCase() },
    include: {
      farmer: { select: { district: true, state: true } },
      cluster: { select: { locationLabel: true } },
      measurements: {
        where: { verificationStatus: 'VERIFIED' },
        orderBy: { measurementDate: 'asc' },
        include: { photos: { where: { isPublic: true }, take: 1 } },
      },
      replacementFor: { select: { publicId: true, status: true, species: true } },
      replacedBy: { select: { publicId: true, status: true, species: true, plantingDate: true } },
      sponsorships: { where: { status: 'ACTIVE' }, select: { treeName: true, message: true, occasion: true }, take: 1 },
    },
  })
  if (!tree) throw notFound(`Tree ${publicId} not found`)

  const points = tree.measurements.map((m) => ({ measurementDate: m.measurementDate, girthCm: m.girthCm.toNumber() }))
  const summary = growthSummary(points)
  const latest = tree.measurements[tree.measurements.length - 1]
  const location = tree.cluster?.locationLabel ?? (tree.farmer ? `${tree.farmer.district}, ${tree.farmer.state}` : null)

  return {
    publicId: tree.publicId,
    species: tree.species,
    variety: tree.variety,
    status: tree.status,
    statusLabel: STATUS_LABEL[tree.status] ?? tree.status,
    alive: isAlive(tree.status),
    location,
    plantingYear: tree.plantingDate?.getUTCFullYear() ?? null,
    currentGirthCm: summary.currentGirthCm,
    currentGirthDate: summary.lastVerifiedAt,
    growth: {
      totalCm: summary.totalGrowthCm,
      lastCm: summary.lastGrowthCm,
      yearsTracked: summary.yearsTracked,
      verifiedReadings: summary.readings,
    },
    timeline: tree.measurements.map((m) => ({
      date: m.measurementDate,
      girthCm: m.girthCm.toNumber(),
      verifiedAt: m.verifiedAt,
      photoUrl: m.photos[0] ? `/public/photos/${m.photos[0].id}` : null,
    })),
    latestVerification: latest
      ? {
          date: latest.measurementDate,
          girthCm: latest.girthCm.toNumber(),
          measurementHeightCm: latest.measurementHeightCm,
          verifiedAt: latest.verifiedAt,
          audited: latest.auditStatus === 'COMPLETED',
          photoUrl: latest.photos[0] ? `/public/photos/${latest.photos[0].id}` : null,
        }
      : null,
    replacementFor: tree.replacementFor,
    replacedBy: tree.replacedBy,
    sponsorship: tree.sponsorships[0] ?? null,
  }
}
