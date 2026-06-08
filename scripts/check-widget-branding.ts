#!/usr/bin/env tsx
/**
 * WHY: Widget must match meos-app monochrome B/W + bundled Inconsolata (no CDN).
 * WHAT: Verifies font assets, chip CSS, fixed label, no integrator style hooks.
 * HOW: File presence + content scan of src/, examples/, package exports.
 * WHERE: save-in-meos/scripts/check-widget-branding.ts
 * WHEN: Pre-commit (BLOCKING); should PASS on Wave -1 bootstrap (fonts ship in repo).
 * GUARDED: OFL.txt + woff2 paths pinned; CDN strings are hard failures.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")

const violations: string[] = []

const FONT_DIR = "assets/fonts/inconsolata"
const REQUIRED_FONT_FILES = [
  `${FONT_DIR}/Inconsolata-Regular.woff2`,
  `${FONT_DIR}/Inconsolata-Medium.woff2`,
  `${FONT_DIR}/OFL.txt`,
] as const

const SCAN_DIRS = ["src", "examples"] as const
const CDN_PATTERNS = [/fonts\.googleapis\.com/i, /fonts\.gstatic\.com/i] as const

const DEFAULT_LABEL = "save to meos"

const REQUIRED_CHIP_CLASSES = [
  ".meos-save-chip",
  ".meos-save-chip__icon",
  ".meos-save-chip__label",
] as const

const REQUIRED_DIMENSION_TOKENS = [
  "min-height: 30px",
  "max-height: 32px",
  "height: 31px",
  "font-size: 11px",
  "display: inline-flex",
  "pointer-events: auto",
  "meos-save-chip--spin",
  "prefers-reduced-motion: reduce",
] as const

const FORBIDDEN_STYLE_HOOKS = [
  /--meos-save-fg/,
  /--meos-save-border/,
  /--meos-save-hover/,
  /label\?:/,
  /className\?:/,
  /style\?:/,
  /theme\?:/,
] as const

function fail(message: string): void {
  violations.push(message)
}

function read(rel: string): string | null {
  const abs = path.join(ROOT, rel)
  if (!fs.existsSync(abs)) return null
  return fs.readFileSync(abs, "utf8")
}

function walkFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir)
  if (!fs.existsSync(abs)) return []

  const out: string[] = []
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkFiles(rel))
    } else if (/\.(ts|tsx|js|jsx|css|html|md)$/.test(entry.name)) {
      out.push(rel)
    }
  }
  return out
}

function assertCssRules(rel: string, content: string): void {
  for (const selector of REQUIRED_CHIP_CLASSES) {
    if (!content.includes(selector)) {
      fail(`${rel}: missing required selector ${selector}`)
    }
  }
  for (const token of REQUIRED_DIMENSION_TOKENS) {
    if (!content.includes(token)) {
      fail(`${rel}: missing required dimension rule "${token}"`)
    }
  }
  for (const pattern of FORBIDDEN_STYLE_HOOKS) {
    if (pattern.test(content)) {
      fail(`${rel}: forbidden integrator style hook matching ${pattern}`)
    }
  }
}

// ── Font assets ─────────────────────────────────────────────────────────────
for (const rel of REQUIRED_FONT_FILES) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    fail(`Missing required font asset: ${rel}`)
  }
}

const ofl = read(`${FONT_DIR}/OFL.txt`)
if (ofl && !/SIL Open Font License/i.test(ofl)) {
  fail(`${FONT_DIR}/OFL.txt does not appear to be OFL-1.1`)
}

// ── @font-face in shipped CSS ─────────────────────────────────────────────────
const fontsCss = read("src/widget/fonts.css")
if (!fontsCss) {
  fail("Missing src/widget/fonts.css")
} else {
  if (!/@font-face/.test(fontsCss)) {
    fail("src/widget/fonts.css: missing @font-face")
  }
  if (!/font-family:\s*["']?Inconsolata["']?/i.test(fontsCss)) {
    fail("src/widget/fonts.css: missing Inconsolata font-family")
  }
  if (!/font-weight:\s*400/.test(fontsCss)) {
    fail("src/widget/fonts.css: missing weight 400")
  }
  if (!/font-weight:\s*500/.test(fontsCss)) {
    fail("src/widget/fonts.css: missing weight 500")
  }
  if (!/Inconsolata-Regular\.woff2/.test(fontsCss)) {
    fail("src/widget/fonts.css: must reference bundled Inconsolata-Regular.woff2")
  }
  if (!/Inconsolata-Medium\.woff2/.test(fontsCss)) {
    fail("src/widget/fonts.css: must reference bundled Inconsolata-Medium.woff2")
  }
}

// ── Widget chip CSS (import + injection mirror) ───────────────────────────────
const widgetCss = read("src/widget/widget.css")
if (!widgetCss) {
  fail("Missing src/widget/widget.css")
} else {
  assertCssRules("src/widget/widget.css", widgetCss)
  if (!/text-transform:\s*lowercase/.test(widgetCss)) {
    fail("src/widget/widget.css: label must render lowercase")
  }
}

const stylesTs = read("src/widget/styles.ts")
if (!stylesTs) {
  fail("Missing src/widget/styles.ts")
} else {
  assertCssRules("src/widget/styles.ts", stylesTs)
  if (!stylesTs.includes("MEOS_SAVE_WIDGET_CSS")) {
    fail("src/widget/styles.ts: must export MEOS_SAVE_WIDGET_CSS for injection")
  }
}

// ── Widget API — fixed label, no style overrides ──────────────────────────────
const widgetIndex = read("src/widget/index.ts")
if (!widgetIndex) {
  fail("Missing src/widget/index.ts")
} else {
  if (!widgetIndex.includes(`MEOS_SAVE_LABEL = "${DEFAULT_LABEL}"`)) {
    fail(`src/widget/index.ts: MEOS_SAVE_LABEL must be exactly "${DEFAULT_LABEL}"`)
  }
  if (!widgetIndex.includes("attachShadow")) {
    fail("src/widget/index.ts: empty mounts must use closed shadow DOM")
  }
  if (!widgetIndex.includes("meos-save-chip")) {
    fail("src/widget/index.ts: must use fixed class meos-save-chip")
  }
  for (const pattern of FORBIDDEN_STYLE_HOOKS) {
    if (pattern.test(widgetIndex)) {
      fail(`src/widget/index.ts: forbidden public API hook matching ${pattern}`)
    }
  }
  const optionsIface = widgetIndex.match(
    /interface SaveButtonOptions[\s\S]*?\}/,
  )?.[0]
  if (optionsIface && /\blabel\??\s*:/.test(optionsIface)) {
    fail("src/widget/index.ts: SaveButtonOptions must not expose label override")
  }
  if (!/\bspin\??\s*:\s*boolean/.test(widgetIndex)) {
    fail("src/widget/index.ts: SaveButtonOptions must expose optional spin toggle")
  }
  if (!widgetIndex.includes("meos-save-chip--spin")) {
    fail("src/widget/index.ts: must apply meos-save-chip--spin when spin is enabled")
  }
}

// ── package.json exports ──────────────────────────────────────────────────────
const pkg = read("package.json")
if (!pkg) {
  fail("Missing package.json")
} else {
  if (!pkg.includes('"./fonts.css"')) {
    fail('package.json exports must include "./fonts.css"')
  }
  if (!pkg.includes('"./widget.css"')) {
    fail('package.json exports must include "./widget.css"')
  }
}

// ── No Google Fonts CDN ─────────────────────────────────────────────────────
for (const dir of SCAN_DIRS) {
  for (const rel of walkFiles(dir)) {
    const content = read(rel)
    if (!content) continue
    for (const pattern of CDN_PATTERNS) {
      if (pattern.test(content)) {
        fail(`${rel}: forbidden CDN reference matching ${pattern}`)
      }
    }
  }
}

// ── Default label lowercase ───────────────────────────────────────────────────
const demoHtml = read("examples/demo.html")
if (!demoHtml) {
  fail("Missing examples/demo.html")
} else {
  if (!demoHtml.includes(DEFAULT_LABEL)) {
    fail(`examples/demo.html: must use default label "${DEFAULT_LABEL}"`)
  }
  if (
    !demoHtml.includes("meos-save-chip") &&
    !demoHtml.includes("initSaveButton")
  ) {
    fail(
      "examples/demo.html: must use meos-save-chip or initSaveButton shadow mount",
    )
  }
  if (/\bMEOS\b/.test(demoHtml)) {
    fail('examples/demo.html: user-facing copy must be lowercase "meos", not "MEOS"')
  }
  if (/Save to [Mm]eos/.test(demoHtml) && !demoHtml.includes(DEFAULT_LABEL)) {
    fail(`examples/demo.html: use "${DEFAULT_LABEL}" not title-case variant`)
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (violations.length > 0) {
  console.error("check-widget-branding: FAIL")
  for (const v of violations) {
    console.error(`  ✗ ${v}`)
  }
  process.exit(1)
}

console.log("check-widget-branding: PASS")
console.log(`fonts: ${REQUIRED_FONT_FILES.length} assets verified`)
console.log(`chip classes: ${REQUIRED_CHIP_CLASSES.length} selectors`)
console.log(`default label: "${DEFAULT_LABEL}"`)
