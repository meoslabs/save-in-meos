/**
 * WHY: Script-tag / CDN consumers load one file and get `window.MeosSave`.
 * WHAT: IIFE bundle entry — codec helpers + widget initialiser on a global.
 * WHERE: dist/widget.iife.js (unpkg / jsDelivr default entry).
 * GUARDED: Named exports only — `export default` breaks esbuild globalName (wraps in .default).
 */
import {
  buildImportIntentV1,
  buildMeosLink,
  decodeMeosLink,
  parseWidgetAttribution,
} from "../import-intent-v1.js"
import { buildSaveChipMarkup, initSaveButton } from "./index.js"

/** Injected at build time from package.json semver. */
declare const __MEOS_SAVE_VERSION__: string

export interface MeosSaveGlobal {
  initSaveButton: typeof initSaveButton
  buildSaveChipMarkup: typeof buildSaveChipMarkup
  buildMeosLink: typeof buildMeosLink
  buildImportIntentV1: typeof buildImportIntentV1
  decodeMeosLink: typeof decodeMeosLink
  parseWidgetAttribution: typeof parseWidgetAttribution
  version: string
}

export {
  initSaveButton,
  buildSaveChipMarkup,
  buildMeosLink,
  buildImportIntentV1,
  decodeMeosLink,
  parseWidgetAttribution,
}

export const version: string =
  typeof __MEOS_SAVE_VERSION__ !== "undefined" ? __MEOS_SAVE_VERSION__ : "0.0.0"

declare global {
  interface Window {
    MeosSave?: MeosSaveGlobal
  }
}
