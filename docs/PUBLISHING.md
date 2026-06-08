# Publishing @meos/save-in-meos

How maintainers ship npm releases and CDN mirrors for integrators.

---

## TL;DR

1. Merge to `main` with CI green
2. Bump `version` in `package.json` + commit
3. Pin `VERSION` in `examples/demo.html` and `examples/cdn-demo.html`
4. Create a GitHub Release (tag = semver, e.g. `v0.0.2`)
5. The **Release** workflow builds, verifies, and `npm publish`
6. unpkg and jsDelivr index the tarball automatically — no extra CDN account

---

## Prerequisites

### npm account and scope

| Step | Action |
|------|--------|
| Account | [npmjs.com signup](https://www.npmjs.com/signup) — org **`meoslabs`** exists |
| Scope | Prefer **`@meoslabs/save-in-meos`** if `@meos` is unavailable; update `package.json` `name` before first publish |
| Access | Org member with publish rights on the package |

First publish of a scoped package requires `--access public` (included in CI and examples below).

### Path A — manual first publish (simplest)

```bash
npm login
npm run build && npm run build:widget
npm test && npm run check:mdp && npm run check:public-scrub
npm publish --access public
```

Smoke-test CDN after a few minutes:

```bash
curl -sI "https://unpkg.com/@meoslabs/save-in-meos@0.0.1/dist/widget.iife.js" | head -1
# expect HTTP/2 200 once published and propagated
```

Open in browser and confirm `typeof MeosSave.initSaveButton === "function"` (not `MeosSave.default`).

### Path B — CI publish (recommended after v0)

**Option 1 — OIDC trusted publishing** (current `release.yml`):

1. npm → Package → **Trusted Publisher** → GitHub Actions
2. Link `meoslabs/save-in-meos`, workflow `release.yml`, environment (optional)
3. No automation token secret required — workflow uses `id-token: write` + `npm publish --provenance`

**Option 2 — automation token** (if OIDC not configured):

Add an npm access token to GitHub repository secrets and change the publish step to use `NODE_AUTH_TOKEN` (see npm docs).

```yaml
- run: npm publish --access public --provenance
  env:
    NODE_AUTH_TOKEN: ${{ secrets.<your-npm-token-secret> }}
```

---

## What gets published

The `files` whitelist in `package.json` ships:

| Artifact | Purpose |
|----------|---------|
| `dist/index.js` + `.d.ts` | npm / bundler entry |
| `dist/widget.iife.js` | CDN / script tag (`unpkg` + `jsdelivr` fields) |
| `dist/save-in-meos.min.js` | Documented alias (same bundle) |
| `dist/widget.iife.css` | Optional external stylesheet |
| `src/widget/fonts.css` + `assets/fonts/` | Bundled Inconsolata (OFL) |
| `src/widget/widget.css` | npm `widget.css` export |

`prepublishOnly` runs `build`, `build:widget`, `check:mdp`, and `check:public-scrub` before every publish.

`build:widget` asserts `MeosSave.initSaveButton` is on the global flat object (guards against `export default` regressions).

---

## CDN (unpkg / jsDelivr)

No separate CDN account is needed. Both mirrors read from the npm registry:

```
https://unpkg.com/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js
https://cdn.jsdelivr.net/npm/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js
```

Integrators must **pin the version** in production. Bump pins in `examples/cdn-demo.html` and `examples/demo.html` when cutting a release.

### Optional: static.usemeos.com

For a meos-controlled mirror (large assets, pinning outside npm):

```bash
meo cdn put save-in-meos/dist/widget.iife.js
```

This is **optional** — unpkg/jsDelivr are the primary integrator CDN path for the widget.

---

## GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| [`ci.yml`](../.github/workflows/ci.yml) | PR + push to `main` / `develop` | `npm ci`, typecheck, checks, test, build |
| [`release.yml`](../.github/workflows/release.yml) | GitHub Release **published** or manual `workflow_dispatch` | Full verify + `npm publish` |

Manual dry run (build + verify, no publish):

1. Actions → Release → Run workflow
2. Leave **dry_run** as `true` (default)

---

## Release checklist

- [ ] `npm test` GREEN
- [ ] `npm run check:mdp` GREEN
- [ ] `npm run check:public-scrub` GREEN
- [ ] `npm run check:ci` GREEN
- [ ] Version bumped in `package.json`
- [ ] `VERSION` constant updated in `examples/demo.html` + `examples/cdn-demo.html`
- [ ] `npm run demo` — chip visible at `/demo?local=1` and `/theme-demo.html`
- [ ] GitHub Release notes mention breaking MDP / widget changes if any
- [ ] After publish: unpkg URL loads `MeosSave.initSaveButton` (flat global, not `.default`)

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `403` on publish | Token lacks publish rights or wrong scope / org |
| unpkg 404 | Not published yet, wrong package name, or registry propagation delay |
| `MeosSave.default` in browser | Rebuild widget — `iife-entry.ts` must use named exports only |
| `check-public-scrub` FAIL | Remove internal paths, branch names, or secrets from committed docs |
| Local demo 404 | Run `npm run demo` (not bare `serve examples` without `build:widget`) |
