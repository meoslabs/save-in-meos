# MDP deeplinks — integrator reference

Canonical import URL:

```
https://meos.do/databox:import:{encoded}?w={widgetId}
```

## What happens when a user clicks

| Context | Result |
|---------|--------|
| Desktop browser | meos.do import preview with QR code |
| Mobile browser, app installed | Opens meos → share review → saves to databox |
| Mobile browser, no app | meos.do install / open funnel |

Other meos.do paths (`/link`, `/link/*`) are separate product flows — your widget should only emit `databox:import` URLs from this package.

## Universal Links / App Links

meos registers `meos.do` for verified app opening:

| Platform | Verification file |
|----------|-------------------|
| Android | `https://meos.do/.well-known/assetlinks.json` |
| iOS | `https://meos.do/.well-known/apple-app-site-association` |

MDP import paths (`/databox:import*`) are included in app link coverage. Integrators do **not** host these files — they are maintained by meoslabs on meos.do.

## Campaign attribution

Always pass a stable `widgetId` via `?w=` (or the `widgetId` option on `initSaveButton` / `buildMeosLink`). This attributes imports to your embed without putting PII in the encoded blob.

## Privacy expectations

- Encode only public page URLs and content the user explicitly chose to save
- Do not put credentials, session tokens, or private URLs in `u`, `t`, or `images`
- The compressed payload is URL-safe base64 — treat shared links as capability URLs

## Related docs

- [`INTEGRATOR.md`](INTEGRATOR.md) — embed guide and API
- [`QA-MDP-SMOKE.md`](QA-MDP-SMOKE.md) — pre-release smoke tests for this package
