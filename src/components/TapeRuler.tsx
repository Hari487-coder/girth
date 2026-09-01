import { motion, useReducedMotion } from 'motion/react'

interface TapeRulerProps {
  /** current girth in cm */
  value: number
  /** scale end in cm */
  max?: number
  /** optional secondary marker, e.g. girth when the sponsorship started */
  baseline?: number
  baselineLabel?: string
  compact?: boolean
  className?: string
}

const W = 640

/**
 * The measuring tape: Girth's signature element. Every girth reading in the
 * app is a position on this tape, and growth is the marker sliding right.
 */
export function TapeRuler({
  value,
  max = 30,
  baseline,
  baselineLabel,
  compact = false,
  className,
}: TapeRulerProps) {
  const reduceMotion = useReducedMotion()
  const H = compact ? 56 : 84
  const tapeY = compact ? 14 : 26
  const tapeH = compact ? 30 : 36
  const padX = 18
  const scaleW = W - padX * 2
  const xFor = (cm: number) => padX + (Math.min(cm, max) / max) * scaleW

  const ticks = []
  for (let cm = 0; cm <= max; cm++) {
    const major = cm % 5 === 0
    ticks.push(
      <line
        key={cm}
        x1={xFor(cm)}
        x2={xFor(cm)}
        y1={tapeY + 2}
        y2={tapeY + 2 + (major ? 13 : 7)}
        stroke="var(--color-tape-ink)"
        strokeWidth={major ? 1.6 : 0.9}
        opacity={major ? 0.9 : 0.55}
      />,
    )
  }

  const markerX = xFor(value)
  const springTransition = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 50, damping: 15 }

  return (
    <div className={className} role="img" aria-label={`Girth ${value} centimetres on a ${max} centimetre tape`}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {/* tape body */}
        <rect
          x={2}
          y={tapeY}
          width={W - 4}
          height={tapeH}
          rx={6}
          fill="var(--color-tape)"
        />
        <rect
          x={2}
          y={tapeY}
          width={W - 4}
          height={5}
          rx={2.5}
          fill="#ffffff"
          opacity={0.35}
        />
        <rect
          x={2}
          y={tapeY + tapeH - 3}
          width={W - 4}
          height={3}
          fill="var(--color-tape-deep)"
          opacity={0.7}
        />
        {ticks}
        {/* cm numerals every 5 cm */}
        {Array.from({ length: Math.floor(max / 5) + 1 }, (_, i) => i * 5).map((cm) => (
          <text
            key={cm}
            x={xFor(cm)}
            y={tapeY + tapeH - (compact ? 5 : 7)}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={compact ? 10 : 12}
            fontWeight={600}
            fill="var(--color-tape-ink)"
          >
            {cm}
          </text>
        ))}

        {/* baseline marker: where the story started */}
        {baseline !== undefined && baseline !== value && (
          <g>
            <line
              x1={xFor(baseline)}
              x2={xFor(baseline)}
              y1={tapeY - 6}
              y2={tapeY + tapeH + 6}
              stroke="var(--color-ink-muted)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            {!compact && (
              <text
                x={xFor(baseline)}
                y={H - 2}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-ink-muted)"
              >
                {baselineLabel ?? `${baseline} cm`}
              </text>
            )}
          </g>
        )}

        {/* reading marker */}
        <motion.g
          initial={false}
          animate={{ x: markerX }}
          transition={springTransition}
        >
          <path
            d={`M -7 ${tapeY - 10} L 7 ${tapeY - 10} L 0 ${tapeY - 1} Z`}
            fill="var(--color-alert)"
          />
          <line
            x1={0}
            x2={0}
            y1={tapeY}
            y2={tapeY + tapeH}
            stroke="var(--color-alert)"
            strokeWidth={2.4}
          />
        </motion.g>
      </svg>
    </div>
  )
}
