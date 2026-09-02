import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { PaymentConfig } from '../../lib/types'
import { formatDate, formatPaise } from '../../lib/format'
import { StatusBadge } from '../../components/StatusBadge'
import { ErrorNote, Field, Loading } from '../../components/ui'

interface LedgerRow {
  id: string
  amountPaise: number
  currency: string
  reason: string
  description: string
  status: string
  createdAt: string
  paidAt: string | null
  externalPaymentId: string | null
  farmer: { legalName: string; village: string }
  tree: { publicId: string } | null
}

interface SponsorshipRow {
  id: string
  treeName: string
  status: string
  amountPaise: number
  createdAt: string
  tree: { publicId: string; species: string }
  customer: { name: string; email: string | null }
}

function ConfigForm({ current, onSaved }: { current: PaymentConfig | null; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: current?.name ?? 'Pilot illustrative model',
    survivalRupees: String((current?.survivalPaise ?? 60000) / 100),
    growthBonusRupees: String((current?.growthBonusPaise ?? 20000) / 100),
    minGrowthCmForBonus: String(current?.minGrowthCmForBonus ?? 1),
    baseRupees: String((current?.basePaise ?? 0) / 100),
    replacementRule: current?.replacementRule ?? 'A dead tree earns nothing; its replacement is registered as a new tree linked to the original.',
    reason: '',
  })
  const save = useMutation({
    mutationFn: () =>
      api('/payments/config', {
        body: {
          name: form.name,
          survivalPaise: Math.round(Number(form.survivalRupees) * 100),
          growthBonusPaise: Math.round(Number(form.growthBonusRupees) * 100),
          minGrowthCmForBonus: Number(form.minGrowthCmForBonus),
          basePaise: Math.round(Number(form.baseRupees) * 100),
          replacementRule: form.replacementRule,
          reason: form.reason,
        },
      }),
    onSuccess: () => {
      setForm((f) => ({ ...f, reason: '' }))
      onSaved()
    },
  })
  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <h2 className="font-display text-lg font-bold text-ink">Farmer payment model</h2>
      <p className="text-[12px] text-ink-muted">Illustrative until the pilot validates it. Every change needs a reason and is logged.</p>
      <Field label="Name" htmlFor="pc-name"><input id="pc-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Survival (₹)" htmlFor="pc-surv"><input id="pc-surv" className="field font-mono" inputMode="decimal" value={form.survivalRupees} onChange={(e) => setForm({ ...form, survivalRupees: e.target.value })} /></Field>
        <Field label="Growth bonus (₹)" htmlFor="pc-bonus"><input id="pc-bonus" className="field font-mono" inputMode="decimal" value={form.growthBonusRupees} onChange={(e) => setForm({ ...form, growthBonusRupees: e.target.value })} /></Field>
        <Field label="Min growth for bonus (cm)" htmlFor="pc-min"><input id="pc-min" className="field font-mono" inputMode="decimal" value={form.minGrowthCmForBonus} onChange={(e) => setForm({ ...form, minGrowthCmForBonus: e.target.value })} /></Field>
        <Field label="Base per reading (₹)" htmlFor="pc-base"><input id="pc-base" className="field font-mono" inputMode="decimal" value={form.baseRupees} onChange={(e) => setForm({ ...form, baseRupees: e.target.value })} /></Field>
      </div>
      <Field label="Replacement rule" htmlFor="pc-rule"><input id="pc-rule" className="field" value={form.replacementRule} onChange={(e) => setForm({ ...form, replacementRule: e.target.value })} /></Field>
      <Field label="Reason for change" htmlFor="pc-reason"><input id="pc-reason" className="field" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required minLength={3} /></Field>
      <ErrorNote error={save.error} />
      <button type="submit" className="btn-primary btn-small" disabled={save.isPending || form.reason.length < 3}>Save as new active model</button>
    </form>
  )
}

export function AdminPayments() {
  const queryClient = useQueryClient()
  const config = useQuery({ queryKey: ['payment-config'], queryFn: () => api<{ config: PaymentConfig | null }>('/payments/config') })
  const ledger = useQuery({ queryKey: ['ledger'], queryFn: () => api<{ entries: LedgerRow[] }>('/payments/ledger') })
  const sponsorships = useQuery({ queryKey: ['sponsorships'], queryFn: () => api<{ sponsorships: SponsorshipRow[] }>('/sponsorships') })
  const [paying, setPaying] = useState<{ id: string; ref: string } | null>(null)

  const markPaid = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) => api(`/payments/${id}/mark-paid`, { body: { externalPaymentId: ref } }),
    onSuccess: () => {
      setPaying(null)
      void queryClient.invalidateQueries({ queryKey: ['ledger'] })
    },
  })
  const activate = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) => api(`/sponsorships/${id}/activate`, { body: { externalPaymentId: ref } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sponsorships'] })
      void queryClient.invalidateQueries({ queryKey: ['public-trees'] })
    },
  })

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <section>
          <h2 className="font-display text-xl font-bold text-ink">Farmer ledger</h2>
          <p className="mt-1 text-[13px] text-ink-soft">Append-only. Pay outside the system for the pilot and record the transfer reference here.</p>
          {ledger.isPending && <Loading />}
          <ErrorNote error={ledger.error} />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[12px] text-ink-muted">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Farmer</th>
                  <th className="py-2 pr-3 font-semibold">Tree</th>
                  <th className="py-2 pr-3 font-semibold">Reason</th>
                  <th className="py-2 pr-3 font-semibold">Amount</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ledger.data?.entries.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2 pr-3">{e.farmer.legalName}<span className="block text-[11px] text-ink-muted">{formatDate(e.createdAt)}</span></td>
                    <td className="py-2 pr-3 font-mono text-[13px]">{e.tree?.publicId ?? '–'}</td>
                    <td className="py-2 pr-3 text-[13px]">{e.description}</td>
                    <td className={`py-2 pr-3 font-mono font-semibold ${e.amountPaise < 0 ? 'text-alert' : 'text-ink'}`}>{formatPaise(e.amountPaise)}</td>
                    <td className="py-2 pr-3"><StatusBadge status={e.status} />{e.externalPaymentId && <span className="block font-mono text-[11px] text-ink-muted">{e.externalPaymentId}</span>}</td>
                    <td className="py-2">
                      {(e.status === 'ELIGIBLE' || e.status === 'APPROVED') &&
                        (paying?.id === e.id ? (
                          <form
                            className="flex gap-1"
                            onSubmit={(ev) => {
                              ev.preventDefault()
                              markPaid.mutate(paying)
                            }}
                          >
                            <input className="field py-1 text-[12px]" placeholder="Transfer ref" value={paying.ref} onChange={(ev) => setPaying({ id: e.id, ref: ev.target.value })} required />
                            <button type="submit" className="btn-primary btn-small" disabled={markPaid.isPending}>Save</button>
                          </form>
                        ) : (
                          <button type="button" className="btn-secondary btn-small" onClick={() => setPaying({ id: e.id, ref: '' })}>Mark paid</button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ErrorNote error={markPaid.error} className="mt-3" />
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-ink">Sponsorships</h2>
          <p className="mt-1 text-[13px] text-ink-soft">Activate once payment is received; a gateway webhook will do this automatically later.</p>
          {sponsorships.isPending && <Loading />}
          <ErrorNote error={sponsorships.error ?? activate.error} />
          <ul className="mt-3 divide-y divide-line">
            {sponsorships.data?.sponsorships.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <span className="font-semibold text-ink">{s.treeName}</span> · <span className="font-mono text-[13px]">{s.tree.publicId}</span> · {s.customer.name}
                  <span className="block text-[12px] text-ink-muted">{formatPaise(s.amountPaise)} · {formatDate(s.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  {s.status === 'PENDING_PAYMENT' && (
                    <button
                      type="button"
                      className="btn-primary btn-small"
                      onClick={() => {
                        const ref = window.prompt('Payment reference (bank/UPI transaction id)')
                        if (ref) activate.mutate({ id: s.id, ref })
                      }}
                    >
                      Activate
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-4 self-start">
        {config.data && (
          <div className="rounded-2xl border border-line bg-paper p-5 text-sm">
            <p className="text-[12px] font-semibold text-ink-muted">Active model</p>
            {config.data.config ? (
              <>
                <p className="mt-1 font-semibold text-ink">{config.data.config.name}</p>
                <p className="mt-2 font-mono text-[13px] text-ink-soft">
                  {formatPaise(config.data.config.survivalPaise)} survival · {formatPaise(config.data.config.growthBonusPaise)} bonus at ≥ {config.data.config.minGrowthCmForBonus} cm
                </p>
                <p className="mt-1 text-[12px] text-ink-muted">{config.data.config.label} · since {formatDate(config.data.config.createdAt)}</p>
              </>
            ) : (
              <p className="mt-1 text-ink-soft">No active model; verified readings will not create ledger entries.</p>
            )}
          </div>
        )}
        {!config.isPending && <ConfigForm current={config.data?.config ?? null} onSaved={() => void queryClient.invalidateQueries({ queryKey: ['payment-config'] })} />}
      </aside>
    </div>
  )
}
