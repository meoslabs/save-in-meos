/**
 * WHY: Theme + bounded shape tokens must be applied consistently (shadow + document mounts).
 * WHAT: Types, clamps, and host attribute/CSS-var application for the save chip.
 * HOW: data-meos-theme on host/button; integrator vars inherit into closed shadow.
 * GUARDED: Font + logo are not exposed — only size/shape tokens are clamped here.
 */
/** Logo is taller than wide — iconSize controls height; width follows SSOT aspect. */
export declare const MEOS_SAVE_ICON_ASPECT: number;
/** Follow OS preference, or pin light/dark regardless of prefers-color-scheme. */
export type SaveChipTheme = "auto" | "light" | "dark";
/** Named chip presets — `default` (full label) or `compact` (logo + save). */
export type SaveChipPreset = "default" | "compact";
/**
 * Bounded shape/size tweaks. Font family and logo artwork stay fixed.
 * Prefer `chipPreset` or CSS custom properties on the mount host.
 */
export interface SaveChipCustomisation {
    /** Chip height in px (28–40). Default 31. */
    height?: number;
    /** Horizontal padding in px (8–16). Default 10. */
    paddingX?: number;
    /** Border radius in px (0–12). Default 2. */
    radius?: number;
    /** Logo mark height in px (11–16). Width follows brand aspect ratio. Default 16. */
    iconSize?: number;
}
/** Canonical chip presets (integrator-facing — see README / INTEGRATOR.md). */
export declare const SAVE_CHIP_PRESETS: Readonly<Record<SaveChipPreset, Readonly<SaveChipCustomisation>>>;
/** Documented host CSS vars integrators may set before initSaveButton. */
export declare const SAVE_CHIP_HOST_VARS: readonly ["--meos-save-chip-height", "--meos-save-chip-padding-x", "--meos-save-chip-radius", "--meos-save-icon-size", "--meos-save-chip-gap"];
/** Visible chip copy for a preset (compact uses short label). */
export declare function resolveChipLabel(preset?: SaveChipPreset): "save in meos" | "save";
/** Merge preset + explicit chip overrides (explicit wins). */
export declare function resolveChipCustomisation(chip?: SaveChipCustomisation, preset?: SaveChipPreset): SaveChipCustomisation | undefined;
/** Pure resolver for chip option object → CSS custom property values (px strings). */
export declare function resolveChipCustomisationVars(chip?: SaveChipCustomisation): Record<string, string>;
/** Apply theme + optional chip object to a mount host or chip button. */
export declare function applyChipPresentation(el: HTMLElement, theme?: SaveChipTheme, chip?: SaveChipCustomisation, preset?: SaveChipPreset): void;
//# sourceMappingURL=chip-theme.d.ts.map