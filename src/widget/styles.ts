/**
 * WHY: initSaveButton injects styles without a separate network fetch (IIFE + npm).
 * WHAT: Runtime copy of widget.css — checker verifies both stay aligned on key rules.
 * WHERE: Injected into document head or shadow root on first initSaveButton call.
 * GUARDED: check-widget-branding compares required tokens with widget.css.
 */

export const MEOS_SAVE_WIDGET_CSS = `
.meos-save-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 32px;
  max-height: 36px;
  height: 34px;
  padding: 0 0.75rem;
  margin: 0;
  font-family: var(--meos-font, "Inconsolata", ui-monospace, monospace);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0.01em;
  text-transform: lowercase;
  color: #000000;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.22);
  border-radius: var(--meos-radius, 0);
  cursor: pointer;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
  appearance: none;
  vertical-align: middle;
}

.meos-save-chip:hover {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.38);
}

.meos-save-chip:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.meos-save-chip:active {
  opacity: 0.88;
}

@media (prefers-color-scheme: dark) {
  .meos-save-chip {
    color: #ffffff;
    border-color: rgba(255, 255, 255, 0.28);
  }

  .meos-save-chip:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.42);
  }
}

.meos-save-chip__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: block;
}

.meos-save-chip__label {
  white-space: nowrap;
}
`
