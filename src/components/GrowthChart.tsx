import { useId, useState } from 'react'

export interface GrowthPoint {
  year: number
  girthCm: number
  simulated?: boolean
}

interface GrowthChartProps {
  data: GrowthPoint[]
  className?: string
}

const W = 640
const H = 250
const PAD = { l: 46, r: 30, t: 28, b: 38 }

/**
 * Single-series girth timeline. Hand-rolled SVG so the marks follow the
 * dataviz spec exactly: 2.5px line, 10px markers, recessive grid, a direct
 * label on the latest reading only, crosshair + tooltip on hover.
 */
export function GrowthChart({ data, className }: GrowthChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const tableId = useId()

  if (data.length === 0) return null

  const maxGirth = Math.max(...data.map((d) => d.girthCm))
  const top = Math.max(10, Math.ceil((maxGirth + 3) / 5) * 5)
  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b

  const x = (i: number) => PAD.l + (data.length === 1 ? innerW / 2 : (i * innerW) / (data.length - 1))
  const y = (v: number) => PAD.t + innerH - (v / top) * innerH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.girthCm)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`

  const gridSteps: number[] = []
  for (let v = 0; v <= top; v += 5) gridSteps.push(v)

  const last = data[data.length - 1]
  const hovered = hover !== null ? data[hover] : null
  const hoveredDelta =
    hover !== null && hover > 0 ? data[hover].girthCm - data[hover - 1].girthCm : null

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = ((event.clientX - rect.left) / rect.width) * W
    let nearest = 0
    let best = Infinity
    data.forEach((_, i) => {
      const d = Math.abs(x(i) - px)
      if (d < best) {
        best = d
        nearest = i
      }
    })
    setHover(nearest)
  }

  return (
    <div className={`relative ${className ?? ''}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        aria-describedby={tableId}
        role="img"
        aria-label={`Girth over time, currently ${last.girthCm} centimetres`}
      >
        {gridSteps.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={PAD.l - 10}
              y={y(v) + 4}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-ink-muted)"
            >
              {v}
            </text>
          </g>
        ))}
        <text
          x={PAD.l - 10}
          y={PAD.t - 12}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-ink-muted)"
        >
          cm
        </text>

        <path d={areaPath} fill="var(--color-canopy)" opacity={0.07} />
        <path d={linePath} fill="none" stroke="var(--color-canopy)" strokeWidth={2.5} />

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.t}
            y2={H - PAD.b}
            stroke="var(--color-line-strong)"
            strokeWidth={1}
          />
        )}

        {data.map((d, i) => {
          const isLast = i === data.length - 1
          return (
            <g key={d.year}>
              <circle
                cx={x(i)}
                cy={y(d.girthCm)}
                r={hover === i ? 6.5 : 5}
                fill={isLast ? 'var(--color-canopy)' : 'var(--color-surface)'}
                stroke="var(--color-canopy)"
                strokeWidth={2.5}
                strokeDasharray={d.simulated ? '3 2' : undefined}
              />
              <text
                x={x(i)}
                y={H - PAD.b + 22}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill={hover === i ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
              >
                {d.year}
              </text>
            </g>
          )
        })}

        {/* direct label on the latest reading only */}
        <text
          x={Math.min(x(data.length - 1), W - PAD.r - 4)}
          y={y(last.girthCm) - 14}
          textAnchor={data.length === 1 ? 'middle' : 'end'}
          fontFamily="var(--font-mono)"
          fontSize={15}
          fontWeight={700}
          fill="var(--color-ink)"
        >
          {last.girthCm} cm
        </text>
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-1.5 font-mono text-[12px] whitespace-nowrap shadow-sm"
          style={{
            left: `${(x(hover!) / W) * 100}%`,
          }}
        >
          <span className="font-semibold">{hovered.girthCm} cm</span>
          <span className="text-ink-muted"> in {hovered.year}</span>
          {hoveredDelta !== null && (
            <span className="text-canopy-deep font-semibold"> (+{hoveredDelta})</span>
          )}
          {hovered.simulated && <span className="text-ink-muted"> · simulated</span>}
        </div>
      )}

      {/* accessible data table for screen readers */}
      <table id={tableId} className="sr-only">
        <caption>Verified girth by year</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Girth in cm</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.year}>
              <td>{d.year}</td>
              <td>{d.girthCm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
