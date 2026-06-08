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
import { runInNewContext } from "node:vm"
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

// Local demo: `npx serve examples` only exposes examples/ — parent ../dist 404s.
// Stage a self-contained vendor/ tree so ?local=1 works without serving repo root.
const VENDOR = path.join(ROOT, "examples", "vendor")
const VENDOR_FONTS = path.join(VENDOR, "fonts", "inconsolata")
fs.mkdirSync(VENDOR_FONTS, { recursive: true })

fs.copyFileSync(outfile, path.join(VENDOR, "widget.iife.js"))
fs.copyFileSync(minAlias, path.join(VENDOR, "save-in-meos.min.js"))
fs.copyFileSync(
  path.join(DIST, "widget.iife.css"),
  path.join(VENDOR, "widget.iife.css"),
)

const fontsSrc = path.join(ROOT, "src/widget/fonts.css")
const fontsCss = fs
  .readFileSync(fontsSrc, "utf8")
  .replaceAll("../../assets/fonts/inconsolata/", "./fonts/inconsolata/")
fs.writeFileSync(path.join(VENDOR, "fonts.css"), fontsCss)

for (const face of ["Inconsolata-Regular.woff2", "Inconsolata-Medium.woff2"]) {
  fs.copyFileSync(
    path.join(ROOT, "assets/fonts/inconsolata", face),
    path.join(VENDOR_FONTS, face),
  )
}

const bytes = fs.statSync(outfile).size

// Guard: default export on iife-entry wraps global as MeosSave.default (breaks script-tag demo).
function assertIifeGlobalFlat(): void {
  const code = fs.readFileSync(outfile, "utf8")
  const ctx: { MeosSave?: { initSaveButton?: unknown; default?: unknown } } = {
    window: undefined,
    document: undefined,
    location: { href: "https://example.com/article" },
  } as unknown as { MeosSave?: { initSaveButton?: unknown; default?: unknown } }
  runInNewContext(code, ctx)
  if (typeof ctx.MeosSave?.initSaveButton !== "function") {
    throw new Error(
      "widget.iife.js: MeosSave.initSaveButton missing on global — use named exports in iife-entry.ts, not export default",
    )
  }
  if (ctx.MeosSave?.default !== undefined) {
    throw new Error(
      "widget.iife.js: MeosSave.default present — export default breaks script-tag consumers",
    )
  }
}

assertIifeGlobalFlat()

console.log(
  `build:widget OK — widget.iife.js (${bytes} bytes), save-in-meos.min.js alias, widget.iife.css, examples/vendor/`,
)
