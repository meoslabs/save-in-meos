# Integrator guide — @meos/save-in-meos

Embed a **save to meos** button on any site. The button opens a canonical import URL:

```
https://meos.do/databox:import:{encoded}?w={widgetId}
```

On desktop, users see the meos.do import preview (with QR). On mobile with the meos app installed, the link opens share review and saves into their databox.

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
  decodeMeosLink,
  encodeImportIntentV1,
  type ImportIntentV1,
} from "@meos/save-in-meos"

const intent: ImportIntentV1 = {
  v: 1,
  tier: "LITE",
  u: "https://example.com/post",
  t: "A passage the reader selected",
}

const url = buildMeosLink(intent, "my-widget")
const restored = decodeMeosLink(url)
```

---

## Script tag (planned)

A hosted IIFE bundle will be available at `https://getmeos.com/widget/v1.js`. Until then, bundle with `npm run build:widget` and self-host `dist/widget.iife.js`:

```html
<script src="/path/to/widget.iife.js"></script>
<script>
  MeosSave.initSaveButton("#meos-save-mount", {
    u: location.href,
    widgetId: "my-widget",
  })
</script>
```

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
