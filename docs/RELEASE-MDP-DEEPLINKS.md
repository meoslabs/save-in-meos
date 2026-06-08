# MDP release checklist — deeplinks & App Links

Branch: `feat/save-in-meos`. Canonical import URL:
`https://meos.do/databox:import:{encoded}?w={widgetId}`.

## Deeplink matrix (path → surface)

| Path | Mobile (app installed) | Mobile (browser) | Desktop |
|------|------------------------|------------------|---------|
| `/link`, `/link/*` | Nexus link screen | Browser / store funnel | meos.do SPA |
| `/databox:import*` | Share review overlay (MDP) | Install interstitial | Import frame + QR |
| Other `/*:*` colon routes | Colon router / deeplink handler | Browser | meos.do SPA |
| `https://usemeos.com/*` | Android App Links (broad) | Browser | SPA |

SSOT: `MEOS_DO_DEEPLINK_MATRIX` in `@meos/core-logic/deeplinks/meosDoUniversalLinks.ts`.

## Hosting map

| Asset | Repo | URL |
|-------|------|-----|
| `assetlinks.json` | meos-desktop `public/.well-known/` | `https://meos.do/.well-known/assetlinks.json` |
| `apple-app-site-association` | meos-desktop (same) | `https://meos.do/.well-known/apple-app-site-association` |
| Campaign funnel | website-getmeos.com | `https://getmeos.com/*` → 307 meos.do |

Generate before deploy: `cd meos-desktop && yarn build:well-known`.

## Pre-merge gates

```bash
# Codec
cd save-in-meos && npm test && npm run check:mdp

# Cross-repo App Links parity
cd meos-core-logic && npx ts-node --project scripts/lip/tsconfig.json scripts/lip/check-app-links-parity.ts

# Lane checkers
cd meos-app && yarn mip:check:mdp-handlers
cd meos-desktop && node -r ts-node/register/transpile-only scripts/dip/check-mdp-routing.ts
cd website-getmeos.com && npm test
```

## Ops after first Play production upload

1. Copy **App signing key certificate** SHA-256 from Play Console.
2. `ANDROID_APP_LINK_SHA256_EXTRA=<fingerprint> yarn build:well-known` in meos-desktop.
3. Deploy meos-desktop; confirm `pm get-app-links` shows `meos.do` verified.

Details: `meos-app/docs/release/android-app-links.md`.

## Integrator-facing docs

- `docs/INTEGRATOR.md` — widget embed + protocol summary
- LIP-0028 (meos-core-logic) — privacy + checker inventory
- MIP-0043 / DIP-0035 — mobile + desktop handler specs
