import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, normalize, resolve } from 'node:path'
import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Env } from '../config/env.js'

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<Buffer>
  /** Fails fast at boot when the backing store is unreachable or misconfigured. */
  check(): Promise<void>
}

/** Keys are opaque paths we generate ourselves; never derived from user input. */
function assertSafeKey(key: string): void {
  if (!/^[a-z0-9/_.-]+$/i.test(key) || key.includes('..')) {
    throw new Error(`Unsafe storage key: ${key}`)
  }
}

class LocalStorage implements Storage {
  constructor(private readonly root: string) {}

  private pathFor(key: string): string {
    assertSafeKey(key)
    const full = resolve(this.root, normalize(key))
    if (!full.startsWith(resolve(this.root))) throw new Error('Storage path escape')
    return full
  }

  async put(key: string, body: Buffer): Promise<void> {
    const path = this.pathFor(key)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, body)
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.pathFor(key))
  }

  async check(): Promise<void> {
    await mkdir(this.root, { recursive: true })
  }
}

/** S3-compatible object storage: AWS S3, Cloudflare R2, MinIO. */
export class S3Storage implements Storage {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(options: {
    bucket: string
    region?: string
    endpoint?: string
    accessKeyId: string
    secretAccessKey: string
    forcePathStyle?: boolean
  }) {
    this.bucket = options.bucket
    this.client = new S3Client({
      region: options.region ?? 'auto',
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? !!options.endpoint,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    })
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    assertSafeKey(key)
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }))
  }

  async get(key: string): Promise<Buffer> {
    assertSafeKey(key)
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
    if (!result.Body) throw new Error(`Empty object for key ${key}`)
    return Buffer.from(await result.Body.transformToByteArray())
  }

  async check(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
  }
}

export function createStorage(env: Env): Storage {
  if (env.STORAGE_DRIVER === 's3') {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error('STORAGE_DRIVER=s3 needs S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY')
    }
    return new S3Storage({
      bucket: env.S3_BUCKET,
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
    })
  }
  return new LocalStorage(join(process.cwd(), env.STORAGE_LOCAL_DIR))
}
