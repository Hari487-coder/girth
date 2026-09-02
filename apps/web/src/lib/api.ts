/** Thin fetch wrapper: same-origin `/api` in development (Vite proxy) or an explicit origin. */
export const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly details: unknown
  readonly requestId: string | undefined

  constructor(status: number, message: string, details?: unknown, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.requestId = requestId
  }

  /** Field-level validation issues, when the API returned them. */
  get issues(): { path: string; message: string }[] {
    return Array.isArray(this.details) ? (this.details as { path: string; message: string }[]) : []
  }
}

/** Thrown when the request never reached the API (offline, DNS, CORS). */
export class NetworkError extends Error {
  constructor() {
    super('Could not reach Girth. Check your connection and try again.')
    this.name = 'NetworkError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { accept: 'application/json' }
  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? (body ? 'POST' : 'GET'),
      headers,
      body,
      credentials: 'include',
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NetworkError()
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  const data = text ? safeJson(text) : null
  if (!response.ok) {
    const payload = (data ?? {}) as { error?: string; details?: unknown; requestId?: string }
    throw new ApiError(response.status, payload.error ?? `Request failed (${response.status})`, payload.details, payload.requestId)
  }
  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Absolute URL for API-served files (photos, QR codes, CSV). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const first = error.issues[0]
    return first ? `${error.message}: ${first.path ? `${first.path} ` : ''}${first.message}` : error.message
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong'
}
