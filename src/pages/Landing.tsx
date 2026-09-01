import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  ArrowRightIcon,
  CameraIcon,
  ChartLineUpIcon,
  HandCoinsIcon,
  IdentificationBadgeIcon,
  MapPinIcon,
  PlantIcon,
  RulerIcon,
  SealCheckIcon,
  TimerIcon,
} from '@phosphor-icons/react'
import { TrunkRings } from '../components/TrunkRings'
import { TapeRuler } from '../components/TapeRuler'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const HERO_STEPS = [
  { year: 2024, girthCm: 8 },
  { year: 2025, girthCm: 14 },
  { year: 2026, girthCm: 21 },
]

const HOW_IT_WORKS = [
  {
    icon: PlantIcon,
    title: 'Sponsor a real tree',
    body: 'Every tree has an ID, a species, a farmer and a place. You pick one, not a promise.',
  },
  {
    icon: HandCoinsIcon,
    title: 'A farmer tends it',
    body: 'The farmer is paid for keeping the tree alive and growing, not for planting it.',
  },
  {
    icon: RulerIcon,
    title: 'We measure every year',
    body: 'Trunk girth is recorded at a standard height, with a photo, GPS and timestamp.',
  },
  {
    icon: ChartLineUpIcon,
    title: 'You watch it grow',
    body: 'Each verified measurement joins a permanent timeline you can check any time.',
  },
]

const TRUST_STEPS = [
  {
    icon: IdentificationBadgeIcon,
    title: 'Tree ID',
    body: 'Every tree gets a unique ID the day it enters the program.',
    detail: 'GIRTH-001',
  },
  {
    icon: RulerIcon,
    title: 'Measurement',
    body: 'Girth is recorded once a year at a standard measurement height.',
    detail: '14 cm',
  },
  {
    icon: CameraIcon,
    title: 'Evidence',
    body: 'Each reading ships with a photo, a GPS fix and a timestamp.',
    detail: 'photo · GPS · time',
  },
  {
    icon: SealCheckIcon,
    title: 'Verification',
    body: 'Automated checks plus random spot audits before a record counts.',
    detail: 'verified',
  },
  {
    icon: TimerIcon,
    title: 'Growth history',
    body: 'Verified readings become a permanent, customer-facing timeline.',
    detail: '8 → 14 → 21 cm',
  },
]

export function Landing() {
  useDocumentTitle('Pay for trees that grow')
  const reduceMotion = useReducedMotion()

  const reveal = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as const },
  })

  return (
    <div>
      {/* hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pt-20">
        <div>
          <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl lg:text-[3.4rem]">
            <span className="text-ink-muted">Don't pay for trees planted.</span>
            <br />
            <span className="text-ink">
              Pay for trees that <span className="text-canopy-deep">grow.</span>
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
            Girth lets you sponsor a real tree and follow its survival and growth, year
            after year.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/trees" className="btn-primary">
              Find a Tree
              <ArrowRightIcon size={16} aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className="btn-secondary">
              See how it works
            </a>
          </div>
        </div>

        <TrunkRings steps={HERO_STEPS} className="mx-auto w-full max-w-md lg:max-w-none" />
      </section>

      {/* the core contrast */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <motion.div {...reveal()}>
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
              A planted tree is a claim.
              <br />
              A growing tree is proof.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
              Most programs sell the number of saplings that went into the ground. Nobody
              tells you what happened next. Girth changes the unit of value: you pay for
              a tree's survival and its girth, measured every year.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper p-5">
                <p className="text-[13px] font-semibold text-ink-muted">Traditional planting</p>
                <p className="mt-2 font-display text-lg font-semibold text-ink-soft">
                  "We planted a tree."
                </p>
                <p className="mt-1 text-[13px] text-ink-muted">Then, silence.</p>
              </div>
              <div className="rounded-2xl border border-canopy/30 bg-canopy-faint p-5">
                <p className="text-[13px] font-semibold text-canopy-deep">Girth</p>
                <p className="mt-2 font-display text-lg font-semibold text-ink">
                  "Your tree is alive. Here's how much it grew."
                </p>
                <p className="mt-1 font-mono text-[13px] text-canopy-deep">measured yearly</p>
              </div>
            </div>
          </motion.div>

          <motion.div {...reveal(0.1)} className="self-center">
            <p className="text-sm font-semibold text-ink">One tree, three years on the tape</p>
            <div className="mt-4 space-y-5">
              {HERO_STEPS.map((step, i) => (
                <div key={step.year} className="grid grid-cols-[64px_1fr_72px] items-center gap-3">
                  <span className="text-[13px] font-medium text-ink-muted">Year {i + 1}</span>
                  <TapeRuler value={step.girthCm} max={25} compact />
                  <span className="text-right font-mono text-xl font-bold text-ink">
                    {step.girthCm} <span className="text-[13px] font-medium text-ink-muted">cm</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-ink-muted">
              Girth is trunk circumference at a standard height. It only moves one way
              while the tree is alive, which makes it an honest score.
            </p>
          </motion.div>
        </div>
      </section>

      {/* how it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <motion.h2 {...reveal()} className="font-display text-3xl font-bold text-ink md:text-4xl">
          How Girth works
        </motion.h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div key={item.title} {...reveal(i * 0.07)} className="card p-6">
              <item.icon size={26} className="text-canopy" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* trust model */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <motion.div {...reveal()} className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
              Why you can trust the number
            </h2>
            <p className="mt-4 leading-relaxed text-ink-soft">
              14 cm is only worth paying for if it's true. Every reading travels this
              path before it reaches you.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-0 lg:grid-cols-5">
            {TRUST_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                {...reveal(i * 0.08)}
                className="relative border-line p-6 max-lg:border-b max-lg:last:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <div className="flex items-center justify-between">
                  <step.icon size={24} className="text-canopy" aria-hidden="true" />
                  {i < TRUST_STEPS.length - 1 && (
                    <ArrowRightIcon
                      size={16}
                      className="text-line-strong max-lg:rotate-90"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{step.body}</p>
                <p className="mt-3 font-mono text-[12px] font-semibold text-canopy-deep">
                  {step.detail}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* business model */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div {...reveal()} className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
            Who pays, who earns
          </h2>
          <span className="demo-chip">Illustrative MVP assumptions</span>
        </motion.div>

        <motion.div
          {...reveal(0.1)}
          className="card mt-10 grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0"
        >
          <div className="p-7">
            <p className="text-[13px] font-semibold text-ink-muted">Consumer</p>
            <p className="mt-3 font-mono text-2xl font-bold text-ink">₹2,000 to ₹4,000</p>
            <p className="mt-1 text-sm text-ink-muted">per tree, per year</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Sponsor a tree for an occasion and follow its verified growth timeline.
            </p>
          </div>
          <div className="p-7">
            <p className="text-[13px] font-semibold text-ink-muted">Corporate</p>
            <p className="mt-3 font-mono text-2xl font-bold text-ink">Bulk sponsorship</p>
            <p className="mt-1 text-sm text-ink-muted">priced per grove</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Sponsor trees at scale with verified survival and growth reporting.
            </p>
          </div>
          <div className="p-7">
            <p className="text-[13px] font-semibold text-ink-muted">Farmer</p>
            <p className="mt-3 font-mono text-2xl font-bold text-ink">Paid for growth</p>
            <p className="mt-1 text-sm text-ink-muted">survival-linked income</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              Annual payment tied to each tree staying alive and putting on girth.
            </p>
          </div>
        </motion.div>
        <p className="mt-4 text-[13px] text-ink-muted">
          None of these prices are validated. Testing willingness to pay is what this
          prototype is for.
        </p>
      </section>

      {/* closing CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <motion.div
          {...reveal()}
          className="rounded-3xl bg-canopy-deep px-6 py-14 text-center sm:px-12"
        >
          <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
            Sponsor a tree you can check on.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/80">
            Pick a real tree, give it a name, and watch the centimetres arrive every
            year.
          </p>
          <Link
            to="/trees"
            className="btn mt-8 bg-white px-7 py-3.5 text-canopy-deep hover:bg-canopy-soft"
          >
            Find a Tree
            <ArrowRightIcon size={16} aria-hidden="true" />
          </Link>
        </motion.div>
      </section>

      <p className="mx-auto mt-10 max-w-7xl px-4 sm:px-6">
        <span className="flex items-center gap-2 text-[13px] text-ink-muted">
          <MapPinIcon size={14} aria-hidden="true" />
          Pilot region in this demo: Sangareddy and Medak districts, Telangana. All demo
          data is fictional.
        </span>
      </p>
    </div>
  )
}
