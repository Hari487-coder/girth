import type { Measurement, MeasurementCheck, Photo, Tree, TreeTag } from '@prisma/client'
import { decimalToNumber } from './prisma.js'

/** Prisma Decimals serialise as strings; the API speaks numbers. */
export function serializeTree(tree: Tree & { tags?: TreeTag[] }) {
  return {
    id: tree.id,
    publicId: tree.publicId,
    species: tree.species,
    variety: tree.variety,
    status: tree.status,
    ownershipStatus: tree.ownershipStatus,
    plantingDate: tree.plantingDate,
    latitude: tree.latitude,
    longitude: tree.longitude,
    currentGirthCm: decimalToNumber(tree.currentGirthCm),
    currentGirthDate: tree.currentGirthDate,
    clusterId: tree.clusterId,
    farmerId: tree.farmerId,
    organisationId: tree.organisationId,
    landPlotId: tree.landPlotId,
    replacementForId: tree.replacementForId,
    tags: tree.tags?.map((t) => ({ id: t.id, tagCode: t.tagCode, status: t.status, attachedAt: t.attachedAt })),
    createdAt: tree.createdAt,
    updatedAt: tree.updatedAt,
  }
}

export function serializeMeasurement(
  m: Measurement & { checks?: MeasurementCheck[]; photos?: Photo[] },
) {
  return {
    id: m.id,
    treeId: m.treeId,
    submittedById: m.submittedById,
    submittedAt: m.submittedAt,
    measurementDate: m.measurementDate,
    measurementHeightCm: m.measurementHeightCm,
    girthCm: decimalToNumber(m.girthCm),
    latitude: m.latitude,
    longitude: m.longitude,
    distanceFromTreeM: m.distanceFromTreeM,
    verificationStatus: m.verificationStatus,
    anomaly: m.anomaly,
    verifiedById: m.verifiedById,
    verifiedAt: m.verifiedAt,
    verificationNotes: m.verificationNotes,
    auditStatus: m.auditStatus,
    correctsId: m.correctsId,
    notes: m.notes,
    clientSubmissionId: m.clientSubmissionId,
    checks: m.checks?.map((c) => ({ key: c.key, passed: c.passed, severity: c.severity, detail: c.detail })),
    photos: m.photos?.map(serializePhoto),
  }
}

export function serializePhoto(p: Photo) {
  return {
    id: p.id,
    measurementId: p.measurementId,
    auditId: p.auditId,
    mimeType: p.mimeType,
    sizeBytes: p.sizeBytes,
    width: p.width,
    height: p.height,
    sha256: p.sha256,
    uploadedAt: p.uploadedAt,
    verificationStatus: p.verificationStatus,
    isPublic: p.isPublic,
    thumbnailUrl: `/photos/${p.id}/thumbnail`,
    originalUrl: `/photos/${p.id}/original`,
  }
}
