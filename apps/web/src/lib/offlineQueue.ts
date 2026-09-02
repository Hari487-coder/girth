import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, NetworkError } from './api'

/**
 * Measurements captured without connectivity wait here and sync later. Each
 * item carries a `clientSubmissionId`, which the API treats as idempotent, so
 * a retry can never double-count a reading.
 */
export interface QueuedMeasurement {
  id: string
  treePublicId: string
  fields: Record<string, string>
  photo?: Blob
  photoName?: string
  createdAt: number
  lastError?: string
}

const DB_NAME = 'girth'
const STORE = 'measurementQueue'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode)
        const req = run(t.objectStore(STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.oncomplete = () => db.close()
      }),
  )
}

export const queueStore = {
  list: () => tx<QueuedMeasurement[]>('readonly', (s) => s.getAll()),
  put: (item: QueuedMeasurement) => tx('readwrite', (s) => s.put(item)),
  remove: (id: string) => tx('readwrite', (s) => s.delete(id)),
}

export function buildMeasurementForm(fields: Record<string, string>, photo?: Blob, photoName = 'photo.jpg'): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) if (v !== '') form.append(k, v)
  if (photo) form.append('photo', photo, photoName)
  return form
}

export async function postMeasurement(treePublicId: string, fields: Record<string, string>, photo?: Blob, photoName?: string) {
  return api<{ measurement: { id: string; verificationStatus: string; anomaly: boolean }; duplicate: boolean }>(
    `/trees/${treePublicId}/measurements`,
    { method: 'POST', form: buildMeasurementForm(fields, photo, photoName) },
  )
}

/** Try each queued item in order; stop at the first network failure. */
export async function flushQueue(): Promise<{ synced: number; remaining: number }> {
  const items = (await queueStore.list()).sort((a, b) => a.createdAt - b.createdAt)
  let synced = 0
  for (const item of items) {
    try {
      await postMeasurement(item.treePublicId, { ...item.fields, clientSubmissionId: item.id }, item.photo, item.photoName)
      await queueStore.remove(item.id)
      synced++
    } catch (error) {
      if (error instanceof NetworkError) break
      if (error instanceof ApiError && error.status === 401) break
      await queueStore.put({ ...item, lastError: error instanceof Error ? error.message : String(error) })
    }
  }
  const remaining = (await queueStore.list()).length
  return { synced, remaining }
}

export function useOfflineQueue() {
  const [pending, setPending] = useState<QueuedMeasurement[]>([])
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)

  const refresh = useCallback(async () => {
    setPending((await queueStore.list()).sort((a, b) => a.createdAt - b.createdAt))
  }, [])

  const flush = useCallback(async () => {
    if (syncing) return
    setSyncing(true)
    try {
      await flushQueue()
    } finally {
      setSyncing(false)
      await refresh()
    }
  }, [syncing, refresh])

  useEffect(() => {
    void refresh()
    const goOnline = () => {
      setOnline(true)
      void flush()
    }
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
    // flush is stable enough for this effect; re-subscribing on every render is wasteful
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh])

  const discard = useCallback(
    async (id: string) => {
      await queueStore.remove(id)
      await refresh()
    },
    [refresh],
  )

  return { pending, syncing, online, flush, refresh, discard }
}
