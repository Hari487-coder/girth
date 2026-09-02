import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QrCodeIcon } from '@phosphor-icons/react'
import { api, apiUrl } from '../../lib/api'
import type { Cluster, Farmer, Tree } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { StatusBadge } from '../../components/StatusBadge'
import { ErrorNote, Field, Loading, Notice } from '../../components/ui'

const SPECIES = ['Mango', 'Neem', 'Teak', 'Tamarind', 'Guava', 'Jamun', 'Amla', 'Pongamia', 'Custard Apple']

export function AdminTrees() {
  const queryClient = useQueryClient()
  const trees = useQuery({ queryKey: ['admin', 'trees'], queryFn: () => api<{ trees: Tree[] }>('/trees?limit=500') })
  const farmers = useQuery({ queryKey: ['farmers'], queryFn: () => api<{ farmers: Farmer[] }>('/farmers') })
  const clusters = useQuery({ queryKey: ['clusters'], queryFn: () => api<{ clusters: Cluster[] }>('/clusters') })

  const [form, setForm] = useState({ species: 'Mango', farmerId: '', clusterId: '', plantingDate: '', latitude: '', longitude: '', tagCode: '', replacementForTreeId: '' })
  const [created, setCreated] = useState<Tree | null>(null)
  const create = useMutation({
    mutationFn: () =>
      api<{ tree: Tree }>('/trees', {
        body: {
          species: form.species,
          farmerId: form.farmerId || undefined,
          clusterId: form.clusterId || undefined,
          plantingDate: form.plantingDate || undefined,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          tagCode: form.tagCode || undefined,
          replacementForTreeId: form.replacementForTreeId || undefined,
        },
      }),
    onSuccess: (data) => {
      setCreated(data.tree)
      setForm((f) => ({ ...f, tagCode: '', replacementForTreeId: '' }))
      void queryClient.invalidateQueries({ queryKey: ['admin', 'trees'] })
      void queryClient.invalidateQueries({ queryKey: ['public-trees'] })
    },
  })

  const [clusterForm, setClusterForm] = useState({ name: '', locationLabel: '' })
  const createCluster = useMutation({
    mutationFn: () => api('/clusters', { body: clusterForm }),
    onSuccess: () => {
      setClusterForm({ name: '', locationLabel: '' })
      void queryClient.invalidateQueries({ queryKey: ['clusters'] })
    },
  })

  const farmerName = (id: string | null) => farmers.data?.farmers.find((f) => f.id === id)?.legalName ?? '–'
  const deadTrees = trees.data?.trees.filter((t) => t.status === 'DEAD') ?? []

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="font-display text-xl font-bold text-ink">All trees</h2>
        {trees.isPending && <Loading />}
        <ErrorNote error={trees.error} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[12px] text-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">Tree</th>
                <th className="py-2 pr-3 font-semibold">Species</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 pr-3 font-semibold">Girth</th>
                <th className="py-2 pr-3 font-semibold">Farmer</th>
                <th className="py-2 pr-3 font-semibold">Tag</th>
                <th className="py-2 font-semibold">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {trees.data?.trees.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 pr-3">
                    <Link to={`/tree/${t.publicId}`} className="font-mono font-semibold text-canopy hover:underline">{t.publicId}</Link>
                  </td>
                  <td className="py-2 pr-3">{t.species}</td>
                  <td className="py-2 pr-3"><StatusBadge status={t.status} /></td>
                  <td className="py-2 pr-3 font-mono">{t.currentGirthCm !== null ? `${t.currentGirthCm} cm` : '–'}<span className="block text-[11px] text-ink-muted">{formatDate(t.currentGirthDate)}</span></td>
                  <td className="py-2 pr-3">{farmerName(t.farmerId)}</td>
                  <td className="py-2 pr-3 font-mono text-[12px]">{t.tags?.[0]?.tagCode ?? '–'}</td>
                  <td className="py-2">
                    <a href={apiUrl(`/trees/${t.publicId}/qr.svg`)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] text-canopy hover:underline">
                      <QrCodeIcon size={14} aria-hidden="true" /> SVG
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="space-y-6">
        <form
          className="card space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
        >
          <h2 className="font-display text-lg font-bold text-ink">Register a tree</h2>
          {created && (
            <Notice>
              <span className="font-mono font-semibold">{created.publicId}</span> registered.{' '}
              <a href={apiUrl(`/trees/${created.publicId}/qr.svg`)} target="_blank" rel="noreferrer" className="font-semibold text-canopy underline">Download QR</a> for the tag.
            </Notice>
          )}
          <Field label="Species" htmlFor="species">
            <input id="species" list="species-list" className="field" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} required />
            <datalist id="species-list">{SPECIES.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <Field label="Farmer" htmlFor="farmer">
            <select id="farmer" className="field cursor-pointer" value={form.farmerId} onChange={(e) => setForm({ ...form, farmerId: e.target.value })}>
              <option value="">No farmer yet</option>
              {farmers.data?.farmers.map((f) => <option key={f.id} value={f.id}>{f.legalName} · {f.village}</option>)}
            </select>
          </Field>
          <Field label="Cluster" htmlFor="cluster">
            <select id="cluster" className="field cursor-pointer" value={form.clusterId} onChange={(e) => setForm({ ...form, clusterId: e.target.value })}>
              <option value="">No cluster</option>
              {clusters.data?.clusters.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Planted" htmlFor="planted"><input id="planted" type="date" className="field" value={form.plantingDate} onChange={(e) => setForm({ ...form, plantingDate: e.target.value })} /></Field>
            <Field label="Tag code" htmlFor="tag"><input id="tag" className="field font-mono" value={form.tagCode} onChange={(e) => setForm({ ...form, tagCode: e.target.value })} /></Field>
            <Field label="Latitude" htmlFor="lat"><input id="lat" className="field font-mono" inputMode="decimal" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></Field>
            <Field label="Longitude" htmlFor="lng"><input id="lng" className="field font-mono" inputMode="decimal" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></Field>
          </div>
          {deadTrees.length > 0 && (
            <Field label="Replaces a dead tree" htmlFor="replaces">
              <select id="replaces" className="field cursor-pointer" value={form.replacementForTreeId} onChange={(e) => setForm({ ...form, replacementForTreeId: e.target.value })}>
                <option value="">No</option>
                {deadTrees.map((t) => <option key={t.id} value={t.id}>{t.publicId} · {t.species}</option>)}
              </select>
            </Field>
          )}
          <ErrorNote error={create.error} />
          <button type="submit" className="btn-primary w-full" disabled={create.isPending}>Register tree</button>
        </form>

        <form
          className="card space-y-3 p-5"
          onSubmit={(e) => {
            e.preventDefault()
            createCluster.mutate()
          }}
        >
          <h2 className="font-display text-lg font-bold text-ink">New cluster</h2>
          <Field label="Name" htmlFor="cluster-name"><input id="cluster-name" className="field" value={clusterForm.name} onChange={(e) => setClusterForm({ ...clusterForm, name: e.target.value })} required /></Field>
          <Field label="Location label" htmlFor="cluster-loc" hint="What the public sees, e.g. Kandi, Sangareddy, Telangana"><input id="cluster-loc" className="field" value={clusterForm.locationLabel} onChange={(e) => setClusterForm({ ...clusterForm, locationLabel: e.target.value })} required /></Field>
          <ErrorNote error={createCluster.error} />
          <button type="submit" className="btn-secondary btn-small" disabled={createCluster.isPending}>Create cluster</button>
        </form>
      </aside>
    </div>
  )
}
