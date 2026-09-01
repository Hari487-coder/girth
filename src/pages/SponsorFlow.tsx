import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import { currentGirthCm, getTree, sponsorshipFor } from '../lib/selectors'
import { formatInr, todayIso } from '../lib/format'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Occasion } from '../lib/types'

const OCCASIONS: { value: Occasion; emoji: string }[] = [
  { value: 'Birthday', emoji: '🎂' },
  { value: 'Wedding', emoji: '💍' },
  { value: 'New baby', emoji: '👶' },
  { value: 'Housewarming', emoji: '🏠' },
  { value: 'Memorial', emoji: '🕊️' },
  { value: 'Just because', emoji: '🌱' },
]

const PLANS = [
  { amount: 2000, note: 'Young trees and small species' },
  { amount: 2500, note: 'Established fruit trees' },
  { amount: 3500, note: 'Hardwoods and older trees' },
]

const STEPS = ['Occasion', 'Sponsorship', 'Personalise']

export function SponsorFlow() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useStore()
  const tree = id ? getTree(state, id) : undefined
  useDocumentTitle(tree ? `Sponsor ${tree.id}` : 'Sponsor a tree')

  const [step, setStep] = useState(0)
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [plan, setPlan] = useState<number>(tree?.priceInr ?? 2500)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  if (!tree) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">That tree isn't in the demo grove</h1>
        <Link to="/trees" className="btn-primary mt-8">Find a Tree</Link>
      </div>
    )
  }

  const existing = sponsorshipFor(state, tree.id)
  if (existing && !done) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold text-ink">
          {tree.species} {tree.id} is already in your grove
        </h1>
        <p className="mt-3 text-ink-soft">You sponsored this tree as "{existing.name}".</p>
        <Link to="/my-trees" className="btn-primary mt-8">View My Trees</Link>
      </div>
    )
  }

  function finish() {
    if (!occasion || !tree) return
    dispatch({
      type: 'SPONSOR',
      sponsorship: {
        treeId: tree.id,
        occasion,
        planInr: plan,
        name: name.trim() || `My ${tree.species} Tree`,
        message: message.trim() || 'Growing with us.',
        sponsoredAt: todayIso(),
        girthAtSponsorshipCm: currentGirthCm(state, tree.id),
      },
    })
    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-canopy-soft text-3xl">
          🌱
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold text-ink">
          Your tree is now part of your story.
        </h1>
        <div className="card mx-auto mt-8 max-w-sm p-6 text-left">
          <p className="font-display text-xl font-bold text-ink">
            {name.trim() || `My ${tree.species} Tree`}
          </p>
          <p className="mt-1 font-mono text-[13px] text-ink-muted">{tree.id}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Occasion</dt>
              <dd className="font-semibold text-ink">{occasion}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Sponsorship</dt>
              <dd className="font-semibold text-ink">{formatInr(plan)} / year</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-ink-muted">Message</dt>
              <dd className="text-right font-semibold text-ink">
                "{message.trim() || 'Growing with us.'}"
              </dd>
            </div>
          </dl>
        </div>
        <button type="button" onClick={() => navigate('/my-trees')} className="btn-primary mt-8">
          View My Tree
          <ArrowRightIcon size={16} aria-hidden="true" />
        </button>
        <p className="mt-4 text-[13px] text-ink-muted">
          Demo sponsorship: no payment was processed.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        to={`/trees/${tree.id}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-canopy"
      >
        <ArrowLeftIcon size={14} aria-hidden="true" />
        Back to {tree.id}
      </Link>

      <h1 className="mt-5 font-display text-3xl font-bold text-ink md:text-4xl">
        Sponsor this {tree.species.toLowerCase()}
      </h1>

      {/* progress */}
      <ol className="mt-6 flex items-center gap-2" aria-label="Sponsorship steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full ${i <= step ? 'bg-canopy' : 'bg-line'}`}
              aria-hidden="true"
            />
            <span
              className={`text-[12px] font-semibold ${i === step ? 'text-canopy-deep' : 'text-ink-muted'}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-6 sm:p-8">
        {step === 0 && (
          <fieldset>
            <legend className="font-display text-xl font-bold text-ink">
              What is this tree for?
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              A tree that grows for decades suits moments that matter.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {OCCASIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOccasion(o.value)}
                  aria-pressed={occasion === o.value}
                  className={`cursor-pointer rounded-2xl border p-4 text-center transition-colors ${
                    occasion === o.value
                      ? 'border-canopy bg-canopy-faint'
                      : 'border-line bg-surface hover:border-line-strong'
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">{o.emoji}</span>
                  <span className="mt-2 block text-sm font-semibold text-ink">{o.value}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <fieldset>
            <legend className="font-display text-xl font-bold text-ink">
              Choose your sponsorship
            </legend>
            <p className="mt-1 text-sm text-ink-soft">
              Your sponsorship supports tree maintenance and verification.
            </p>
            <div className="mt-5 space-y-3">
              {PLANS.map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => setPlan(p.amount)}
                  aria-pressed={plan === p.amount}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                    plan === p.amount
                      ? 'border-canopy bg-canopy-faint'
                      : 'border-line bg-surface hover:border-line-strong'
                  }`}
                >
                  <div>
                    <span className="font-mono text-lg font-bold text-ink">
                      {formatInr(p.amount)}
                      <span className="font-sans text-sm font-normal text-ink-muted"> / year</span>
                    </span>
                    <p className="mt-0.5 text-[13px] text-ink-soft">{p.note}</p>
                  </div>
                  {p.amount === tree.priceInr && (
                    <span className="rounded-full bg-canopy-soft px-2.5 py-1 text-[11px] font-semibold text-canopy-deep">
                      This tree's rate
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Make it yours</h2>
            <p className="mt-1 text-sm text-ink-soft">
              The name and message stay on the tree's page for as long as you sponsor it.
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="tree-name" className="field-label">Tree name</label>
                <input
                  id="tree-name"
                  type="text"
                  className="field"
                  placeholder="Amma's Mango Tree"
                  value={name}
                  maxLength={48}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="tree-message" className="field-label">Message</label>
                <input
                  id="tree-message"
                  type="text"
                  className="field"
                  placeholder="Growing with us."
                  value={message}
                  maxLength={80}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary btn-small">
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 0 && !occasion}
              className="btn-primary"
            >
              Continue
              <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={finish} className="btn-primary">
              Sponsor Tree
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
