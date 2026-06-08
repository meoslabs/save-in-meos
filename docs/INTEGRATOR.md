# Integrator guide — @meoslabs/save-in-meos

Embed a **save in meos** button on any site. The button opens a canonical import URL:

```
https://meos.do/databox:import:{encoded}?w={widgetId}
```

On desktop, users see the meos.do import preview (with QR). On mobile with the meos app installed, the link opens share review and saves into their databox.

---

## Choose your integration path

| Use case | How |
|----------|-----|
| **npm / bundler** | `npm install @meoslabs/save-in-meos` |
| **Script tag (no build)** | Pin unpkg or jsDelivr URLs — [`examples/cdn-demo.html`](../examples/cdn-demo.html) |
| **Programmatic only** | Import `buildMeosLink` / `buildImportIntentV1` — skip widget CSS |
| **Try it** | `npm run demo` → [`examples/demo.html`](../examples/demo.html?local=1), [`theme-demo.html`](../examples/theme-demo.html) |

---

## Quick start (30 seconds)

1. Open [`examples/demo.html`](../examples/demo.html) in a browser
2. Click **save in meos**
3. Confirm the URL host is `meos.do` and includes your `widgetId` in `?w=`

---

## npm install

```bash
npm install @meoslabs/save-in-meos
```

### Widget embed

```ts
import "@meoslabs/save-in-meos/fonts.css"
import "@meoslabs/save-in-meos/widget.css"
import { initSaveButton } from "@meoslabs/save-in-meos"

// Empty mount → closed shadow DOM chip (integrators cannot restyle internals)
initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-widget",
})
```

The default chip label is **save in meos**. The only shorter variant is `chipPreset: "compact"` → visible **save** (logo + save). There is no arbitrary `label` option. Font and logo path are not customisable. Logo is **vector SVG** at **16px** mark height.

### Theme (light / dark / auto)

```ts
initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-widget",
  theme: "dark", // "light" | "dark" | "auto" (follows OS)
})
```

`theme: "auto"` (default) follows `prefers-color-scheme`. Pin `light` or `dark` when your page has its own theme toggle.

### Chip presets (recommended)

| Preset | Visible label | Use when | Height | Padding X | Radius |
|--------|---------------|----------|--------|-----------|--------|
| `default` | save in meos | Share rows | 31px | 10px | 2px |
| `compact` | save | Dense toolbars | 28px | 8px | 2px |

```ts
initSaveButton("#meos-save-mount", {
  u: location.href,
  widgetId: "my-widget",
  chipPreset: "compact", // logo + "save"
  theme: "dark",
})
```

`aria-label` remains **save in meos** on both presets.

### Bounded shape / size (advanced)

Override preset fields or set raw `chip` values:

```ts
initSaveButton("#meos-save-mount", {
  u: location.href,
  widgetId: "my-widget",
  chipPreset: "default",
  chip: { paddingX: 12 }, // overrides preset padding only
})
```

Or set CSS custom properties on the mount host before `initSaveButton`:

| Variable | Range | Default |
|----------|-------|---------|
| `--meos-save-chip-height` | 28–40px | 31px |
| `--meos-save-chip-padding-x` | 8–16px | 10px |
| `--meos-save-chip-radius` | 0–12px | 2px |
| `--meos-save-icon-size` | 11–16px | 16px (height; width follows brand aspect) |
| `--meos-save-chip-gap` | — | 0.3125rem |

**Not customisable:** font family, font size, label text, logo artwork, or chip colours outside the light/dark tokens.

Live previews: [`theme-demo.html`](../examples/theme-demo.html), [`chip-preview.html`](../examples/chip-preview.html?theme=dark&preset=default).

### Build links without the widget

```ts
import {
  buildMeosLink,
  buildImportIntentV1,
  decodeMeosLink,
  parseWidgetAttribution,
} from "@meoslabs/save-in-meos"

const intent = buildImportIntentV1({
  u: "https://example.com/post",
  t: "A passage the reader selected",
})

const url = buildMeosLink(intent, "my-widget")
const restored = decodeMeosLink(url)
const widgetId = parseWidgetAttribution(url)
```

---

## Script tag (CDN)

No npm or bundler required. Pin the package version — never use `@latest` in production.

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@meoslabs/save-in-meos@0.0.4/src/widget/fonts.css"
/>
<div id="meos-save-mount"></div>
<script src="https://unpkg.com/@meoslabs/save-in-meos@0.0.4/dist/widget.iife.js"></script>
<script>
  MeosSave.initSaveButton("#meos-save-mount", {
    u: location.href,
    widgetId: "my-widget",
  })
</script>
```

**jsDelivr:**

```
https://cdn.jsdelivr.net/npm/@meoslabs/save-in-meos@0.0.4/dist/widget.iife.js
```

**Alias:** `dist/save-in-meos.min.js` (same minified bundle).

Widget chip styles are injected into a closed shadow root at runtime — you only need `fonts.css` for Inconsolata. If you compose chip markup yourself, also import `@meoslabs/save-in-meos/widget.css` or `dist/widget.iife.css`.

### `window.MeosSave` API (CDN global)

| Member | Purpose |
|--------|---------|
| `initSaveButton` | Mount the branded chip |
| `buildMeosLink` | Build import URL from intent |
| `buildImportIntentV1` | Tier-pick intent from URL + optional quote/images |
| `decodeMeosLink` | Parse import URL back to intent |
| `parseWidgetAttribution` | Read `?w=` widget id |
| `buildSaveChipMarkup` | HTML for manual composition |
| `version` | Package semver baked into the bundle |

Self-hosting: run `npm run build:widget` and serve `dist/widget.iife.js` from your origin.

---

## Branding rules

| Wrong | Right |
|-------|-------|
| `MEOS`, `Save in MEOS` | `meos`, `save in meos` |
| Custom fonts, arbitrary label, or logo | `chipPreset` + `theme` only |
| `label: "Save to Meos"` | `default` or `compact` preset |

- Inconsolata is **bundled** in the package (OFL-1.1)
- Import `@meoslabs/save-in-meos/widget.css` only when composing markup yourself
- Do **not** add Google Fonts `<link>` tags
- Do **not** override `.meos-save-chip` font, label, logo, or colours — use `theme` / `chip` / host CSS vars instead

---

## Protocol reference

| Constant | Value |
|----------|-------|
| Host | `meos.do` |
| Resource | `databox:import` |
| Tiers (v1) | REF / LITE / IMG / FULL |
| Attribution | `?w={widgetId}` |

**REF** — URL only. **LITE** — URL + quoted text (`t`). **IMG** — URL + `images[]`. **FULL** — URL + optional `blocks[]`.

Widget attribution (`w`) is carried in the query string only; it is never embedded in the compressed payload.

---

## App Links / Universal Links

Widget URLs open the **meos** app when installed:

| Platform | Mechanism | Hosted file |
|----------|-----------|-------------|
| Android | App Links (`autoVerify`) | `https://meos.do/.well-known/assetlinks.json` |
| iOS | Associated Domains | `https://meos.do/.well-known/apple-app-site-association` |

Paths covered include `/databox:import*` (MDP). Desktop browsers without the app see the import preview on meos.do; mobile browsers may see an install interstitial.

See [`RELEASE-MDP-DEEPLINKS.md`](RELEASE-MDP-DEEPLINKS.md) for the integrator-facing matrix.

---

## Support

- Issues: [github.com/meoslabs/save-in-meos/issues](https://github.com/meoslabs/save-in-meos/issues)
- Product: [meos.do](https://meos.do)
