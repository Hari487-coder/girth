import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CameraIcon,
  CheckCircleIcon,
  MapPinIcon,
  PlusCircleIcon,
  ProhibitIcon,
  TimerIcon,
} from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import {
  currentGirthCm,
  farmSummary,
  INCENTIVE,
  latestVerified,
  pendingMeasurement,
  verifiedHistory,
} from '../lib/selectors'
import { FARMERS } from '../lib/seed'
import { formatDate, formatInr, signedCm, todayIso } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Tree } from '../lib/types'

const STATUS_ORDER: Record<Tree['status'], number> = { attention: 0, growing: 1, dead: 2 }

function FarmTreeRow({ tree }: { tree: Tree }) {
  const { state } = useStore()
  const girth = currentGirthCm(state, tree.id)
  const history = verifiedHistory(state, tree.id)
  const previous = history.length > 1 ? history[history.length - 2].girthCm : undefined
  const latest = latestVerified(state, tree.id)
  const pending = pendingMeasurement(state, tree.id)
  const growth = previous !== undefined ? girth - previous : undefined

  return (
    <Link
      to={`/trees/${tree.id}`}
      className={`card flex flex-col gap-2 p-4 transition-colors hover:border-canopy ${
        tree.status === 'dead' ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold text-ink-muted">{tree.id}</span>
        <StatusBadge
          status={tree.status}
          label={tree.status === 'growing' ? 'Growing' : undefined}
        />
      </div>
      <p className="font-display text-lg font-bold text-ink">{tree.species}</p>
      <div className="flex items-baseline justify-between">
        <p className="font-mono text-2xl font-bold text-ink">
          {girth}
          <span className="ml-1 text-[13px] font-medium text-ink-muted">cm</span>
        </p>
        {growth !== undefined && growth > 0 && (
          <span className="rounded-md bg-canopy-soft px-1.5 py-0.5 font-mono text-[12px] font-semibold text-canopy-deep">
            {signedCm(growth)}
          </span>
        )}
        {growth === 0 && (
          <span className="rounded-md bg-warn-soft px-1.5 py-0.5 font-mono text-[12px] font-semibold text-warn">
            no growth
          </span>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line pt-2 text-[12px] text-ink-muted">
        <span>
          {previous !== undefined ? `was ${previous} cm` : 'first year'}
          {latest && ` · ${formatDate(latest.date)}`}
        </span>
        {pending && <StatusBadge status="pending" label="Pending" />}
      </div>
    </Link>
  )
}

export function Farmer() {
  useDocumentTitle("Ravi's Farm · Farmer Portal")
  const { state, dispatch } = useStore()
  const farm = farmSummary(state, FARMERS.ravi.id)

  const [formOpen, setFormOpen] = useState(false)
  const [treeId, setTreeId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [girth, setGirth] = useState('')
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submittedTo, setSubmittedTo] = useState<string | null>(null)

  const measurableTrees = useMemo(
    () =>
      farm.trees.filter(
        (t) => t.status !== 'dead' && !pendingMeasurement(state, t.id),
      ),
    [farm.trees, state],
  )

  const selectedCurrent = treeId ? currentGirthCm(state, treeId) : undefined

  const sortedTrees = [...farm.trees].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id.localeCompare(b.id),
  )

  function submitMeasurement(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const girthNum = Number(girth)
    if (!treeId) {
      setError('Pick the tree you measured.')
      return
    }
    if (!girth || Number.isNaN(girthNum) || girthNum <= 0) {
      setError('Enter the girth you read off the tape, in centimetres.')
      return
    }
    const current = currentGirthCm(state, treeId)
    if (girthNum < current) {
      setError(
        `That reading is below the last verified girth (${current} cm). Trees don't shrink: check the tape and remeasure.`,
      )
      return
    }
    dispatch({
      type: 'SUBMIT_MEASUREMENT',
      treeId,
      date,
      girthCm: girthNum,
      submittedBy: farm.farmerName,
    })
    setSubmittedTo(treeId)
    setTreeId('')
    setGirth('')
    setPhotoName(null)
    setFormOpen(false)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="demo-chip">Farmer demo mode</span>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Ravi's Farm</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[15px] text-ink-soft">
            <MapPinIcon size={15} aria-hidden="true" />
            {farm.village}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setFormOpen((o) => !o)
            setSubmittedTo(null)
          }}
        >
          <PlusCircleIcon size={17} aria-hidden="true" />
          Record Measurement
        </button>
      </div>

      {/* farm stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink-muted">Active trees</p>
          <p className="mt-1 font-mono text-4xl font-bold text-ink">{farm.activeCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink-muted">Growing</p>
          <p className="mt-1 font-mono text-4xl font-bold text-canopy-deep">{farm.growingCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink-muted">Need attention</p>
          <p className="mt-1 font-mono text-4xl font-bold text-warn">{farm.attentionCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-[13px] font-semibold text-ink-muted">Lost</p>
          <p className="mt-1 font-mono text-4xl font-bold text-ink-muted">{farm.deadCount}</p>
        </div>
      </div>

      {/* earnings */}
      <section className="card mt-6 p-6 sm:p-8" aria-label="Your earnings">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">Your earnings</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Payment follows the trees, not the planting.
            </p>
          </div>
          <span className="demo-chip">Prototype incentive model</span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl bg-canopy-faint p-6">
            <p className="text-[13px] font-semibold text-canopy-deep">
              Estimated annual maintenance payment
            </p>
            <p className="mt-2 font-mono text-5xl font-bold tracking-tight text-ink">
              {formatInr(farm.totalInr)}
            </p>
            <dl className="mt-5 space-y-2 border-t border-canopy/20 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  {farm.activeCount} trees alive × {formatInr(INCENTIVE.alivePerTreeInr)}
                </dt>
                <dd className="font-mono font-semibold text-ink">{formatInr(farm.maintenanceInr)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">
                  {farm.growingCount} trees growing × {formatInr(INCENTIVE.growthBonusInr)}
                </dt>
                <dd className="font-mono font-semibold text-ink">{formatInr(farm.growthBonusInr)}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-3 self-center">
            <div className="flex items-start gap-3 rounded-xl border border-line p-4">
              <CheckCircleIcon size={20} className="mt-0.5 shrink-0 text-canopy" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Growing tree: eligible for payment</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  Care payment plus the growth bonus when the verified girth goes up.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-line p-4">
              <TimerIcon size={20} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Flat tree: care payment only</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  Alive but not growing earns no bonus, so reviving it pays.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-line p-4">
              <ProhibitIcon size={20} className="mt-0.5 shrink-0 text-ink-muted" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">Dead tree: no growth payment</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  A lost tree drops out of the payment run. Keeping trees alive is the job.
                </p>
              </div>
            </div>
            <p className="text-[12px] text-ink-muted">
              Amounts are illustrative for the prototype, not a validated payment formula.
            </p>
          </div>
        </div>
      </section>

      {/* submission success */}
      {submittedTo && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tape-deep/40 bg-warn-soft px-5 py-4">
          <div className="flex items-center gap-3">
            <StatusBadge status="pending" />
            <p className="text-sm text-ink">
              Measurement for <span className="font-mono font-semibold">{submittedTo}</span>{' '}
              submitted. It counts once Girth verifies it.
            </p>
          </div>
          <Link to="/verification" className="text-[13px] font-semibold text-canopy hover:text-canopy-deep">
            Open verification queue
          </Link>
        </div>
      )}

      {/* measurement form */}
      {formOpen && (
        <form onSubmit={submitMeasurement} className="card mt-6 p-6 sm:p-8" noValidate>
          <h2 className="font-display text-2xl font-bold text-ink">Record a measurement</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Wrap the tape at standard height and enter what it says.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="m-tree" className="field-label">Tree</label>
              <select
                id="m-tree"
                className="field cursor-pointer"
                value={treeId}
                onChange={(e) => {
                  setTreeId(e.target.value)
                  setError(null)
                }}
              >
                <option value="">Select a tree</option>
                {measurableTrees.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.species}
                  </option>
                ))}
              </select>
              {selectedCurrent !== undefined && (
                <p className="mt-1.5 text-[12px] text-ink-muted">
                  Last verified girth: {selectedCurrent} cm
                </p>
              )}
            </div>
            <div>
              <label htmlFor="m-date" className="field-label">Measurement date</label>
              <input
                id="m-date"
                type="date"
                className="field"
                value={date}
                max={todayIso()}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="m-girth" className="field-label">Girth (cm)</label>
              <input
                id="m-girth"
                type="number"
                inputMode="decimal"
                className="field"
                placeholder={selectedCurrent !== undefined ? `${selectedCurrent + 3}` : 'e.g. 17'}
                value={girth}
                min={1}
                onChange={(e) => {
                  setGirth(e.target.value)
                  setError(null)
                }}
              />
            </div>
            <div>
              <span className="field-label">Evidence</span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="btn-secondary btn-small cursor-pointer">
                  <CameraIcon size={15} aria-hidden="true" />
                  {photoName ? 'Change photo' : 'Attach photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-canopy-soft px-2.5 py-1 text-[12px] font-semibold text-canopy-deep">
                  <MapPinIcon size={13} aria-hidden="true" /> GPS captured
                </span>
              </div>
              <p className="mt-1.5 text-[12px] text-ink-muted">
                {photoName ? `${photoName} attached` : 'A demo photo is used if none is attached'}
                . Nothing is uploaded in the prototype.
              </p>
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-alert-soft px-4 py-3 text-sm font-medium text-alert" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center gap-3 border-t border-line pt-6">
            <button type="submit" className="btn-primary">
              Submit for verification
            </button>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* tree list */}
      <div className="mt-10">
        <h2 className="font-display text-2xl font-bold text-ink">Your trees</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sortedTrees.map((tree) => (
            <FarmTreeRow key={tree.id} tree={tree} />
          ))}
        </div>
      </div>
    </div>
  )
}
