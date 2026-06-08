#!/usr/bin/env tsx
/**
 * WHY: Drift between package.json and CDN pins causes broken demos and README images.
 * WHAT: Fails if any consumer file pins a different @meoslabs/save-in-meos@semver.
 * GUARDED: Run in pre-commit; fix with npm run version:sync.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
) as { version: string }

const expected = pkg.version
const violations: string[] = []

const PIN_FILES = [
  "README.md",
  "docs/INTEGRATOR.md",
  "examples/cdn-demo.html",
] as const

const PIN_RE = /@meoslabs\/save-in-meos@(\d+\.\d+\.\d+)/g

for (const rel of PIN_FILES) {
  const content = fs.readFileSync(path.join(ROOT, rel), "utf8")
  for (const match of content.matchAll(PIN_RE)) {
    const found = match[1]
    if (found !== expected) {
      violations.push(`${rel}: pins @${found}, expected @${expected}`)
    }
  }
}

const demo = fs.readFileSync(path.join(ROOT, "examples/demo.html"), "utf8")
const demoMatch = demo.match(/var VERSION = "(\d+\.\d+\.\d+)"/)
if (!demoMatch) {
  violations.push("examples/demo.html: missing var VERSION")
} else if (demoMatch[1] !== expected) {
  violations.push(
    `examples/demo.html: VERSION=${demoMatch[1]}, expected ${expected}`,
  )
}

if (violations.length > 0) {
  console.error("check-version-pins: FAIL")
  for (const v of violations) console.error(`  ✗ ${v}`)
  console.error("  → run: npm run version:sync")
  process.exit(1)
}

console.log(`check-version-pins: PASS (v${expected})`)
