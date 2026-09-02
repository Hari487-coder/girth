/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface DetectedBarcode {
  rawValue: string
}

/** Experimental browser API (Chrome, Android); feature-detected before use. */
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] })
  detect(source: ImageBitmapSource): Promise<DetectedBarcode[]>
}
