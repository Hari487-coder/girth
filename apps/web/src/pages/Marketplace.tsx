import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { AvailableTreesResponse } from '../lib/types'
import { formatPaise } from '../lib/format'
import { speciesPhotoCredits } from '../lib/speciesPhotos'
import { TreeCard } from '../components/TreeCard'
import { Empty, ErrorNote, Loading, Page } from '../components/ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Marketplace() {
  useDocumentTitle('Find a Tree')
  const [species, setSpecies] = useState('all')
  const [sort, setSort] = useState<'id' | 'girth' | 'growth'>('id')
  const query = useQuery({
    queryKey: ['public-trees'],
    queryFn: () => api<AvailableTreesResponse>('/public/trees'),
  })

  const speciesOptions = useMemo(
    () => [...new Set((query.data?.trees ?? []).map((t) => t.species))].sort(),
    [query.data],
  )

  const trees = useMemo(() => {
    const list = (query.data?.trees ?? []).filter((t) => species === 'all' || t.species === species)
    if (sort === 'girth') return [...list].sort((a, b) => (b.currentGirthCm ?? 0) - (a.currentGirthCm ?? 0))
    if (sort === 'growth') return [...list].sort((a, b) => (b.lastGrowthCm ?? 0) - (a.lastGrowthCm ?? 0))
    return list
  }, [query.data, species, sort])

  const selectClass =
    'cursor-pointer rounded-full border border-line-strong bg-surface px-4 py-2 text-[13px] font-medium text-ink focus:border-canopy focus:outline-none'

  return (
    <Page
      title="Find a tree"
      intro="Every tree here has an ID, a farmer, a location and a verified girth history. Sponsor one and its next measurement is yours to follow."
      actions={
        query.data && (
          <span className="demo-chip" title="Pilot price; not validated yet">
            {formatPaise(query.data.pricePaise)} for {query.data.termYears} years, pilot price
          </span>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter trees">
        <label className="sr-only" htmlFor="filter-species">Species</label>
        <select id="filter-species" className={selectClass} value={species} onChange={(e) => setSpecies(e.target.value)}>
          <option value="all">Any species</option>
          {speciesOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="sort">Sort</label>
        <select id="sort" className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="id">Oldest first</option>
          <option value="girth">Largest girth</option>
          <option value="growth">Fastest growing</option>
        </select>
      </div>

      {query.isPending && <Loading label="Loading trees" />}
      <ErrorNote error={query.error} className="mt-6" />

      {query.data && (
        <>
          <p className="mt-6 font-mono text-[13px] text-ink-muted">
            {trees.length} {trees.length === 1 ? 'tree' : 'trees'} open for sponsorship
          </p>
          {trees.length > 0 ? (
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trees.map((tree) => (
                <TreeCard key={tree.publicId} tree={tree} pricePaise={query.data.pricePaise} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <Empty title="No trees match" body="Try another species, or check back after the next planting round." />
            </div>
          )}
          <p className="mt-6 text-[11px] leading-relaxed text-ink-muted">
            Species photos are real trees of each species, not the individual tree. Via Wikimedia Commons:{' '}
            {speciesPhotoCredits().map((c, i, all) => (
              <span key={c.credit + c.license}>
                <a href={c.href} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-canopy">
                  {c.credit}
                </a>{' '}
                ({c.license}){i < all.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </>
      )}
    </Page>
  )
}
