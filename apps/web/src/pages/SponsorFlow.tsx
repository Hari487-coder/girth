import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowRightIcon } from '@phosphor-icons/react'
import { api } from '../lib/api'
import type { PublicTreeProfile } from '../lib/types'
import { formatPaise, OCCASIONS } from '../lib/format'
import { ErrorNote, Field, Loading } from '../components/ui'
import { useDocumentTitle } from '../lib/useDocumentTitle'

type Profile = PublicTreeProfile & { sponsorable: boolean; pricePaise: number; termYears: number }
const STEPS = ['Occasion', 'Personalise', 'Confirm']

export function SponsorFlow() {
  const { publicId = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = publicId.toUpperCase()
  const profile = useQuery({ queryKey: ['public-tree', id], queryFn: () => api<Profile>(`/public/trees/${id}`) })
  useDocumentTitle(`Sponsor ${id}`)

  const [step, setStep] = useState(0)
  const [occasion, setOccasion] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const sponsor = useMutation({
    mutationFn: () =>
      api<{ sponsorship: { id: string; status: string } }>(`/trees/${id}/sponsorships`, {
        body: { treeName: name.trim() || `My ${profile.data?.species ?? ''} Tree`.trim(), message: message.trim() || undefined, occasion },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['public-tree', id] })
      void queryClient.invalidateQueries({ queryKey: ['public-trees'] })
      void queryClient.invalidateQueries({ queryKey: ['me', 'trees'] })
    },
  })

  if (profile.isPending) return <Loading label="Loading tree" />
  if (profile.error || !profile.data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <ErrorNote error={profile.error} />
        <Link to="/trees" className="btn-primary mt-8">Find a Tree</Link>
      </div>
    )
  }
  const tree = profile.data

  if (sponsor.isSuccess) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-canopy-soft text-3xl">🌱</div>
        <h1 className="mt-6 font-display text-4xl font-bold text-ink">Your tree is now part of your story.</h1>
        <div className="card mx-auto mt-8 max-w-sm p-6 text-left">
          <p className="font-display text-xl font-bold text-ink">{name.trim() || `My ${tree.species} Tree`}</p>
          <p className="mt-1 font-mono text-[13px] text-ink-muted">{tree.publicId}</p>
          <p className="mt-4 text-sm text-ink-soft">
            The Girth team will confirm your payment of {formatPaise(tree.pricePaise)} and activate the sponsorship. Until then it shows as
            "awaiting payment" in My Trees.
          </p>
        </div>
        <button type="button" onClick={() => navigate('/my-trees')} className="btn-primary mt-8">
          View My Trees
          <ArrowRightIcon size={16} aria-hidden="true" />
        </button>
      </div>
    )
  }

  if (!tree.sponsorable) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-ink">{tree.publicId} is not open for sponsorship</h1>
        <p className="mt-3 text-ink-soft">{tree.sponsorship ? 'Someone already sponsors this tree.' : tree.statusLabel}</p>
        <Link to="/trees" className="btn-primary mt-8">Find another tree</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to={`/tree/${tree.publicId}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-soft hover:text-canopy">
        <ArrowLeftIcon size={14} aria-hidden="true" />
        Back to {tree.publicId}
      </Link>
      <h1 className="mt-5 font-display text-3xl font-bold text-ink md:text-4xl">Sponsor this {tree.species.toLowerCase()}</h1>

      <ol className="mt-6 flex items-center gap-2" aria-label="Sponsorship steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1.5 rounded-full ${i <= step ? 'bg-canopy' : 'bg-line'}`} aria-hidden="true" />
            <span className={`text-[12px] font-semibold ${i === step ? 'text-canopy-deep' : 'text-ink-muted'}`}>{label}</span>
          </li>
        ))}
      </ol>

      <div className="card mt-6 p-6 sm:p-8">
        {step === 0 && (
          <fieldset>
            <legend className="font-display text-xl font-bold text-ink">What is this tree for?</legend>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {OCCASIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOccasion(o.value)}
                  aria-pressed={occasion === o.value}
                  className={`cursor-pointer rounded-2xl border p-4 text-center transition-colors ${occasion === o.value ? 'border-canopy bg-canopy-faint' : 'border-line bg-surface hover:border-line-strong'}`}
                >
                  <span className="text-2xl" aria-hidden="true">{o.emoji}</span>
                  <span className="mt-2 block text-sm font-semibold text-ink">
                    {o.value === 'BIRTH' ? 'New baby' : o.value === 'COMMITMENT' ? 'A commitment' : o.value.charAt(0) + o.value.slice(1).toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-ink">Make it yours</h2>
            <Field label="Tree name" htmlFor="tree-name">
              <input id="tree-name" className="field" placeholder="Amma's Mango Tree" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Message" htmlFor="tree-message" hint="Shown on the tree's public page.">
              <input id="tree-message" className="field" placeholder="Growing with us." value={message} maxLength={240} onChange={(e) => setMessage(e.target.value)} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Confirm</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Tree</dt><dd className="font-semibold text-ink">{tree.publicId} · {tree.species}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Name</dt><dd className="font-semibold text-ink">{name.trim() || `My ${tree.species} Tree`}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Occasion</dt><dd className="font-semibold text-ink">{occasion}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Sponsorship</dt><dd className="font-semibold text-ink">{formatPaise(tree.pricePaise)} for {tree.termYears} years</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-paper p-4 text-[13px] leading-relaxed text-ink-soft">
              Pilot pricing, not yet validated. No card is charged online: the Girth team confirms payment by hand and activates the sponsorship, and
              every step is recorded.
            </p>
            <ErrorNote error={sponsor.error} className="mt-4" />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
          {step > 0 ? <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary btn-small">Back</button> : <span />}
          {step < 2 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !occasion} className="btn-primary">
              Continue
              <ArrowRightIcon size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={() => sponsor.mutate()} disabled={sponsor.isPending} className="btn-primary">
              {sponsor.isPending ? 'Sponsoring' : 'Sponsor tree'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
