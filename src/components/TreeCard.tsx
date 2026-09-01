import { Link } from 'react-router-dom'
import { MapPinIcon } from '@phosphor-icons/react'
import type { Tree } from '../lib/types'
import { useStore } from '../lib/store'
import { currentGirthCm, lastGrowthCm, treeAge } from '../lib/selectors'
import { formatInr, signedCm } from '../lib/format'
import { StatusBadge } from './StatusBadge'
import { TapeRuler } from './TapeRuler'

interface TreeCardProps {
  tree: Tree
}

export function TreeCard({ tree }: TreeCardProps) {
  const { state } = useStore()
  const girth = currentGirthCm(state, tree.id)
  const growth = lastGrowthCm(state, tree.id)
  const age = treeAge(tree)
  const sponsored = state.sponsorships.some((s) => s.treeId === tree.id)

  return (
    <Link
      to={`/trees/${tree.id}`}
      className="card group flex flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-canopy hover:shadow-[0_10px_30px_-16px_rgba(45,106,67,0.35)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-muted">
          {tree.id}
        </span>
        <StatusBadge status={tree.status} label={tree.status === 'growing' ? 'Growing' : undefined} />
      </div>

      <h3 className="mt-2 font-display text-2xl font-bold text-ink">{tree.species}</h3>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
        <MapPinIcon size={14} aria-hidden="true" />
        {tree.location}
      </p>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-mono text-3xl font-bold tracking-tight text-ink">{girth}</span>
        <span className="font-mono text-sm text-ink-muted">cm girth</span>
        {growth !== undefined && growth > 0 && (
          <span className="ml-auto rounded-md bg-canopy-soft px-1.5 py-0.5 font-mono text-[12px] font-semibold text-canopy-deep">
            {signedCm(growth)} this year
          </span>
        )}
      </div>
      <TapeRuler value={girth} compact className="mt-1" />

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[13px]">
        <div>
          <dt className="text-ink-muted">Age</dt>
          <dd className="font-semibold text-ink">
            {age} {age === 1 ? 'year' : 'years'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Planted</dt>
          <dd className="font-semibold text-ink">{tree.plantedYear}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Farmer</dt>
          <dd className="truncate font-semibold text-ink">{tree.farmerName.split(' ')[0]}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="text-[15px] font-bold text-ink">
          {formatInr(tree.priceInr)}
          <span className="font-normal text-ink-muted"> / year</span>
        </span>
        <span className="text-[13px] font-semibold text-canopy group-hover:underline">
          {sponsored ? 'In your grove' : 'View tree'}
        </span>
      </div>
    </Link>
  )
}
