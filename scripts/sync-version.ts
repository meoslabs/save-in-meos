#!/usr/bin/env tsx
/**
 * WHY: CDN URLs, demos, and docs must pin the same semver as package.json.
 * WHAT: Rewrites @meoslabs/save-in-meos@X.Y.Z pins and demo VERSION constants.
 * HOW: Run after `npm version patch|minor|major` — then commit + rebuild widget.
 * WHERE: npm run version:sync
 * GUARDED: check-version-pins.ts fails pre-commit if pins drift.
 */
import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
) as { version: string }

const version = pkg.version
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`sync-version: invalid package.json version "${version}"`)
  process.exit(1)
}

const PIN_FILES = [
  "README.md",
  "docs/INTEGRATOR.md",
  "examples/cdn-demo.html",
] as const

const PIN_RE = /@meoslabs\/save-in-meos@\d+\.\d+\.\d+/g

function syncPins(rel: string): boolean {
  const abs = path.join(ROOT, rel)
  const before = fs.readFileSync(abs, "utf8")
  const after = before.replaceAll(PIN_RE, `@meoslabs/save-in-meos@${version}`)
  if (after !== before) {
    fs.writeFileSync(abs, after, "utf8")
    console.log(`sync-version: updated pins in ${rel}`)
    return true
  }
  return false
}

function syncDemoVersion(): boolean {
  const rel = "examples/demo.html"
  const abs = path.join(ROOT, rel)
  const before = fs.readFileSync(abs, "utf8")
  const after = before.replace(
    /var VERSION = "\d+\.\d+\.\d+"/,
    `var VERSION = "${version}"`,
  )
  if (after !== before) {
    fs.writeFileSync(abs, after, "utf8")
    console.log(`sync-version: updated VERSION in ${rel}`)
    return true
  }
  return false
}

function syncLockfileRoot(): boolean {
  const lockPath = path.join(ROOT, "package-lock.json")
  if (!fs.existsSync(lockPath)) return false
  const lock = JSON.parse(fs.readFileSync(lockPath, "utf8")) as {
    version?: string
    packages?: Record<string, { version?: string }>
  }
  let changed = false
  if (lock.version !== version) {
    lock.version = version
    changed = true
  }
  const rootKey = ""
  if (lock.packages?.[rootKey]?.version !== version) {
    lock.packages ??= {}
    lock.packages[rootKey] ??= {}
    lock.packages[rootKey].version = version
    changed = true
  }
  if (changed) {
    fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, "utf8")
    console.log("sync-version: updated package-lock.json root version")
  }
  return changed
}

let changed = false
for (const rel of PIN_FILES) changed = syncPins(rel) || changed
changed = syncDemoVersion() || changed
changed = syncLockfileRoot() || changed

console.log(`sync-version: package.json is v${version}`)

if (process.argv.includes("--build")) {
  const build = spawnSync("npm", ["run", "build:widget"], {
    cwd: ROOT,
    stdio: "inherit",
  })
  if (build.status !== 0) process.exit(build.status ?? 1)
}

if (!changed && !process.argv.includes("--build")) {
  console.log("sync-version: all pins already match")
}
