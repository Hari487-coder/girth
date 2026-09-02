import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { CountUp } from './CountUp'

interface GrowthStep {
  year: number
  girthCm: number
}

interface TrunkRingsProps {
  steps: GrowthStep[]
  className?: string
}

const W = 520
const H = 430
const CX = 250
const CY = 215

/**
 * Hero visual: a trunk cross-section where each ring is a year, wrapped by the
 * measuring tape. On load it replays the tree's growth once, year by year.
 */
export function TrunkRings({ steps, className }: TrunkRingsProps) {
  const reduceMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true, amount: 0.35 })
  const [stepIndex, setStepIndex] = useState(reduceMotion ? steps.length - 1 : 0)

  useEffect(() => {
    if (reduceMotion || !inView) return
    if (stepIndex >= steps.length - 1) return
    const timer = setTimeout(() => setStepIndex((i) => i + 1), 1500)
    return () => clearTimeout(timer)
  }, [stepIndex, steps.length, reduceMotion, inView])

  const current = steps[stepIndex]
  const maxGirth = steps[steps.length - 1].girthCm
  const tapeMax = Math.ceil((maxGirth + 6) / 5) * 5

  // ring radii: one ring per step, from heartwood outward
  const outerR = 165
  const innerR = 34
  const ringR = (i: number) => innerR + ((i + 1) / steps.length) * (outerR - innerR)

  const tapeY = CY - 21
  const tapeH = 42
  const padX = 14
  const xFor = (cm: number) => padX + (cm / tapeMax) * (W - padX * 2)

  const ticks = []
  for (let cm = 0; cm <= tapeMax; cm++) {
    const major = cm % 5 === 0
    ticks.push(
      <line
        key={cm}
        x1={xFor(cm)}
        x2={xFor(cm)}
        y1={tapeY + 2}
        y2={tapeY + 2 + (major ? 14 : 8)}
        stroke="var(--color-tape-ink)"
        strokeWidth={major ? 1.6 : 0.9}
        opacity={major ? 0.9 : 0.5}
      />,
    )
  }

  const springTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 45, damping: 14 }

  return (
    <div className={className} ref={containerRef}>
      <div
        role="img"
        aria-label={`A trunk cross-section growing from ${steps[0].girthCm} to ${maxGirth} centimetres of girth between ${steps[0].year} and ${steps[steps.length - 1].year}`}
      >
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
          {/* bark */}
          <circle cx={CX} cy={CY} r={outerR + 14} fill="#6b5744" />
          <circle cx={CX} cy={CY} r={outerR + 6} fill="#8a7156" />
          {/* sapwood */}
          <circle cx={CX} cy={CY} r={outerR} fill="#f0ead9" />
          {/* heartwood */}
          <circle cx={CX} cy={CY} r={innerR} fill="#dcc9a2" />

          {/* one ring per year; rings appear as the years replay */}
          {steps.map((step, i) => (
            <motion.g
              key={step.year}
              initial={false}
              animate={{ opacity: i <= stepIndex ? 1 : 0.12 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.5 }}
            >
              <ellipse
                cx={CX}
                cy={CY}
                rx={ringR(i)}
                ry={ringR(i) * 0.965}
                transform={`rotate(${(i * 7) % 14} ${CX} ${CY})`}
                fill="none"
                stroke="#7a6a4f"
                strokeWidth={i === steps.length - 1 ? 2.2 : 1.4}
                opacity={0.75}
              />
              {/* year label with leader line, upper-right of its ring */}
              <line
                x1={CX + ringR(i) * 0.72}
                y1={CY - ringR(i) * 0.72}
                x2={CX + ringR(i) * 0.72 + 26}
                y2={CY - ringR(i) * 0.72 - 20}
                stroke="var(--color-ink-muted)"
                strokeWidth={1}
              />
              <text
                x={CX + ringR(i) * 0.72 + 30}
                y={CY - ringR(i) * 0.72 - 24}
                fontFamily="var(--font-mono)"
                fontSize={13}
                fill={i <= stepIndex ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
              >
                {step.year}
              </text>
            </motion.g>
          ))}

          {/* measuring tape across the section */}
          <rect x={0} y={tapeY} width={W} height={tapeH} fill="var(--color-tape)" />
          <rect x={0} y={tapeY} width={W} height={5} fill="#ffffff" opacity={0.35} />
          <rect
            x={0}
            y={tapeY + tapeH - 3}
            width={W}
            height={3}
            fill="var(--color-tape-deep)"
            opacity={0.7}
          />
          {ticks}
          {Array.from({ length: Math.floor(tapeMax / 5) + 1 }, (_, i) => i * 5).map((cm) => (
            <text
              key={cm}
              x={xFor(cm)}
              y={tapeY + tapeH - 8}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={12}
              fontWeight={600}
              fill="var(--color-tape-ink)"
            >
              {cm}
            </text>
          ))}

          {/* the reading */}
          <motion.g initial={false} animate={{ x: xFor(current.girthCm) }} transition={springTransition}>
            <line
              x1={0}
              x2={0}
              y1={tapeY - 8}
              y2={tapeY + tapeH + 8}
              stroke="var(--color-alert)"
              strokeWidth={2.6}
            />
            <path d={`M -8 ${tapeY - 19} L 8 ${tapeY - 19} L 0 ${tapeY - 8} Z`} fill="var(--color-alert)" />
          </motion.g>
        </svg>
      </div>

      <div className="mt-5 flex items-baseline justify-center gap-3">
        <span className="font-mono text-5xl font-bold tracking-tight text-ink">
          <CountUp value={current.girthCm} />
          <span className="ml-1 text-2xl font-semibold text-ink-muted">cm</span>
        </span>
        <span className="font-mono text-base text-ink-muted">in {current.year}</span>
      </div>
      <p className="mt-2 text-center text-sm text-ink-muted">
        Each ring is a year. The tape is the proof.
      </p>
    </div>
  )
}
