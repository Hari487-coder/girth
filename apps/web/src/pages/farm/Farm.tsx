import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowsClockwiseIcon, RulerIcon, WifiSlashIcon } from '@phosphor-icons/react'
import { api } from '../../lib/api'
import type { FarmSummary, Tree } from '../../lib/types'
import { formatDate, formatPaise } from '../../lib/format'
import { useLang, useT } from '../../lib/i18n'
import { useOfflineQueue } from '../../lib/offlineQueue'
import { StatusBadge } from '../../components/StatusBadge'
import { ErrorNote, Loading, Stat } from '../../components/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

type FarmTree = Tree & { pendingMeasurements: number }

export function Farm() {
  const t = useT()
  const [lang, setLang] = useLang()
  useDocumentTitle(t('myFarm'))
  const farm = useQuery({ queryKey: ['me', 'farm'], queryFn: () => api<FarmSummary>('/me/farm') })
  const trees = useQuery({ queryKey: ['me', 'trees'], queryFn: () => api<{ trees: FarmTree[] }>('/me/trees') })
  const queue = useOfflineQueue()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-ink-muted">{t('myFarm')}</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{farm.data?.farmer.legalName ?? '…'}</h1>
          {farm.data && <p className="mt-1 text-sm text-ink-soft">{farm.data.farmer.village}, {farm.data.farmer.district}</p>}
        </div>
        <label className="text-[12px] text-ink-muted">
          <span className="sr-only">{t('language')}</span>
          <select
            className="cursor-pointer rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px] font-medium text-ink"
            value={lang}
            onChange={(e) => setLang(e.target.value as 'en' | 'te')}
          >
            <option value="en">English</option>
            <option value="te">తెలుగు</option>
          </select>
        </label>
      </div>

      <Link to="/farm/measure" className="btn-primary mt-6 w-full py-4 text-base">
        <RulerIcon size={20} aria-hidden="true" />
        {t('recordMeasurement')}
      </Link>

      {!queue.online && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-ink">
          <WifiSlashIcon size={18} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
          {t('offline')}
        </p>
      )}
      {queue.pending.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tape-deep/40 bg-warn-soft px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            {queue.pending.length} {t('waitingToSync')}
          </p>
          <button type="button" className="btn-secondary btn-small" onClick={() => void queue.flush()} disabled={queue.syncing || !queue.online}>
            <ArrowsClockwiseIcon size={15} className={queue.syncing ? 'animate-spin' : ''} aria-hidden="true" />
            {t('syncNow')}
          </button>
          {queue.pending.some((p) => p.lastError) && (
            <ul className="w-full space-y-1 text-[12px] text-alert">
              {queue.pending.filter((p) => p.lastError).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.treePublicId}: {p.lastError}</span>
                  <button type="button" className="cursor-pointer underline" onClick={() => void queue.discard(p.id)}>Discard</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {farm.isPending && <Loading />}
      <ErrorNote error={farm.error} className="mt-4" />
      {farm.data && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t('trees')} value={farm.data.registered} />
            <Stat label={t('alive')} value={farm.data.alive} tone="canopy" />
            <Stat label={t('needsAttention')} value={farm.data.needsAttention} tone="warn" />
            <Stat label={t('dead')} value={farm.data.dead} tone="muted" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat label={t('paymentsPending')} value={formatPaise(farm.data.payments.pendingPaise)} tone="canopy" />
            <Stat label={t('paid')} value={formatPaise(farm.data.payments.paidPaise)} />
          </div>
        </>
      )}

      <h2 className="mt-8 font-display text-xl font-bold text-ink">{t('yourTrees')}</h2>
      {trees.isPending && <Loading />}
      <ErrorNote error={trees.error} className="mt-4" />
      <ul className="mt-4 space-y-2">
        {trees.data?.trees.map((tree) => (
          <li key={tree.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-ink-muted">{tree.publicId}</span>
                <StatusBadge status={tree.status} />
                {tree.pendingMeasurements > 0 && <StatusBadge status="PENDING_REVIEW" label={`${tree.pendingMeasurements} ${t('pending')}`} />}
              </div>
              <p className="mt-1 font-semibold text-ink">{tree.species}</p>
              <p className="text-[12px] text-ink-muted">
                {tree.currentGirthCm !== null ? `${tree.currentGirthCm} cm · ${t('lastVerified')} ${formatDate(tree.currentGirthDate)}` : t('pending')}
              </p>
            </div>
            <Link to={`/farm/measure/${tree.publicId}`} className="btn-secondary btn-small shrink-0">
              {t('measure')}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
