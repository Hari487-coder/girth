import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Experiment } from '../../lib/types'
import { StatusBadge } from '../../components/StatusBadge'
import { ErrorNote, Field, Loading } from '../../components/ui'

function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    status: experiment.status,
    result: experiment.result ?? '',
    learning: experiment.learning ?? '',
    decision: experiment.decision ?? '',
  })
  const save = useMutation({
    mutationFn: () =>
      api(`/experiments/${experiment.id}`, {
        method: 'PATCH',
        body: { status: form.status, result: form.result || undefined, learning: form.learning || undefined, decision: form.decision || undefined },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['experiments'] }),
  })
  return (
    <article className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[13px] font-bold text-ink-muted">{experiment.code}</p>
        <StatusBadge status={experiment.status} />
      </div>
      <h3 className="mt-2 font-display text-lg font-bold text-ink">{experiment.hypothesis}</h3>
      <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
        <div><dt className="font-semibold text-ink-muted">Experiment</dt><dd className="text-ink-soft">{experiment.experiment}</dd></div>
        <div><dt className="font-semibold text-ink-muted">Metric · target</dt><dd className="text-ink-soft">{experiment.metric}{experiment.target ? ` · ${experiment.target}` : ''}</dd></div>
      </dl>
      <form
        className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
      >
        <Field label="Status" htmlFor={`st-${experiment.id}`}>
          <select id={`st-${experiment.id}`} className="field cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Experiment['status'] })}>
            {['PLANNED', 'RUNNING', 'LEARNING', 'DECIDED'].map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Decision" htmlFor={`dc-${experiment.id}`}>
          <select id={`dc-${experiment.id}`} className="field cursor-pointer" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })}>
            <option value="">Not yet</option>
            <option value="PERSEVERE">Persevere</option>
            <option value="PIVOT">Pivot</option>
            <option value="STOP">Stop</option>
          </select>
        </Field>
        <Field label="Result" htmlFor={`rs-${experiment.id}`}><input id={`rs-${experiment.id}`} className="field" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="What actually happened" /></Field>
        <Field label="Learning" htmlFor={`ln-${experiment.id}`}><input id={`ln-${experiment.id}`} className="field" value={form.learning} onChange={(e) => setForm({ ...form, learning: e.target.value })} placeholder="What it taught us" /></Field>
        <div className="sm:col-span-2">
          <ErrorNote error={save.error} className="mb-2" />
          <button type="submit" className="btn-secondary btn-small" disabled={save.isPending}>Save</button>
        </div>
      </form>
    </article>
  )
}

export function AdminExperiments() {
  const queryClient = useQueryClient()
  const experiments = useQuery({ queryKey: ['experiments'], queryFn: () => api<{ experiments: Experiment[] }>('/experiments') })
  const [form, setForm] = useState({ code: '', hypothesis: '', experiment: '', metric: '', target: '' })
  const create = useMutation({
    mutationFn: () => api('/experiments', { body: { ...form, target: form.target || undefined } }),
    onSuccess: () => {
      setForm({ code: '', hypothesis: '', experiment: '', metric: '', target: '' })
      void queryClient.invalidateQueries({ queryKey: ['experiments'] })
    },
  })
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">Build, measure, learn. Results are typed in by people; the platform supplies the numbers.</p>
        {experiments.isPending && <Loading />}
        <ErrorNote error={experiments.error} />
        {experiments.data?.experiments.map((e) => (
          <ExperimentCard key={e.id} experiment={e} />
        ))}
      </div>
      <form
        className="card space-y-3 self-start p-5"
        onSubmit={(e) => {
          e.preventDefault()
          create.mutate()
        }}
      >
        <h2 className="font-display text-lg font-bold text-ink">New experiment</h2>
        <Field label="Code" htmlFor="ex-code"><input id="ex-code" className="field font-mono" placeholder="EXP-04" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
        <Field label="Hypothesis" htmlFor="ex-hyp"><input id="ex-hyp" className="field" value={form.hypothesis} onChange={(e) => setForm({ ...form, hypothesis: e.target.value })} required /></Field>
        <Field label="Experiment" htmlFor="ex-exp"><input id="ex-exp" className="field" value={form.experiment} onChange={(e) => setForm({ ...form, experiment: e.target.value })} required /></Field>
        <Field label="Metric" htmlFor="ex-met"><input id="ex-met" className="field" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} required /></Field>
        <Field label="Target" htmlFor="ex-tgt"><input id="ex-tgt" className="field" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></Field>
        <ErrorNote error={create.error} />
        <button type="submit" className="btn-primary btn-small" disabled={create.isPending}>Add experiment</button>
      </form>
    </div>
  )
}
