const STYLES: Record<string, { label: string; dot: string; box: string }> = {
  // tree
  PLANNED: { label: 'Planned', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  PLANTED: { label: 'Planted', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  ACTIVE: { label: 'Alive & Growing', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  NEEDS_ATTENTION: { label: 'Needs attention', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  FLAGGED: { label: 'Flagged', dot: 'bg-alert', box: 'bg-alert-soft text-alert' },
  DEAD: { label: 'Did not survive', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  REPLACED: { label: 'Replaced', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  RETIRED: { label: 'Retired', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  // measurement
  SUBMITTED: { label: 'Submitted', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  PENDING_REVIEW: { label: 'Pending verification', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  VERIFIED: { label: 'Verified', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  REMEASURE_REQUIRED: { label: 'Remeasure requested', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  SUPERSEDED: { label: 'Superseded', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  // ledger
  ELIGIBLE: { label: 'Eligible', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  APPROVED: { label: 'Approved', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  PAID: { label: 'Paid', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  // sponsorship
  PENDING_PAYMENT: { label: 'Awaiting payment', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  EXPIRED: { label: 'Expired', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
  // audit
  PENDING: { label: 'Audit pending', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  PASS: { label: 'Audit passed', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  MINOR_DISCREPANCY: { label: 'Minor discrepancy', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  MAJOR_DISCREPANCY: { label: 'Major discrepancy', dot: 'bg-alert', box: 'bg-alert-soft text-alert' },
  FRAUD_SUSPECTED: { label: 'Fraud suspected', dot: 'bg-alert', box: 'bg-alert-soft text-alert' },
  // experiments
  RUNNING: { label: 'Running', dot: 'bg-canopy', box: 'bg-canopy-soft text-canopy-deep' },
  LEARNING: { label: 'Learning', dot: 'bg-warn', box: 'bg-warn-soft text-warn' },
  DECIDED: { label: 'Decided', dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' },
}

interface StatusBadgeProps {
  status: string
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const style = STYLES[status] ?? { label: status, dot: 'bg-ink-muted', box: 'bg-line/60 text-ink-soft' }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${style.box} ${className}`}>
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {label ?? style.label}
    </span>
  )
}
