import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { CameraIcon, CheckCircleIcon, MapPinIcon, QrCodeIcon } from '@phosphor-icons/react'
import { api, ApiError, NetworkError } from '../../lib/api'
import type { Measurement, Tree } from '../../lib/types'
import { formatDate, todayIso } from '../../lib/format'
import { getPosition, supportsBarcodeDetector, type Position } from '../../lib/geo'
import { useT } from '../../lib/i18n'
import { postMeasurement, queueStore } from '../../lib/offlineQueue'
import { StatusBadge } from '../../components/StatusBadge'
import { ErrorNote, Field } from '../../components/ui'
import { QrScanner } from './QrScanner'
import { useDocumentTitle } from '../../lib/useDocumentTitle'

type Step = 'tree' | 'measure' | 'photo' | 'submit' | 'done'
type Outcome = { kind: 'submitted'; measurement: Measurement } | { kind: 'queued' }

interface TreeDetail {
  tree: Tree
  measurements: Measurement[]
}

/**
 * The farmer's core job on one screen at a time: which tree, what the tape
 * says, a photo, the location, send. Works without connectivity: the reading
 * is queued and sent later under the same submission id.
 */
export function Measure() {
  const t = useT()
  useDocumentTitle(t('recordMeasurement'))
  const params = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<Step>('tree')
  const [treeInput, setTreeInput] = useState(params.publicId?.toUpperCase() ?? '')
  const [scanning, setScanning] = useState(false)
  const [tree, setTree] = useState<TreeDetail | null>(null)
  const [treeError, setTreeError] = useState<unknown>(null)
  const [loadingTree, setLoadingTree] = useState(false)

  const [girth, setGirth] = useState('')
  const [height, setHeight] = useState('130')
  const [date, setDate] = useState(todayIso())
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [position, setPosition] = useState<Position | null | 'pending'>('pending')
  const [submitError, setSubmitError] = useState<unknown>(null)
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [submissionId] = useState(() => crypto.randomUUID())

  const loadTree = useCallback(async (publicId: string) => {
    setLoadingTree(true)
    setTreeError(null)
    try {
      const detail = await api<TreeDetail>(`/trees/${publicId}`)
      setTree(detail)
      setStep('measure')
    } catch (error) {
      setTreeError(error instanceof ApiError && error.status === 403 ? new Error(t('notYourTree')) : error)
    } finally {
      setLoadingTree(false)
    }
  }, [t])

  useEffect(() => {
    if (params.publicId) void loadTree(params.publicId.toUpperCase())
  }, [params.publicId, loadTree])

  useEffect(() => {
    if (step !== 'submit' || position !== 'pending') return
    let cancelled = false
    void getPosition().then((p) => {
      if (!cancelled) setPosition(p)
    })
    return () => {
      cancelled = true
    }
  }, [step, position])

  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const lastVerified = tree?.measurements.filter((m) => m.verificationStatus === 'VERIFIED').at(-1)

  async function submit() {
    if (!tree) return
    setSubmitting(true)
    setSubmitError(null)
    const pos = position === 'pending' ? null : position
    const fields: Record<string, string> = {
      measurementDate: date,
      measurementHeightCm: height,
      girthCm: girth,
      clientSubmissionId: submissionId,
      deviceMetadata: JSON.stringify({ ua: navigator.userAgent.slice(0, 120), accuracyM: pos?.accuracyM ?? null }),
      ...(pos ? { latitude: String(pos.latitude), longitude: String(pos.longitude) } : {}),
    }
    try {
      const result = await postMeasurement(tree.tree.publicId, fields, photo ?? undefined, photo?.name)
      setOutcome({ kind: 'submitted', measurement: result.measurement as Measurement })
      setStep('done')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    } catch (error) {
      if (error instanceof NetworkError) {
        await queueStore.put({
          id: submissionId,
          treePublicId: tree.tree.publicId,
          fields,
          photo: photo ?? undefined,
          photoName: photo?.name,
          createdAt: Date.now(),
        })
        setOutcome({ kind: 'queued' })
        setStep('done')
      } else {
        setSubmitError(error)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const girthNumber = Number(girth)
  const girthValid = girth !== '' && Number.isFinite(girthNumber) && girthNumber > 0 && girthNumber < 999

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <Link to="/farm" className="text-[13px] font-semibold text-ink-soft hover:text-canopy">← {t('backToFarm')}</Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-ink">{t('recordMeasurement')}</h1>

      <ol className="mt-4 flex items-center gap-1.5" aria-label="Steps">
        {(['tree', 'measure', 'photo', 'submit'] as Step[]).map((s, i) => {
          const order: Step[] = ['tree', 'measure', 'photo', 'submit', 'done']
          const reached = order.indexOf(step) >= i
          return <li key={s} className={`h-1.5 flex-1 rounded-full ${reached ? 'bg-canopy' : 'bg-line'}`} aria-hidden="true" />
        })}
      </ol>

      {step === 'tree' && (
        <div className="card mt-5 p-5">
          <h2 className="font-display text-lg font-bold text-ink">{t('whichTree')}</h2>
          {supportsBarcodeDetector() && !scanning && (
            <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setScanning(true)}>
              <QrCodeIcon size={18} aria-hidden="true" />
              {t('scanTag')}
            </button>
          )}
          {scanning && (
            <div className="mt-4">
              <QrScanner
                onResult={(id) => {
                  setScanning(false)
                  setTreeInput(id)
                  void loadTree(id)
                }}
                onClose={() => setScanning(false)}
              />
            </div>
          )}
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault()
              void loadTree(treeInput.trim().toUpperCase())
            }}
          >
            <Field label={t('orTypeId')} htmlFor="tree-id">
              <input
                id="tree-id"
                className="field font-mono uppercase"
                placeholder="GIRTH-000001"
                value={treeInput}
                autoCapitalize="characters"
                onChange={(e) => setTreeInput(e.target.value)}
              />
            </Field>
            <ErrorNote error={treeError} className="mt-3" />
            <button type="submit" className="btn-primary mt-4 w-full" disabled={loadingTree || !treeInput.trim()}>
              {loadingTree ? '…' : t('confirmTree')}
            </button>
          </form>
        </div>
      )}

      {step === 'measure' && tree && (
        <div className="card mt-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[12px] font-semibold text-ink-muted">{tree.tree.publicId}</p>
              <p className="font-display text-lg font-bold text-ink">{tree.tree.species}</p>
            </div>
            <StatusBadge status={tree.tree.status} />
          </div>
          {lastVerified && (
            <p className="mt-2 text-[13px] text-ink-soft">
              {t('lastVerified')}: <span className="font-mono font-semibold text-ink">{lastVerified.girthCm} cm</span> · {formatDate(lastVerified.measurementDate)}
            </p>
          )}
          <p className="mt-4 text-sm text-ink-soft">{t('measureHelp')}</p>
          <div className="mt-4 space-y-4">
            <Field label={t('girthCm')} htmlFor="girth">
              <input
                id="girth"
                className="field font-mono text-3xl"
                inputMode="decimal"
                type="number"
                step="0.5"
                min="0.5"
                max="999"
                value={girth}
                onChange={(e) => setGirth(e.target.value)}
                autoFocus
              />
            </Field>
            <Field label={t('heightCm')} htmlFor="height" hint={t('standardHeight')}>
              <input id="height" className="field font-mono" inputMode="numeric" type="number" min="1" max="400" value={height} onChange={(e) => setHeight(e.target.value)} />
            </Field>
            <Field label="Date" htmlFor="date">
              <input id="date" className="field" type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn-secondary btn-small" onClick={() => setStep('tree')}>Back</button>
            <button type="button" className="btn-primary flex-1" disabled={!girthValid} onClick={() => setStep('photo')}>Next</button>
          </div>
        </div>
      )}

      {step === 'photo' && (
        <div className="card mt-5 p-5">
          <h2 className="font-display text-lg font-bold text-ink">{t('takePhoto')}</h2>
          {photoPreview ? (
            <img src={photoPreview} alt="Your measurement photo" className="mt-4 aspect-[4/3] w-full rounded-xl object-cover" />
          ) : (
            <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-line-strong text-ink-muted">
              <CameraIcon size={32} aria-hidden="true" />
            </div>
          )}
          <label className="btn-secondary mt-4 w-full cursor-pointer">
            <CameraIcon size={18} aria-hidden="true" />
            {photo ? t('retakePhoto') : t('takePhoto')}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
          </label>
          {photo && <p className="mt-2 text-center text-[12px] text-canopy-deep">{t('photoAttached')}</p>}
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn-secondary btn-small" onClick={() => setStep('measure')}>Back</button>
            <button type="button" className="btn-primary flex-1" onClick={() => setStep('submit')}>Next</button>
          </div>
        </div>
      )}

      {step === 'submit' && tree && (
        <div className="card mt-5 p-5">
          <h2 className="font-display text-lg font-bold text-ink">{t('location')}</h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <MapPinIcon size={18} className={position === 'pending' ? 'animate-pulse text-warn' : position ? 'text-canopy' : 'text-ink-muted'} aria-hidden="true" />
            {position === 'pending' ? t('locating') : position ? `${t('locationCaptured')} (±${position.accuracyM} m)` : t('locationUnavailable')}
          </p>
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink-muted">Tree</dt><dd className="font-mono font-semibold text-ink">{tree.tree.publicId}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">{t('girthCm')}</dt><dd className="font-mono font-semibold text-ink">{girth} cm</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">{t('heightCm')}</dt><dd className="font-mono font-semibold text-ink">{height} cm</dd></div>
            <div className="flex justify-between"><dt className="text-ink-muted">Photo</dt><dd className="font-semibold text-ink">{photo ? t('photoAttached') : '–'}</dd></div>
          </dl>
          <ErrorNote error={submitError} className="mt-4" />
          <div className="mt-5 flex gap-3">
            <button type="button" className="btn-secondary btn-small" onClick={() => setStep('photo')}>Back</button>
            <button type="button" className="btn-primary flex-1" disabled={submitting || position === 'pending'} onClick={() => void submit()}>
              {submitting ? t('submitting') : t('submit')}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && outcome && (
        <div className="card mt-5 p-6 text-center">
          <CheckCircleIcon size={40} className="mx-auto text-canopy" aria-hidden="true" />
          <p className="mt-3 font-display text-xl font-bold text-ink">{outcome.kind === 'submitted' ? t('submitted') : t('savedOffline')}</p>
          {outcome.kind === 'submitted' && outcome.measurement.anomaly && (
            <ul className="mt-4 space-y-1 rounded-xl bg-warn-soft p-4 text-left text-[13px] text-ink">
              {outcome.measurement.checks?.filter((c) => !c.passed).map((c) => (
                <li key={c.key}>{c.detail}</li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" className="btn-primary" onClick={() => navigate(0)}>{t('anotherTree')}</button>
            <Link to="/farm" className="btn-secondary">{t('backToFarm')}</Link>
          </div>
        </div>
      )}
    </div>
  )
}
