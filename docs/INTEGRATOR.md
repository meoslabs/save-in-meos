# Integrator guide — @meos/save-in-meos

Embed a **save to meos** button on any site. The button opens a canonical import URL:

```
https://meos.do/databox:import:{encoded}?w={widgetId}
```

On desktop, users see the meos.do import preview (with QR). On mobile with the meos app installed, the link opens share review and saves into their databox.

---

## Choose your integration path

| Use case | How |
|----------|-----|
| **npm / bundler** | `npm install @meos/save-in-meos` |
| **Script tag (no build)** | Pin unpkg or jsDelivr URLs — [`examples/cdn-demo.html`](../examples/cdn-demo.html) |
| **Programmatic only** | Import `buildMeosLink` / `buildImportIntentV1` — skip widget CSS |
| **Try it** | Open [`examples/demo.html`](../examples/demo.html) (CDN) or `?local=1` after `npm run build:widget` |

---

## Quick start (30 seconds)

1. Open [`examples/demo.html`](../examples/demo.html) in a browser
2. Click **save to meos**
3. Confirm the URL host is `meos.do` and includes your `widgetId` in `?w=`

---

## npm install

```bash
npm install @meos/save-in-meos
```

### Widget embed

```ts
import "@meos/save-in-meos/fonts.css"
import "@meos/save-in-meos/widget.css"
import { initSaveButton } from "@meos/save-in-meos"

// Empty mount → closed shadow DOM chip (integrators cannot restyle internals)
initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-widget",
})
```

The chip label is fixed at **save to meos** — there is no `label` option. Branding is enforced by the widget and `npm run check:widget-branding`.

### Build links without the widget

```ts
import {
  buildMeosLink,
  buildImportIntentV1,
  decodeMeosLink,
  parseWidgetAttribution,
} from "@meos/save-in-meos"

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
  href="https://unpkg.com/@meos/save-in-meos@0.0.1/src/widget/fonts.css"
/>
<div id="meos-save-mount"></div>
<script src="https://unpkg.com/@meos/save-in-meos@0.0.1/dist/widget.iife.js"></script>
<script>
  MeosSave.initSaveButton("#meos-save-mount", {
    u: location.href,
    widgetId: "my-widget",
  })
</script>
```

**jsDelivr:**

```
https://cdn.jsdelivr.net/npm/@meos/save-in-meos@0.0.1/dist/widget.iife.js
```

**Alias:** `dist/save-in-meos.min.js` (same minified bundle).

Widget chip styles are injected into a closed shadow root at runtime — you only need `fonts.css` for Inconsolata. If you compose chip markup yourself, also import `@meos/save-in-meos/widget.css` or `dist/widget.iife.css`.

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
| `MEOS`, `Save to MEOS` | `meos`, `save to meos` |
| Custom colours, fonts, or label on the chip | Use the packaged chip as-is |

- Inconsolata is **bundled** in the package (OFL-1.1)
- Import `@meos/save-in-meos/widget.css` only when composing markup yourself
- Do **not** add Google Fonts `<link>` tags
- Do **not** override `.meos-save-chip` styles — use `initSaveButton` on an empty mount

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
