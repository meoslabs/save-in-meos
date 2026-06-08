#!/usr/bin/env tsx
/**
 * WHY: Release and CI workflows must exist before we rely on them for npm + CDN.
 * WHAT: Validates required GitHub Actions workflow files and key job steps.
 * HOW: Parse workflow YAML for required script names (no external YAML dep).
 * WHERE: npm run check:ci — optional ratchet alongside check:mdp.
 * GUARDED: Extend REQUIRED when release pipeline grows.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const WORKFLOWS = path.join(ROOT, ".github", "workflows")

const violations: string[] = []

function requireFile(rel: string): string {
  const abs = path.join(WORKFLOWS, rel)
  if (!fs.existsSync(abs)) {
    violations.push(`missing workflow file: .github/workflows/${rel}`)
    return ""
  }
  return fs.readFileSync(abs, "utf8")
}

function requireContains(content: string, needle: string, label: string): void {
  if (!content.includes(needle)) {
    violations.push(`${label}: expected to contain ${needle}`)
  }
}

function requireAbsent(content: string, needle: string, label: string): void {
  if (content.includes(needle)) {
    violations.push(`${label}: must not contain ${needle} (use OIDC trusted publishing)`)
  }
}

const ci = requireFile("ci.yml")
if (ci) {
  requireContains(ci, "npm ci", "ci.yml")
  requireContains(ci, "check:mdp", "ci.yml")
  requireContains(ci, "check:public-scrub", "ci.yml")
  requireContains(ci, "npm test", "ci.yml")
}

const release = requireFile("release.yml")
if (release) {
  requireContains(release, "build:widget", "release.yml")
  requireContains(release, "npm publish", "release.yml")
  requireContains(release, "id-token: write", "release.yml")
  requireContains(release, "registry-url:", "release.yml")
  requireContains(release, "--provenance", "release.yml")
  requireContains(release, "--access public", "release.yml")
  requireAbsent(release, "NODE_AUTH_TOKEN", "release.yml")
  requireAbsent(release, "NPM_TOKEN", "release.yml")
}

if (violations.length > 0) {
  console.error("check-ci-workflows: FAIL")
  for (const v of violations) console.error(`  ✗ ${v}`)
  process.exit(1)
}

console.log("check-ci-workflows: PASS")
