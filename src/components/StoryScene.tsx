import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const CAPTIONS = [
  'Someone plants a tree at IIT Hyderabad.',
  'Ravi, a farmer in Kandi, is paid to keep it alive.',
  'You watch its girth grow, year after year.',
]

const STAGE_MS = 2400
const HOLD_MS = 5000
const MAX_CYCLES = 3

/**
 * The 10-second version of Girth, played as a scene: a tree is planted on the
 * IIT Hyderabad campus, a farmer keeps it alive, and the sponsor watches the
 * girth grow. Replays a few times, then rests on the final frame.
 */
export function StoryScene({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const [stage, setStage] = useState(reduceMotion ? 2 : 0)
  // between cycles the actors fade out together, so the restart isn't a soup
  // of half-transparent trees and people
  const [blanking, setBlanking] = useState(false)
  const cycles = useRef(0)

  useEffect(() => {
    if (reduceMotion || blanking) return
    if (stage === 2 && cycles.current >= MAX_CYCLES - 1) return
    const timer = setTimeout(
      () => {
        if (stage < 2) {
          setStage(stage + 1)
        } else {
          setBlanking(true)
        }
      },
      stage === 2 ? HOLD_MS : STAGE_MS,
    )
    return () => clearTimeout(timer)
  }, [stage, reduceMotion, blanking])

  useEffect(() => {
    if (!blanking) return
    const timer = setTimeout(() => {
      cycles.current += 1
      setStage(0)
      setBlanking(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [blanking])

  const fade = (visible: boolean) => ({
    initial: false as const,
    animate: { opacity: visible ? 1 : 0 },
    transition: { duration: reduceMotion ? 0 : 0.55 },
  })

  const grow = (visible: boolean) => ({
    initial: false as const,
    animate: { opacity: visible ? 1 : 0, scale: visible ? 1 : 0.93 },
    transition: { duration: reduceMotion ? 0 : 0.55 },
  })

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-3xl border border-line bg-surface">
        <svg
          viewBox="0 0 720 460"
          width="100%"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Illustration: a tree is planted at IIT Hyderabad, a farmer waters it, and its girth is measured with a tape as it grows"
        >
          {/* sun */}
          <circle cx={632} cy={66} r={34} fill="#f3e3ae" opacity={0.6} />

          {/* campus buildings */}
          <g>
            <rect x={44} y={216} width={132} height={144} fill="#e6e9df" />
            {Array.from({ length: 5 }, (_, row) =>
              Array.from({ length: 4 }, (_, col) => (
                <rect
                  key={`b1-${row}-${col}`}
                  x={58 + col * 28}
                  y={228 + row * 26}
                  width={16}
                  height={14}
                  fill="#cfd5c6"
                />
              )),
            )}
            <rect x={186} y={262} width={84} height={98} fill="#dde1d4" />
            {Array.from({ length: 3 }, (_, row) =>
              Array.from({ length: 3 }, (_, col) => (
                <rect
                  key={`b2-${row}-${col}`}
                  x={196 + col * 24}
                  y={274 + row * 26}
                  width={14}
                  height={13}
                  fill="#c8cebd"
                />
              )),
            )}
            <rect x={556} y={190} width={104} height={170} fill="#e3e7db" />
            {Array.from({ length: 6 }, (_, i) => (
              <rect
                key={`b3-${i}`}
                x={566 + i * 16}
                y={200}
                width={6}
                height={150}
                fill="#cdd3c2"
              />
            ))}
          </g>

          {/* campus label */}
          <g>
            <rect x={44} y={152} width={238} height={34} rx={17} fill="#ffffff" stroke="#e2e5de" />
            <text
              x={62}
              y={174}
              fontFamily="var(--font-mono)"
              fontSize={13}
              fontWeight={600}
              fill="var(--color-ink-soft)"
            >
              IIT Hyderabad · Kandi campus
            </text>
          </g>

          {/* ground */}
          <rect x={0} y={360} width={720} height={100} fill="#dee4cd" />
          <rect x={0} y={360} width={720} height={6} fill="#c9d2b3" />

          <motion.g
            initial={false}
            animate={{ opacity: blanking ? 0 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
          >
          {/* tree, stage 0: freshly planted sapling */}
          <motion.g {...grow(stage === 0)} style={{ transformOrigin: '360px 360px' }}>
            <ellipse cx={360} cy={360} rx={30} ry={9} fill="#c3b291" />
            <path
              d="M360 358 C359 344 361 332 360 322"
              stroke="#6b5744"
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx={349} cy={318} rx={10} ry={6} transform="rotate(-25 349 318)" fill="#2d6a43" />
            <ellipse cx={372} cy={314} rx={11} ry={6.5} transform="rotate(20 372 314)" fill="#3c7a52" />
            <ellipse cx={360} cy={305} rx={6} ry={4.5} fill="#2d6a43" />
          </motion.g>

          {/* tree, stage 1: a young tree */}
          <motion.g {...grow(stage === 1)} style={{ transformOrigin: '360px 360px' }}>
            <ellipse cx={360} cy={362} rx={44} ry={9} fill="#b9c2a3" opacity={0.6} />
            <path
              d="M354 360 L356 300 Q360 296 364 300 L366 360 Z"
              fill="#7a6350"
            />
            <circle cx={360} cy={272} r={40} fill="#35704a" />
            <circle cx={336} cy={286} r={24} fill="#2d6a43" />
            <circle cx={384} cy={283} r={26} fill="#3c7a52" />
            <circle cx={372} cy={260} r={14} fill="#5b9370" opacity={0.8} />
          </motion.g>

          {/* tree, stage 2: grown, wearing the tape */}
          <motion.g {...grow(stage === 2)} style={{ transformOrigin: '360px 360px' }}>
            <ellipse cx={360} cy={364} rx={64} ry={11} fill="#b9c2a3" opacity={0.6} />
            <path
              d="M349 360 C352 320 353 280 355 240 L365 240 C367 280 368 320 371 360 Z"
              fill="#7a6350"
            />
            <path
              d="M358 356 C359 320 360 290 360 252"
              stroke="#5f4c3c"
              strokeWidth={1.5}
              opacity={0.5}
              fill="none"
            />
            <path
              d="M355 250 C340 238 330 232 318 228"
              stroke="#7a6350"
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M365 248 C382 236 392 232 404 226"
              stroke="#7a6350"
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
            />
            <circle cx={360} cy={196} r={62} fill="#2d6a43" />
            <circle cx={306} cy={226} r={40} fill="#35704a" />
            <circle cx={416} cy={222} r={44} fill="#3c7a52" />
            <circle cx={386} cy={178} r={20} fill="#5b9370" opacity={0.75} />

            {/* the measuring tape */}
            <path d="M330 296 L390 292 L390.5 309 L330.5 313 Z" fill="var(--color-tape)" />
            {Array.from({ length: 5 }, (_, i) => {
              const x = 337 + i * 12
              const topY = 296 - (x - 330) * 0.066
              return (
                <line
                  key={x}
                  x1={x}
                  y1={topY + 3}
                  x2={x}
                  y2={topY + (i % 2 === 0 ? 11 : 8)}
                  stroke="var(--color-tape-ink)"
                  strokeWidth={1.2}
                  opacity={0.75}
                />
              )
            })}
            <path d="M390 292 L410 296 L409 312 L390.5 309 Z" fill="var(--color-tape-deep)" />
            <line x1={360} y1={313} x2={360} y2={322} stroke="var(--color-line-strong)" strokeWidth={1.5} />
            <rect x={308} y={322} width={104} height={28} rx={14} fill="#ffffff" stroke="#c8cec4" />
            <text
              x={360}
              y={341}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={14}
              fontWeight={700}
              fill="var(--color-ink)"
            >
              Girth 14 cm
            </text>
          </motion.g>

          {/* planter, crouching (stage 0 only) */}
          <motion.g {...fade(stage === 0)}>
            <path d="M290 356 L318 356 L318 344 L304 344 Z" fill="#3a4241" />
            <ellipse
              cx={294}
              cy={324}
              rx={17}
              ry={23}
              transform="rotate(18 294 324)"
              fill="#b0603f"
            />
            <circle cx={310} cy={299} r={12} fill="#a06a42" />
            <path d="M298 297 A12 12 0 0 1 322 297 L322 293 A12 12 0 0 0 298 293 Z" fill="#2b2320" />
            <path
              d="M306 318 C320 330 332 340 342 350"
              stroke="#a06a42"
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
            <path d="M342 347 L356 353 L344 358 Z" fill="#7d8a94" />
          </motion.g>

          {/* sponsor, standing with phone (stages 1 and 2) */}
          <motion.g {...fade(stage >= 1)}>
            <rect x={228} y={330} width={9} height={30} rx={3} fill="#3a4241" />
            <rect x={242} y={330} width={9} height={30} rx={3} fill="#3a4241" />
            <rect x={224} y={290} width={32} height={44} rx={12} fill="#b0603f" />
            <circle cx={240} cy={276} r={12} fill="#a06a42" />
            <path d="M228 274 A12 12 0 0 1 252 274 L252 270 A12 12 0 0 0 228 270 Z" fill="#2b2320" />
            <path
              d="M230 296 C228 310 227 318 228 326"
              stroke="#b0603f"
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M250 296 C260 302 264 296 266 289"
              stroke="#b0603f"
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
            <rect x={261} y={271} width={12} height={20} rx={2.5} fill="#202823" />
            <rect x={263} y={274} width={8} height={13} rx={1} fill="#e3eee6" />
            <motion.rect
              {...fade(stage === 2)}
              x={264.5}
              y={281}
              width={5}
              height={2.5}
              fill="#2d6a43"
            />
          </motion.g>

          {/* farmer with watering can (stages 1 and 2) */}
          <motion.g {...fade(stage >= 1)}>
            <rect x={490} y={330} width={9} height={30} rx={3} fill="#7c6a52" />
            <rect x={502} y={330} width={9} height={30} rx={3} fill="#7c6a52" />
            <rect x={483} y={288} width={34} height={46} rx={12} fill="#efece0" />
            <circle cx={500} cy={274} r={12} fill="#7e5233" />
            <path d="M488 272 A12 12 0 0 1 512 272 L512 268 A12 12 0 0 0 488 268 Z" fill="#241d18" />
            <path
              d="M489 296 C478 302 468 306 462 306"
              stroke="#efece0"
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
            <circle cx={460} cy={306} r={4.5} fill="#7e5233" />
            <g transform="rotate(-18 451 305)">
              <rect x={438} y={296} width={26} height={18} rx={6} fill="#7d8a94" />
              <path
                d="M438 302 L421 292"
                stroke="#7d8a94"
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M444 296 A9 9 0 0 1 458 296"
                stroke="#7d8a94"
                strokeWidth={3}
                fill="none"
              />
            </g>
            <ellipse cx={415} cy={301} rx={2.5} ry={4} fill="#8fb2c9" />
            <ellipse cx={409} cy={315} rx={2.5} ry={4} fill="#8fb2c9" />
            <ellipse cx={405} cy={329} rx={2.5} ry={4} fill="#8fb2c9" />
            <ellipse cx={403} cy={356} rx={11} ry={3.5} fill="#a99878" opacity={0.5} />
          </motion.g>
          </motion.g>
        </svg>
      </div>

      {/* rotating caption; screen readers get the whole story once instead */}
      <div className="mt-4 flex min-h-12 flex-col items-center gap-2" aria-hidden="true">
        <motion.p
          key={stage}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center text-[15px] font-medium text-ink"
        >
          {CAPTIONS[stage]}
        </motion.p>
        <div className="flex items-center gap-1.5">
          {CAPTIONS.map((caption, i) => (
            <span
              key={caption}
              className={`h-1 w-6 rounded-full transition-colors duration-300 ${
                i === stage ? 'bg-canopy' : 'bg-line'
              }`}
            />
          ))}
        </div>
      </div>
      <p className="sr-only">
        {CAPTIONS.join(' ')} That is Girth: the planting happens once, the care and the
        measuring happen every year.
      </p>
    </div>
  )
}
