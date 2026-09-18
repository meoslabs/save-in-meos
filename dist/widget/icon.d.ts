/**
 * WHY: Branded meos mark for the save chip — monochrome, currentColor.
 * WHAT: Inline SVG string for the bundled logo path (no external asset URL).
 * WHERE: Composed inside initSaveButton / integrator markup via buildSaveChipMarkup.
 * GUARDED: check-widget-branding verifies icon class + SVG presence in widget sources.
 */
/** Exact viewBox from assets/branding/meos-logo-charcoal-nostroke.svg (SSOT). */
export declare const MEOS_SAVE_ICON_VIEWBOX = "0 0 27.275015 30.362297";
export declare function buildSaveIconSvg(className: string): string;
//# sourceMappingURL=icon.d.ts.map