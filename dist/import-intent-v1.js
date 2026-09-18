/**
 * WHY: ImportIntentV1 is the codec SSOT for meos deeplink protocol (MDP).
 *      Encode/decode for databox:import must live only in this package.
 * WHAT: Types + encode/decode/buildMeosLink for `databox:import` URLs.
 * HOW: Optimised wire schema (k: u|ut|i|f) → JSON → deflateRaw → base64url.
 * WHERE: @meoslabs/save-in-meos — consumed by widget and meos clients.
 * GUARDED: check-mdp-contract.ts golden fixtures in fixtures/mdp/.
 */
import pako from "pako";
/** MDP contract version — semver pinned by golden fixture checkers. */
export const MDP_CONTRACT_VERSION = "0.0.1";
/** Canonical meos.do host for import deeplinks. */
export const MEOS_DO_HOST = "meos.do";
/** Colon-grammar resource for widget import (not facility bulk import). */
export const DATABOX_IMPORT_RESOURCE = "databox:import";
/** Maximum URL length before QR degradation (bytes, conservative for Level-M QR). */
export const MDP_MAX_QR_URL_LENGTH = 2048;
export class MdpEncodeError extends Error {
    cause;
    constructor(message, cause) {
        super(`[MdpEncodeError] ${message}`);
        this.cause = cause;
        this.name = "MdpEncodeError";
    }
}
export class MdpDecodeError extends Error {
    cause;
    constructor(message, cause) {
        super(`[MdpDecodeError] ${message}`);
        this.cause = cause;
        this.name = "MdpDecodeError";
    }
}
const TIER_TO_KIND = {
    REF: "u",
    LITE: "ut",
    IMG: "i",
    FULL: "f",
};
const KIND_TO_TIER = {
    u: "REF",
    ut: "LITE",
    i: "IMG",
    f: "FULL",
};
function base64ToBase64Url(base64) {
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64UrlToBase64(base64url) {
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
        base64 += "=";
    }
    return base64;
}
function bytesToBase64(bytes) {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes).toString("base64");
    }
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        let chunkStr = "";
        for (let j = 0; j < chunk.length; j++) {
            chunkStr += String.fromCharCode(chunk[j]);
        }
        binary += chunkStr;
    }
    return btoa(binary);
}
function base64ToBytes(base64) {
    if (typeof Buffer !== "undefined") {
        return Uint8Array.from(Buffer.from(base64, "base64"));
    }
    const binaryStr = atob(base64);
    return Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
}
function compressJson(json) {
    try {
        return pako.deflateRaw(json, { level: 9 });
    }
    catch (error) {
        throw new MdpEncodeError("Compression failed", error);
    }
}
function decompressToJson(compressed) {
    try {
        return pako.inflateRaw(compressed, { to: "string" });
    }
    catch (error) {
        throw new MdpDecodeError("Decompression failed — invalid or corrupted data", error);
    }
}
function encodeBytesToBase64Url(bytes) {
    try {
        return base64ToBase64Url(bytesToBase64(bytes));
    }
    catch (error) {
        throw new MdpEncodeError("Base64 encoding failed", error);
    }
}
function decodeBase64UrlToBytes(encoded) {
    try {
        return base64ToBytes(base64UrlToBase64(encoded));
    }
    catch (error) {
        throw new MdpDecodeError("Base64url decoding failed", error);
    }
}
function assertUrl(value, field) {
    try {
        const parsed = new URL(value);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new MdpEncodeError(`${field} must be an http(s) URL`);
        }
    }
    catch (error) {
        if (error instanceof MdpEncodeError)
            throw error;
        throw new MdpEncodeError(`${field} must be a valid URL`);
    }
}
function validateTitleFlags(intent) {
    if (intent.fetchTitle !== undefined && typeof intent.fetchTitle !== "boolean") {
        throw new MdpEncodeError("fetchTitle must be a boolean when set");
    }
    if (intent.regenerateTitle !== undefined && typeof intent.regenerateTitle !== "boolean") {
        throw new MdpEncodeError("regenerateTitle must be a boolean when set");
    }
    if (intent.title !== undefined) {
        if (typeof intent.title !== "string" || intent.title.trim().length === 0) {
            throw new MdpEncodeError("title must be a non-empty string when set");
        }
    }
}
function validateIntent(intent) {
    if (intent.v !== 1) {
        throw new MdpEncodeError(`Unsupported schema version: ${intent.v}`);
    }
    if (!intent.u || typeof intent.u !== "string") {
        throw new MdpEncodeError("Intent requires canonical URL (u)");
    }
    assertUrl(intent.u, "u");
    validateTitleFlags(intent);
    switch (intent.tier) {
        case "REF":
            break;
        case "LITE":
            if (!intent.t || typeof intent.t !== "string" || intent.t.trim().length === 0) {
                throw new MdpEncodeError("LITE tier requires quoted text (t)");
            }
            break;
        case "IMG":
            if (!intent.images || intent.images.length === 0) {
                throw new MdpEncodeError("IMG tier requires at least one image URL");
            }
            for (const imageUrl of intent.images) {
                assertUrl(imageUrl, "images[]");
            }
            break;
        case "FULL":
            if (!intent.blocks || intent.blocks.length === 0) {
                throw new MdpEncodeError("FULL tier requires at least one block");
            }
            break;
        default:
            throw new MdpEncodeError(`Unknown tier: ${String(intent.tier)}`);
    }
}
function intentTitleFlagsToWire(intent, wire) {
    if (intent.fetchTitle === false)
        wire.ft = false;
    if (intent.title)
        wire.ttl = intent.title;
    if (intent.regenerateTitle === true)
        wire.rt = true;
}
function intentTitleFlagsFromWire(wire, intent) {
    if (wire.ft === false)
        intent.fetchTitle = false;
    if (wire.ttl)
        intent.title = wire.ttl;
    if (wire.rt === true)
        intent.regenerateTitle = true;
}
function intentToWire(intent) {
    const k = TIER_TO_KIND[intent.tier];
    const wire = { k, u: intent.u };
    if (intent.tier === "LITE" && intent.t) {
        wire.t = intent.t;
    }
    if (intent.tier === "IMG") {
        if (intent.t)
            wire.t = intent.t;
        wire.imgs = intent.images;
    }
    if (intent.tier === "FULL" && intent.blocks) {
        wire.blocks = intent.blocks;
    }
    intentTitleFlagsToWire(intent, wire);
    return wire;
}
function wireToIntent(wire) {
    if (!wire || typeof wire !== "object") {
        throw new MdpDecodeError("Invalid schema: not an object");
    }
    if (!wire.k || !(wire.k in KIND_TO_TIER)) {
        throw new MdpDecodeError(`Invalid schema: unknown kind "${String(wire.k)}"`);
    }
    if (!wire.u || typeof wire.u !== "string") {
        throw new MdpDecodeError("Invalid schema: missing canonical URL (u)");
    }
    try {
        const parsed = new URL(wire.u);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            throw new MdpDecodeError("Invalid schema: u must be an http(s) URL");
        }
    }
    catch (error) {
        if (error instanceof MdpDecodeError)
            throw error;
        throw new MdpDecodeError("Invalid schema: u must be a valid URL");
    }
    const tier = KIND_TO_TIER[wire.k];
    const intent = { v: 1, tier, u: wire.u };
    switch (tier) {
        case "LITE":
            if (!wire.t || typeof wire.t !== "string" || wire.t.trim().length === 0) {
                throw new MdpDecodeError("LITE tier requires quoted text (t)");
            }
            intent.t = wire.t;
            break;
        case "IMG":
            if (!wire.imgs || wire.imgs.length === 0) {
                throw new MdpDecodeError("IMG tier requires image URLs (imgs)");
            }
            for (const imageUrl of wire.imgs) {
                try {
                    const parsed = new URL(imageUrl);
                    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                        throw new MdpDecodeError("Invalid schema: imgs[] must be http(s) URLs");
                    }
                }
                catch (error) {
                    if (error instanceof MdpDecodeError)
                        throw error;
                    throw new MdpDecodeError("Invalid schema: imgs[] must be valid URLs");
                }
            }
            if (wire.t)
                intent.t = wire.t;
            intent.images = wire.imgs;
            break;
        case "FULL":
            if (!wire.blocks || wire.blocks.length === 0) {
                throw new MdpDecodeError("FULL tier requires blocks");
            }
            intent.blocks = wire.blocks;
            break;
        default:
            break;
    }
    intentTitleFlagsFromWire(wire, intent);
    return intent;
}
/**
 * Select the minimum encoding tier for the given content.
 * REF — URL only; LITE — URL + distinct text; IMG — image URLs; FULL — blocks.
 */
export function selectImportTier(input) {
    if (input.blocks && input.blocks.length > 0)
        return "FULL";
    if (input.images && input.images.length > 0)
        return "IMG";
    if (input.t && input.t.trim().length > 0 && input.t !== input.u)
        return "LITE";
    return "REF";
}
/** Build a typed ImportIntentV1 from loose widget input. */
export function buildImportIntentV1(input) {
    const tier = selectImportTier(input);
    const intent = { v: 1, tier, u: input.u };
    if (tier === "LITE" && input.t)
        intent.t = input.t;
    if (tier === "IMG") {
        if (input.t)
            intent.t = input.t;
        if (input.images)
            intent.images = input.images;
    }
    if (tier === "FULL" && input.blocks)
        intent.blocks = input.blocks;
    if (input.fetchTitle === false)
        intent.fetchTitle = false;
    if (input.title)
        intent.title = input.title;
    if (input.regenerateTitle === true)
        intent.regenerateTitle = true;
    return intent;
}
/**
 * Encode ImportIntentV1 to a URL-safe payload segment (no host/path).
 * Widget attribution (?w=) is never included in the blob.
 */
export function encodeImportIntentV1(intent) {
    validateIntent(intent);
    const wire = intentToWire(intent);
    const json = JSON.stringify(wire);
    try {
        const compressed = compressJson(json);
        return encodeBytesToBase64Url(compressed);
    }
    catch (error) {
        if (error instanceof MdpEncodeError)
            throw error;
        throw new MdpEncodeError("Encoding failed", error);
    }
}
/**
 * Decode a databox:import payload segment back to ImportIntentV1.
 * Does not parse ?w= — use decodeMeosLink for full URLs.
 */
export function decodeImportIntentV1(encoded) {
    if (!encoded || typeof encoded !== "string") {
        throw new MdpDecodeError("Encoded segment is empty or invalid");
    }
    try {
        const compressed = decodeBase64UrlToBytes(encoded);
        const json = decompressToJson(compressed);
        const wire = JSON.parse(json);
        return wireToIntent(wire);
    }
    catch (error) {
        if (error instanceof MdpDecodeError)
            throw error;
        if (error instanceof SyntaxError) {
            throw new MdpDecodeError("JSON parsing failed — invalid schema", error);
        }
        throw new MdpDecodeError("Decoding failed", error);
    }
}
function assembleMeosUrl(encoded, widgetId) {
    const base = `https://${MEOS_DO_HOST}/${DATABOX_IMPORT_RESOURCE}:${encoded}`;
    if (!widgetId)
        return base;
    return `${base}?w=${encodeURIComponent(widgetId)}`;
}
function copyIntentTitleFlags(intent) {
    return {
        ...(intent.fetchTitle === false ? { fetchTitle: false } : {}),
        ...(intent.title !== undefined ? { title: intent.title } : {}),
        ...(intent.regenerateTitle === true ? { regenerateTitle: true } : {}),
    };
}
function toRefIntent(intent) {
    return { v: 1, tier: "REF", u: intent.u, ...copyIntentTitleFlags(intent) };
}
function toLiteIntent(intent) {
    const quoted = intent.t?.trim();
    if (!quoted) {
        throw new MdpEncodeError("LITE tier requires quoted text (t)");
    }
    return { v: 1, tier: "LITE", u: intent.u, t: quoted, ...copyIntentTitleFlags(intent) };
}
/** Step down one tier for QR guard — IMG/FULL try LITE (keep quote) before REF. */
function degradeIntentForQrGuard(intent) {
    if (intent.tier === "LITE")
        return toRefIntent(intent);
    if (intent.t?.trim())
        return toLiteIntent(intent);
    return toRefIntent(intent);
}
/**
 * Build full https://meos.do/databox:import:{encoded}?w={widgetId} URL.
 * Degrades tier (IMG/FULL → LITE → REF) when the URL exceeds MDP_MAX_QR_URL_LENGTH.
 * Widget id is query-only — never embedded in the compressed blob.
 */
export function buildMeosLink(intent, widgetId, options) {
    validateIntent(intent);
    const maxUrlLength = options?.maxUrlLength ?? MDP_MAX_QR_URL_LENGTH;
    const attribution = widgetId ?? intent.w;
    const blobIntent = {
        v: intent.v,
        tier: intent.tier,
        u: intent.u,
        ...(intent.t !== undefined ? { t: intent.t } : {}),
        ...(intent.images !== undefined ? { images: intent.images } : {}),
        ...(intent.blocks !== undefined ? { blocks: intent.blocks } : {}),
        ...copyIntentTitleFlags(intent),
    };
    let workingIntent = blobIntent;
    let url = assembleMeosUrl(encodeImportIntentV1(workingIntent), attribution);
    while (url.length > maxUrlLength && workingIntent.tier !== "REF") {
        workingIntent = degradeIntentForQrGuard(workingIntent);
        url = assembleMeosUrl(encodeImportIntentV1(workingIntent), attribution);
    }
    if (url.length > maxUrlLength) {
        throw new MdpEncodeError(`URL exceeds maxUrlLength (${maxUrlLength}) even at REF tier — shorten canonical URL (u)`);
    }
    return url;
}
function extractEncodedSegment(urlOrPath) {
    const trimmed = urlOrPath.trim();
    let pathAndQuery;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        pathAndQuery = `${new URL(trimmed).pathname}${new URL(trimmed).search}`;
    }
    else if (trimmed.startsWith("/")) {
        pathAndQuery = trimmed;
    }
    else {
        pathAndQuery = `/${trimmed}`;
    }
    const marker = `${DATABOX_IMPORT_RESOURCE}:`;
    const idx = pathAndQuery.indexOf(marker);
    if (idx === -1) {
        throw new MdpDecodeError(`URL must contain resource "${DATABOX_IMPORT_RESOURCE}"`);
    }
    const after = pathAndQuery.slice(idx + marker.length);
    const encoded = after.split("?")[0];
    if (!encoded || encoded.length < 4) {
        throw new MdpDecodeError("Encoded payload segment missing or too short");
    }
    return encoded;
}
/**
 * Parse a meos.do import URL into ImportIntentV1.
 * Accepts full URL or path-only `databox:import:…` segments.
 * Widget attribution (?w=) is query-only and not merged into the intent.
 */
export function decodeMeosLink(url) {
    const trimmed = url.trim();
    const encoded = extractEncodedSegment(trimmed);
    return decodeImportIntentV1(encoded);
}
/** Read widget attribution from a meos.do import URL (?w= query param). */
export function parseWidgetAttribution(url) {
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return undefined;
    }
    return new URL(trimmed).searchParams.get("w") ?? undefined;
}
//# sourceMappingURL=import-intent-v1.js.map