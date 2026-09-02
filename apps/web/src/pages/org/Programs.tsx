import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DownloadSimpleIcon } from '@phosphor-icons/react'
import { api, apiUrl } from '../../lib/api'
import type { ProgramOverview } from '../../lib/types'
import { useSession } from '../../lib/session'
import { Empty, ErrorNote, Loading, Page, Stat } from '../../components/ui'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

interface Organisation {
  id: string
  name: string
}
interface Program {
  id: string
  name: string
  status: string
}

export function Programs() {
  useDocumentTitle('Programs')
  const { user } = useSession()
  const organisations = useQuery({ queryKey: ['organisations'], queryFn: () => api<{ organisations: Organisation[] }>('/organisations') })
  const [orgId, setOrgId] = useState(user?.organisationId ?? '')
  useEffect(() => {
    if (!orgId && organisations.data?.organisations[0]) setOrgId(organisations.data.organisations[0].id)
  }, [organisations.data, orgId])

  const programs = useQuery({
    queryKey: ['programs', orgId],
    queryFn: () => api<{ programs: Program[] }>(`/organisations/${orgId}/programs`),
    enabled: !!orgId,
  })
  const [programId, setProgramId] = useState('')
  useEffect(() => {
    if (programs.data?.programs[0] && !programs.data.programs.some((p) => p.id === programId)) setProgramId(programs.data.programs[0].id)
  }, [programs.data, programId])

  const overview = useQuery({
    queryKey: ['program-overview', programId],
    queryFn: () => api<ProgramOverview>(`/programs/${programId}/overview`),
    enabled: !!programId,
  })
  const o = overview.data
  const selectClass = 'cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-ink'

  return (
    <Page
      title="Program overview"
      intro="Registered, alive, verified: the numbers an organisation can defend. Unverified trees are never counted as verified."
      actions={
        programId && (
          <a href={apiUrl(`/programs/${programId}/report.csv`)} className="btn-secondary btn-small">
            <DownloadSimpleIcon size={15} aria-hidden="true" /> Export CSV
          </a>
        )
      }
    >
      <div className="flex flex-wrap gap-2">
        {user?.role === 'ADMIN' && organisations.data && (
          <select className={selectClass} value={orgId} onChange={(e) => setOrgId(e.target.value)} aria-label="Organisation">
            {organisations.data.organisations.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        )}
        {programs.data && programs.data.programs.length > 0 && (
          <select className={selectClass} value={programId} onChange={(e) => setProgramId(e.target.value)} aria-label="Program">
            {programs.data.programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>
      <ErrorNote error={organisations.error ?? programs.error ?? overview.error} className="mt-4" />
      {programs.data && programs.data.programs.length === 0 && <div className="mt-6"><Empty title="No programs yet" body="An admin can create a program and its clusters for this organisation." /></div>}
      {overview.isPending && programId && <Loading />}
      {o && (
        <>
          <p className="mt-6 text-sm text-ink-soft">{o.program.name} · {o.program.organisation.name} · {o.program.clusters.length} clusters · {o.farmers} farmers</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Trees registered" value={o.registered} />
            <Stat label="Alive" value={o.alive} tone="canopy" />
            <Stat label="Survival" value={o.survivalPct === null ? '–' : `${o.survivalPct}%`} tone="canopy" />
            <Stat label="Dead" value={o.dead} tone="muted" />
            <Stat label="Verified" value={o.verified} hint={o.verifiedPct === null ? undefined : `${o.verifiedPct}% of registered`} />
            <Stat label="Pending review" value={o.pending} tone="warn" />
            <Stat label="Needs attention" value={o.needsAttention} tone="warn" />
            <Stat label="Average growth" value={o.averageGrowthCm === null ? '–' : `${o.averageGrowthCm} cm`} />
            <Stat label="Audits" value={o.audits} hint={o.auditDiscrepancyPct === null ? undefined : `${o.auditDiscrepancyPct}% discrepancies`} />
          </div>
        </>
      )}
    </Page>
  )
}
