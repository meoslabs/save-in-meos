# Publishing @meoslabs/save-in-meos

How maintainers ship npm releases, CDN mirrors, and the GitHub Pages demo.

---

## TL;DR

1. Merge to `main` with CI green
2. `npm version patch` (or edit `package.json` manually)
3. **`npm run version:sync`** — updates README, docs, examples, lockfile, rebuilds widget
4. Commit + push to `main`
5. Create **GitHub Release** tag `vX.Y.Z` matching `package.json`
6. `release.yml` → `npm publish` via OIDC → unpkg / jsDelivr index automatically
7. GitHub Pages redeploys demos on every `main` push (`pages.yml`)

---

## Version pins (single source of truth)

`package.json#version` is canonical. These files must match:

| File | What gets synced |
|------|------------------|
| `README.md` | `@meoslabs/save-in-meos@X.Y.Z` CDN URLs |
| `docs/INTEGRATOR.md` | CDN examples |
| `examples/cdn-demo.html` | unpkg / jsDelivr pins |
| `examples/demo.html` | `var VERSION = "X.Y.Z"` |
| `package-lock.json` | root `version` field |
| `dist/widget.iife.js` | `__MEOS_SAVE_VERSION__` (via `build:widget`) |

```bash
npm version patch          # bumps package.json + git tag (optional)
npm run version:sync       # sync pins + rebuild widget
npm run check:version-pins # ratchet — also runs in pre-commit
```

**Never hand-edit CDN pins** across six files — use `version:sync`.

### Version history (bootstrap mess — resolved)

| Version | What happened |
|---------|----------------|
| `0.0.1` | First manual bootstrap publish |
| `0.0.2` | Accidental empty publish during org visibility fix — **slot burned** on npm |
| `0.0.3` | Current `latest` — readme preview SVGs, public package |

GitHub Releases `v0.0.1` / `v0.0.2` exist but CI publish failed (see OIDC below). **Trust npm `latest`, not orphan GitHub release tags.**

---

## OIDC / CI publish failures (E404)

### Symptom

```
npm notice publish Signed provenance statement ...
npm error 404 Not Found - PUT https://registry.npmjs.org/@meoslabs%2fsave-in-meos
```

### Root causes (check in order)

| # | Cause | Fix |
|---|--------|-----|
| 1 | **npm CLI too old** — Node 20 ships npm 10; OIDC needs **npm ≥ 11.5.1** | `release.yml` now runs `npm install -g npm@11.6.2` before publish |
| 2 | **Trusted Publisher not on package** | npm → `@meoslabs/save-in-meos` → Settings → Trusted Publisher → `release.yml`, env blank |
| 3 | **Bootstrap publish missing** | First version must be manual (`Path A` below) |
| 4 | **Org scoped default private** | `npm access set status=public @meoslabs/save-in-meos` after manual publish |

npm returns **404** for both “package missing” and “OIDC handshake failed” — misleading. Provenance signing before the 404 means OIDC token exchange partially worked; usually cause **#1** or **#2**.

### Verify OIDC path (no publish)

```bash
gh workflow run release.yml --repo meoslabs/save-in-meos -f dry_run=true
```

### Re-publish after fix (tag already exists)

```bash
gh workflow run release.yml --repo meoslabs/save-in-meos -f dry_run=false
```

Only works if the version is **not** already on npm.

---

## Prerequisites

### npm account and scope

| Step | Action |
|------|--------|
| Account | [npmjs.com](https://www.npmjs.com) — org **`meoslabs`** |
| Package | `@meoslabs/save-in-meos` |
| Access | Org member with publish rights |

### Path A — manual first publish (**required once**)

```bash
npm login
npm run prepublishOnly
npm publish --access public --provenance=false
npm access set status=public @meoslabs/save-in-meos   # if org defaults scoped → private
```

### Path B — CI publish (after bootstrap + Trusted Publisher)

**npmjs.com** → `@meoslabs/save-in-meos` → **Trusted Publisher**:

| Field | Value |
|--------|--------|
| Repository owner | `meoslabs` |
| Repository name | `save-in-meos` |
| Workflow filename | `release.yml` |
| Environment | *(leave blank)* |

No `NPM_TOKEN` secret. Workflow uses `id-token: write` + `npm publish --provenance --access public`.

---

## GitHub Pages demo

| Workflow | Trigger | Output |
|----------|---------|--------|
| [`pages.yml`](../.github/workflows/pages.yml) | push to `main` | https://meoslabs.github.io/save-in-meos/ |

**One-time repo setting:** Settings → Pages → Build and deployment → **Source: GitHub Actions**.

`pages.yml` runs `build:widget` (stages `examples/vendor/`) then deploys `examples/`.

---

## GitHub Actions summary

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| [`ci.yml`](../.github/workflows/ci.yml) | PR + push `main` / `develop` | verify + build |
| [`release.yml`](../.github/workflows/release.yml) | Release published / manual | verify + npm publish (OIDC) |
| [`pages.yml`](../.github/workflows/pages.yml) | push `main` | live demos |

All Node jobs upgrade to **npm 11.6.2** before `npm ci` (OIDC parity).

---

## What gets published

See `package.json#files`. Includes `dist/*`, widget CSS/fonts, `assets/preview/` (readme chip SVGs).

`prepublishOnly`: build, widget, MDP checks, public scrub, **version pin check**.

---

## CDN (unpkg / jsDelivr)

```
https://unpkg.com/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js
https://cdn.jsdelivr.net/npm/@meoslabs/save-in-meos@VERSION/assets/preview/chip-default-light.svg
```

jsDelivr often indexes new versions faster than unpkg.

---

## Release checklist

- [ ] `npm test` + `npm run check:mdp` + `npm run check:ci` GREEN
- [ ] `npm version patch` (or bump `package.json`)
- [ ] **`npm run version:sync`**
- [ ] Commit + push `main`
- [ ] GitHub Release `vX.Y.Z` (tag = `package.json` version)
- [ ] CI publish GREEN (or manual publish if OIDC still blocked)
- [ ] Verify: `npm view @meoslabs/save-in-meos version`
- [ ] Verify CDN: `curl -sI https://cdn.jsdelivr.net/npm/@meoslabs/save-in-meos@VERSION/dist/widget.iife.js`
- [ ] Verify demo: https://meoslabs.github.io/save-in-meos/

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| OIDC `E404` on publish | Upgrade npm in CI (see above); verify Trusted Publisher on **package** |
| `check-version-pins` FAIL | `npm run version:sync` |
| `403` cannot republish version | npm version slots are immutable — bump patch |
| unpkg 404, jsDelivr 200 | Wait for propagation or pin jsDelivr |
| Pages 404 | Enable Pages → GitHub Actions source; wait for `pages.yml` |
| `MeosSave.default` in browser | Rebuild widget — named exports only in `iife-entry.ts` |
