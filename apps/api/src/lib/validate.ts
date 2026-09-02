import type { ZodType } from 'zod'
import { badRequest } from './errors.js'

/** Parse untrusted input; a failure becomes a 400 with field-level issues. */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw badRequest(
      'Invalid request',
      result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    )
  }
  return result.data
}
