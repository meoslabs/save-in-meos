/**
 * WHY: ImportIntentV1 is the codec SSOT for meos deeplink protocol (mdp).
 *      LIP-0028 references this package semver — do not duplicate encode/decode
 *      in meos-core-logic or meos-app.
 * WHAT: Types + encode/decode/buildMeosLink for `databox:import` URLs.
 * HOW: Tier-picked encoding (REF/LITE/IMG/FULL v1) into URL-safe blobs.
 * WHERE: @meos/save-in-meos — consumed by widget, desktop frame, app bridge.
 * WHEN: Implement after check-mdp-contract is RED (Wave -1 → Phase 1).
 * GUARDED: check-mdp-contract.ts golden fixtures in fixtures/mdp/.
 */

/** MDP contract version — pinned by LIP-0028 and cross-repo smoke tests. */
export const MDP_CONTRACT_VERSION = "0.0.1"

export type ImportIntentTier = "REF" | "LITE" | "IMG" | "FULL"

/** Canonical meos.do host for import deeplinks. */
export const MEOS_DO_HOST = "meos.do"

/** Colon-grammar resource for widget import (not facility bulk import). */
export const DATABOX_IMPORT_RESOURCE = "databox:import"

/** Maximum URL length before QR degradation (bytes, conservative for Level-M QR). */
export const MDP_MAX_QR_URL_LENGTH = 2048

export interface ImportIntentV1 {
  /** Schema version — always 1 for v1 codec. */
  v: 1
  tier: ImportIntentTier
  /** Canonical content URL (REF/LITE/IMG/FULL). */
  u: string
  /** Optional quoted text (LITE tier). */
  t?: string
  /** Optional image URLs (IMG tier). */
  images?: string[]
  /** Widget attribution id — also expressible via ?w= query param. */
  w?: string
}

/**
 * Encode ImportIntentV1 to a URL-safe payload segment (no host/path).
 * @throws Not implemented — Wave -1 stub; implement to turn check-mdp-contract GREEN.
 */
export function encodeImportIntentV1(_intent: ImportIntentV1): string {
  throw new Error("encodeImportIntentV1: not implemented (Wave -1 stub)")
}

/**
 * Decode a databox:import payload segment back to ImportIntentV1.
 * @throws Not implemented — Wave -1 stub.
 */
export function decodeImportIntentV1(_encoded: string): ImportIntentV1 {
  throw new Error("decodeImportIntentV1: not implemented (Wave -1 stub)")
}

/**
 * Build full https://meos.do/databox:import:{encoded}?w={widgetId} URL.
 * @throws Not implemented — Wave -1 stub.
 */
export function buildMeosLink(_intent: ImportIntentV1, _widgetId?: string): string {
  throw new Error("buildMeosLink: not implemented (Wave -1 stub)")
}

/**
 * Parse a meos.do import URL into ImportIntentV1.
 * Accepts full URL or path-only `databox:import:…` segments.
 * @throws Not implemented — Wave -1 stub.
 */
export function decodeMeosLink(_url: string): ImportIntentV1 {
  throw new Error("decodeMeosLink: not implemented (Wave -1 stub)")
}
