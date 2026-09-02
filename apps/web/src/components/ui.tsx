import type { ReactNode } from 'react'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { errorMessage } from '../lib/api'

export function Page({ title, intro, actions, children, width = 'max-w-7xl' }: { title: string; intro?: ReactNode; actions?: ReactNode; children: ReactNode; width?: string }) {
  return (
    <div className={`mx-auto ${width} px-4 py-10 sm:px-6`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">{title}</h1>
          {intro && <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">{intro}</p>}
        </div>
        {actions}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  )
}

export function Stat({ label, value, tone = 'ink', hint }: { label: string; value: ReactNode; tone?: 'ink' | 'canopy' | 'warn' | 'muted'; hint?: string }) {
  const color = { ink: 'text-ink', canopy: 'text-canopy-deep', warn: 'text-warn', muted: 'text-ink-muted' }[tone]
  return (
    <div className="card p-5">
      <p className="text-[13px] font-semibold text-ink-muted">{label}</p>
      <p className={`mt-1 font-mono text-3xl font-bold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>}
    </div>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-16 text-sm text-ink-muted" role="status">
      <span className="size-2 animate-pulse rounded-full bg-canopy" aria-hidden="true" />
      {label}
    </div>
  )
}

export function ErrorNote({ error, className = '' }: { error: unknown; className?: string }) {
  if (!error) return null
  return (
    <p className={`flex items-start gap-2 rounded-xl bg-alert-soft px-4 py-3 text-sm font-medium text-alert ${className}`} role="alert">
      <WarningCircleIcon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      {errorMessage(error)}
    </p>
  )
}

export function Notice({ children, tone = 'canopy' }: { children: ReactNode; tone?: 'canopy' | 'warn' }) {
  const cls = tone === 'canopy' ? 'border-canopy/30 bg-canopy-faint text-ink' : 'border-tape-deep/40 bg-warn-soft text-ink'
  return <div className={`rounded-2xl border px-5 py-4 text-sm ${cls}`}>{children}</div>
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card px-6 py-16 text-center">
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-ink-muted">{hint}</p>}
    </div>
  )
}

export function Chip({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'canopy' | 'warn' | 'alert' }) {
  const cls = {
    muted: 'bg-line/60 text-ink-soft',
    canopy: 'bg-canopy-soft text-canopy-deep',
    warn: 'bg-warn-soft text-warn',
    alert: 'bg-alert-soft text-alert',
  }[tone]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${cls}`}>{children}</span>
}
