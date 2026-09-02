import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { ErrorNote, Loading, Stat } from '../../components/ui'

interface Overview {
  trees: { registered: number; alive: number; dead: number; needsAttention: number; verified: number; pending: number; survivalPct: number | null; averageGrowthCm: number | null }
  measurements: Record<string, number>
  measurementsTotal: number
  audits: Record<string, number>
  auditsTotal: number
  auditDiscrepancyPct: number | null
  farmers: number
  sponsorships: Record<string, number>
}

export function AdminOverview() {
  const query = useQuery({ queryKey: ['analytics'], queryFn: () => api<Overview>('/analytics/overview') })
  if (query.isPending) return <Loading />
  if (query.error || !query.data) return <ErrorNote error={query.error} />
  const o = query.data
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-bold text-ink">Trees</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Registered" value={o.trees.registered} />
          <Stat label="Alive" value={o.trees.alive} tone="canopy" hint={o.trees.survivalPct === null ? undefined : `${o.trees.survivalPct}% survival`} />
          <Stat label="Needs attention" value={o.trees.needsAttention} tone="warn" />
          <Stat label="Dead" value={o.trees.dead} tone="muted" />
          <Stat label="Verified at least once" value={o.trees.verified} />
          <Stat label="With pending reading" value={o.trees.pending} tone="warn" />
          <Stat label="Average growth" value={o.trees.averageGrowthCm === null ? '–' : `${o.trees.averageGrowthCm} cm`} />
          <Stat label="Farmers" value={o.farmers} />
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold text-ink">Verification</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Measurements" value={o.measurementsTotal} />
          <Stat label="Verified" value={o.measurements.VERIFIED ?? 0} tone="canopy" />
          <Stat label="Pending review" value={o.measurements.PENDING_REVIEW ?? 0} tone="warn" />
          <Stat label="Flagged / remeasure" value={(o.measurements.FLAGGED ?? 0) + (o.measurements.REMEASURE_REQUIRED ?? 0)} tone="warn" />
          <Stat label="Audits" value={o.auditsTotal} hint={o.auditDiscrepancyPct === null ? undefined : `${o.auditDiscrepancyPct}% material discrepancies`} />
          <Stat label="Audits pending" value={o.audits.PENDING ?? 0} tone="warn" />
          <Stat label="Sponsorships active" value={o.sponsorships.ACTIVE ?? 0} tone="canopy" />
          <Stat label="Awaiting payment" value={o.sponsorships.PENDING_PAYMENT ?? 0} tone="warn" />
        </div>
      </section>
    </div>
  )
}
