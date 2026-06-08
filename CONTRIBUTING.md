# Contributing — save-in-meos

Thanks for helping maintain the public `@meos/save-in-meos` package.

## Setup

```bash
npm install
npm run build
```

Pre-commit runs `check:mdp-contract`, `check:widget-branding`, and `typecheck`.

## Before you open a PR

```bash
npm test
npm run check:mdp
npm run check:public-scrub
```

## Public release scrub checklist

Run before making the repo public or publishing to npm:

- [ ] `npm run check:public-scrub` — no agent paths, branch names, or secrets in docs
- [ ] No agent playbooks or IDE workspace artefacts in the tree
- [ ] README + INTEGRATOR aimed at external integrators, not internal waves
- [ ] `package.json` has `repository`, `license`, and `files` whitelist
- [ ] `LICENSE` (MIT) + `assets/fonts/inconsolata/OFL.txt` present
- [ ] `examples/demo.html` works without internal commentary
- [ ] `npm run check:mdp` GREEN

## Cross-repo MDP ecosystem (meoslabs internal)

This repo is the **codec SSOT** — do not duplicate `encode`/`decode` in other packages. End-to-end MDP (app handlers, desktop frame, analytics privacy) is validated across private meoslabs repos. That matrix is intentionally **not** documented here; maintainers run those gates in the meos workspace before major releases.

## Codec contract

Golden fixtures in `fixtures/mdp/` are pinned by `scripts/check-mdp-contract.ts`. Renaming fixtures requires updating the checker allowlist.
