import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CameraIcon,
  CheckCircleIcon,
  FlagIcon,
  MapPinIcon,
  RulerIcon,
  SealCheckIcon,
  TimerIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import { getTree, pendingQueue, reviewedMeasurements, verifiedHistory } from '../lib/selectors'
import { seededRandom } from '../lib/seed'
import { formatDate, signedCm } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import { DemoPhoto } from '../components/DemoPhoto'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Measurement } from '../lib/types'

/** Annual girth gain beyond this is suspicious for a young tree. */
const MAX_PLAUSIBLE_GAIN_CM = 7

function QueueItem({
  measurement,
  onReviewed,
}: {
  measurement: Measurement
  onReviewed: (id: string) => void
}) {
  const { state, dispatch } = useStore()
  const tree = getTree(state, measurement.treeId)
  if (!tree) return null

  const history = verifiedHistory(state, tree.id)
  const previous = history[history.length - 1]
  const delta = previous ? measurement.girthCm - previous.girthCm : undefined
  const suspicious = delta !== undefined && (delta < 0 || delta > MAX_PLAUSIBLE_GAIN_CM)

  function review(decision: 'verified' | 'flagged' | 'remeasure') {
    dispatch({ type: 'REVIEW_MEASUREMENT', measurementId: measurement.id, decision })
    onReviewed(measurement.id)
  }

  return (
    <article className="card p-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr_auto]">
        <DemoPhoto girthCm={measurement.girthCm} className="max-lg:max-w-xs" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/trees/${tree.id}`}
              className="font-mono text-[13px] font-semibold text-canopy hover:text-canopy-deep"
            >
              {tree.id}
            </Link>
            <span className="text-sm font-semibold text-ink">{tree.species}</span>
            <StatusBadge status="pending" />
          </div>
          <p className="mt-1 text-[13px] text-ink-soft">
            Submitted by {measurement.submittedBy} · {formatDate(measurement.date)}
          </p>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <p className="text-[12px] font-semibold text-ink-muted">Submitted girth</p>
              <p className="font-mono text-3xl font-bold text-ink">
                {measurement.girthCm}
                <span className="ml-1 text-sm font-medium text-ink-muted">cm</span>
              </p>
            </div>
            {previous && (
              <div>
                <p className="text-[12px] font-semibold text-ink-muted">Last verified</p>
                <p className="font-mono text-3xl font-bold text-ink-soft">
                  {previous.girthCm}
                  <span className="ml-1 text-sm font-medium text-ink-muted">cm</span>
                </p>
              </div>
            )}
            {delta !== undefined && (
              <span
                className={`rounded-lg px-2.5 py-1 font-mono text-sm font-semibold ${
                  suspicious ? 'bg-warn-soft text-warn' : 'bg-canopy-soft text-canopy-deep'
                }`}
              >
                {signedCm(delta)} vs last year
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 font-semibold text-canopy-deep">
              <MapPinIcon size={13} aria-hidden="true" /> GPS matches the farm
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 font-semibold text-canopy-deep">
              <TimerIcon size={13} aria-hidden="true" /> Timestamp plausible
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 font-semibold text-canopy-deep">
              <CameraIcon size={13} aria-hidden="true" /> Photo attached
            </span>
            {suspicious && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 font-semibold text-warn">
                <WarningCircleIcon size={13} aria-hidden="true" /> Growth outside expected range
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-row gap-2 lg:flex-col">
          <button type="button" className="btn-primary btn-small" onClick={() => review('verified')}>
            <SealCheckIcon size={15} aria-hidden="true" />
            Verify
          </button>
          <button
            type="button"
            className="btn btn-small border border-alert/40 bg-surface px-4 text-alert hover:bg-alert-soft"
            onClick={() => review('flagged')}
          >
            <FlagIcon size={15} aria-hidden="true" />
            Flag
          </button>
          <button
            type="button"
            className="btn-secondary btn-small"
            onClick={() => review('remeasure')}
          >
            <RulerIcon size={15} aria-hidden="true" />
            Request remeasurement
          </button>
        </div>
      </div>
    </article>
  )
}

export function Verification() {
  useDocumentTitle('Verification')
  const { state, dispatch } = useStore()
  const queue = pendingQueue(state)
  const held = reviewedMeasurements(state)
  const [reviewedIds, setReviewedIds] = useState<string[]>([])

  const justVerified = reviewedIds
    .map((id) => state.measurements.find((m) => m.id === id))
    .filter((m): m is Measurement => !!m && m.status === 'verified')

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="demo-chip">Girth team demo mode</span>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Verification Queue</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
            Girth never publishes an uploaded number as-is. Every submission is checked
            here before it reaches a customer's timeline.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[13px] font-semibold text-ink">Automated checks</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            Photo, GPS and timestamp present; girth can only stay flat or rise; annual
            gain within the expected range for the species.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[13px] font-semibold text-ink">Random spot audits</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            A share of verified records is remeasured in the field by a Girth auditor,
            so a fabricated reading is a bad bet.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {queue.length > 0 ? (
          queue.map((m) => (
            <QueueItem
              key={m.id}
              measurement={m}
              onReviewed={(id) =>
                setReviewedIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
              }
            />
          ))
        ) : (
          <div className="card px-6 py-14 text-center">
            <CheckCircleIcon size={30} className="mx-auto text-canopy" aria-hidden="true" />
            <p className="mt-3 font-display text-xl font-bold text-ink">Queue is clear</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
              New submissions from the Farmer Portal land here. Record a measurement
              there to see the loop in action.
            </p>
            <Link to="/farmer" className="btn-secondary btn-small mt-5">
              Open Farmer Portal
            </Link>
          </div>
        )}
      </div>

      {justVerified.length > 0 && (
        <section className="mt-10" aria-label="Recently verified">
          <h2 className="font-display text-xl font-bold text-ink">Verified this session</h2>
          <div className="mt-4 space-y-2">
            {justVerified.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/trees/${m.treeId}`}
                    className="font-mono text-[13px] font-semibold text-canopy hover:text-canopy-deep"
                  >
                    {m.treeId}
                  </Link>
                  <span className="font-mono text-sm font-semibold text-ink">{m.girthCm} cm</span>
                  <StatusBadge status="verified" />
                  {seededRandom(m.id) < 0.15 && (
                    <span className="rounded-full bg-warn-soft px-2.5 py-1 text-[12px] font-semibold text-warn">
                      Spot audit scheduled
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-ink-muted">
                  Now on the customer's timeline
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {held.length > 0 && (
        <section className="mt-10" aria-label="Held back">
          <h2 className="font-display text-xl font-bold text-ink">Held back</h2>
          <p className="mt-1 text-sm text-ink-soft">
            These readings never reached a customer. The farmer is asked to remeasure.
          </p>
          <div className="mt-4 space-y-2">
            {held.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-[13px] font-semibold text-ink-muted">{m.treeId}</span>
                  <span className="font-mono text-sm font-semibold text-ink">{m.girthCm} cm</span>
                  <StatusBadge status={m.status} />
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-[13px] font-semibold text-canopy hover:text-canopy-deep"
                  onClick={() =>
                    dispatch({ type: 'REVIEW_MEASUREMENT', measurementId: m.id, decision: 'pending' })
                  }
                >
                  Return to queue
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
