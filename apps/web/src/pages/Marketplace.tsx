import { useMemo, useState } from 'react'
import { XCircleIcon } from '@phosphor-icons/react'
import { useStore } from '../lib/store'
import { TreeCard } from '../components/TreeCard'
import { speciesPhotoCredits } from '../lib/speciesPhotos'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import type { Occasion } from '../lib/types'

const OCCASIONS: Occasion[] = [
  'Birthday',
  'Wedding',
  'New baby',
  'Housewarming',
  'Memorial',
  'Just because',
]

const PRICE_BANDS = [
  { key: 'all', label: 'Any price', test: () => true },
  { key: 'low', label: 'Up to ₹2,000', test: (p: number) => p <= 2000 },
  { key: 'mid', label: '₹2,001 to ₹3,000', test: (p: number) => p > 2000 && p <= 3000 },
  { key: 'high', label: 'Above ₹3,000', test: (p: number) => p > 3000 },
] as const

export function Marketplace() {
  useDocumentTitle('Find a Tree')
  const { state } = useStore()

  const [occasion, setOccasion] = useState('all')
  const [species, setSpecies] = useState('all')
  const [location, setLocation] = useState('all')
  const [price, setPrice] = useState<(typeof PRICE_BANDS)[number]['key']>('all')
  const [status, setStatus] = useState('all')

  const available = useMemo(() => state.trees.filter((t) => t.available), [state.trees])
  const speciesOptions = useMemo(
    () => [...new Set(available.map((t) => t.species))].sort(),
    [available],
  )
  const locationOptions = useMemo(
    () => [...new Set(available.map((t) => t.location))].sort(),
    [available],
  )

  const filtered = available.filter((tree) => {
    if (occasion !== 'all' && !tree.occasions.includes(occasion as Occasion)) return false
    if (species !== 'all' && tree.species !== species) return false
    if (location !== 'all' && tree.location !== location) return false
    if (status !== 'all' && tree.status !== status) return false
    const band = PRICE_BANDS.find((b) => b.key === price)!
    return band.test(tree.priceInr)
  })

  const hasFilters =
    occasion !== 'all' || species !== 'all' || location !== 'all' || price !== 'all' || status !== 'all'

  function clearFilters() {
    setOccasion('all')
    setSpecies('all')
    setLocation('all')
    setPrice('all')
    setStatus('all')
  }

  const selectClass =
    'cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-ink focus:border-canopy focus:outline-none'

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Find a tree</h1>
          <p className="mt-3 max-w-xl leading-relaxed text-ink-soft">
            Every tree here is real to the prototype: it has a farmer, a location and a
            verified growth history. Sponsor one and it becomes yours to follow.
          </p>
        </div>
        <span className="demo-chip">Demo data · all trees are fictional</span>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter trees">
        <label className="sr-only" htmlFor="filter-occasion">Occasion</label>
        <select
          id="filter-occasion"
          className={selectClass}
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
        >
          <option value="all">Any occasion</option>
          {OCCASIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-species">Species</label>
        <select
          id="filter-species"
          className={selectClass}
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
        >
          <option value="all">Any species</option>
          {speciesOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-location">Location</label>
        <select
          id="filter-location"
          className={selectClass}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="all">Any location</option>
          {locationOptions.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-price">Price</label>
        <select
          id="filter-price"
          className={selectClass}
          value={price}
          onChange={(e) => setPrice(e.target.value as typeof price)}
        >
          {PRICE_BANDS.map((b) => (
            <option key={b.key} value={b.key}>{b.label}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="filter-status">Growth status</label>
        <select
          id="filter-status"
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Any status</option>
          <option value="growing">Growing</option>
          <option value="attention">Needs attention</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold text-canopy hover:text-canopy-deep"
          >
            <XCircleIcon size={16} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      <p className="mt-6 font-mono text-[13px] text-ink-muted">
        {filtered.length} {filtered.length === 1 ? 'tree' : 'trees'} available
      </p>

      {filtered.length > 0 ? (
        <>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tree) => (
              <TreeCard key={tree.id} tree={tree} />
            ))}
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-ink-muted">
            Species photos are real trees of each species, not the individual demo
            trees. Via Wikimedia Commons:{' '}
            {speciesPhotoCredits().map((c, i, all) => (
              <span key={c.credit + c.license}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line underline-offset-2 hover:text-canopy"
                >
                  {c.credit}
                </a>{' '}
                ({c.license}){i < all.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </>
      ) : (
        <div className="card mt-4 px-6 py-16 text-center">
          <p className="font-display text-xl font-bold text-ink">No trees match those filters</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
            The demo grove is small. Widen a filter or clear them all to see every
            available tree.
          </p>
          <button type="button" onClick={clearFilters} className="btn-primary btn-small mt-6">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
