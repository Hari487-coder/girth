import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRightIcon, PlantIcon } from '@phosphor-icons/react'
import { api } from '../lib/api'
import type { SponsoredTree } from '../lib/types'
import { formatDate, signedCm, OCCASION_LABEL } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import { TapeRuler } from '../components/TapeRuler'
import { CountUp } from '../components/CountUp'
import { Empty, ErrorNote, Loading, Page } from '../components/ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function MyTrees() {
  useDocumentTitle('My Trees')
  const query = useQuery({ queryKey: ['me', 'trees'], queryFn: () => api<{ trees: SponsoredTree[] }>('/me/trees') })

  return (
    <Page title="My Trees" intro="The trees you sponsor, with their verified girth and how much they have grown since you joined them." width="max-w-5xl">
      {query.isPending && <Loading label="Loading your trees" />}
      <ErrorNote error={query.error} />
      {query.data && query.data.trees.length === 0 && (
        <Empty
          title="No trees yet"
          body="Sponsor a tree and it appears here with its girth, its history and every verified update."
          action={
            <Link to="/trees" className="btn-primary">
              Find a Tree
              <ArrowRightIcon size={16} aria-hidden="true" />
            </Link>
          }
        />
      )}
      <div className="space-y-6">
        {query.data?.trees.map((s) => {
          const girth = s.currentGirthCm ?? 0
          const baseline = s.growthSinceSponsorshipCm !== null ? girth - s.growthSinceSponsorshipCm : undefined
          const tapeMax = Math.max(30, Math.ceil((girth + 8) / 10) * 10)
          return (
            <article key={s.sponsorshipId} className="card overflow-hidden">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-muted">{s.tree.publicId}</span>
                    <StatusBadge status={s.tree.status} />
                    {s.status !== 'ACTIVE' && <StatusBadge status={s.status} />}
                  </div>
                  <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">{s.treeName}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{s.tree.species} · {OCCASION_LABEL[s.occasion] ?? s.occasion}</p>
                  {s.message && <p className="mt-3 text-sm text-ink-soft">"{s.message}"</p>}
                  {s.status === 'PENDING_PAYMENT' && (
                    <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-[13px] text-ink">
                      Awaiting payment confirmation from the Girth team. Growth updates start once it is active.
                    </p>
                  )}
                  {s.lastVerifiedAt && <p className="mt-4 text-[13px] text-ink-muted">Last verified {formatDate(s.lastVerifiedAt)} · {s.verifiedReadings} readings</p>}
                  <div className="mt-5">
                    <Link to={`/tree/${s.tree.publicId}`} className="btn-secondary btn-small">View growth</Link>
                  </div>
                </div>
                <div className="rounded-2xl bg-paper p-5 sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-ink-muted">Girth</p>
                      <p className="mt-1 font-mono text-5xl font-bold tracking-tight text-ink sm:text-6xl">
                        {s.currentGirthCm !== null ? <CountUp value={s.currentGirthCm} /> : '–'}
                        <span className="ml-1.5 text-xl font-semibold text-ink-muted">cm</span>
                      </p>
                    </div>
                    {s.growthSinceSponsorshipCm !== null && (
                      <p className="rounded-lg bg-canopy-soft px-2.5 py-1 font-mono text-sm font-semibold text-canopy-deep">{signedCm(s.growthSinceSponsorshipCm)} since sponsorship</p>
                    )}
                  </div>
                  <TapeRuler value={girth} max={tapeMax} baseline={baseline} baselineLabel="at sponsorship" className="mt-3" />
                </div>
              </div>
            </article>
          )
        })}
      </div>
      {query.data && query.data.trees.length > 0 && (
        <p className="mt-8 flex items-center gap-2 text-[13px] text-ink-muted">
          <PlantIcon size={16} aria-hidden="true" />
          Each verified measurement updates these numbers. Nothing here is estimated.
        </p>
      )}
    </Page>
  )
}
