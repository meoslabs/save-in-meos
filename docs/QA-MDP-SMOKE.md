# MDP smoke test matrix

Manual and automated gates for **meos deeplink protocol (MDP)** on branch `feat/save-in-meos`.
Canonical URL: `https://meos.do/databox:import:{encoded}?w={widgetId}`.

## Lane commands

| Lane | Repo | Command | Proves |
|------|------|---------|--------|
| A — Codec | save-in-meos | `npm test && npm run check:mdp` | Encode/decode roundtrips, tier pick |
| B — Desktop browser | meos-desktop | `yarn e2e e2e/components/system/MlpImport.spec.ts` | Import frame + QR |
| C — Desktop unit | meos-desktop | `yarn test __tests__/utils/mlp-import.spec.ts` | Decode fixtures, sanitizer |
| D — Core privacy | meos-core-logic | `npx ts-node scripts/lip/check-mdp-privacy.ts` | No raw URL on `deeplink_resolved` |
| E — Edge privacy | website-getmeos.com | `npm test` (vitest `check-mdp-edge-privacy`) | No import blob in `campaign_path` |
| F — App handlers | meos-app | `yarn mip:check:fast` | Bridge, registry, sanitizer wiring |
| G — Real phone | meos-app (ADB) | See below | Universal link → share review → pad |

## ADB matrix (primary device gate)

Assume a release/dev APK is sideloaded ([meos-android-sideload skill](https://github.com/meoslabs/meos-app)).

```bash
adb shell am start -a android.intent.action.VIEW \
  -d 'https://meos.do/databox:import:{fixture}?w=adb-test'

adb logcat -s ReactNativeJS | rg -i 'mlpImport|share-receive|usePadSeed'
```

| Case | Input | Expected |
|------|-------|----------|
| REF cold start | intent URL, app killed | Overlay → review → pad, `source.kind=import` |
| LITE quote | url+text in blob | `origin: "quoted"` on primary block |
| REF warm | app backgrounded | share-receive route or overlay |
| Misroute regression | same host `/link/foo` | Still NexusLink — not import |
| Desktop QR | scan from DataboxImportFrame | Same as REF cold start |

## Privacy spot-checks

- PostHog `deeplink_resolved`: must include `mdp_verb` / `url_host`, never raw `url` or encoded blob.
- getmeos.com edge `getmeos_redirect`: `campaign_path` must be `/databox:import:[redacted]` for import-shaped paths.
- Desktop OG / middleware: no full import URL in description (DIP-0035).

## Fixtures

Golden URLs live in `save-in-meos/fixtures/mdp/` (codec lane). Use the same fixtures for Playwright and ADB.
