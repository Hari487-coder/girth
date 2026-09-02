export interface Position {
  latitude: number
  longitude: number
  accuracyM: number
}

/** One GPS fix, or null when the device refuses or times out. Never blocks a submission. */
export function getPosition(timeoutMs = 20_000): Promise<Position | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (p) =>
        resolve({
          latitude: Math.round(p.coords.latitude * 1e6) / 1e6,
          longitude: Math.round(p.coords.longitude * 1e6) / 1e6,
          accuracyM: Math.round(p.coords.accuracy),
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    )
  })
}

/** In-app QR reading where the browser supports it; the camera app is the fallback. */
export function supportsBarcodeDetector(): boolean {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}
