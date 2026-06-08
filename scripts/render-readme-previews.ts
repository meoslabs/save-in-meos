#!/usr/bin/env tsx
/**
 * WHY: GitHub README cannot execute widget JS — static SVGs match live chip branding.
 * WHAT: Renders chip preset × theme previews into assets/preview/ (SSOT: icon + chip-theme).
 * HOW: Pure SVG from buildSaveIconSvg + preset dimensions; regenerated on build:widget.
 * WHERE: npm run build:readme-previews
 * GUARDED: check-widget-branding verifies preview files exist when README references them.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  MEOS_SAVE_ICON_ASPECT,
  SAVE_CHIP_PRESETS,
  resolveChipLabel,
  type SaveChipPreset,
} from "../src/widget/chip-theme.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const OUT_DIR = path.join(ROOT, "assets", "preview")

const LOGO_PATH =
  "m 392.92917,553.87771 v 12.58642 c 0,0.81325 -0.43385,1.5653 -1.13856,1.97265 l -7.84461,4.52907 c -2.06849,1.19415 -4.65283,-0.29916 -4.65415,-2.68721 v -0.66167 c 0,-7.00219 -5.8219,-10.18416 -9.06937,-11.41442 -1.02593,-0.38945 -2.12418,0.3626 -2.12418,1.45958 v 0.004 c 0.0556,4.33298 2.37151,8.34226 6.13053,10.54974 l 4.52634,2.65794 c 0.31136,0.18203 0.5074,0.51155 0.52136,0.87166 0,0.01 0,0.0195 0.001,0.0342 0.0342,0.82852 -0.86468,1.36652 -1.5834,0.95219 l -10.90009,-6.29314 c -0.70476,-0.4075 -1.13988,-1.1594 -1.13988,-1.97265 v -9.05809 c 0.001,-2.3883 2.58565,-3.87985 4.65415,-2.68717 l 0.58529,0.33772 c 6.05961,3.4906 11.72027,0.0439 14.4088,-2.15337 0.38945,-0.31819 0.57831,-0.76732 0.57831,-1.21498 0,-0.53244 -0.26695,-1.05931 -0.78401,-1.35676 -3.78117,-2.11857 -8.41039,-2.11721 -12.20269,0.0342 l -4.56528,2.59117 c -0.31282,0.17813 -0.69509,0.18203 -1.0148,0.0146 -0.01,-0.005 -0.0195,-0.01 -0.0293,-0.0146 -0.73399,-0.38652 -0.752,-1.43177 -0.0342,-1.84747 l 10.90019,-6.29319 c 0.70476,-0.4075 1.57359,-0.4075 2.27845,0 l 7.84461,4.52907 c 2.06713,1.19415 2.06713,4.17877 0,5.37429 l -0.57411,0.33088 c -0.01,0.005 -0.0244,0.0146 -0.0342,0.0195 -6.03043,3.50597 -5.87334,10.12028 -5.31733,13.54285 0.12933,0.79656 0.81608,1.31928 1.54865,1.31928 0.26109,0 0.52966,-0.0669 0.78128,-0.21278 3.72559,-2.21456 6.03883,-6.2251 6.07079,-10.58459 l 0.0391,-5.2492 c 0.003,-0.36016 0.19033,-0.69373 0.49489,-0.88694 0.01,-0.005 0.0195,-0.01 0.0244,-0.0146 0.70178,-0.44215 1.61654,0.0654 1.61654,0.89529 z"
const LOGO_TRANSFORM = "translate(-365.65417,-544.51253)"

type PreviewTheme = "light" | "dark"

const THEME: Record<
  PreviewTheme,
  { fg: string; border: string; canvas: string }
> = {
  light: { fg: "#000000", border: "rgba(0,0,0,0.24)", canvas: "#ffffff" },
  dark: { fg: "#ffffff", border: "rgba(255,255,255,0.3)", canvas: "#151515" },
}

const FONT =
  "Inconsolata, ui-monospace, Cascadia Mono, Segoe UI Mono, monospace"
const GAP = 5
const FONT_SIZE = 11
const CANVAS_PAD = 12

function estimateLabelWidth(label: string): number {
  return Math.ceil(label.length * (FONT_SIZE * 0.56))
}

function renderChipSvg(preset: SaveChipPreset, theme: PreviewTheme): string {
  const chip = SAVE_CHIP_PRESETS[preset]
  const label = resolveChipLabel(preset)
  const colours = THEME[theme]
  const height = chip.height ?? 31
  const paddingX = chip.paddingX ?? 10
  const radius = chip.radius ?? 2
  const iconH = chip.iconSize ?? 16
  const iconW = iconH * MEOS_SAVE_ICON_ASPECT
  const labelW = estimateLabelWidth(label)
  const chipW = paddingX + iconW + GAP + labelW + paddingX
  const canvasW = Math.ceil(chipW + CANVAS_PAD * 2)
  const canvasH = height + CANVAS_PAD * 2
  const chipX = CANVAS_PAD
  const chipY = CANVAS_PAD
  const iconX = chipX + paddingX
  const iconY = chipY + (height - iconH) / 2
  const textX = iconX + iconW + GAP
  const textY = chipY + height / 2 + FONT_SIZE * 0.36

  const iconScale = iconH / 30.362297

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}" role="img" aria-label="${label} — ${preset} chip (${theme})">
  <title>${label} — meos save chip</title>
  <rect width="100%" height="100%" fill="${colours.canvas}"/>
  <rect x="${chipX}" y="${chipY}" width="${chipW}" height="${height}" rx="${radius}" fill="transparent" stroke="${colours.border}" stroke-width="1"/>
  <g transform="translate(${iconX}, ${iconY}) scale(${iconScale})" fill="${colours.fg}">
    <g transform="${LOGO_TRANSFORM}"><path d="${LOGO_PATH}"/></g>
  </g>
  <text x="${textX}" y="${textY}" fill="${colours.fg}" font-family="${FONT}" font-size="${FONT_SIZE}" font-weight="500" letter-spacing="0.02em">${label}</text>
</svg>
`
}

function writePreview(name: string, svg: string): void {
  const file = path.join(OUT_DIR, name)
  fs.writeFileSync(file, svg, "utf8")
  console.log(`render-readme-previews: ${path.relative(ROOT, file)}`)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

for (const preset of ["default", "compact"] as const) {
  for (const theme of ["light", "dark"] as const) {
    writePreview(
      `chip-${preset}-${theme}.svg`,
      renderChipSvg(preset, theme),
    )
  }
}

console.log("render-readme-previews: OK")
