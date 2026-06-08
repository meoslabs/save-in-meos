# @meos/save-in-meos

**meos deeplink protocol (MDP)** codec and **save to meos** embed widget for third-party sites.

Let visitors save a page (or a quote from it) into [meos](https://meos.do) with one tap. This package builds canonical import URLs and ships a branded, self-contained button you can drop into any site — via npm, a script tag, or programmatic imports only.

## How to integrate

| Use case | How |
|----------|-----|
| **npm / bundler** | `npm install @meos/save-in-meos` then `import { initSaveButton } from '@meos/save-in-meos'` |
| **Script tag (CDN)** | Pin `https://unpkg.com/@meos/save-in-meos@VERSION/dist/widget.iife.js` + `fonts.css` — see [`examples/cdn-demo.html`](examples/cdn-demo.html) |
| **Programmatic only** | `import { buildMeosLink, buildImportIntentV1 } from '@meos/save-in-meos'` — no widget CSS required |
| **Local demo** | `npm run demo` then open `http://localhost:4173/demo?local=1` (stages `examples/vendor/` via `build:widget`) |

CDN mirrors (auto-indexed from npm — no separate account):

- **unpkg:** `https://unpkg.com/@meos/save-in-meos@VERSION/dist/widget.iife.js`
- **jsDelivr:** `https://cdn.jsdelivr.net/npm/@meos/save-in-meos@VERSION/dist/widget.iife.js`

Alias: `dist/save-in-meos.min.js` (identical minified IIFE).

## Widget appearance

The **save to meos** chip is **not styleable** — by design. Empty mount points render inside a **closed shadow root** with fixed label, icon, and colours. Integrators cannot restyle internals (enforced by `check:widget-branding`).

What you *can* control:

| Aspect | Behaviour |
|--------|-----------|
| **Dark / light chip** | Automatic via `prefers-color-scheme` (no option to pass) |
| **Page typography** | Load `fonts.css` on your page — chip uses `--meos-font` when present |
| **Placement** | Any empty `#mount` div in your layout |
| **Spin animation** | `spin: false` in `initSaveButton` options |

**Live examples** (after `npm run demo`):

| Demo | URL |
|------|-----|
| Blog post embed | `http://localhost:4173/demo?local=1` |
| Light + dark side-by-side | `http://localhost:4173/theme-demo.html` |
| CDN copy/paste snippet | `http://localhost:4173/cdn-demo.html` |

GitHub README cannot run script tags — use the demos above locally, or the unpkg URLs after publish (see [Publishing](#publishing)).

Toggle your OS dark mode on `demo?local=1` to see the chip invert with the page background.

## Quick start — npm widget

```ts
import "@meos/save-in-meos/fonts.css"
import "@meos/save-in-meos/widget.css"
import { initSaveButton } from "@meos/save-in-meos"

initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-site",
})
```

## Quick start — script tag

```html
<link rel="stylesheet" href="https://unpkg.com/@meos/save-in-meos@0.0.1/src/widget/fonts.css" />
<div id="meos-save-mount"></div>
<script src="https://unpkg.com/@meos/save-in-meos@0.0.1/dist/widget.iife.js"></script>
<script>
  MeosSave.initSaveButton("#meos-save-mount", {
    u: location.href,
    widgetId: "my-site",
  })
</script>
```

## Quick start — build links programmatically

```ts
import {
  buildMeosLink,
  buildImportIntentV1,
  decodeMeosLink,
  type ImportIntentV1,
} from "@meos/save-in-meos"

const intent = buildImportIntentV1({
  u: "https://example.com/article",
  t: "Optional selected quote",
})

const url = buildMeosLink(intent, "my-widget")
const roundtrip = decodeMeosLink(url)
```

See [`docs/INTEGRATOR.md`](docs/INTEGRATOR.md) for tiers, branding rules, and Universal Links.

## What is MDP?

The **meos deeplink protocol** encodes an import intent — URL, optional quoted text, images — into a compact `https://meos.do/databox:import:…` link. Widget attribution travels in the `?w=` query param.

| Tier | Use when |
|------|----------|
| **REF** | Page URL only |
| **LITE** | URL + selected quote text |
| **IMG** | URL + image URLs |
| **FULL** | URL + structured blocks (advanced) |

## Development

```bash
npm install
npm run build
npm run build:widget   # dist/widget.iife.js for CDN / script tag
npm run demo           # build + serve examples (local widget demos)
npm test
npm run check:mdp          # contract + branding gates
npm run check:public-scrub # no internal paths / secrets in docs
npm run check:ci           # GitHub Actions workflow ratchet
```

## Publishing

See [`docs/PUBLISHING.md`](docs/PUBLISHING.md) for the full checklist. Summary:

1. **npm scope** — publish as `@meoslabs/save-in-meos` (or `@meos/…` if the org scope is available on npmjs.com)
2. **First publish** — `npm login` → `npm publish --access public` (or GitHub Release → OIDC trusted publishing)
3. **CDN** — unpkg/jsDelivr index the npm tarball automatically; pin `VERSION` in integrator HTML
4. **Optional** — `meo cdn put dist/widget.iife.js` only if you also want a copy on `static.usemeos.com` (separate from npm mirrors)

## Docs

| Doc | Audience |
|-----|----------|
| [`docs/INTEGRATOR.md`](docs/INTEGRATOR.md) | Site owners embedding the widget |
| [`docs/PUBLISHING.md`](docs/PUBLISHING.md) | Maintainers — npm publish + CI secrets |
| [`docs/QA-MDP-SMOKE.md`](docs/QA-MDP-SMOKE.md) | Smoke-test this package before release |
| [`docs/RELEASE-MDP-DEEPLINKS.md`](docs/RELEASE-MDP-DEEPLINKS.md) | App Links / Universal Links for integrators |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | meoslabs contributors |

## Licence

- **Code:** [MIT](LICENSE)
- **Fonts:** Inconsolata [OFL-1.1](assets/fonts/inconsolata/OFL.txt) (bundled in the package)
