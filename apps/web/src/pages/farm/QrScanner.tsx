import { useEffect, useRef, useState } from 'react'

const TREE_ID = /GIRTH-\d{6,}/i

interface QrScannerProps {
  onResult: (publicId: string) => void
  onClose: () => void
}

/** Camera QR reader using the browser's BarcodeDetector (feature-detected by the caller). */
export function QrScanner({ onResult, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let stream: MediaStream | undefined
    let timer: number | undefined
    let done = false
    const video = videoRef.current

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (!video) return
        video.srcObject = stream
        await video.play()
        const detector = new BarcodeDetector({ formats: ['qr_code'] })
        timer = window.setInterval(async () => {
          if (done || video.readyState < 2) return
          try {
            const codes = await detector.detect(video)
            for (const code of codes) {
              const match = TREE_ID.exec(code.rawValue)
              if (match) {
                done = true
                onResult(match[0].toUpperCase())
                return
              }
            }
          } catch {
            // a frame failed to decode; keep scanning
          }
        }, 350)
      } catch {
        setError('Camera not available. Type the tree ID instead.')
      }
    }
    void start()

    return () => {
      done = true
      if (timer) window.clearInterval(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [onResult])

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-ink">
      <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline aria-label="Camera preview for scanning a tree tag" />
      <div className="flex items-center justify-between px-4 py-3 text-[13px] text-white">
        <span>{error ?? 'Point at the QR on the tag'}</span>
        <button type="button" className="cursor-pointer font-semibold underline" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
