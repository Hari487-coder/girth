import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, normalize, resolve } from 'node:path'
import type { Env } from '../config/env.js'

export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<void>
  get(key: string): Promise<Buffer>
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
}

export function createStorage(env: Env): Storage {
  if (env.STORAGE_DRIVER === 's3') {
    // The S3 driver ships with the staging deployment, together with the
    // bucket, credentials and lifecycle policy it needs.
    throw new Error('STORAGE_DRIVER=s3 is not wired yet; use STORAGE_DRIVER=local')
  }
  return new LocalStorage(join(process.cwd(), env.STORAGE_LOCAL_DIR))
}
