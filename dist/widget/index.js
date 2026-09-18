/**
 * WHY: Embeddable save-in-meos widget — builds MDP import URLs on user gesture.
 * WHAT: initSaveButton mounts a branded chip (shadow DOM or fixed classes) + navigates.
 * WHERE: Bundled as dist/widget.iife.js for script-tag consumers.
 * GUARDED: No label/style overrides — branding enforced by implementation + checker.
 */
import { buildImportIntentV1, buildMeosLink, } from "../import-intent-v1.js";
import { applyChipPresentation, resolveChipLabel, } from "./chip-theme.js";
import { buildSaveIconSvg } from "./icon.js";
import { MEOS_SAVE_DOCUMENT_CSS, MEOS_SAVE_SHADOW_CSS } from "./styles.js";
export { SAVE_CHIP_HOST_VARS, SAVE_CHIP_PRESETS, resolveChipLabel, applyChipPresentation, } from "./chip-theme.js";
export const MEOS_SAVE_LABEL = "save in meos";
/** Visible label when `chipPreset: "compact"` — aria-label stays MEOS_SAVE_LABEL. */
export const MEOS_SAVE_COMPACT_LABEL = "save";
export const MEOS_SAVE_CHIP_CLASS = "meos-save-chip";
export const MEOS_SAVE_ICON_CLASS = "meos-save-chip__icon";
export const MEOS_SAVE_LABEL_CLASS = "meos-save-chip__label";
const STYLE_TAG_ID = "meos-save-widget-styles";
const SHADOW_HOST_ATTR = "data-meos-save-host";
const WIRE_CLICK_ABORT = Symbol("meos-wire-click-abort");
let stylesInjected = false;
/**
 * Build inner HTML for the branded chip (icon + label).
 * Pass `chipPreset: "compact"` for the short **save** label.
 */
export function buildSaveChipMarkup(preset) {
    const label = resolveChipLabel(preset);
    return `${buildSaveIconSvg(MEOS_SAVE_ICON_CLASS)}<span class="${MEOS_SAVE_LABEL_CLASS}">${label}</span>`;
}
/** Inject widget styles once at document level (npm hosts that import widget.css may skip). */
export function ensureWidgetStyles() {
    if (stylesInjected || typeof document === "undefined")
        return;
    if (document.getElementById(STYLE_TAG_ID)) {
        stylesInjected = true;
        return;
    }
    const style = document.createElement("style");
    style.id = STYLE_TAG_ID;
    style.setAttribute("data-meos-save", "");
    style.textContent = MEOS_SAVE_DOCUMENT_CSS;
    document.head.appendChild(style);
    stylesInjected = true;
}
function isEmptyMount(el) {
    return el.childNodes.length === 0 && !el.textContent?.trim();
}
function applyBrandedChip(button, preset) {
    button.type = "button";
    button.className = MEOS_SAVE_CHIP_CLASS;
    button.setAttribute("data-meos-save", "");
    button.setAttribute("aria-label", MEOS_SAVE_LABEL);
    if (preset === "compact") {
        button.setAttribute("data-meos-chip-preset", "compact");
    }
    button.innerHTML = buildSaveChipMarkup(preset);
}
function shadowHostButton(host) {
    const button = host.shadowRoot?.querySelector("button");
    return button instanceof HTMLButtonElement ? button : null;
}
function mountInShadowHost(host, options) {
    applyChipPresentation(host, options.theme ?? "auto", options.chip, options.chipPreset);
    host.setAttribute(SHADOW_HOST_ATTR, "");
    const existing = shadowHostButton(host);
    if (existing) {
        applyBrandedChip(existing, options.chipPreset);
        wireClick(existing, options, true);
        return existing;
    }
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = MEOS_SAVE_SHADOW_CSS;
    shadow.appendChild(style);
    const button = document.createElement("button");
    applyBrandedChip(button, options.chipPreset);
    shadow.appendChild(button);
    wireClick(button, options);
    return button;
}
function wireClick(button, options, replace = false) {
    const host = button;
    if (replace && host[WIRE_CLICK_ABORT]) {
        host[WIRE_CLICK_ABORT].abort();
    }
    const ac = new AbortController();
    host[WIRE_CLICK_ABORT] = ac;
    let capturedSelection;
    button.addEventListener("pointerdown", () => {
        capturedSelection = getSelectionText();
    }, { signal: ac.signal });
    button.addEventListener("click", (event) => {
        event.preventDefault();
        try {
            const pageUrl = typeof location !== "undefined"
                ? location.href
                : (options.u ?? "");
            const intent = buildImportIntentV1({
                u: pageUrl,
                t: options.t ?? getSelectionText() ?? capturedSelection,
                images: options.images,
                blocks: options.blocks,
                fetchTitle: options.fetchTitle,
                title: options.title,
                regenerateTitle: options.regenerateTitle,
            });
            const href = buildMeosLink(intent, options.widgetId);
            if (typeof location !== "undefined") {
                location.href = href;
            }
        }
        catch (err) {
            console.error("[save-in-meos] failed to build import link", err);
        }
    }, { signal: ac.signal });
}
/**
 * Wire a mount point (or existing button) to build and navigate to a meos import deeplink.
 *
 * - Empty container → closed shadow root with branded chip (integrators cannot restyle).
 * - Existing button/anchor → branded markup + document-level styles (classes are fixed).
 */
export function initSaveButton(target, options = {
    u: typeof location !== "undefined" ? location.href : "",
}) {
    const el = typeof target === "string"
        ? document.querySelector(target)
        : target;
    if (!el)
        return null;
    if (isEmptyMount(el) || el.hasAttribute(SHADOW_HOST_ATTR)) {
        return mountInShadowHost(el, options);
    }
    ensureWidgetStyles();
    let button;
    if (el instanceof HTMLButtonElement) {
        button = el;
    }
    else if (el instanceof HTMLAnchorElement) {
        button = document.createElement("button");
        button.type = "button";
        el.replaceWith(button);
    }
    else {
        button = document.createElement("button");
        el.appendChild(button);
    }
    applyBrandedChip(button, options.chipPreset);
    applyChipPresentation(button, options.theme ?? "auto", options.chip, options.chipPreset);
    wireClick(button, options, true);
    return button;
}
function getSelectionText() {
    if (typeof window === "undefined" || !window.getSelection)
        return undefined;
    const text = window.getSelection()?.toString().trim();
    return text && text.length > 0 ? text : undefined;
}
//# sourceMappingURL=index.js.map