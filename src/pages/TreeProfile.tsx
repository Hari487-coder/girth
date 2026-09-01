import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckCircleIcon,
  MapPinIcon,
  RulerIcon,
  TimerIcon,
} from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import {
  currentGirthCm,
  getTree,
  lastGrowthCm,
  latestVerified,
  pendingMeasurement,
  sponsorshipFor,
  verifiedHistory,
} from '../lib/selectors'
import { formatDate, formatInr, signedCm } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import { TapeRuler } from '../components/TapeRuler'
import { GrowthChart } from '../components/GrowthChart'
import { DemoPhoto } from '../components/DemoPhoto'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const VERIFY_PIPELINE = ['Farmer submits', 'Girth checks', 'Random spot audit', 'Record verified']

export function TreeProfile() {
  const { id } = useParams()
  const { state } = useStore()
  const tree = id ? getTree(state, id) : undefined
  useDocumentTitle(tree ? `${tree.id} ${tree.species}` : 'Tree not found')

  if (!tree) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">That tree isn't in the demo grove</h1>
        <p className="mt-3 text-ink-soft">Tree IDs look like GIRTH-001. Try the marketplace instead.</p>
        <Link to="/trees" className="btn-primary mt-8">Find a Tree</Link>
      </div>
    )
  }

  const history = verifiedHistory(state, tree.id)
  const girth = currentGirthCm(state, tree.id)
  const growth = lastGrowthCm(state, tree.id)
  const latest = latestVerified(state, tree.id)
  const pending = pendingMeasurement(state, tree.id)
  const sponsorship = sponsorshipFor(state, tree.id)
  const totalGrowth = history.length > 1 ? girth - history[0].girthCm : 0
  const farmTreeCount = state.trees.filter(
    (t) => t.farmerId === tree.farmerId && t.status !== 'dead',
  ).length

  const chartData = history.map((m) => ({
    year: Number(m.date.slice(0, 4)),
    girthCm: m.girthCm,
    simulated: m.simulated,
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link
        to="/trees"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-canopy"
      >
        <ArrowLeftIcon size={14} aria-hidden="true" />
        All trees
      </Link>

      {/* header */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] font-semibold tracking-wide text-ink-muted">
              {tree.id}
            </span>
            <StatusBadge status={tree.status} />
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink md:text-5xl">
            {tree.species}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-ink-soft">
            <span>Growing since {tree.plantedYear}</span>
            <span className="inline-flex items-center gap-1.5">
              <MapPinIcon size={15} aria-hidden="true" />
              {tree.location}
            </span>
            <span>Cared for by {tree.farmerName}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {/* current girth */}
          <section className="card p-6 sm:p-8" aria-label="Current girth">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold text-ink-muted">Current girth</p>
                <p className="mt-1 font-mono text-6xl font-bold tracking-tight text-ink sm:text-7xl">
                  {girth}
                  <span className="ml-2 text-2xl font-semibold text-ink-muted">cm</span>
                </p>
              </div>
              <div className="text-right">
                {growth !== undefined && (
                  <p className="rounded-lg bg-canopy-soft px-2.5 py-1 font-mono text-sm font-semibold text-canopy-deep">
                    {signedCm(growth)} this year
                  </p>
                )}
                {latest && (
                  <p className="mt-2 text-[13px] text-ink-muted">
                    Last verified {formatDate(latest.date)}
                  </p>
                )}
              </div>
            </div>
            <TapeRuler value={girth} className="mt-4" />
          </section>

          {/* growth timeline */}
          <section className="card p-6 sm:p-8" aria-label="Growth timeline">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-ink">Growth</h2>
              {history.length > 1 && (
                <p className="font-mono text-[13px] font-semibold text-canopy-deep">
                  {signedCm(totalGrowth)} since {chartData[0].year}
                </p>
              )}
            </div>
            <GrowthChart data={chartData} className="mt-4" />
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              Every point is a verified annual measurement. A tree that keeps adding
              girth is alive, healthy and storing more carbon: that is what your
              sponsorship pays for.
            </p>
          </section>

          {/* pending banner */}
          {pending && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tape-deep/40 bg-warn-soft px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-ink">
                  New measurement awaiting verification: {pending.girthCm} cm
                </p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  Submitted by {pending.submittedBy} on {formatDate(pending.date)}. It joins
                  the timeline once verified.
                </p>
              </div>
              <Link
                to="/verification"
                className="text-[13px] font-semibold text-canopy hover:text-canopy-deep"
              >
                Open verification queue
              </Link>
            </div>
          )}

          {/* verification */}
          <section className="card p-6 sm:p-8" aria-label="Verification">
            <h2 className="font-display text-2xl font-bold text-ink">How do we know?</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              You never have to take our word for a number. This is the latest
              measurement record behind the girth above.
            </p>

            {latest && (
              <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.1fr]">
                <DemoPhoto girthCm={latest.girthCm} />
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[13px] font-semibold text-ink-muted">
                      Measurement #{String(latest.seq).padStart(3, '0')}
                    </p>
                    <StatusBadge status="verified" />
                  </div>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Date</dt>
                      <dd className="font-semibold text-ink">{formatDate(latest.date)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Girth</dt>
                      <dd className="font-mono font-semibold text-ink">{latest.girthCm} cm</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-muted">Measured at</dt>
                      <dd className="font-semibold text-ink">Standard measurement height</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Submitted by</dt>
                      <dd className="font-semibold text-ink">{latest.submittedBy}, Farmer</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep">
                      <MapPinIcon size={13} aria-hidden="true" /> GPS captured
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep">
                      <TimerIcon size={13} aria-hidden="true" /> Timestamp captured
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep">
                      <RulerIcon size={13} aria-hidden="true" /> Girth recorded
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep">
                      <CameraIcon size={13} aria-hidden="true" /> Photo attached
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 rounded-xl bg-paper p-4">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-ink-soft">
                {VERIFY_PIPELINE.map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className={i === VERIFY_PIPELINE.length - 1 ? 'font-semibold text-canopy-deep' : ''}>
                      {step}
                    </span>
                    {i < VERIFY_PIPELINE.length - 1 && (
                      <ArrowRightIcon size={13} className="text-line-strong" aria-hidden="true" />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            {sponsorship ? (
              <>
                <p className="text-[13px] font-semibold text-canopy-deep">In your grove</p>
                <p className="mt-2 font-display text-xl font-bold text-ink">{sponsorship.name}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Sponsored {formatDate(sponsorship.sponsoredAt)} · {sponsorship.occasion}
                </p>
                <Link to="/my-trees" className="btn-primary mt-5 w-full">
                  View My Trees
                </Link>
              </>
            ) : (
              <>
                <p className="font-mono text-3xl font-bold text-ink">
                  {formatInr(tree.priceInr)}
                  <span className="ml-1 font-sans text-sm font-normal text-ink-muted">/ year</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  Your sponsorship supports tree maintenance and annual verification.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tree.occasions.map((o) => (
                    <span
                      key={o}
                      className="rounded-full border border-line px-2.5 py-1 text-[12px] font-medium text-ink-soft"
                    >
                      {o}
                    </span>
                  ))}
                </div>
                <Link to={`/trees/${tree.id}/sponsor`} className="btn-primary mt-5 w-full">
                  Sponsor This Tree
                </Link>
                <p className="mt-3 text-center text-[12px] text-ink-muted">
                  Demo checkout: no real payment is processed.
                </p>
              </>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-canopy-soft font-display text-sm font-bold text-canopy-deep">
                {tree.farmerName.split(' ').map((p) => p[0]).join('')}
              </span>
              <div>
                <p className="font-semibold text-ink">{tree.farmerName}</p>
                <p className="text-[13px] text-ink-muted">{tree.location}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Cares for {farmTreeCount} living trees in this program. Payment is tied to
              each tree's survival and growth, so a thriving tree pays better than a new
              sapling.
            </p>
            <Link
              to="/farmer"
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-canopy hover:text-canopy-deep"
            >
              See the farmer's side
              <ArrowRightIcon size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-line bg-paper p-5">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
              <CheckCircleIcon size={16} className="text-canopy" aria-hidden="true" />
              What you're actually buying
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Not the planting. The proof of growth: a verified girth reading for this
              tree, every year, for as long as you sponsor it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
