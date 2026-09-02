import { createHash, randomUUID } from 'node:crypto'
import sharp, { type Metadata } from 'sharp'
import type { Tx } from '../lib/prisma.js'
import { badRequest } from '../lib/errors.js'
import type { Storage } from './storage.js'

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp'])

export interface UploadedFile {
  buffer: Buffer
  filename: string
  mimetype: string
}

export interface StoredPhotoInput {
  treeId: string
  measurementId?: string
  auditId?: string
  uploadedById: string
  latitude?: number | null
  longitude?: number | null
  takenAt?: Date | null
}

/**
 * Evidence, not decoration: the original bytes are kept untouched, a thumbnail
 * is derived for display, and the file is validated by decoding it rather than
 * trusting the declared content type.
 */
export async function storePhoto(
  tx: Tx,
  storage: Storage,
  file: UploadedFile,
  input: StoredPhotoInput,
) {
  if (file.buffer.length === 0) throw badRequest('Photo file is empty')
  if (file.buffer.length > MAX_PHOTO_BYTES) throw badRequest('Photo must be 10 MB or smaller')

  let metadata: Metadata
  try {
    metadata = await sharp(file.buffer, { failOn: 'error' }).metadata()
  } catch {
    throw badRequest('File is not a readable image')
  }
  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw badRequest('Photo must be a JPEG, PNG or WebP image')
  }

  const id = randomUUID()
  const ext = metadata.format === 'jpeg' ? 'jpg' : metadata.format
  const storageKey = `photos/${input.treeId}/${id}.${ext}`
  const thumbnailKey = `photos/${input.treeId}/${id}.thumb.jpg`
  const thumbnail = await sharp(file.buffer).rotate().resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()

  await storage.put(storageKey, file.buffer, `image/${metadata.format}`)
  await storage.put(thumbnailKey, thumbnail, 'image/jpeg')

  return tx.photo.create({
    data: {
      id,
      treeId: input.treeId,
      measurementId: input.measurementId ?? null,
      auditId: input.auditId ?? null,
      uploadedById: input.uploadedById,
      storageKey,
      thumbnailKey,
      mimeType: `image/${metadata.format}`,
      sizeBytes: file.buffer.length,
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
      width: metadata.width ?? null,
      height: metadata.height ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      takenAt: input.takenAt ?? null,
    },
  })
}
