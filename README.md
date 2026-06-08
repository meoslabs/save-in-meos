# @meos/save-in-meos

**meos deeplink protocol (MDP)** codec and **save to meos** embed widget for third-party sites.

Let visitors save a page (or a quote from it) into [meos](https://meos.do) with one tap. This package builds canonical import URLs and ships a branded, self-contained button you can drop into any site.

## Install

```bash
npm install @meos/save-in-meos
```

## Quick start — embed widget

```ts
import "@meos/save-in-meos/fonts.css"
import "@meos/save-in-meos/widget.css"
import { initSaveButton } from "@meos/save-in-meos"

// Mount on an empty element — the chip renders in a closed shadow root
initSaveButton("#meos-save-mount", {
  u: "https://example.com/article",
  widgetId: "my-site",
})
```

Open [`examples/demo.html`](examples/demo.html) locally (`npx serve examples` or your editor's live server) to try the chip.

## Quick start — build links programmatically

```ts
import {
  buildMeosLink,
  decodeMeosLink,
  encodeImportIntentV1,
  type ImportIntentV1,
} from "@meos/save-in-meos"

const intent: ImportIntentV1 = {
  v: 1,
  tier: "REF",
  u: "https://example.com/article",
}

const url = buildMeosLink(intent, "my-widget")
// → https://meos.do/databox:import:{encoded}?w=my-widget

const roundtrip = decodeMeosLink(url)
```

See [`docs/INTEGRATOR.md`](docs/INTEGRATOR.md) for tiers, branding rules, Universal Links, and script-tag embed (coming soon).

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
npm test
npm run check:mdp          # contract + branding gates
npm run check:public-scrub # no internal paths / secrets in docs
```

## Docs

| Doc | Audience |
|-----|----------|
| [`docs/INTEGRATOR.md`](docs/INTEGRATOR.md) | Site owners embedding the widget |
| [`docs/QA-MDP-SMOKE.md`](docs/QA-MDP-SMOKE.md) | Smoke-test this package before release |
| [`docs/RELEASE-MDP-DEEPLINKS.md`](docs/RELEASE-MDP-DEEPLINKS.md) | App Links / Universal Links for integrators |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | meoslabs contributors |

## Licence

- **Code:** [MIT](LICENSE)
- **Fonts:** Inconsolata [OFL-1.1](assets/fonts/inconsolata/OFL.txt) (bundled in the package)
