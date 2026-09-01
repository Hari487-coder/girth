import { ArrowClockwiseIcon } from '@phosphor-icons/react'
import { useDocumentTitle } from '../lib/useDocumentTitle'

interface FunnelRow {
  label: string
  value: number
}

const HYPOTHESES = [
  {
    id: 'H1',
    text: 'People understand and value "pay for growth" more than simply "plant a tree."',
    testedBy: 'Experiment 01',
  },
  {
    id: 'H2',
    text: 'People will pay for a tree that they can follow over time.',
    testedBy: 'Experiments 01 & 03',
  },
  {
    id: 'H3',
    text: 'Farmers keep trees alive when their income depends on survival and growth.',
    testedBy: 'Experiment 02',
  },
  {
    id: 'H4',
    text: 'A simple verification system creates enough trust for customers.',
    testedBy: 'Designed, not yet run',
  },
]

function LearningChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-2.5 py-1 text-[12px] font-semibold text-warn">
      <span className="size-1.5 rounded-full bg-warn" aria-hidden="true" />
      Learning
    </span>
  )
}

function Funnel({ rows }: { rows: FunnelRow[] }) {
  const max = Math.max(...rows.map((r) => r.value))
  return (
    <div className="mt-5 space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[130px_1fr_48px] items-center gap-3">
          <span className="text-[13px] text-ink-soft">{row.label}</span>
          <div>
            <div
              className="h-3 rounded-r-[4px] bg-canopy"
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-right font-mono text-sm font-semibold text-ink">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

export function Experiments() {
  useDocumentTitle('Experiment Dashboard')

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="demo-chip">Internal · not customer-facing</span>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">Experiment Dashboard</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
            Girth is a set of assumptions, not a finished business. This page shows how
            the MVP measures whether those assumptions survive contact with real people.
            All numbers below are mock results for the prototype.
          </p>
        </div>
      </div>

      {/* build - measure - learn */}
      <div className="card mt-8 flex flex-wrap items-center justify-center gap-4 px-6 py-6 sm:gap-8">
        {['Build', 'Measure', 'Learn'].map((phase, i) => (
          <div key={phase} className="flex items-center gap-4 sm:gap-8">
            <span className="font-display text-xl font-bold tracking-wide text-ink">
              {phase}
            </span>
            <ArrowClockwiseIcon
              size={18}
              className={`text-canopy ${i === 2 ? '' : 'rotate-90'}`}
              aria-hidden="true"
            />
          </div>
        ))}
        <p className="w-full text-center text-[13px] text-ink-muted sm:w-auto sm:text-left">
          Ship the smallest thing that tests the riskiest assumption, then decide.
        </p>
      </div>

      {/* hypotheses */}
      <section className="mt-10" aria-label="Hypotheses">
        <h2 className="font-display text-2xl font-bold text-ink">The four bets</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {HYPOTHESES.map((h) => (
            <div key={h.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[13px] font-bold text-canopy-deep">{h.id}</span>
                <span className="text-[12px] font-medium text-ink-muted">{h.testedBy}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* experiments */}
      <section className="mt-10 space-y-5" aria-label="Experiments">
        <h2 className="font-display text-2xl font-bold text-ink">Live experiments</h2>

        <article className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[13px] font-bold text-ink-muted">Experiment 01</p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">
                Will people pay for measurable growth?
              </h3>
            </div>
            <LearningChip />
          </div>
          <div className="mt-2 grid gap-8 md:grid-cols-[1fr_200px]">
            <Funnel
              rows={[
                { label: 'Viewed trees', value: 100 },
                { label: 'Started sponsoring', value: 31 },
                { label: 'Completed', value: 8 },
              ]}
            />
            <div className="self-center rounded-2xl bg-paper p-5 text-center">
              <p className="font-mono text-4xl font-bold text-ink">8%</p>
              <p className="mt-1 text-[13px] text-ink-soft">view-to-sponsor conversion</p>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
            Reading: a third of viewers start the flow, so the pitch lands; the drop at
            checkout is the thing to study next.
          </p>
        </article>

        <article className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[13px] font-bold text-ink-muted">Experiment 02</p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">
                Will farmers actually maintain trees?
              </h3>
            </div>
            <LearningChip />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-paper p-5">
              <p className="font-mono text-3xl font-bold text-ink">20</p>
              <p className="mt-1 text-[13px] text-ink-soft">pilot farmers</p>
            </div>
            <div className="rounded-2xl bg-paper p-5">
              <p className="font-mono text-3xl font-bold text-ink">200</p>
              <p className="mt-1 text-[13px] text-ink-soft">trees in program</p>
            </div>
            <div className="rounded-2xl bg-paper p-5">
              <p className="font-mono text-3xl font-bold text-ink">184</p>
              <p className="mt-1 text-[13px] text-ink-soft">alive after year one</p>
            </div>
            <div className="rounded-2xl bg-canopy-faint p-5">
              <p className="font-mono text-3xl font-bold text-canopy-deep">92%</p>
              <p className="mt-1 text-[13px] text-ink-soft">survival rate</p>
            </div>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
            Reading: typical plantation survival is far lower. If survival-linked pay
            holds this up at scale, the core incentive works.
          </p>
        </article>

        <article className="card p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[13px] font-bold text-ink-muted">Experiment 03</p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">
                Will customers engage with annual growth updates?
              </h3>
            </div>
            <LearningChip />
          </div>
          <Funnel
            rows={[
              { label: 'Updates sent', value: 50 },
              { label: 'Opened', value: 41 },
              { label: 'Viewed their tree', value: 32 },
            ]}
          />
          <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
            Reading: 64% came back to look at their tree a year later. Retention is the
            moat: nobody revisits a certificate.
          </p>
        </article>
      </section>

      <p className="mt-8 rounded-2xl border border-tape-deep/40 bg-tape/15 px-5 py-4 text-[13px] leading-relaxed text-tape-ink">
        These are fabricated numbers for the prototype demo. The point is the
        instrument: each screen in this app feeds one of these funnels, so the real
        MVP would produce real versions of this page from day one.
      </p>
    </div>
  )
}
