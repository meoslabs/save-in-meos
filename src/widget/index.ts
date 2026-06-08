/**
 * WHY: Embeddable save-to-meos widget — builds MDP import URLs on user gesture.
 * WHAT: initSaveButton attaches click handler → buildMeosLink → navigate.
 * WHERE: Bundled as dist/widget.iife.js for script-tag consumers.
 */

import {
  buildImportIntentV1,
  buildMeosLink,
  type ImportIntentInput,
} from "../import-intent-v1.js"

export interface SaveButtonOptions extends ImportIntentInput {
  widgetId?: string
  label?: string
}

const DEFAULT_LABEL = "save to meos"

/**
 * Wire a button (or selector) to build and navigate to a meos import deeplink.
 */
export function initSaveButton(
  target: string | HTMLElement,
  options: SaveButtonOptions = { u: typeof location !== "undefined" ? location.href : "" },
): void {
  const el =
    typeof target === "string"
      ? (document.querySelector(target) as HTMLElement | null)
      : target

  if (!el) return

  const label = options.label ?? DEFAULT_LABEL
  if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) {
    el.textContent = label
  }

  el.addEventListener("click", (event) => {
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

function getSelectionText(): string | undefined {
  if (typeof window === "undefined" || !window.getSelection) return undefined
  const text = window.getSelection()?.toString().trim()
  return text && text.length > 0 ? text : undefined
}
