#!/usr/bin/env tsx
/**
 * WHY: CDN / script-tag consumers need a single browser bundle + optional CSS copy.
 * WHAT: esbuild IIFE → dist/widget.iife.js (+ min alias + widget.iife.css).
 * HOW: Bundles iife-entry; widget styles are inlined in shadow DOM at runtime.
 * WHERE: npm run build:widget — also runs in prepublishOnly and release CI.
 * GUARDED: check-ci-workflows.ts expects this script and output paths.
 */
import esbuild from "esbuild"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const DIST = path.join(ROOT, "dist")

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
  version: string
}

fs.mkdirSync(DIST, { recursive: true })

const outfile = path.join(DIST, "widget.iife.js")

await esbuild.build({
  entryPoints: [path.join(ROOT, "src/widget/iife-entry.ts")],
  bundle: true,
  format: "iife",
  globalName: "MeosSave",
  outfile,
  platform: "browser",
  minify: true,
  sourcemap: true,
  define: {
    __MEOS_SAVE_VERSION__: JSON.stringify(pkg.version),
  },
  logLevel: "info",
})

// Documented alias for integrators who expect a *.min.js name.
const minAlias = path.join(DIST, "save-in-meos.min.js")
fs.copyFileSync(outfile, minAlias)

// Optional external stylesheet for hosts composing chip markup themselves.
fs.copyFileSync(
  path.join(ROOT, "src/widget/widget.css"),
  path.join(DIST, "widget.iife.css"),
)

const bytes = fs.statSync(outfile).size
console.log(`build:widget OK — widget.iife.js (${bytes} bytes), save-in-meos.min.js alias, widget.iife.css`)
