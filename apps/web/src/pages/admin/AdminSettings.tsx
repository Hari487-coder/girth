import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Setting } from '../../lib/types'
import { formatDate } from '../../lib/format'
import { ErrorNote, Loading } from '../../components/ui'

function SettingRow({ setting }: { setting: Setting }) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState(setting.value)
  const [reason, setReason] = useState('')
  const save = useMutation({
    mutationFn: () => api(`/settings/${setting.key}`, { method: 'PUT', body: { value, reason } }),
    onSuccess: () => {
      setReason('')
      void queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
  return (
    <form
      className="card p-5"
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
    >
      <p className="font-mono text-[13px] font-semibold text-ink">{setting.key}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{setting.description}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
        <input className="field font-mono" value={value} onChange={(e) => setValue(e.target.value)} aria-label={`${setting.key} value`} />
        <input className="field" placeholder="Reason for change" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
        <button type="submit" className="btn-primary btn-small" disabled={save.isPending || reason.length < 3 || value === setting.value}>Save</button>
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">{setting.isDefault ? 'Default value' : `Changed ${formatDate(setting.updatedAt)}`}</p>
      <ErrorNote error={save.error} className="mt-2" />
    </form>
  )
}

export function AdminSettings() {
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api<{ settings: Setting[] }>('/settings') })
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-ink-soft">Every change needs a reason and lands in the audit log.</p>
      {settings.isPending && <Loading />}
      <ErrorNote error={settings.error} />
      {settings.data?.settings.map((s) => (
        <SettingRow key={s.key} setting={s} />
      ))}
    </div>
  )
}
