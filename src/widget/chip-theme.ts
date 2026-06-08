/**
 * WHY: Theme + bounded shape tokens must be applied consistently (shadow + document mounts).
 * WHAT: Types, clamps, and host attribute/CSS-var application for the save chip.
 * HOW: data-meos-theme on host/button; integrator vars inherit into closed shadow.
 * GUARDED: Font + logo are not exposed — only size/shape tokens are clamped here.
 */

/** Logo is taller than wide — iconSize controls height; width follows SSOT aspect. */
export const MEOS_SAVE_ICON_ASPECT = 27.275015 / 30.362297

/** Follow OS preference, or pin light/dark regardless of prefers-color-scheme. */
export type SaveChipTheme = "auto" | "light" | "dark"

/** Named chip presets — `default` (full label) or `compact` (logo + save). */
export type SaveChipPreset = "default" | "compact"

/**
 * Bounded shape/size tweaks. Font family and logo artwork stay fixed.
 * Prefer `chipPreset` or CSS custom properties on the mount host.
 */
export interface SaveChipCustomisation {
  /** Chip height in px (28–40). Default 31. */
  height?: number
  /** Horizontal padding in px (8–16). Default 10. */
  paddingX?: number
  /** Border radius in px (0–12). Default 2. */
  radius?: number
  /** Logo mark height in px (11–16). Width follows brand aspect ratio. Default 16. */
  iconSize?: number
}

/** Canonical chip presets (integrator-facing — see README / INTEGRATOR.md). */
export const SAVE_CHIP_PRESETS: Readonly<
  Record<SaveChipPreset, Readonly<SaveChipCustomisation>>
> = {
  /** Share-row default — meos logo + save in meos. */
  default: { height: 31, paddingX: 10, radius: 2, iconSize: 16 },
  /** Dense toolbar — meos logo + save (short label). */
  compact: { height: 28, paddingX: 8, radius: 2, iconSize: 16 },
} as const

/** Documented host CSS vars integrators may set before initSaveButton. */
export const SAVE_CHIP_HOST_VARS = [
  "--meos-save-chip-height",
  "--meos-save-chip-padding-x",
  "--meos-save-chip-radius",
  "--meos-save-icon-size",
  "--meos-save-chip-gap",
] as const

const HEIGHT = { min: 28, max: 40, default: 31 } as const
const PADDING_X = { min: 8, max: 16, default: 10 } as const
const RADIUS = { min: 0, max: 12, default: 2 } as const
const ICON = { min: 11, max: 16, default: 16 } as const

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Visible chip copy for a preset (compact uses short label). */
export function resolveChipLabel(preset?: SaveChipPreset): "save in meos" | "save" {
  return preset === "compact" ? "save" : "save in meos"
}

/** Merge preset + explicit chip overrides (explicit wins). */
export function resolveChipCustomisation(
  chip?: SaveChipCustomisation,
  preset?: SaveChipPreset,
): SaveChipCustomisation | undefined {
  const base = preset ? { ...SAVE_CHIP_PRESETS[preset] } : {}
  const merged = { ...base, ...chip }
  return Object.keys(merged).length > 0 ? merged : undefined
}

/** Pure resolver for chip option object → CSS custom property values (px strings). */
export function resolveChipCustomisationVars(
  chip?: SaveChipCustomisation,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (chip?.height !== undefined) {
    out["--meos-save-chip-height"] = `${clamp(chip.height, HEIGHT.min, HEIGHT.max)}px`
  }
  if (chip?.paddingX !== undefined) {
    out["--meos-save-chip-padding-x"] = `${clamp(chip.paddingX, PADDING_X.min, PADDING_X.max)}px`
  }
  if (chip?.radius !== undefined) {
    out["--meos-save-chip-radius"] = `${clamp(chip.radius, RADIUS.min, RADIUS.max)}px`
  }
  if (chip?.iconSize !== undefined) {
    out["--meos-save-icon-size"] = `${clamp(chip.iconSize, ICON.min, ICON.max)}px`
  }
  return out
}

/** Apply theme + optional chip object to a mount host or chip button. */
export function applyChipPresentation(
  el: HTMLElement,
  theme: SaveChipTheme = "auto",
  chip?: SaveChipCustomisation,
  preset?: SaveChipPreset,
): void {
  el.setAttribute("data-meos-theme", theme)

  const resolved = resolveChipCustomisation(chip, preset)
  const vars = resolveChipCustomisationVars(resolved)
  for (const [name, value] of Object.entries(vars)) {
    el.style.setProperty(name, value)
  }
}
