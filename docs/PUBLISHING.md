# Publishing @meos/save-in-meos

How maintainers ship npm releases and CDN mirrors for integrators.

---

## TL;DR

1. Merge to `main` with CI green
2. Bump `version` in `package.json` + commit
3. Create a GitHub Release (tag = semver, e.g. `v0.0.2`)
4. The **Release** workflow builds, verifies, and `npm publish`
5. unpkg and jsDelivr index the tarball automatically — no extra step

---

## Prerequisites

### npm account

- Create an account at [npmjs.com](https://www.npmjs.com/signup) if you do not have one
- Request access to the **meoslabs** org for the `@meos` scope
- First publish of a scoped package requires `--access public` (the release workflow includes this)

### Local publish (optional)

```bash
npm login
npm run build && npm run build:widget
npm test && npm run check:mdp && npm run check:public-scrub
npm publish --access public
```

### CI publish (recommended)

Add an npm automation token to GitHub repository secrets:

| Secret | Value |
|--------|-------|
| `NPM_TOKEN` | npm access token with **publish** permission for `@meos/save-in-meos` |

Create the token: npm → Access Tokens → **Granular Access Token** → scope to the `@meos` packages or the `save-in-meos` package.

The workflow uses `NODE_AUTH_TOKEN` (standard for `actions/setup-node` + `npm publish`).

---

## What gets published

The `files` whitelist in `package.json` ships:

| Artifact | Purpose |
|----------|---------|
| `dist/index.js` + `.d.ts` | npm / bundler entry |
| `dist/widget.iife.js` | CDN / script tag (also `unpkg` + `jsdelivr` fields) |
| `dist/save-in-meos.min.js` | Documented alias (same bundle) |
| `dist/widget.iife.css` | Optional external stylesheet |
| `src/widget/fonts.css` + `assets/fonts/` | Bundled Inconsolata (OFL) |
| `src/widget/widget.css` | npm `widget.css` export |

`prepublishOnly` runs `build`, `build:widget`, `check:mdp`, and `check:public-scrub` before every publish.

---

## CDN (unpkg / jsDelivr)

No separate CDN account is needed. Both mirrors read from the npm registry:

```
https://unpkg.com/@meos/save-in-meos@VERSION/dist/widget.iife.js
https://cdn.jsdelivr.net/npm/@meos/save-in-meos@VERSION/dist/widget.iife.js
```

Integrators must **pin the version** in production. Document the pin in [`INTEGRATOR.md`](INTEGRATOR.md) and bump [`examples/cdn-demo.html`](../examples/cdn-demo.html) when cutting a release.

---

## GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| [`ci.yml`](../.github/workflows/ci.yml) | PR + push to `main` / `develop` | `npm ci`, typecheck, `check:mdp`, `check:public-scrub`, `check:ci`, test, build |
| [`release.yml`](../.github/workflows/release.yml) | GitHub Release **published** or manual `workflow_dispatch` | Full verify + `npm publish` |

Manual dry run (build + verify, no publish):

1. Actions → Release → Run workflow
2. Set **dry_run** to `true`

---

## Release checklist

- [ ] `npm test` GREEN
- [ ] `npm run check:mdp` GREEN
- [ ] `npm run check:public-scrub` GREEN
- [ ] `npm run check:ci` GREEN
- [ ] Version bumped in `package.json`
- [ ] `examples/cdn-demo.html` + `examples/demo.html` `VERSION` constant updated
- [ ] GitHub Release notes mention breaking MDP / widget changes if any
- [ ] After publish: smoke-test unpkg URL loads `MeosSave.initSaveButton`

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `403` on publish | Token lacks publish rights or package name not authorised under `@meos` |
| unpkg 404 | Publish may still be propagating — wait a few minutes |
| `check-public-scrub` FAIL | Remove internal paths, branch names, or secrets from committed docs |
| Widget missing on CDN | Confirm `dist/widget.iife.js` exists locally after `npm run build:widget` |
