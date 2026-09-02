import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ErrorNote, Loading } from '../../components/ui'

interface LogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  reason: string | null
  createdAt: string
  actor: { name: string; role: string } | null
  previousState: unknown
  newState: unknown
}

export function AdminLog() {
  const log = useQuery({ queryKey: ['audit-log'], queryFn: () => api<{ entries: LogEntry[] }>('/audit-log?limit=200') })
  return (
    <div className="max-w-5xl">
      <p className="text-sm text-ink-soft">Who did what, to which record, from what state to what state. This log cannot be edited or deleted.</p>
      {log.isPending && <Loading />}
      <ErrorNote error={log.error} />
      <ul className="mt-4 divide-y divide-line">
        {log.data?.entries.map((e) => (
          <li key={e.id} className="py-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[12px] text-ink-muted">{new Date(e.createdAt).toLocaleString()}</span>
              <span className="font-semibold text-ink">{e.action}</span>
              <span className="text-ink-soft">{e.entityType}</span>
              <span className="font-mono text-[11px] text-ink-muted">{e.entityId.slice(0, 8)}</span>
              <span className="text-ink-soft">by {e.actor ? `${e.actor.name} (${e.actor.role.toLowerCase().replace('_', ' ')})` : 'system'}</span>
            </div>
            {e.reason && <p className="mt-1 text-[13px] text-ink-soft">Reason: {e.reason}</p>}
            {(e.previousState !== null || e.newState !== null) && (
              <details className="mt-1 text-[12px] text-ink-muted">
                <summary className="cursor-pointer">State</summary>
                <pre className="mt-1 overflow-x-auto rounded-lg bg-paper p-3 font-mono text-[11px]">{JSON.stringify({ before: e.previousState, after: e.newState }, null, 2)}</pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
