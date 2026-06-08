# Contributing — save-in-meos

Thanks for helping maintain the public `@meoslabs/save-in-meos` package.

## Setup

```bash
npm install
npm run build
npm run build:widget
```

Pre-commit runs `check:mdp-contract`, `check:widget-branding`, and `typecheck`.

## Before you open a PR

```bash
npm test
npm run check:mdp
npm run check:public-scrub
npm run check:ci
```

CI (`.github/workflows/ci.yml`) runs the same gates on every PR.

## Public release scrub checklist

Run before making the repo public or publishing to npm:

- [ ] `npm run check:public-scrub` — no agent paths, branch names, or secrets in docs
- [ ] No agent playbooks or IDE workspace artefacts in the tree
- [ ] README + INTEGRATOR aimed at external integrators, not internal waves
- [ ] `package.json` has `repository`, `license`, and `files` whitelist (includes `widget.iife.js`)
- [ ] `LICENSE` (MIT) + `assets/fonts/inconsolata/OFL.txt` present
- [ ] `examples/demo.html` works zero-build (unpkg) and with `?local=1` after `build:widget`
- [ ] `npm run check:mdp` GREEN

Publishing steps: [`docs/PUBLISHING.md`](docs/PUBLISHING.md).

## Cross-repo MDP ecosystem (meoslabs internal)

This repo is the **codec SSOT** — do not duplicate `encode`/`decode` in other packages. End-to-end MDP (app handlers, desktop frame, analytics privacy) is validated across private meoslabs repos. That matrix is intentionally **not** documented here; maintainers run those gates in the meos workspace before major releases.

## Codec contract

Golden fixtures in `fixtures/mdp/` are pinned by `scripts/check-mdp-contract.ts`. Renaming fixtures requires updating the checker allowlist.
