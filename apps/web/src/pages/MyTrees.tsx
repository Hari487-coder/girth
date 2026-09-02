import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRightIcon, PlantIcon, SparkleIcon } from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import {
  currentGirthCm,
  getTree,
  latestVerified,
  nextGrowthIncrement,
  verifiedHistory,
} from '../lib/selectors'
import { formatDate, signedCm } from '../lib/format'
import { StatusBadge } from '../components/StatusBadge'
import { TapeRuler } from '../components/TapeRuler'
import { CountUp } from '../components/CountUp'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Sponsorship } from '../lib/types'

function SponsoredTreeCard({ sponsorship }: { sponsorship: Sponsorship }) {
  const { state, dispatch } = useStore()
  const reduceMotion = useReducedMotion()
  const [lastDelta, setLastDelta] = useState<number | null>(null)
  const tree = getTree(state, sponsorship.treeId)

  if (!tree) return null

  const girth = currentGirthCm(state, tree.id)
  const latest = latestVerified(state, tree.id)
  const history = verifiedHistory(state, tree.id)
  const latestYear = latest ? Number(latest.date.slice(0, 4)) : undefined
  const sinceSponsorship = girth - sponsorship.girthAtSponsorshipCm
  const hasSimulated = history.some((m) => m.simulated)
  const tapeMax = Math.max(30, Math.ceil((girth + 8) / 10) * 10)

  function simulateYear() {
    const delta = nextGrowthIncrement(state, tree!.id)
    setLastDelta(delta)
    dispatch({ type: 'SIMULATE_GROWTH', treeId: tree!.id })
  }

  return (
    <article className="card overflow-hidden">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-muted">
              {tree.id}
            </span>
            <StatusBadge status={tree.status} label={tree.status === 'growing' ? 'Alive' : undefined} />
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
            {sponsorship.name}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {tree.species} · {tree.location}
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            "{sponsorship.message}" · {sponsorship.occasion}
          </p>
          {latest && (
            <p className="mt-4 text-[13px] text-ink-muted">
              Last verified {formatDate(latest.date)}
              {hasSimulated && ' (includes simulated years)'}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link to={`/trees/${tree.id}`} className="btn-secondary btn-small">
              View growth
            </Link>
            <button type="button" onClick={simulateYear} className="btn-primary btn-small">
              <SparkleIcon size={15} aria-hidden="true" />
              See next year's growth
            </button>
          </div>
          <p className="mt-3 text-[12px] text-ink-muted">
            Simulates the next annual verified measurement, for the demo.
          </p>
        </div>

        <div className="rounded-2xl bg-paper p-5 sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-ink-muted">
                Girth{latestYear ? ` in ${latestYear}` : ''}
              </p>
              <p className="mt-1 font-mono text-5xl font-bold tracking-tight text-ink sm:text-6xl">
                <CountUp value={girth} />
                <span className="ml-1.5 text-xl font-semibold text-ink-muted">cm</span>
              </p>
            </div>
            <div className="text-right">
              <p className="rounded-lg bg-canopy-soft px-2.5 py-1 font-mono text-sm font-semibold text-canopy-deep">
                {signedCm(sinceSponsorship)} since sponsorship
              </p>
            </div>
          </div>
          <TapeRuler
            value={girth}
            max={tapeMax}
            baseline={sponsorship.girthAtSponsorshipCm}
            baselineLabel="at sponsorship"
            className="mt-3"
          />
          <AnimatePresence>
            {lastDelta !== null && (
              <motion.div
                key={girth}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.5 }}
                className="mt-4 rounded-xl border border-canopy/30 bg-canopy-faint px-4 py-3"
              >
                <p className="font-mono text-sm font-bold text-canopy-deep">
                  {signedCm(lastDelta)} this year
                </p>
                <p className="mt-0.5 text-sm font-medium text-ink">
                  Your tree grew. That's what you paid for.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  )
}

export function MyTrees() {
  useDocumentTitle('My Trees')
  const { state } = useStore()
  const sponsorships = state.sponsorships

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">My Trees</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
            The trees you sponsor, with their live girth and verified history. This page
            is the product: proof, not promises.
          </p>
        </div>
        <span className="demo-chip">Demo data</span>
      </div>

      {sponsorships.length === 0 ? (
        <div className="card mt-10 px-6 py-20 text-center">
          <PlantIcon size={34} className="mx-auto text-canopy" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl font-bold text-ink">No trees yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
            Sponsor a tree and it appears here with its girth, its history and an annual
            update you can watch arrive.
          </p>
          <Link to="/trees" className="btn-primary mt-7">
            Find a Tree
            <ArrowRightIcon size={16} aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-6">
          {sponsorships.map((s) => (
            <SponsoredTreeCard key={s.treeId} sponsorship={s} />
          ))}
        </div>
      )}
    </div>
  )
}
