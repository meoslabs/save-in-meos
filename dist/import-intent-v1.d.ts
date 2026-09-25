/**
 * WHY: ImportIntentV1 is the codec SSOT for meos deeplink protocol (MDP).
 *      Encode/decode for databox:import must live only in this package.
 * WHAT: Types + encode/decode/buildMeosLink for `databox:import` URLs.
 * HOW: Optimised wire schema (k: u|ut|i|f) → JSON → deflateRaw → base64url.
 * WHERE: @meoslabs/save-in-meos — consumed by widget and meos clients.
 * GUARDED: check-mdp-contract.ts golden fixtures in fixtures/mdp/.
 */
/** MDP contract version — semver pinned by golden fixture checkers. */
export declare const MDP_CONTRACT_VERSION = "0.0.1";
export type ImportIntentTier = "REF" | "LITE" | "IMG" | "FULL";
/** Wire kind — compact tier discriminator inside the compressed blob. */
export type ImportIntentKind = "u" | "ut" | "i" | "f";
/** Canonical meos.do host for import deeplinks. */
export declare const MEOS_DO_HOST = "meos.do";
/** Colon-grammar resource for widget import (not facility bulk import). */
export declare const DATABOX_IMPORT_RESOURCE = "databox:import";
/** Maximum URL length before QR degradation (bytes, conservative for Level-M QR). */
export declare const MDP_MAX_QR_URL_LENGTH = 2048;
export interface ImportIntentV1 {
    /** Schema version — always 1 for v1 codec. */
    v: 1;
    tier: ImportIntentTier;
    /** Canonical content URL (REF/LITE/IMG/FULL). */
    u: string;
    /** Optional quoted text (LITE tier). */
    t?: string;
    /** Optional image URLs (IMG tier). */
    images?: string[];
    /**
     * Widget attribution id — expressible via ?w= query param only.
     * Never encoded into the compressed blob.
     */
    w?: string;
    /** Optional PadSeed-shaped blocks (FULL tier). */
    blocks?: unknown[];
    /**
     * When false, consumer should not use relay-fetched page title (default true when absent).
     * Wire key `ft` — omitted when true (default).
     */
    fetchTitle?: boolean;
    /** Integrator-supplied pad title — overrides relay title when set. Wire key `ttl`. */
    title?: string;
    /**
     * When true, consumer should queue AI title refine on first save (default false when absent).
     * Wire key `rt` — omitted when false (default).
     */
    regenerateTitle?: boolean;
}
/** Input for automatic tier selection before building an intent. */
export interface ImportIntentInput {
    u: string;
    t?: string;
    images?: string[];
    blocks?: unknown[];
    fetchTitle?: boolean;
    title?: string;
    regenerateTitle?: boolean;
}
export declare class MdpEncodeError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
export declare class MdpDecodeError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
/**
 * Select the minimum encoding tier for the given content.
 * REF — URL only; LITE — URL + distinct text; IMG — image URLs; FULL — blocks.
 */
export declare function selectImportTier(input: ImportIntentInput): ImportIntentTier;
/** Build a typed ImportIntentV1 from loose widget input. */
export declare function buildImportIntentV1(input: ImportIntentInput): ImportIntentV1;
/**
 * Encode ImportIntentV1 to a URL-safe payload segment (no host/path).
 * Widget attribution (?w=) is never included in the blob.
 */
export declare function encodeImportIntentV1(intent: ImportIntentV1): string;
/**
 * Decode a databox:import payload segment back to ImportIntentV1.
 * Does not parse ?w= — use decodeMeosLink for full URLs.
 */
export declare function decodeImportIntentV1(encoded: string): ImportIntentV1;
export interface BuildMeosLinkOptions {
    /** Override QR guard threshold (default MDP_MAX_QR_URL_LENGTH). */
    maxUrlLength?: number;
}
/**
 * Build full https://meos.do/databox:import:{encoded}?w={widgetId} URL.
 * Degrades tier (IMG/FULL → LITE → REF) when the URL exceeds MDP_MAX_QR_URL_LENGTH.
 * Widget id is query-only — never embedded in the compressed blob.
 */
export declare function buildMeosLink(intent: ImportIntentV1, widgetId?: string, options?: BuildMeosLinkOptions): string;
/**
 * Parse a meos.do import URL into ImportIntentV1.
 * Accepts full URL or path-only `databox:import:…` segments.
 * Widget attribution (?w=) is query-only and not merged into the intent.
 */
export declare function decodeMeosLink(url: string): ImportIntentV1;
/** Read widget attribution from a meos.do import URL (?w= query param). */
export declare function parseWidgetAttribution(url: string): string | undefined;
//# sourceMappingURL=import-intent-v1.d.ts.map