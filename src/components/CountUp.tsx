import { useEffect } from 'react'
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'

interface CountUpProps {
  value: number
  className?: string
}

/** Animates numeric changes with a spring. Girth readings deserve the drama. */
export function CountUp({ value, className }: CountUpProps) {
  const reduceMotion = useReducedMotion()
  const spring = useSpring(value, { stiffness: 55, damping: 16 })

  useEffect(() => {
    if (reduceMotion) {
      spring.jump(value)
    } else {
      spring.set(value)
    }
  }, [value, reduceMotion, spring])

  const text = useTransform(spring, (v) => Math.round(v).toString())

  return <motion.span className={className}>{text}</motion.span>
}
