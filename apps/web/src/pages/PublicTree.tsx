import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon, CameraIcon, MapPinIcon, RulerIcon, SealCheckIcon, TimerIcon } from '@phosphor-icons/react'
import { api, apiUrl } from '../lib/api'
import type { PublicTreeProfile } from '../lib/types'
import { formatDate, formatPaise, shortDate, signedCm, OCCASION_LABEL } from '../lib/format'
import { SPECIES_PHOTOS } from '../lib/speciesPhotos'
import { useSession } from '../lib/session'
import { StatusBadge } from '../components/StatusBadge'
import { TapeRuler } from '../components/TapeRuler'
import { CountUp } from '../components/CountUp'
import { GrowthChart } from '../components/GrowthChart'
import { ErrorNote, Loading, Notice } from '../components/ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const VERIFY_PIPELINE = ['Farmer submits', 'Automated checks', 'Human review', 'Random spot audit']

type Profile = PublicTreeProfile & { sponsorable: boolean; pricePaise: number; termYears: number }

export function PublicTree() {
  const { publicId = '' } = useParams()
  const { user } = useSession()
  const query = useQuery({
    queryKey: ['public-tree', publicId.toUpperCase()],
    queryFn: () => api<Profile>(`/public/trees/${publicId.toUpperCase()}`),
  })
  const tree = query.data
  useDocumentTitle(tree ? `${tree.publicId} ${tree.species}` : publicId.toUpperCase())

  if (query.isPending) return <Loading label="Finding this tree" />
  if (query.error || !tree) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">No tree with that ID</h1>
        <p className="mt-3 text-ink-soft">Tree IDs look like GIRTH-000001. Check the tag and try again.</p>
        <ErrorNote error={query.error} className="mx-auto mt-6 max-w-md" />
        <Link to="/trees" className="btn-primary mt-8">Find a Tree</Link>
      </div>
    )
  }

  const photo = SPECIES_PHOTOS[tree.species]
  const girth = tree.currentGirthCm ?? 0
  const tapeMax = Math.max(30, Math.ceil((girth + 8) / 10) * 10)
  const chartData = tree.timeline.map((t) => ({ label: shortDate(t.date), girthCm: t.girthCm }))
  const latest = tree.latestVerification
  const canMeasure = user && ['FARMER', 'FIELD_AUDITOR', 'ADMIN'].includes(user.role) && tree.alive

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link to="/trees" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-canopy">
        <ArrowLeftIcon size={14} aria-hidden="true" />
        All trees
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] font-semibold tracking-wide text-ink-muted">{tree.publicId}</span>
            <StatusBadge status={tree.status} label={tree.statusLabel} />
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink md:text-5xl">{tree.species}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-ink-soft">
            {tree.plantingYear && <span>Growing since {tree.plantingYear}</span>}
            {tree.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon size={15} aria-hidden="true" />
                {tree.location}
              </span>
            )}
            <span>{tree.growth.verifiedReadings} verified {tree.growth.verifiedReadings === 1 ? 'reading' : 'readings'}</span>
          </p>
        </div>

        {photo && (
          <figure className="w-full sm:max-w-sm">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-line/40">
              <img src={photo.src} alt={`A ${tree.species.toLowerCase()} tree of this species`} className="size-full object-cover" style={{ objectPosition: photo.position }} />
            </div>
            <figcaption className="mt-1.5 text-[11px] text-ink-muted">
              A {tree.species.toLowerCase()} like this one · photo{' '}
              <a href={photo.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-canopy">{photo.credit}</a>{' '}
              ({photo.license}), Wikimedia Commons
            </figcaption>
          </figure>
        )}
      </div>

      {!tree.alive && (
        <div className="mt-6">
          <Notice tone="warn">
            <p className="font-semibold text-ink">
              {tree.status === 'REPLACED' || tree.status === 'DEAD' ? 'This tree did not survive.' : 'This tree is no longer in the program.'}
            </p>
            <p className="mt-1 text-ink-soft">
              {tree.status === 'REPLACED' || tree.status === 'DEAD' ? 'A Girth auditor confirmed it. We do not hide mortality; it is part of the record.' : ''}
              {tree.replacedBy && (
                <>
                  {' '}A replacement, <Link to={`/tree/${tree.replacedBy.publicId}`} className="font-semibold text-canopy hover:underline">{tree.replacedBy.publicId}</Link>, is growing in its place.
                </>
              )}
            </p>
          </Notice>
        </div>
      )}
      {tree.replacementFor && (
        <div className="mt-6">
          <Notice>
            This tree replaced <Link to={`/tree/${tree.replacementFor.publicId}`} className="font-semibold text-canopy hover:underline">{tree.replacementFor.publicId}</Link>, which did not survive. The original stays on record.
          </Notice>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <section className="card p-6 sm:p-8" aria-label="Current girth">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-ink-muted">Current girth</p>
                {tree.currentGirthCm !== null ? (
                  <p className="mt-1 font-mono text-6xl font-bold tracking-tight text-ink sm:text-7xl">
                    <CountUp value={tree.currentGirthCm} />
                    <span className="ml-2 text-2xl font-semibold text-ink-muted">cm</span>
                  </p>
                ) : (
                  <p className="mt-2 text-ink-soft">Awaiting the first verified measurement.</p>
                )}
              </div>
              <div className="text-right">
                {tree.growth.lastCm !== null && (
                  <p className="rounded-lg bg-canopy-soft px-2.5 py-1 font-mono text-sm font-semibold text-canopy-deep">{signedCm(tree.growth.lastCm)} since last reading</p>
                )}
                {tree.currentGirthDate && <p className="mt-2 text-[13px] text-ink-muted">Verified {formatDate(tree.currentGirthDate)}</p>}
              </div>
            </div>
            <TapeRuler value={girth} max={tapeMax} className="mt-4" />
          </section>

          <section className="card p-6 sm:p-8" aria-label="Growth timeline">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">Growth</h2>
              {tree.growth.totalCm !== null && (
                <p className="font-mono text-[13px] font-semibold text-canopy-deep">
                  {signedCm(tree.growth.totalCm)} over {tree.growth.yearsTracked} {tree.growth.yearsTracked === 1 ? 'year' : 'years'}
                </p>
              )}
            </div>
            {chartData.length > 0 ? (
              <GrowthChart data={chartData} className="mt-4" />
            ) : (
              <p className="mt-4 text-sm text-ink-soft">The timeline starts with the first verified reading.</p>
            )}
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              Every point is a measurement a person submitted with a photo and location, and a second person verified. Nothing on this
              chart can be edited afterwards.
            </p>
          </section>

          <section className="card p-6 sm:p-8" aria-label="Verification">
            <h2 className="font-display text-2xl font-bold text-ink">How do we know?</h2>
            {latest ? (
              <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.1fr]">
                <div className="overflow-hidden rounded-xl border border-line bg-line/30">
                  {latest.photoUrl ? (
                    <img src={apiUrl(latest.photoUrl)} alt={`Verified measurement photo for ${tree.publicId}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-[13px] text-ink-muted">
                      <span>
                        <CameraIcon size={22} className="mx-auto mb-2" aria-hidden="true" />
                        No public photo for this reading
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[13px] font-semibold text-ink-muted">Latest verified measurement</p>
                    <StatusBadge status="VERIFIED" />
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Measured</dt>
                      <dd className="font-semibold text-ink">{formatDate(latest.date)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Girth</dt>
                      <dd className="font-mono font-semibold text-ink">{latest.girthCm} cm</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Measured at</dt>
                      <dd className="font-semibold text-ink">{latest.measurementHeightCm} cm above ground</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Verified</dt>
                      <dd className="font-semibold text-ink">{formatDate(latest.verifiedAt)}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep"><RulerIcon size={13} aria-hidden="true" /> Girth recorded</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep"><TimerIcon size={13} aria-hidden="true" /> Timestamp captured</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep"><MapPinIcon size={13} aria-hidden="true" /> Location checked</span>
                    {latest.audited && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep"><SealCheckIcon size={13} aria-hidden="true" /> Spot audited</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">No verified measurement yet. The first one appears here with its photo and location.</p>
            )}
            <div className="mt-7 rounded-xl bg-paper p-4">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-ink-soft">
                {VERIFY_PIPELINE.map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className={i === VERIFY_PIPELINE.length - 1 ? 'font-semibold text-canopy-deep' : ''}>{step}</span>
                    {i < VERIFY_PIPELINE.length - 1 && <ArrowRightIcon size={13} className="text-line-strong" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {tree.sponsorship ? (
            <div className="card p-6">
              <p className="text-[13px] font-semibold text-canopy-deep">Sponsored</p>
              <p className="mt-2 font-display text-xl font-bold text-ink">{tree.sponsorship.treeName}</p>
              {tree.sponsorship.message && <p className="mt-1 text-sm text-ink-soft">"{tree.sponsorship.message}"</p>}
              <p className="mt-2 text-[13px] text-ink-muted">{OCCASION_LABEL[tree.sponsorship.occasion] ?? tree.sponsorship.occasion}</p>
            </div>
          ) : tree.sponsorable ? (
            <div className="card p-6">
              <p className="font-mono text-3xl font-bold text-ink">
                {formatPaise(tree.pricePaise)}
                <span className="ml-1 font-sans text-sm font-normal text-ink-muted">for {tree.termYears} years</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">Your sponsorship pays the farmer for keeping this tree alive and pays for its yearly verification.</p>
              <Link to={`/tree/${tree.publicId}/sponsor`} className="btn-primary mt-5 w-full">Sponsor this tree</Link>
              <p className="mt-3 text-center text-[12px] text-ink-muted">Pilot price. Payment is confirmed by the Girth team; no card is taken online yet.</p>
            </div>
          ) : (
            <div className="card p-6 text-sm text-ink-soft">This tree is not open for sponsorship.</div>
          )}

          {canMeasure && (
            <div className="card p-6">
              <p className="text-[13px] font-semibold text-ink">Field</p>
              <Link to={`/farm/measure/${tree.publicId}`} className="btn-secondary mt-3 w-full">
                <RulerIcon size={16} aria-hidden="true" />
                Record measurement
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="text-[13px] font-semibold text-ink">What you are looking at</p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Not a promise that a tree was planted. A verified girth reading for this exact tree, every year, with the evidence behind it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
