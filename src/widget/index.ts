/**
 * WHY: Embeddable save-to-meos widget — builds MDP import URLs on user gesture.
 * WHAT: initSaveButton mounts a branded chip (shadow DOM or fixed classes) + navigates.
 * WHERE: Bundled as dist/widget.iife.js for script-tag consumers.
 * GUARDED: No label/style overrides — branding enforced by implementation + checker.
 */

import {
  buildImportIntentV1,
  buildMeosLink,
  type ImportIntentInput,
} from "../import-intent-v1.js"
import { buildSaveIconSvg } from "./icon.js"
import { MEOS_SAVE_WIDGET_CSS } from "./styles.js"

export interface SaveButtonOptions extends ImportIntentInput {
  widgetId?: string
}

/** Fixed user-facing copy — not customisable (meos brand). */
export const MEOS_SAVE_LABEL = "save to meos" as const

export const MEOS_SAVE_CHIP_CLASS = "meos-save-chip" as const
export const MEOS_SAVE_ICON_CLASS = "meos-save-chip__icon" as const
export const MEOS_SAVE_LABEL_CLASS = "meos-save-chip__label" as const

const STYLE_TAG_ID = "meos-save-widget-styles"
const SHADOW_HOST_ATTR = "data-meos-save-host"

let stylesInjected = false

/**
 * Build inner HTML for the branded chip (icon + fixed label).
 * React hosts may compose this markup with widget.css — do not change classes.
 */
export function buildSaveChipMarkup(): string {
  return `${buildSaveIconSvg(MEOS_SAVE_ICON_CLASS)}<span class="${MEOS_SAVE_LABEL_CLASS}">${MEOS_SAVE_LABEL}</span>`
}

/** Inject widget styles once at document level (npm hosts that import widget.css may skip). */
export function ensureWidgetStyles(): void {
  if (stylesInjected || typeof document === "undefined") return
  if (document.getElementById(STYLE_TAG_ID)) {
    stylesInjected = true
    return
  }
  const style = document.createElement("style")
  style.id = STYLE_TAG_ID
  style.setAttribute("data-meos-save", "")
  style.textContent = MEOS_SAVE_WIDGET_CSS
  document.head.appendChild(style)
  stylesInjected = true
}

function isEmptyMount(el: HTMLElement): boolean {
  return el.childNodes.length === 0 && !el.textContent?.trim()
}

function applyBrandedChip(button: HTMLButtonElement): void {
  button.type = "button"
  button.className = MEOS_SAVE_CHIP_CLASS
  button.setAttribute("data-meos-save", "")
  button.setAttribute("aria-label", MEOS_SAVE_LABEL)
  button.innerHTML = buildSaveChipMarkup()
}

function mountInShadowHost(host: HTMLElement, options: SaveButtonOptions): HTMLButtonElement {
  host.setAttribute(SHADOW_HOST_ATTR, "")
  const shadow = host.attachShadow({ mode: "closed" })
  const style = document.createElement("style")
  style.textContent = MEOS_SAVE_WIDGET_CSS
  shadow.appendChild(style)
  const button = document.createElement("button")
  applyBrandedChip(button)
  shadow.appendChild(button)
  wireClick(button, options)
  return button
}

function wireClick(button: HTMLElement, options: SaveButtonOptions): void {
  button.addEventListener("click", (event) => {
    event.preventDefault()
    const pageUrl =
      options.u || (typeof location !== "undefined" ? location.href : "")
    const intent = buildImportIntentV1({
      u: pageUrl,
      t: options.t ?? getSelectionText(),
      images: options.images,
      blocks: options.blocks,
    })
    const href = buildMeosLink(intent, options.widgetId)
    if (typeof location !== "undefined") {
      location.href = href
    }
  })
}

/**
 * Wire a mount point (or existing button) to build and navigate to a meos import deeplink.
 *
 * - Empty container → closed shadow root with branded chip (integrators cannot restyle).
 * - Existing button/anchor → branded markup + document-level styles (classes are fixed).
 */
export function initSaveButton(
  target: string | HTMLElement,
  options: SaveButtonOptions = {
    u: typeof location !== "undefined" ? location.href : "",
  },
): HTMLButtonElement | null {
  const el =
    typeof target === "string"
      ? (document.querySelector(target) as HTMLElement | null)
      : target

  if (!el) return null

  if (isEmptyMount(el)) {
    return mountInShadowHost(el, options)
  }

  ensureWidgetStyles()

  let button: HTMLButtonElement
  if (el instanceof HTMLButtonElement) {
    button = el
  } else if (el instanceof HTMLAnchorElement) {
    button = document.createElement("button")
    button.type = "button"
    el.replaceWith(button)
  } else {
    button = document.createElement("button")
    el.appendChild(button)
  }

  applyBrandedChip(button)
  wireClick(button, options)
  return button
}

function getSelectionText(): string | undefined {
  if (typeof window === "undefined" || !window.getSelection) return undefined
  const text = window.getSelection()?.toString().trim()
  return text && text.length > 0 ? text : undefined
}
