/**
 * IIFE bundle entry — exposes MeosSave global for script-tag embeds.
 */
import { initSaveButton } from "./index.js"

export interface MeosSaveGlobal {
  initSaveButton: typeof initSaveButton
  version: string
}

declare global {
  interface Window {
    MeosSave?: MeosSaveGlobal
  }
}

const MeosSave: MeosSaveGlobal = {
  initSaveButton,
  version: "0.0.1",
}

if (typeof window !== "undefined") {
  window.MeosSave = MeosSave
}

export default MeosSave
