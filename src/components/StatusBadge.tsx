import type { MeasurementStatus, TreeStatus } from '../lib/types'

type BadgeStatus = TreeStatus | MeasurementStatus

const STYLES: Record<BadgeStatus, { label: string; dot: string; box: string }> = {
  growing: {
    label: 'Alive & Growing',
    dot: 'bg-canopy',
    box: 'bg-canopy-soft text-canopy-deep',
  },
  attention: {
    label: 'Needs attention',
    dot: 'bg-warn',
    box: 'bg-warn-soft text-warn',
  },
  dead: {
    label: 'Dead',
    dot: 'bg-ink-muted',
    box: 'bg-line/60 text-ink-soft',
  },
  pending: {
    label: 'Pending verification',
    dot: 'bg-warn',
    box: 'bg-warn-soft text-warn',
  },
  verified: {
    label: 'Verified',
    dot: 'bg-canopy',
    box: 'bg-canopy-soft text-canopy-deep',
  },
  flagged: {
    label: 'Flagged',
    dot: 'bg-alert',
    box: 'bg-alert-soft text-alert',
  },
  remeasure: {
    label: 'Remeasure requested',
    dot: 'bg-warn',
    box: 'bg-warn-soft text-warn',
  },
}

interface StatusBadgeProps {
  status: BadgeStatus
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const style = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${style.box} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label ?? style.label}
    </span>
  )
}
