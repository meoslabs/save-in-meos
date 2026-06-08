#!/usr/bin/env tsx
/**
 * WHY: GitHub Release tags must match package.json semver or npm gets wrong versions.
 * WHAT: Compares GITHUB_REF tag (vX.Y.Z) to package.json version.
 * WHEN: release.yml on `release` events only.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const ref = process.env.GITHUB_REF ?? ""
const tag = ref.replace(/^refs\/tags\//, "")
const expected = tag.startsWith("v") ? tag.slice(1) : tag

if (!expected || !/^\d+\.\d+\.\d+/.test(expected)) {
  console.error(`check-release-version: invalid or missing release tag (GITHUB_REF=${ref})`)
  process.exit(1)
}

const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
) as { version: string }

if (pkg.version !== expected) {
  console.error(
    `check-release-version: FAIL — package.json is ${pkg.version} but release tag is v${expected}`,
  )
  console.error("Bump package.json to match the GitHub Release tag before publishing.")
  process.exit(1)
}

console.log(`check-release-version: PASS (v${pkg.version})`)
