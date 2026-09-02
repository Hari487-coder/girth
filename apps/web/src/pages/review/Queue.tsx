import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FlagIcon, RulerIcon, SealCheckIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { api, apiUrl } from '../../lib/api'
import type { QueueItem } from '../../lib/types'
import { formatDate, formatPaise } from '../../lib/format'
import { StatusBadge } from '../../components/StatusBadge'
import { Chip, Empty, ErrorNote, Loading, Notice, Page } from '../../components/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

type Decision = 'verify' | 'flag' | 'remeasure'

interface ReviewResult {
  measurement: { verificationStatus: string }
  growthCm: number | null
  payout: { totalPaise: number; count: number }
  auditScheduled: boolean
}

interface Decided {
  treePublicId: string
  result: ReviewResult
}

function QueueCard({ item, onDecided }: { item: QueueItem; onDecided: (d: Decided) => void }) {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const review = useMutation({
    mutationFn: (decision: Decision) => api<ReviewResult>(`/measurements/${item.id}/${decision}`, { body: { notes: notes.trim() || undefined } }),
    onSuccess: (data) => {
      onDecided({ treePublicId: item.tree.publicId, result: data })
      void queryClient.invalidateQueries({ queryKey: ['queue'] })
      void queryClient.invalidateQueries({ queryKey: ['audits'] })
    },
  })
  const previous = item.tree.currentGirthCm
  const delta = previous !== null ? Math.round((item.girthCm - previous) * 10) / 10 : null

  return (
    <article className="card p-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          {item.photos && item.photos.length > 0 ? (
            item.photos.map((p) => (
              <a key={p.id} href={apiUrl(p.originalUrl)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-line">
                <img src={apiUrl(p.thumbnailUrl)} alt="Measurement evidence" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              </a>
            ))
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-line-strong text-[13px] text-ink-muted lg:aspect-[4/3] lg:h-auto">No photo</div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/tree/${item.tree.publicId}`} className="font-mono text-[13px] font-semibold text-canopy hover:underline">{item.tree.publicId}</Link>
            <span className="text-sm font-semibold text-ink">{item.tree.species}</span>
            <StatusBadge status={item.verificationStatus} />
            {item.anomaly && (
              <Chip tone="warn">
                <WarningCircleIcon size={13} aria-hidden="true" /> Potential anomaly
              </Chip>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">
            Submitted by {item.submittedBy.name} ({item.submittedBy.role.toLowerCase().replace('_', ' ')}) · measured {formatDate(item.measurementDate)} at {item.measurementHeightCm} cm
          </p>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-[12px] font-semibold text-ink-muted">Submitted girth</p>
              <p className="font-mono text-3xl font-bold text-ink">{item.girthCm}<span className="ml-1 text-sm font-medium text-ink-muted">cm</span></p>
            </div>
            {previous !== null && (
              <div>
                <p className="text-[12px] font-semibold text-ink-muted">Last verified</p>
                <p className="font-mono text-3xl font-bold text-ink-soft">{previous}<span className="ml-1 text-sm font-medium text-ink-muted">cm</span></p>
              </div>
            )}
            {delta !== null && (
              <span className={`rounded-lg px-2.5 py-1 font-mono text-sm font-semibold ${item.anomaly ? 'bg-warn-soft text-warn' : 'bg-canopy-soft text-canopy-deep'}`}>
                {delta >= 0 ? '+' : ''}{delta} cm
              </span>
            )}
            {item.distanceFromTreeM !== null && <span className="text-[13px] text-ink-muted">{item.distanceFromTreeM} m from registered location</span>}
          </div>
          <ul className="mt-4 space-y-1 text-[13px]">
            {item.checks?.map((c) => (
              <li key={c.key} className={`flex items-start gap-2 ${c.severity === 'WARN' ? 'text-warn' : c.severity === 'FAIL' ? 'text-alert' : 'text-ink-muted'}`}>
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                {c.detail}
              </li>
            ))}
          </ul>
          {item.notes && <p className="mt-3 text-[13px] text-ink-soft">Note from submitter: "{item.notes}"</p>}
          <textarea
            className="field mt-4 min-h-20"
            placeholder="Review notes (kept on the record)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Review notes"
          />
          <ErrorNote error={review.error} className="mt-3" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary btn-small" disabled={review.isPending} onClick={() => review.mutate('verify')}>
              <SealCheckIcon size={15} aria-hidden="true" /> Verify
            </button>
            <button type="button" className="btn btn-small border border-alert/40 bg-surface px-4 text-alert hover:bg-alert-soft" disabled={review.isPending} onClick={() => review.mutate('flag')}>
              <FlagIcon size={15} aria-hidden="true" /> Flag
            </button>
            <button type="button" className="btn-secondary btn-small" disabled={review.isPending} onClick={() => review.mutate('remeasure')}>
              <RulerIcon size={15} aria-hidden="true" /> Request remeasurement
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

export function Queue() {
  useDocumentTitle('Verification queue')
  const queue = useQuery({ queryKey: ['queue'], queryFn: () => api<{ queue: QueueItem[] }>('/measurements/queue'), refetchInterval: 60_000 })
  const [decided, setDecided] = useState<Decided[]>([])

  return (
    <Page
      title="Verification queue"
      intro="Nothing counts until a person has looked at it. Anomalies are first; every decision is recorded with your name and notes."
      width="max-w-5xl"
    >
      {decided.length > 0 && (
        <div className="mb-6 space-y-2">
          {decided.map((d, i) => (
            <Notice key={`${d.treePublicId}-${i}`}>
              <p className="font-semibold">
                {d.treePublicId}: {d.result.measurement.verificationStatus.toLowerCase().replace('_', ' ')}
                {d.result.growthCm !== null && ` · growth ${d.result.growthCm >= 0 ? '+' : ''}${d.result.growthCm} cm`}
                {d.result.payout.count > 0 && ` · farmer eligible for ${formatPaise(d.result.payout.totalPaise)}`}
                {d.result.auditScheduled && ' · selected for a spot audit'}
              </p>
            </Notice>
          ))}
        </div>
      )}
      {queue.isPending && <Loading label="Loading queue" />}
      <ErrorNote error={queue.error} />
      {queue.data && queue.data.queue.length === 0 && (
        <Empty title="Queue is clear" body="New submissions from farmers and auditors appear here." />
      )}
      <div className="space-y-4">
        {queue.data?.queue.map((item) => (
          <QueueCard key={item.id} item={item} onDecided={(d) => setDecided((list) => [d, ...list])} />
        ))}
      </div>
    </Page>
  )
}
