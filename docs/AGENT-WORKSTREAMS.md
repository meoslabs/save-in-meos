# AGENT-WORKSTREAMS — save-in-meos mdp

> **Read this before touching any MDP lane.** Cross-repo plan:
> `.cursor/plans/save-in-meos_mlp_0da60c23.plan.md`

## TL;DR

- **Protocol:** meos deeplink protocol (mdp)
- **Branch:** `feat/save-in-meos` across all repos
- **Wave -1:** checkers + fixtures land **first** (contract checker RED until codec)
- **Codec SSOT:** this repo only — do not duplicate encode/decode elsewhere

---

## Wave dependency graph

```
Wave -1 (checkers RED + branding GREEN)
    ↓
LIP-0028 draft + fixtures
    ↓
Parallel: core-logic sanitizer | app MIP-0043 | desktop DIP-0035 | save-in-meos codec
    ↓
Playwright + demo + widget CDN
```

---

## File ownership

| Lane | Owns | Must not touch |
|------|------|----------------|
| **Checkers** | `check-mdp-*`, fixtures, pre-commit | Feature implementation |
| **Codec** (this repo) | `src/**`, `examples/**` | `DeepLinkProvider`, middleware |
| **App** | `mdpImportBridge.ts`, overlay, handlers | Codec, frame UI |
| **Desktop** | `_middleware.ts`, `DataboxImportFrame` | `app.config` intents |
| **Core-logic** | LIP-0028, `sanitizeDeeplinkForAnalytics` | Frame components |

---

## Definition of done (Codec lane)

```bash
cd save-in-meos
npm test
npm run check:mdp          # both checkers GREEN
npm run typecheck
```

**Pre-commit:** runs `check:widget-branding` + `typecheck` (BLOCKING).
**Full DoD:** `npm run check:mdp` — `check-mdp-contract` expected **RED** until Phase 1 codec ships.

---

## Checker inventory (this repo)

| Script | Status (Wave -1) | Enforces |
|--------|------------------|----------|
| `scripts/check-mdp-contract.ts` | **RED** | Golden fixture roundtrips, URL grammar, QR guard |
| `scripts/check-widget-branding.ts` | **GREEN** | Bundled Inconsolata, no Google Fonts CDN, lowercase label |

---

## Commit hygiene

**Never commit:** `.scratch/`, `*.debug.log`, ADB screenshots, temp probe scripts.

**Do commit:** checkers, `fixtures/mdp/**`, permanent docs (`INTEGRATOR.md`, this file).

---

## Agent briefing (paste into subagent prompts)

```
Lane: Codec — save-in-meos mdp.
Read: docs/AGENT-WORKSTREAMS.md, LIP-0028 (when drafted).
Wave -1: check-mdp-contract is RED — implement src/import-intent-v1.ts to GREEN.
User-facing: lowercase meos; Inconsolata B/W; no fonts.googleapis.com.
Do NOT: duplicate codec in meos-app or meos-core-logic.
DoD: npm run check:mdp GREEN + npm test.
```
