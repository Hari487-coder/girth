import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { S3Storage } from '../src/services/storage.js'

/**
 * Runs only when an S3-compatible endpoint is provided (MinIO locally or in
 * CI). Exercises the exact driver production uses.
 */
const endpoint = process.env.S3_TEST_ENDPOINT
const describeS3 = endpoint ? describe : describe.skip

describeS3('S3-compatible storage driver', () => {
  const storage = new S3Storage({
    bucket: process.env.S3_TEST_BUCKET ?? 'girth-test',
    endpoint,
    region: 'us-east-1',
    accessKeyId: process.env.S3_TEST_ACCESS_KEY ?? 'girth',
    secretAccessKey: process.env.S3_TEST_SECRET_KEY ?? 'girth-minio',
    forcePathStyle: true,
  })

  it('reaches the bucket', async () => {
    await expect(storage.check()).resolves.toBeUndefined()
  })

  it('stores and reads back bytes unchanged', async () => {
    const key = `photos/test/${randomUUID()}.bin`
    const body = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
    await storage.put(key, body, 'image/jpeg')
    const back = await storage.get(key)
    expect(back.equals(body)).toBe(true)
  })

  it('refuses unsafe keys', async () => {
    await expect(storage.put('../escape.jpg', Buffer.from('x'), 'image/jpeg')).rejects.toThrow(/Unsafe/)
  })
})
