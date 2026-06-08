/**
 * WHY: initSaveButton injects styles without a separate network fetch (IIFE + npm).
 * WHAT: Runtime chip CSS — theme tokens + bounded size vars; mirrors widget.css.
 * WHERE: Injected into document head or shadow root on first initSaveButton call.
 * GUARDED: check-widget-branding compares required tokens with widget.css.
 */

/** Shared chip rules (shadow :host + document .meos-save-chip). */
const CHIP_RULES = `
.meos-save-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--meos-save-chip-gap, 0.3125rem);
  min-height: calc(var(--meos-save-chip-height, 31px) - 1px);
  max-height: calc(var(--meos-save-chip-height, 31px) + 1px);
  height: var(--meos-save-chip-height, 31px);
  padding: 0 var(--meos-save-chip-padding-x, 0.625rem);
  margin: 0;
  font-family: var(--meos-font, "Inconsolata", ui-monospace, monospace);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: lowercase;
  color: var(--meos-save-fg, #000000);
  background: transparent;
  border: 1px solid var(--meos-save-border, rgba(0, 0, 0, 0.24));
  border-radius: var(--meos-save-chip-radius, 2px);
  cursor: pointer;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  pointer-events: auto;
  user-select: none;
  transition:
    background 0.12s ease,
    border-color 0.12s ease,
    opacity 0.12s ease,
    transform 0.08s ease;
  appearance: none;
  vertical-align: middle;
}

.meos-save-chip:hover {
  background: var(--meos-save-hover-bg, rgba(0, 0, 0, 0.06));
  border-color: var(--meos-save-hover-border, rgba(0, 0, 0, 0.42));
}

.meos-save-chip:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.meos-save-chip:active {
  opacity: 0.9;
  transform: scale(0.98);
}

.meos-save-chip__icon {
  width: calc(var(--meos-save-icon-size, 16px) * 27.275015 / 30.362297);
  height: var(--meos-save-icon-size, 16px);
  flex-shrink: 0;
  display: block;
  pointer-events: none;
  shape-rendering: geometricPrecision;
  overflow: visible;
}

.meos-save-chip__label {
  white-space: nowrap;
  pointer-events: none;
}
`

const LIGHT_THEME_VARS = `
  --meos-save-fg: #000000;
  --meos-save-border: rgba(0, 0, 0, 0.24);
  --meos-save-hover-bg: rgba(0, 0, 0, 0.06);
  --meos-save-hover-border: rgba(0, 0, 0, 0.42);
`

const DARK_THEME_VARS = `
  --meos-save-fg: #ffffff;
  --meos-save-border: rgba(255, 255, 255, 0.3);
  --meos-save-hover-bg: rgba(255, 255, 255, 0.08);
  --meos-save-hover-border: rgba(255, 255, 255, 0.46);
`

/** Injected into closed shadow roots (:host theme selectors). */
export const MEOS_SAVE_SHADOW_CSS = `
:host {
  ${LIGHT_THEME_VARS}
  color-scheme: light;
}

:host([data-meos-theme="light"]) {
  ${LIGHT_THEME_VARS}
  color-scheme: light;
}

:host([data-meos-theme="dark"]) {
  ${DARK_THEME_VARS}
  color-scheme: dark;
}

@media (prefers-color-scheme: dark) {
  :host([data-meos-theme="auto"]) {
    ${DARK_THEME_VARS}
    color-scheme: dark;
  }
}

${CHIP_RULES}
`

/** Document-level chip (npm hosts importing widget.css). */
export const MEOS_SAVE_DOCUMENT_CSS = `
.meos-save-chip,
.meos-save-chip[data-meos-theme="auto"] {
  ${LIGHT_THEME_VARS}
}

.meos-save-chip[data-meos-theme="light"] {
  ${LIGHT_THEME_VARS}
}

.meos-save-chip[data-meos-theme="dark"] {
  ${DARK_THEME_VARS}
}

@media (prefers-color-scheme: dark) {
  .meos-save-chip[data-meos-theme="auto"] {
    ${DARK_THEME_VARS}
  }
}

${CHIP_RULES}
`

/** Full injection bundle for initSaveButton (shadow + document fallback). */
export const MEOS_SAVE_WIDGET_CSS = `${MEOS_SAVE_SHADOW_CSS}\n${MEOS_SAVE_DOCUMENT_CSS}`
