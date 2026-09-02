import type { FastifyRequest } from 'fastify'
import { badRequest } from './errors.js'
import { MAX_PHOTO_BYTES, type UploadedFile } from '../services/photos.js'

export interface ParsedBody {
  fields: Record<string, string>
  file?: UploadedFile
}

/**
 * Accepts either JSON (no photo, e.g. an offline queue syncing facts first) or
 * multipart with text fields and at most one `photo` file.
 */
export async function readBody(request: FastifyRequest): Promise<ParsedBody> {
  if (!request.isMultipart()) {
    const body = (request.body ?? {}) as Record<string, unknown>
    const fields: Record<string, string> = {}
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) fields[k] = String(v)
    }
    return { fields }
  }

  const fields: Record<string, string> = {}
  let file: UploadedFile | undefined
  for await (const part of request.parts({ limits: { fileSize: MAX_PHOTO_BYTES, files: 1 } })) {
    if (part.type === 'file') {
      if (part.fieldname !== 'photo') {
        await part.toBuffer()
        continue
      }
      const buffer = await part.toBuffer()
      if (part.file.truncated) throw badRequest('Photo must be 10 MB or smaller')
      file = { buffer, filename: part.filename, mimetype: part.mimetype }
    } else {
      fields[part.fieldname] = String(part.value)
    }
  }
  return { fields, file }
}
