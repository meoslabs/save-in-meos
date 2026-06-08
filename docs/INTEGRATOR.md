# Integrator guide — @meos/save-in-meos

> **Status:** Wave -1 stub. Full spec mirrors LIP-0028 (meos-core-logic) when drafted.

## TL;DR

Embed a **save to meos** button on any site. The button builds a
`https://meos.do/databox:import:{encoded}?w={widgetId}` deeplink.

---

## Quick start (30 seconds)

1. Open [`examples/demo.html`](../examples/demo.html) in a browser
2. Click **save to meos**
3. Desktop → meos.do import preview + QR (after Phase 1)
4. Phone with app → share review flow (after MIP-0043)

---

## npm (Phase 1+)

```bash
npm install @meos/save-in-meos
```

```ts
import "@meos/save-in-meos/fonts.css"
import "@meos/save-in-meos/widget.css"
import { initSaveButton } from "@meos/save-in-meos"

// Empty mount → closed shadow DOM chip (integrators cannot restyle)
initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-widget",
})
```

The chip label is fixed at **save to meos** — there is no `label` option.
Branding is enforced by the widget implementation and `check-widget-branding`.

---

## Script tag (Phase 2)

```html
<script
  async
  src="https://getmeos.com/widget/v1.js"
  data-widget-id="auto"
></script>
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

- Canonical host: `meos.do`
- Resource: `databox:import`
- Tiers: REF / LITE / IMG / FULL (v1)
- Attribution: `?w={widgetId}`

See LIP-0028 in meos-core-logic for the authoritative contract.
