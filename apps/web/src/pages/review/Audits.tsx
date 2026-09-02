import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiUrl } from '../../lib/api'
import type { Audit } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { StatusBadge } from '../../components/StatusBadge'
import { Empty, ErrorNote, Field, Loading, Page } from '../../components/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

function AuditForm({ audit }: { audit: Audit }) {
  const queryClient = useQueryClient()
  const [observed, setObserved] = useState('')
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [fraud, setFraud] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)

  const record = useMutation({
    mutationFn: () => {
      const form = new FormData()
      if (observed) form.append('observedGirthCm', observed)
      if (status) form.append('observedStatus', status)
      if (notes) form.append('notes', notes)
      form.append('fraudSuspected', String(fraud))
      if (photo) form.append('photo', photo)
      return api<{ audit: Audit }>(`/audits/${audit.id}/result`, { method: 'POST', form })
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['audits'] }),
  })

  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`/tree/${audit.tree.publicId}`} className="font-mono text-[13px] font-semibold text-canopy hover:underline">{audit.tree.publicId}</Link>
        <span className="text-sm font-semibold text-ink">{audit.tree.species}</span>
        <StatusBadge status={audit.result} />
        <span className="text-[13px] text-ink-muted">scheduled {formatDate(audit.scheduledAt)}</span>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        Reported <span className="font-mono font-semibold text-ink">{audit.reportedGirthCm} cm</span> on {formatDate(audit.measurement.measurementDate)}. Measure the tree yourself and record what you find.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Observed girth (cm)" htmlFor={`obs-${audit.id}`}>
          <input id={`obs-${audit.id}`} className="field font-mono" type="number" step="0.5" min="0" value={observed} onChange={(e) => setObserved(e.target.value)} />
        </Field>
        <Field label="Observed tree status" htmlFor={`status-${audit.id}`}>
          <select id={`status-${audit.id}`} className="field cursor-pointer" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">As recorded</option>
            <option value="ACTIVE">Alive and growing</option>
            <option value="NEEDS_ATTENTION">Alive, needs attention</option>
            <option value="DEAD">Dead</option>
          </select>
        </Field>
        <Field label="Photo" htmlFor={`photo-${audit.id}`}>
          <input id={`photo-${audit.id}`} type="file" accept="image/*" capture="environment" className="text-sm" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Notes" htmlFor={`notes-${audit.id}`}>
          <input id={`notes-${audit.id}`} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={fraud} onChange={(e) => setFraud(e.target.checked)} />
        Fraud suspected
      </label>
      <ErrorNote error={record.error} className="mt-3" />
      <button type="button" className="btn-primary btn-small mt-4" disabled={record.isPending || (!observed && !status)} onClick={() => record.mutate()}>
        Record audit result
      </button>
    </article>
  )
}

export function Audits() {
  useDocumentTitle('Audits')
  const audits = useQuery({ queryKey: ['audits'], queryFn: () => api<{ audits: Audit[] }>('/audits') })
  const pending = audits.data?.audits.filter((a) => a.result === 'PENDING') ?? []
  const done = audits.data?.audits.filter((a) => a.result !== 'PENDING').sort((a, b) => (b.performedAt ?? '').localeCompare(a.performedAt ?? '')) ?? []

  return (
    <Page title="Spot audits" intro="A sample of verified readings is remeasured in the field. Discrepancies are recorded next to the original, never over it." width="max-w-5xl">
      {audits.isPending && <Loading label="Loading audits" />}
      <ErrorNote error={audits.error} />
      <h2 className="font-display text-xl font-bold text-ink">To do</h2>
      {audits.data && pending.length === 0 && <div className="mt-3"><Empty title="No audits waiting" body="Selections happen automatically as readings are verified." /></div>}
      <div className="mt-3 space-y-4">
        {pending.map((a) => (
          <AuditForm key={a.id} audit={a} />
        ))}
      </div>
      {done.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-bold text-ink">Completed</h2>
          <div className="mt-3 space-y-2">
            {done.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <Link to={`/tree/${a.tree.publicId}`} className="font-mono text-[13px] font-semibold text-canopy hover:underline">{a.tree.publicId}</Link>
                  <span className="font-mono">reported {a.reportedGirthCm} cm</span>
                  {a.observedGirthCm !== null && <span className="font-mono">observed {a.observedGirthCm} cm</span>}
                  {a.differenceCm !== null && <span className={`font-mono font-semibold ${Math.abs(a.differenceCm) > 3 ? 'text-alert' : 'text-ink'}`}>{a.differenceCm >= 0 ? '+' : ''}{a.differenceCm} cm</span>}
                  <StatusBadge status={a.result} />
                  {a.photos.length > 0 && <a href={apiUrl(a.photos[0]!.originalUrl)} target="_blank" rel="noreferrer" className="text-[13px] text-canopy underline">photo</a>}
                </div>
                <span className="text-[13px] text-ink-muted">{formatDate(a.performedAt)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Page>
  )
}
