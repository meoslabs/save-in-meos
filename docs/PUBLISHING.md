# Publishing @meoslabs/save-in-meos

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

### Path A — manual first publish (**required once**)

npm **cannot** attach Trusted Publishing until the package exists on the registry.
The first version must be published manually; CI/OIDC handles every release after
trusted publisher is linked.

```bash
npm login                    # meoslabs org member, 2FA on
npm run prepublishOnly
npm publish --access public --provenance=false
# If the meoslabs org defaults scoped packages to private, also run:
npm access set status=public @meoslabs/save-in-meos
```

Do **not** use `--provenance` on the bootstrap publish — provenance is CI/OIDC only.

Smoke-test CDN after a few minutes:

```bash
curl -sI "https://unpkg.com/@meoslabs/save-in-meos@0.0.1/dist/widget.iife.js" | head -1
# expect HTTP/2 200 once published and propagated
```

Open in browser and confirm `typeof MeosSave.initSaveButton === "function"` (not `MeosSave.default`).

### Path B — CI publish (recommended — **use this**)

**OIDC trusted publishing** (`release.yml` — no `NPM_TOKEN` secret):

#### One-time: your actions on npmjs.com (~2 minutes)

1. Log in at [npmjs.com](https://www.npmjs.com) as a **`meoslabs` org member** with publish rights.
2. Open **meoslabs** org → **Packages** (or [npm trusted publishers](https://www.npmjs.com/settings/meoslabs/publishing)).
3. **Add trusted publisher** → **GitHub Actions** and enter **exactly**:

| Field | Value |
|--------|--------|
| Repository owner | `meoslabs` |
| Repository name | `save-in-meos` |
| Workflow filename | `release.yml` |
| Environment | *(leave blank)* |

4. Open **@meoslabs/save-in-meos** → **Settings** → **Trusted Publisher** → add the GitHub Actions connection above.

**Prerequisite:** Path A bootstrap publish must have run first (package must exist).

No automation token. No GitHub secret. The workflow uses `id-token: write` + `npm publish --provenance --access public`.

#### One-time: GitHub (usually already done)

- **Actions** enabled on `meoslabs/save-in-meos`
- Default branch **`main`**

#### Every release (automated)

1. Merge to `main` with CI green
2. Bump `version` in `package.json` (commit to `main`)
3. Create **GitHub Release** with tag **`vX.Y.Z`** matching `package.json` (e.g. `v0.0.1`)
4. `release.yml` runs → verifies → `npm publish`
5. unpkg / jsDelivr pick up the tarball within minutes

**Dry run** (no publish): Actions → Release → Run workflow → `dry_run: true`

**Manual publish trigger** (after trusted publisher is set): Run workflow → `dry_run: false` on `main`.

```bash
gh workflow run release.yml --repo meoslabs/save-in-meos -f dry_run=false
```

### First publish failed with `E404 Not Found`?

If CI logs show provenance signed but:

```
npm error 404 Not Found - PUT ... @meoslabs/save-in-meos - Not found
```

**Cause:** npm **Trusted Publisher** is not linked yet (OIDC auth worked; npm rejected the package create).

**Fix:**

1. Complete the [one-time npmjs.com steps](#one-time-your-actions-on-npmjscom-2-minutes) above.
2. Re-run publish (release tag already exists — use workflow dispatch):

```bash
gh workflow run release.yml --repo meoslabs/save-in-meos -f dry_run=false
```

3. Verify:

```bash
npm view @meoslabs/save-in-meos version
curl -sI "https://unpkg.com/@meoslabs/save-in-meos@0.0.1/dist/widget.iife.js" | head -3
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
