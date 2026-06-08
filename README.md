# @meoslabs/save-in-meos

**meos deeplink protocol (MDP)** codec and **save in meos** embed widget for third-party sites.

Let visitors save a page (or a quote from it) into [meos](https://meos.do) with one tap. This package builds canonical import URLs and ships a branded, self-contained button you can drop into any site — via npm, a script tag, or programmatic imports only.

## Widget preview

Static SVG previews of the branded chip (regenerated from widget SSOT on `npm run build:widget`). The live widget matches these presets — closed shadow DOM, Inconsolata, vector meos mark.

<!-- CDN_PREVIEW: pin @VERSION when cutting a release -->
<table>
  <thead>
    <tr>
      <th></th>
      <th><code>default</code> — save in meos</th>
      <th><code>compact</code> — save</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>light</strong></td>
      <td align="center">
        <img
          src="https://unpkg.com/@meoslabs/save-in-meos@0.0.2/assets/preview/chip-default-light.svg"
          alt="save in meos chip — default preset, light theme"
          height="55"
        />
      </td>
      <td align="center">
        <img
          src="https://unpkg.com/@meoslabs/save-in-meos@0.0.2/assets/preview/chip-compact-light.svg"
          alt="save chip — compact preset, light theme"
          height="52"
        />
      </td>
    </tr>
    <tr>
      <td><strong>dark</strong></td>
      <td align="center">
        <img
          src="https://unpkg.com/@meoslabs/save-in-meos@0.0.2/assets/preview/chip-default-dark.svg"
          alt="save in meos chip — default preset, dark theme"
          height="55"
        />
      </td>
      <td align="center">
        <img
          src="https://unpkg.com/@meoslabs/save-in-meos@0.0.2/assets/preview/chip-compact-dark.svg"
          alt="save chip — compact preset, dark theme"
          height="52"
        />
      </td>
    </tr>
  </tbody>
</table>

Preview assets also ship in-repo at [`assets/preview/`](assets/preview/) and on [jsDelivr](https://cdn.jsdelivr.net/npm/@meoslabs/save-in-meos@0.0.2/assets/preview/chip-default-light.svg).

## How to integrate

| Use case | How |
|----------|-----|
| **npm / bundler** | `npm install @meoslabs/save-in-meos` then `import { initSaveButton } from '@meoslabs/save-in-meos'` |
| **Script tag (CDN)** | Pin `https://unpkg.com/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js` + `fonts.css` — see [`examples/cdn-demo.html`](examples/cdn-demo.html) |
| **Programmatic only** | `import { buildMeosLink, buildImportIntentV1 } from '@meoslabs/save-in-meos'` — no widget CSS required |
| **Local demo** | `npm run demo` then open `http://localhost:4173/demo?local=1` (stages `examples/vendor/` via `build:widget`) |

CDN mirrors (auto-indexed from npm — no separate account):

- **unpkg:** `https://unpkg.com/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js`
- **jsDelivr:** `https://cdn.jsdelivr.net/npm/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js`

Alias: `dist/save-in-meos.min.js` (identical minified IIFE).

## Widget appearance

The **save in meos** chip uses a **closed shadow root**. Integrators cannot change the label, font (Inconsolata), or logo SVG path. The logo is **vector** (from `assets/branding/meos-logo-charcoal-nostroke.svg`), rendered at **16px mark height** by default with the correct brand aspect ratio.

| Customisable | Fixed (brand) |
|--------------|---------------|
| `theme: "auto" \| "light" \| "dark"` | Font family + weight |
| `chipPreset: "default" \| "compact"` | Logo SVG path |
| Chip height (28–40px), padding, radius | Arbitrary label text |
| Logo mark height (11–16px) | Logo animation (static mark only) |

### Chip presets

Two presets only — pick size and label together:

| Preset | Visible label | Use when | Height | Padding X | Radius |
|--------|---------------|----------|--------|-----------|--------|
| `default` | **save in meos** | Share rows (default) | 31px | 10px | 2px |
| `compact` | **save** | Dense toolbars | 28px | 8px | 2px |

`aria-label` is always **save in meos** (accessibility). Only the visible chip text shortens on `compact`.

```ts
initSaveButton("#meos-save-mount", {
  u: location.href,
  widgetId: "my-site",
  theme: "dark",
  chipPreset: "compact",
})
```

Explicit `chip` fields override preset values. Prefer `chipPreset` over hand-rolled pixel values.

**Theme:** `auto` follows OS `prefers-color-scheme`. Pin `light` or `dark` when your page theme differs from the OS.

**Advanced shape via CSS on the mount host:**

```css
#meos-save-mount {
  --meos-save-chip-height: 36px;
  --meos-save-icon-size: 16px;
}
```

**Live examples** (after `npm run demo`):

| Demo | URL |
|------|-----|
| Blog post embed | `http://localhost:4173/demo.html?local=1` |
| Theme + chip presets | `http://localhost:4173/theme-demo.html` |
| CDN copy/paste snippet | `http://localhost:4173/cdn-demo.html` |

See [`docs/INTEGRATOR.md`](docs/INTEGRATOR.md) for the full widget API.

## Quick start — npm widget

```ts
import "@meoslabs/save-in-meos/fonts.css"
import "@meoslabs/save-in-meos/widget.css"
import { initSaveButton } from "@meoslabs/save-in-meos"

initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-site",
})
```

## Quick start — script tag

```html
<link rel="stylesheet" href="https://unpkg.com/@meoslabs/save-in-meos@0.0.2/src/widget/fonts.css" />
<div id="meos-save-mount"></div>
<script src="https://unpkg.com/@meoslabs/save-in-meos@0.0.2/dist/widget.iife.js"></script>
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
} from "@meoslabs/save-in-meos"

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
