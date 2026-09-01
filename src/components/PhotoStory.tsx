import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import plantingDrive from '../assets/photos/planting-drive.jpg'
import saplingHands from '../assets/photos/sapling-hands.jpg'
import iithCampusTree from '../assets/photos/iith-campus-tree.jpg'

interface Beat {
  src: string
  alt: string
  caption: string
  /** object-position, to keep the subject in frame inside the fixed 4:3 crop */
  position: string
}

const BEATS: Beat[] = [
  {
    src: plantingDrive,
    alt: 'Two women planting a young sapling in open ground while a child watches',
    caption: 'Someone plants a tree.',
    position: 'center 40%',
  },
  {
    src: saplingHands,
    alt: 'A pair of hands pressing soil firmly around a freshly planted sapling',
    caption: 'A farmer is paid to keep it alive.',
    position: 'center',
  },
  {
    src: iithCampusTree,
    alt: 'A young tree growing in the plaza of the Knowledge Resource Centre at IIT Hyderabad',
    caption: 'And it grows at IIT Hyderabad, measured every year.',
    position: 'center 72%',
  },
]

const CREDITS = [
  {
    name: 'McKay Savage',
    license: 'CC BY 2.0',
    href: 'https://commons.wikimedia.org/wiki/File:India_-_Kids_-_Planting_trees_for_her_future_(4040009491).jpg',
  },
  {
    name: 'Robbieross123',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Plant_a_Sapling_for_Better_Future.jpg',
  },
  {
    name: 'Mukesh721',
    license: 'CC0',
    href: 'https://commons.wikimedia.org/wiki/File:Central_Library_IIT_Hyderabad,_Knowledge_Resource_centre_IIT_Hyderabad.jpg',
  },
]

const STAGE_MS = 3200
const HOLD_MS = 5200
const MAX_CYCLES = 3

/**
 * The story in real photographs: planted, kept alive, growing at IIT
 * Hyderabad. Plays through the three beats a few times, then rests on the
 * campus tree.
 */
export function PhotoStory({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()
  const [stage, setStage] = useState(reduceMotion ? BEATS.length - 1 : 0)
  const cycles = useRef(0)

  useEffect(() => {
    if (reduceMotion) return
    const last = BEATS.length - 1
    if (stage === last && cycles.current >= MAX_CYCLES - 1) return
    const timer = setTimeout(
      () => {
        if (stage < last) {
          setStage(stage + 1)
        } else {
          cycles.current += 1
          setStage(0)
        }
      },
      stage === last ? HOLD_MS : STAGE_MS,
    )
    return () => clearTimeout(timer)
  }, [stage, reduceMotion])

  return (
    <figure className={className}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-line/40">
        {BEATS.map((beat, i) => (
          <motion.img
            key={beat.src}
            src={beat.src}
            alt={beat.alt}
            initial={false}
            animate={{ opacity: i === stage ? 1 : 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7 }}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: beat.position }}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>

      <figcaption className="mt-4 flex min-h-12 flex-col items-center gap-2">
        <motion.p
          key={stage}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center text-[15px] font-medium text-ink"
        >
          {BEATS[stage].caption}
        </motion.p>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {BEATS.map((beat, i) => (
            <span
              key={beat.src}
              className={`h-1 w-6 rounded-full transition-colors duration-300 ${
                i === stage ? 'bg-canopy' : 'bg-line'
              }`}
            />
          ))}
        </div>
      </figcaption>

      <p className="mt-2 text-center text-[11px] text-ink-muted">
        Real photos, not our trees yet:{' '}
        {CREDITS.map((credit, i) => (
          <span key={credit.name}>
            <a
              href={credit.href}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-line underline-offset-2 hover:text-canopy"
            >
              {credit.name}
            </a>{' '}
            ({credit.license}){i < CREDITS.length - 1 ? ' · ' : ''}
          </span>
        ))}
        <span> · Wikimedia Commons</span>
      </p>
    </figure>
  )
}
