import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { homeFor, useSession } from '../lib/session'
import { ErrorNote, Field } from '../components/ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const ENV = (import.meta.env.VITE_APP_ENV as string | undefined) ?? 'local'

const LOCAL_ACCOUNTS = [
  ['Admin', 'admin@girth.local', 'girth-admin-local'],
  ['Field auditor', 'auditor@girth.local', 'girth-auditor-local'],
  ['Farmer (Ravi)', '+919000000001', 'girth-farmer-local'],
  ['Customer', 'customer@girth.local', 'girth-customer-local'],
  ['Organisation', 'org@girth.local', 'girth-org-local'],
]

export function Login() {
  useDocumentTitle('Sign in')
  const { login } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await login(identifier.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : homeFor(user.role), { replace: true })
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-soft">Farmers, auditors, sponsors and programme teams all sign in here.</p>

      <form onSubmit={submit} className="card mt-8 space-y-5 p-6" noValidate>
        <Field label="Email or phone" htmlFor="identifier">
          <input
            id="identifier"
            className="field"
            autoComplete="username"
            inputMode="email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            className="field"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <ErrorNote error={error} />
        <button type="submit" className="btn-primary w-full" disabled={busy || !identifier || !password}>
          {busy ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      {ENV !== 'production' && (
        <details className="mt-6 rounded-2xl border border-line bg-surface p-4 text-[13px] text-ink-soft">
          <summary className="cursor-pointer font-semibold text-ink">Local test accounts</summary>
          <ul className="mt-3 space-y-2">
            {LOCAL_ACCOUNTS.map(([role, id, pw]) => (
              <li key={id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{role}</span>
                <button
                  type="button"
                  className="cursor-pointer font-mono text-[12px] text-canopy hover:underline"
                  onClick={() => {
                    setIdentifier(id ?? '')
                    setPassword(pw ?? '')
                  }}
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-ink-muted">Seeded by `npm run db:seed`. Never shown in production.</p>
        </details>
      )}
    </div>
  )
}
