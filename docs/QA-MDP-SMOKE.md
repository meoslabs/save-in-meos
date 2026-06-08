# MDP smoke tests — @meoslabs/save-in-meos

Package-level gates before publishing a new version. Canonical URL shape:

```
https://meos.do/databox:import:{encoded}?w={widgetId}
```

## Automated (required)

```bash
npm install
npm run build
npm test
npm run check:mdp
npm run check:public-scrub
```

| Check | Proves |
|-------|--------|
| `npm test` | Unit roundtrips, tier selection, error cases |
| `check:mdp-contract` | Golden fixtures encode/decode, URL grammar, QR length guard |
| `check:widget-branding` | Bundled Inconsolata, lowercase label, no Google Fonts CDN |
| `check:public-scrub` | No internal agent paths or secrets in committed docs |

## Manual widget smoke

1. `npm run build && npm run build:widget`
2. Open `examples/demo.html` in Chrome and Safari (or `npx serve examples`)
3. Click **save in meos** — URL must be `https://meos.do/databox:import:…`
4. Confirm chip uses bundled font (no network request to `fonts.googleapis.com`)
5. Toggle light/dark mode — chip stays monochrome B/W

## Fixture spot-check

Golden intents live in `fixtures/mdp/`:

| Fixture | Tier | Notes |
|---------|------|-------|
| `ref-minimal.json` | REF | URL only |
| `lite-quote.json` | LITE | URL + quote |
| `ref-with-widget.json` | REF | `?w=` attribution |

Decode any `buildMeosLink` output and confirm it matches the fixture intent.

## Cross-platform (integrator)

After deploying your embed:

| Surface | Expected |
|---------|----------|
| Desktop browser | meos.do import preview + QR |
| Mobile + meos app | Share review → pad |
| Mobile, no app | Install / open funnel on meos.do |

Use the same fixture URLs your CI generates — do not hand-craft encoded blobs.
