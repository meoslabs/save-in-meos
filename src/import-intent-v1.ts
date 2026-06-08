/**
 * WHY: ImportIntentV1 is the codec SSOT for meos deeplink protocol (MDP).
 *      Encode/decode for databox:import must live only in this package.
 * WHAT: Types + encode/decode/buildMeosLink for `databox:import` URLs.
 * HOW: Optimised wire schema (k: u|ut|i|f) → JSON → deflateRaw → base64url.
 * WHERE: @meoslabs/save-in-meos — consumed by widget and meos clients.
 * GUARDED: check-mdp-contract.ts golden fixtures in fixtures/mdp/.
 */

import pako from "pako"

/** MDP contract version — semver pinned by golden fixture checkers. */
export const MDP_CONTRACT_VERSION = "0.0.1"

export type ImportIntentTier = "REF" | "LITE" | "IMG" | "FULL"

/** Wire kind — compact tier discriminator inside the compressed blob. */
export type ImportIntentKind = "u" | "ut" | "i" | "f"

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
  /**
   * Widget attribution id — expressible via ?w= query param only.
   * Never encoded into the compressed blob.
   */
  w?: string
  /** Optional PadSeed-shaped blocks (FULL tier). */
  blocks?: unknown[]
}

/** Input for automatic tier selection before building an intent. */
export interface ImportIntentInput {
  u: string
  t?: string
  images?: string[]
  blocks?: unknown[]
}

/** Optimised on-wire schema (short keys, omit defaults). */
interface WireImportIntentV1 {
  k: ImportIntentKind
  u?: string
  t?: string
  imgs?: string[]
  blocks?: unknown[]
}

export class MdpEncodeError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(`[MdpEncodeError] ${message}`)
    this.name = "MdpEncodeError"
  }
}

export class MdpDecodeError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(`[MdpDecodeError] ${message}`)
    this.name = "MdpDecodeError"
  }
}

const TIER_TO_KIND: Record<ImportIntentTier, ImportIntentKind> = {
  REF: "u",
  LITE: "ut",
  IMG: "i",
  FULL: "f",
}

const KIND_TO_TIER: Record<ImportIntentKind, ImportIntentTier> = {
  u: "REF",
  ut: "LITE",
  i: "IMG",
  f: "FULL",
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
  while (base64.length % 4) {
    base64 += "="
  }
  return base64
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64")
  }
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    let chunkStr = ""
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j] as number)
    }
    binary += chunkStr
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"))
  }
  const binaryStr = atob(base64)
  return Uint8Array.from(binaryStr, (c) => c.charCodeAt(0))
}

function compressJson(json: string): Uint8Array {
  try {
    return pako.deflateRaw(json, { level: 9 })
  } catch (error) {
    throw new MdpEncodeError("Compression failed", error)
  }
}

function decompressToJson(compressed: Uint8Array): string {
  try {
    return pako.inflateRaw(compressed, { to: "string" })
  } catch (error) {
    throw new MdpDecodeError("Decompression failed — invalid or corrupted data", error)
  }
}

function encodeBytesToBase64Url(bytes: Uint8Array): string {
  try {
    return base64ToBase64Url(bytesToBase64(bytes))
  } catch (error) {
    throw new MdpEncodeError("Base64 encoding failed", error)
  }
}

function decodeBase64UrlToBytes(encoded: string): Uint8Array {
  try {
    return base64ToBytes(base64UrlToBase64(encoded))
  } catch (error) {
    throw new MdpDecodeError("Base64url decoding failed", error)
  }
}

function assertUrl(value: string, field: string): void {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new MdpEncodeError(`${field} must be an http(s) URL`)
    }
  } catch (error) {
    if (error instanceof MdpEncodeError) throw error
    throw new MdpEncodeError(`${field} must be a valid URL`)
  }
}

function validateIntent(intent: ImportIntentV1): void {
  if (intent.v !== 1) {
    throw new MdpEncodeError(`Unsupported schema version: ${intent.v}`)
  }
  if (!intent.u || typeof intent.u !== "string") {
    throw new MdpEncodeError("Intent requires canonical URL (u)")
  }
  assertUrl(intent.u, "u")

  switch (intent.tier) {
    case "REF":
      break
    case "LITE":
      if (!intent.t || typeof intent.t !== "string" || intent.t.trim().length === 0) {
        throw new MdpEncodeError("LITE tier requires quoted text (t)")
      }
      break
    case "IMG":
      if (!intent.images || intent.images.length === 0) {
        throw new MdpEncodeError("IMG tier requires at least one image URL")
      }
      for (const imageUrl of intent.images) {
        assertUrl(imageUrl, "images[]")
      }
      break
    case "FULL":
      if (!intent.blocks || intent.blocks.length === 0) {
        throw new MdpEncodeError("FULL tier requires at least one block")
      }
      break
    default:
      throw new MdpEncodeError(`Unknown tier: ${String(intent.tier)}`)
  }
}

function intentToWire(intent: ImportIntentV1): WireImportIntentV1 {
  const k = TIER_TO_KIND[intent.tier]
  const wire: WireImportIntentV1 = { k, u: intent.u }

  if (intent.tier === "LITE" && intent.t) {
    wire.t = intent.t
  }
  if (intent.tier === "IMG") {
    if (intent.t) wire.t = intent.t
    wire.imgs = intent.images
  }
  if (intent.tier === "FULL" && intent.blocks) {
    wire.blocks = intent.blocks
  }

  return wire
}

function wireToIntent(wire: WireImportIntentV1): ImportIntentV1 {
  if (!wire || typeof wire !== "object") {
    throw new MdpDecodeError("Invalid schema: not an object")
  }
  if (!wire.k || !(wire.k in KIND_TO_TIER)) {
    throw new MdpDecodeError(`Invalid schema: unknown kind "${String(wire.k)}"`)
  }
  if (!wire.u || typeof wire.u !== "string") {
    throw new MdpDecodeError("Invalid schema: missing canonical URL (u)")
  }

  try {
    const parsed = new URL(wire.u)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new MdpDecodeError("Invalid schema: u must be an http(s) URL")
    }
  } catch (error) {
    if (error instanceof MdpDecodeError) throw error
    throw new MdpDecodeError("Invalid schema: u must be a valid URL")
  }

  const tier = KIND_TO_TIER[wire.k]
  const intent: ImportIntentV1 = { v: 1, tier, u: wire.u }

  switch (tier) {
    case "LITE":
      if (!wire.t || typeof wire.t !== "string" || wire.t.trim().length === 0) {
        throw new MdpDecodeError("LITE tier requires quoted text (t)")
      }
      intent.t = wire.t
      break
    case "IMG":
      if (!wire.imgs || wire.imgs.length === 0) {
        throw new MdpDecodeError("IMG tier requires image URLs (imgs)")
      }
      for (const imageUrl of wire.imgs) {
        try {
          const parsed = new URL(imageUrl)
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new MdpDecodeError("Invalid schema: imgs[] must be http(s) URLs")
          }
        } catch (error) {
          if (error instanceof MdpDecodeError) throw error
          throw new MdpDecodeError("Invalid schema: imgs[] must be valid URLs")
        }
      }
      if (wire.t) intent.t = wire.t
      intent.images = wire.imgs
      break
    case "FULL":
      if (!wire.blocks || wire.blocks.length === 0) {
        throw new MdpDecodeError("FULL tier requires blocks")
      }
      intent.blocks = wire.blocks
      break
    default:
      break
  }

  return intent
}

/**
 * Select the minimum encoding tier for the given content.
 * REF — URL only; LITE — URL + distinct text; IMG — image URLs; FULL — blocks.
 */
export function selectImportTier(input: ImportIntentInput): ImportIntentTier {
  if (input.blocks && input.blocks.length > 0) return "FULL"
  if (input.images && input.images.length > 0) return "IMG"
  if (input.t && input.t.trim().length > 0 && input.t !== input.u) return "LITE"
  return "REF"
}

/** Build a typed ImportIntentV1 from loose widget input. */
export function buildImportIntentV1(input: ImportIntentInput): ImportIntentV1 {
  const tier = selectImportTier(input)
  const intent: ImportIntentV1 = { v: 1, tier, u: input.u }

  if (tier === "LITE" && input.t) intent.t = input.t
  if (tier === "IMG") {
    if (input.t) intent.t = input.t
    if (input.images) intent.images = input.images
  }
  if (tier === "FULL" && input.blocks) intent.blocks = input.blocks

  return intent
}

/**
 * Encode ImportIntentV1 to a URL-safe payload segment (no host/path).
 * Widget attribution (?w=) is never included in the blob.
 */
export function encodeImportIntentV1(intent: ImportIntentV1): string {
  validateIntent(intent)

  const wire = intentToWire(intent)
  const json = JSON.stringify(wire)

  try {
    const compressed = compressJson(json)
    return encodeBytesToBase64Url(compressed)
  } catch (error) {
    if (error instanceof MdpEncodeError) throw error
    throw new MdpEncodeError("Encoding failed", error)
  }
}

/**
 * Decode a databox:import payload segment back to ImportIntentV1.
 * Does not parse ?w= — use decodeMeosLink for full URLs.
 */
export function decodeImportIntentV1(encoded: string): ImportIntentV1 {
  if (!encoded || typeof encoded !== "string") {
    throw new MdpDecodeError("Encoded segment is empty or invalid")
  }

  try {
    const compressed = decodeBase64UrlToBytes(encoded)
    const json = decompressToJson(compressed)
    const wire = JSON.parse(json) as WireImportIntentV1
    return wireToIntent(wire)
  } catch (error) {
    if (error instanceof MdpDecodeError) throw error
    if (error instanceof SyntaxError) {
      throw new MdpDecodeError("JSON parsing failed — invalid schema", error)
    }
    throw new MdpDecodeError("Decoding failed", error)
  }
}

function assembleMeosUrl(encoded: string, widgetId?: string): string {
  const base = `https://${MEOS_DO_HOST}/${DATABOX_IMPORT_RESOURCE}:${encoded}`
  if (!widgetId) return base
  return `${base}?w=${encodeURIComponent(widgetId)}`
}

function toRefIntent(intent: ImportIntentV1): ImportIntentV1 {
  return { v: 1, tier: "REF", u: intent.u }
}

export interface BuildMeosLinkOptions {
  /** Override QR guard threshold (default MDP_MAX_QR_URL_LENGTH). */
  maxUrlLength?: number
}

/**
 * Build full https://meos.do/databox:import:{encoded}?w={widgetId} URL.
 * Degrades to REF tier when the URL exceeds MDP_MAX_QR_URL_LENGTH (QR guard).
 * Widget id is query-only — never embedded in the compressed blob.
 */
export function buildMeosLink(
  intent: ImportIntentV1,
  widgetId?: string,
  options?: BuildMeosLinkOptions,
): string {
  validateIntent(intent)

  const maxUrlLength = options?.maxUrlLength ?? MDP_MAX_QR_URL_LENGTH
  const attribution = widgetId ?? intent.w
  const blobIntent: ImportIntentV1 = {
    v: intent.v,
    tier: intent.tier,
    u: intent.u,
    ...(intent.t !== undefined ? { t: intent.t } : {}),
    ...(intent.images !== undefined ? { images: intent.images } : {}),
    ...(intent.blocks !== undefined ? { blocks: intent.blocks } : {}),
  }

  let workingIntent = blobIntent
  let url = assembleMeosUrl(encodeImportIntentV1(workingIntent), attribution)

  while (url.length > maxUrlLength && workingIntent.tier !== "REF") {
    workingIntent = toRefIntent(workingIntent)
    url = assembleMeosUrl(encodeImportIntentV1(workingIntent), attribution)
  }

  if (url.length > maxUrlLength) {
    throw new MdpEncodeError(
      `URL exceeds maxUrlLength (${maxUrlLength}) even at REF tier — shorten canonical URL (u)`,
    )
  }

  return url
}

function extractEncodedSegment(urlOrPath: string): string {
  const trimmed = urlOrPath.trim()
  let pathAndQuery: string

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    pathAndQuery = `${new URL(trimmed).pathname}${new URL(trimmed).search}`
  } else if (trimmed.startsWith("/")) {
    pathAndQuery = trimmed
  } else {
    pathAndQuery = `/${trimmed}`
  }

  const marker = `${DATABOX_IMPORT_RESOURCE}:`
  const idx = pathAndQuery.indexOf(marker)
  if (idx === -1) {
    throw new MdpDecodeError(`URL must contain resource "${DATABOX_IMPORT_RESOURCE}"`)
  }

  const after = pathAndQuery.slice(idx + marker.length)
  const encoded = after.split("?")[0]
  if (!encoded || encoded.length < 4) {
    throw new MdpDecodeError("Encoded payload segment missing or too short")
  }

  return encoded
}

/**
 * Parse a meos.do import URL into ImportIntentV1.
 * Accepts full URL or path-only `databox:import:…` segments.
 * Widget attribution (?w=) is query-only and not merged into the intent.
 */
export function decodeMeosLink(url: string): ImportIntentV1 {
  const trimmed = url.trim()
  const encoded = extractEncodedSegment(trimmed)
  return decodeImportIntentV1(encoded)
}

/** Read widget attribution from a meos.do import URL (?w= query param). */
export function parseWidgetAttribution(url: string): string | undefined {
  const trimmed = url.trim()
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return undefined
  }
  return new URL(trimmed).searchParams.get("w") ?? undefined
}
