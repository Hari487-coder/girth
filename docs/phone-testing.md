# Real phone testing

The farmer app lives on cheap Android phones in fields with patchy signal.
Nothing counts as working until it works there. Run this on staging before
sign-off and record results in the table at the bottom.

## Devices

| Device | Browser | Why |
| --- | --- | --- |
| Budget Android (≤ ₹10k, Android 11+) | Chrome | The farmer's phone. In-app QR via BarcodeDetector, GPS, camera capture |
| Mid-range Android | Chrome | Baseline |
| iPhone | Safari | Sponsors and organisation staff. No BarcodeDetector: camera-app scan path |
| Laptop | Chrome | Reviewer queue, admin |

## Before you start

- Print a QR tag: Admin → Trees → QR SVG for a seeded tree, or any tree you register. Print at ≥ 3 cm.
- Farmer account signed in on the Android phone (`+919000000001` on staging, or a farmer you created).
- Auditor account on the laptop.
- Airplane mode within reach.

## Scenarios

### 1. QR scan with the camera app (all phones)
1. Open the phone's camera, point at the tag.
2. **Expect:** a link to `https://<staging>/tree/GIRTH-nnnnnn` opens the public tree page within 3 s, showing ID, species, status, girth and timeline. No login prompt.
3. Signed in as farmer: **expect** a "Record measurement" button on that page.

### 2. In-app QR scan (Android Chrome)
1. My Farm → Record measurement → Scan the tag.
2. **Expect:** camera permission prompt, live preview, tree recognised within 2 s, wizard jumps to the girth step with the tree's last verified girth shown.
3. On iPhone: **expect** no scan button; typing the ID works.

### 3. GPS
1. Reach the location step outdoors.
2. **Expect:** "Location captured (±N m)" with N under 30 m outdoors within 20 s. Indoors it may fall back to "Location not available"; the reading still submits.
3. Reviewer queue must show "N m from registered location" for a tree with coordinates.

### 4. Camera and photo
1. Tap "Take a photo of the tape on the trunk". **Expect:** the rear camera opens directly (`capture="environment"`).
2. Take a photo; **expect** the preview and "Photo attached".
3. Submit; on the laptop, **expect** the thumbnail in the queue and the original opening in a new tab. Original size ≤ 10 MB; larger photos are rejected with a clear message.

### 5. Offline measurement
1. Turn on airplane mode. Open My Farm (already loaded pages keep working; a fresh load shows the PWA shell if installed).
2. Record a measurement with photo. **Expect:** "Saved on this phone. It will be sent when you are back online."
3. Return to My Farm. **Expect:** "1 measurements waiting to sync" and the offline banner.

### 6. Sync after reconnect
1. Turn airplane mode off. **Expect:** the waiting count clears by itself within 10 s (or after tapping Sync now).
2. Tap Sync now again. **Expect:** nothing new is created (same submission id). Check the queue on the laptop: exactly one entry for that tree and date.
3. Force-close the app, reopen while offline: **expect** the queued item is still there (IndexedDB), and syncs once online.

### 7. Reviewer verification
1. Laptop → Review. **Expect:** the phone's reading with checks, distance, photo, "Potential anomaly" if any check warned.
2. Verify. **Expect:** decision notice with growth and farmer payout; the phone's My Farm shows the new payment pending; the public page shows the new point.
3. Flag a second reading. **Expect:** tree status FLAGGED on the public page with the honest label.

### 8. Install as an app (Android)
1. Chrome menu → Add to Home screen. **Expect:** Girth icon, standalone window, My Farm loads.

### 9. Telugu
1. My Farm → language → తెలుగు. **Expect:** all farmer screens switch; a Telugu speaker confirms wording (record corrections in `apps/web/src/lib/i18n.ts`).

## Results

| Date | Device | Scenario | Result | Notes / issue link |
| --- | --- | --- | --- | --- |
| | | | | |
