import { Link } from 'react-router-dom'
import { MapPinIcon } from '@phosphor-icons/react'
import type { AvailableTree } from '../lib/types'
import { formatPaise, signedCm } from '../lib/format'
import { SPECIES_PHOTOS } from '../lib/speciesPhotos'
import { StatusBadge } from './StatusBadge'
import { TapeRuler } from './TapeRuler'

interface TreeCardProps {
  tree: AvailableTree
  pricePaise: number
}

export function TreeCard({ tree, pricePaise }: TreeCardProps) {
  const photo = SPECIES_PHOTOS[tree.species]
  const girth = tree.currentGirthCm ?? 0
  const age = tree.plantingYear ? new Date().getUTCFullYear() - tree.plantingYear : null

  return (
    <Link
      to={`/tree/${tree.publicId}`}
      className="card group flex flex-col overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-canopy hover:shadow-[0_10px_30px_-16px_rgba(45,106,67,0.35)]"
    >
      {photo && (
        <div className="-mx-5 -mt-5 mb-4 h-36 overflow-hidden border-b border-line bg-line/40">
          <img
            src={photo.src}
            alt={`A ${tree.species.toLowerCase()} tree of this species`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            style={{ objectPosition: photo.position }}
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[12px] font-semibold tracking-wide text-ink-muted">{tree.publicId}</span>
        <StatusBadge status={tree.status} label={tree.status === 'ACTIVE' ? 'Growing' : undefined} />
      </div>

      <h3 className="mt-2 font-display text-2xl font-bold text-ink">{tree.species}</h3>
      {tree.location && (
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
          <MapPinIcon size={14} aria-hidden="true" />
          {tree.location}
        </p>
      )}

      <div className="mt-4 flex items-baseline gap-2">
        {tree.currentGirthCm !== null ? (
          <>
            <span className="font-mono text-3xl font-bold tracking-tight text-ink">{tree.currentGirthCm}</span>
            <span className="font-mono text-sm text-ink-muted">cm girth</span>
          </>
        ) : (
          <span className="text-sm text-ink-muted">Awaiting first verified measurement</span>
        )}
        {tree.lastGrowthCm !== null && tree.lastGrowthCm > 0 && (
          <span className="ml-auto rounded-md bg-canopy-soft px-1.5 py-0.5 font-mono text-[12px] font-semibold text-canopy-deep">
            {signedCm(tree.lastGrowthCm)} last year
          </span>
        )}
      </div>
      <TapeRuler value={girth} compact className="mt-1" />

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[13px]">
        <div>
          <dt className="text-ink-muted">Age</dt>
          <dd className="font-semibold text-ink">{age === null ? '–' : `${age} ${age === 1 ? 'year' : 'years'}`}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Planted</dt>
          <dd className="font-semibold text-ink">{tree.plantingYear ?? '–'}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Verified</dt>
          <dd className="font-semibold text-ink">{tree.verifiedReadings}×</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="text-[15px] font-bold text-ink">
          {formatPaise(pricePaise)}
          <span className="font-normal text-ink-muted"> sponsorship</span>
        </span>
        <span className="text-[13px] font-semibold text-canopy group-hover:underline">View tree</span>
      </div>
    </Link>
  )
}
