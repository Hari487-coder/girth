import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Farmer } from '../../lib/types'
import { ErrorNote, Field, Loading, Notice } from '../../components/ui'

const EMPTY = { name: '', phone: '', password: '', village: '', district: 'Sangareddy', state: 'Telangana', preferredLanguage: 'te' }

export function AdminFarmers() {
  const queryClient = useQueryClient()
  const farmers = useQuery({ queryKey: ['farmers'], queryFn: () => api<{ farmers: Farmer[] }>('/farmers') })
  const [form, setForm] = useState(EMPTY)
  const [created, setCreated] = useState<Farmer | null>(null)
  const create = useMutation({
    mutationFn: () => api<{ farmer: Farmer }>('/farmers', { body: form }),
    onSuccess: (data) => {
      setCreated(data.farmer)
      setForm(EMPTY)
      void queryClient.invalidateQueries({ queryKey: ['farmers'] })
    },
  })

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="font-display text-xl font-bold text-ink">Farmers</h2>
        {farmers.isPending && <Loading />}
        <ErrorNote error={farmers.error} />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[12px] text-ink-muted">
              <tr>
                <th className="py-2 pr-3 font-semibold">Name</th>
                <th className="py-2 pr-3 font-semibold">Phone</th>
                <th className="py-2 pr-3 font-semibold">Village</th>
                <th className="py-2 pr-3 font-semibold">Language</th>
                <th className="py-2 pr-3 font-semibold">Agreement</th>
                <th className="py-2 font-semibold">Trees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {farmers.data?.farmers.map((f) => (
                <tr key={f.id}>
                  <td className="py-2 pr-3 font-semibold text-ink">{f.legalName}</td>
                  <td className="py-2 pr-3 font-mono text-[13px]">{f.phone}</td>
                  <td className="py-2 pr-3">{f.village}, {f.district}</td>
                  <td className="py-2 pr-3">{f.preferredLanguage === 'te' ? 'Telugu' : 'English'}</td>
                  <td className="py-2 pr-3">{f.contractStatus.toLowerCase()}</td>
                  <td className="py-2 font-mono">{f._count?.trees ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <form
        className="card space-y-4 self-start p-5"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <h2 className="font-display text-lg font-bold text-ink">Add a farmer</h2>
        {created && <Notice>{created.legalName} can now sign in with their phone number.</Notice>}
        <Field label="Name" htmlFor="f-name"><input id="f-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        <Field label="Phone" htmlFor="f-phone" hint="Used to sign in"><input id="f-phone" className="field font-mono" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
        <Field label="Temporary password" htmlFor="f-pass" hint="Share in person; at least 8 characters"><input id="f-pass" className="field font-mono" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
        <Field label="Village" htmlFor="f-village"><input id="f-village" className="field" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="District" htmlFor="f-district"><input id="f-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required /></Field>
          <Field label="State" htmlFor="f-state"><input id="f-state" className="field" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required /></Field>
        </div>
        <Field label="Language" htmlFor="f-lang">
          <select id="f-lang" className="field cursor-pointer" value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}>
            <option value="te">Telugu</option>
            <option value="en">English</option>
          </select>
        </Field>
        <ErrorNote error={create.error} />
        <button type="submit" className="btn-primary w-full" disabled={create.isPending}>Add farmer</button>
      </form>
    </div>
  )
}
