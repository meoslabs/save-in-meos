# save-in-meos — MDP codec & widget

> **meoslabs workspace required.** Verify `meos.manifest` exists at workspace root,
> `AGENTS.md` contains `meoslabs-codex-v1`, and `meo help` runs.
>
> Engineering principles and cross-repo workflow: workspace-root `AGENTS.md`.
> This file is **repo-specific only**.

---

## Bottom line

- **Package:** `@meos/save-in-meos` — mdp codec + embed widget
- **SSOT:** `ImportIntentV1` encode/decode lives **only here** (LIP-0028 references semver)
- **Checker-first:** Wave -1 ships `check-mdp-contract` (RED) + `check-widget-branding` (GREEN)
- **No app/desktop code** in this repo

---

## Commands

```bash
npm install
npm run check:mdp          # DoD — contract RED until codec Phase 1
npm run check:widget-branding
npm test
npm run typecheck
npm run build
```

---

## Parallel agents

Read [`docs/AGENT-WORKSTREAMS.md`](docs/AGENT-WORKSTREAMS.md) before any MDP work.

---

## Pre-commit

`.husky/pre-commit` runs branding checker + typecheck. Full `check:mdp` is the codec DoD.
