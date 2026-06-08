#!/usr/bin/env tsx
/**
 * WHY: Public repo must not ship agent playbooks, workspace paths, or secrets.
 * WHAT: Scan tracked docs/examples for forbidden internal patterns.
 * HOW: Walk src/, docs/, examples/, README, CONTRIBUTING — skip node_modules/dist.
 * GUARDED: Extend FORBIDDEN when new leak classes appear; run before npm publish.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const SCAN_ROOTS = ["src", "docs", "examples", "scripts", "fixtures"]
const SCAN_FILES = ["README.md", "CONTRIBUTING.md", "package.json", "LICENSE"]

/** Patterns that must not appear in public-facing committed files. */
const FORBIDDEN: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /agent-workspace/i, label: "internal workspace path" },
  { pattern: /\/home\/[^\s]+/i, label: "absolute home path" },
  { pattern: /\.cursor\//i, label: "Cursor internal directory" },
  { pattern: /feat\/save-in-meos/i, label: "internal feature branch name" },
  { pattern: /wave\s*-?\s*1/i, label: "internal wave language" },
  { pattern: /AGENT-WORKSTREAMS/i, label: "agent workstream doc reference" },
  { pattern: /PostHog|phc_[a-zA-Z0-9]+/i, label: "analytics key or vendor internals" },
  { pattern: /R2_(ACCESS|SECRET)|CLOUDFLARE_ACCOUNT/i, label: "cloud credential env var" },
  { pattern: /sk-[a-zA-Z0-9]{20,}/, label: "API key shape" },
  { pattern: /ANDROID_APP_LINK_SHA256/i, label: "internal Play Console ops" },
]

const violations: string[] = []

function shouldScanFile(filePath: string): boolean {
  const base = path.basename(filePath)
  if (base === "check-public-scrub.ts") return false
  if (filePath.includes(`${path.sep}node_modules${path.sep}`)) return false
  if (filePath.includes(`${path.sep}dist${path.sep}`)) return false
  const ext = path.extname(filePath)
  return [".md", ".html", ".ts", ".css", ".json"].includes(ext)
}

function scanFile(absPath: string): void {
  if (!shouldScanFile(absPath)) return
  const rel = path.relative(ROOT, absPath)
  const text = fs.readFileSync(absPath, "utf8")
  const lines = text.split("\n")
  for (const { pattern, label } of FORBIDDEN) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i]!)) {
        violations.push(`${rel}:${i + 1} — ${label}: ${lines[i]!.trim().slice(0, 80)}`)
      }
    }
  }
}

function walk(dir: string): void {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue
      walk(abs)
    } else {
      scanFile(abs)
    }
  }
}

for (const rel of SCAN_ROOTS) walk(path.join(ROOT, rel))
for (const rel of SCAN_FILES) {
  const abs = path.join(ROOT, rel)
  if (fs.existsSync(abs)) scanFile(abs)
}

if (violations.length > 0) {
  console.error("check-public-scrub: FAIL")
  for (const v of violations) console.error(`  ✗ ${v}`)
  process.exit(1)
}

console.log("check-public-scrub: PASS")
