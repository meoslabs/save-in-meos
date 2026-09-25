/**
 * WHY: Embeddable save-in-meos widget — builds MDP import URLs on user gesture.
 * WHAT: initSaveButton mounts a branded chip (shadow DOM or fixed classes) + navigates.
 * WHERE: Bundled as dist/widget.iife.js for script-tag consumers.
 * GUARDED: No label/style overrides — branding enforced by implementation + checker.
 */
import { type ImportIntentInput } from "../import-intent-v1.js";
import { type SaveChipCustomisation, type SaveChipPreset, type SaveChipTheme } from "./chip-theme.js";
export interface SaveButtonOptions extends ImportIntentInput {
    widgetId?: string;
    /**
     * `auto` follows OS dark mode; `light` / `dark` pin the chip palette.
     * Does not change font or logo — only foreground, border, and hover colours.
     */
    theme?: SaveChipTheme;
    /**
     * `default` — logo + save in meos. `compact` — logo + save (short label).
     * Explicit `chip` fields override preset dimensions.
     */
    chipPreset?: SaveChipPreset;
    /**
     * Bounded shape/size tweaks (height, padding, radius, icon box).
     * Font and logo artwork are not customisable — use CSS host vars instead:
     * `--meos-save-chip-height`, `--meos-save-chip-padding-x`, `--meos-save-chip-radius`,
     * `--meos-save-icon-size`.
     */
    chip?: SaveChipCustomisation;
}
/** Fixed user-facing copy — not customisable (meos brand). */
export type { SaveChipCustomisation, SaveChipPreset, SaveChipTheme, } from "./chip-theme.js";
export { SAVE_CHIP_HOST_VARS, SAVE_CHIP_PRESETS, resolveChipLabel, applyChipPresentation, } from "./chip-theme.js";
export declare const MEOS_SAVE_LABEL: "save in meos";
/** Visible label when `chipPreset: "compact"` — aria-label stays MEOS_SAVE_LABEL. */
export declare const MEOS_SAVE_COMPACT_LABEL: "save";
export declare const MEOS_SAVE_CHIP_CLASS: "meos-save-chip";
export declare const MEOS_SAVE_ICON_CLASS: "meos-save-chip__icon";
export declare const MEOS_SAVE_LABEL_CLASS: "meos-save-chip__label";
/**
 * Build inner HTML for the branded chip (icon + label).
 * Pass `chipPreset: "compact"` for the short **save** label.
 */
export declare function buildSaveChipMarkup(preset?: SaveChipPreset): string;
/** Inject widget styles once at document level (npm hosts that import widget.css may skip). */
export declare function ensureWidgetStyles(): void;
/**
 * Wire a mount point (or existing button) to build and navigate to a meos import deeplink.
 *
 * - Empty container → closed shadow root with branded chip (integrators cannot restyle).
 * - Existing button/anchor → branded markup + document-level styles (classes are fixed).
 */
export declare function initSaveButton(target: string | HTMLElement, options?: SaveButtonOptions): HTMLButtonElement | null;
//# sourceMappingURL=index.d.ts.map