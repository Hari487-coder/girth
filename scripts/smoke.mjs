#!/usr/bin/env node
// Post-deploy smoke test. Usage:
//   node scripts/smoke.mjs https://girth.example.com            (web origin; API at /api)
//   API_BASE=https://api.example.com node scripts/smoke.mjs https://girth.example.com
// Optional: SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD to exercise a signed-in path.
const origin = (process.argv[2] ?? 'http://localhost:3200').replace(/\/$/, '')
const apiBase = (process.env.API_BASE ?? `${origin}/api`).replace(/\/$/, '')
const results = []
let cookie = ''

async function step(name, fn) {
  const started = Date.now()
  try {
    const detail = await fn()
    results.push({ name, ok: true, ms: Date.now() - started, detail })
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - started, detail: error instanceof Error ? error.message : String(error) })
  }
}

async function get(path, opts = {}) {
  const res = await fetch(`${apiBase}${path}`, { ...opts, headers: { accept: 'application/json', ...(cookie ? { cookie } : {}), ...(opts.headers ?? {}) } })
  return res
}

await step('web serves the app shell', async () => {
  const res = await fetch(`${origin}/`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  const html = await res.text()
  if (!html.includes('<div id="root">')) throw new Error('no app root in HTML')
  return `${html.length} bytes`
})

await step('web deep link falls back to the app', async () => {
  const res = await fetch(`${origin}/tree/GIRTH-000001`)
  if (!res.ok) throw new Error(`status ${res.status}`)
  return `status ${res.status}`
})

await step('api health', async () => {
  const res = await get('/health')
  const body = await res.json()
  if (!res.ok || !body.ok) throw new Error(`status ${res.status}`)
  return body.time
})

await step('security headers present', async () => {
  const res = await get('/health')
  const missing = ['x-content-type-options', 'x-frame-options'].filter((h) => !res.headers.get(h))
  if (missing.length) throw new Error(`missing ${missing.join(', ')}`)
  return 'ok'
})

await step('public tree list', async () => {
  const res = await get('/public/trees')
  const body = await res.json()
  if (!res.ok) throw new Error(`status ${res.status}`)
  const text = JSON.stringify(body)
  if (/\+91\d{6,}/.test(text)) throw new Error('phone number leaked into public listing')
  return `${body.trees.length} trees, price ${body.pricePaise} paise`
})

await step('public tree profile has no private fields', async () => {
  const list = await (await get('/public/trees')).json()
  const first = list.trees[0]
  if (!first) return 'no trees to check'
  const res = await get(`/public/trees/${first.publicId}`)
  const body = await res.json()
  if (!res.ok) throw new Error(`status ${res.status}`)
  for (const key of ['farmerId', 'phone', 'latitude', 'longitude', 'passwordHash']) {
    if (key in body) throw new Error(`private field ${key} exposed`)
  }
  return `${body.publicId} ${body.species} ${body.currentGirthCm ?? '-'} cm`
})

await step('protected route rejects anonymous', async () => {
  const res = await get('/measurements/queue')
  if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`)
  return '401'
})

await step('login rate limit is enforced', async () => {
  let limited = false
  for (let i = 0; i < 12; i++) {
    const res = await get('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: 'nobody@example.com', password: 'wrong-password' }) })
    if (res.status === 429) {
      limited = true
      break
    }
  }
  if (!limited) throw new Error('no 429 after 12 bad logins')
  return '429 reached'
})

if (process.env.SMOKE_ADMIN_EMAIL && process.env.SMOKE_ADMIN_PASSWORD) {
  await step('admin can sign in and read the queue', async () => {
    // wait out the rate limit window from the previous step
    await new Promise((r) => setTimeout(r, 61_000))
    const res = await get('/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: process.env.SMOKE_ADMIN_EMAIL, password: process.env.SMOKE_ADMIN_PASSWORD }) })
    if (!res.ok) throw new Error(`login status ${res.status}`)
    cookie = (res.headers.get('set-cookie') ?? '').split(';')[0]
    const queue = await get('/measurements/queue')
    if (!queue.ok) throw new Error(`queue status ${queue.status}`)
    return `${(await queue.json()).queue.length} in queue`
  })
}

const failed = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name.padEnd(44)} ${String(r.ms).padStart(5)} ms  ${r.detail}`)
console.log(failed.length ? `\n${failed.length} check(s) failed` : '\nSmoke test passed')
process.exit(failed.length ? 1 : 0)
