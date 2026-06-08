import { describe, expect, it } from "vitest"

import {
  DATABOX_IMPORT_RESOURCE,
  MDP_CONTRACT_VERSION,
  MDP_MAX_QR_URL_LENGTH,
  MEOS_DO_HOST,
  buildImportIntentV1,
  buildMeosLink,
  decodeImportIntentV1,
  decodeMeosLink,
  encodeImportIntentV1,
  parseWidgetAttribution,
  selectImportTier,
} from "./import-intent-v1.js"

describe("MDP_CONTRACT_VERSION", () => {
  it("exports semver", () => {
    expect(MDP_CONTRACT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

describe("selectImportTier", () => {
  it("picks REF for URL only", () => {
    expect(selectImportTier({ u: "https://example.com/a" })).toBe("REF")
  })

  it("picks LITE when text differs from URL", () => {
    expect(
      selectImportTier({
        u: "https://example.com/a",
        t: "quoted passage",
      }),
    ).toBe("LITE")
  })

  it("picks IMG when images are present", () => {
    expect(
      selectImportTier({
        u: "https://example.com/a",
        images: ["https://cdn.example.com/pic.jpg"],
      }),
    ).toBe("IMG")
  })

  it("picks FULL when blocks are present", () => {
    expect(
      selectImportTier({
        u: "https://example.com/a",
        blocks: [{ type: "text", text: "hello" }],
      }),
    ).toBe("FULL")
  })
})

describe("encodeImportIntentV1 / decodeImportIntentV1", () => {
  const refIntent = buildImportIntentV1({ u: "https://example.com/article" })
  const liteIntent = buildImportIntentV1({
    u: "https://blog.example.org/posts/hello",
    t: "A short quoted passage from the article body.",
  })

  it("roundtrips REF tier", () => {
    const encoded = encodeImportIntentV1(refIntent)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeImportIntentV1(encoded)).toEqual(refIntent)
  })

  it("roundtrips LITE tier", () => {
    const encoded = encodeImportIntentV1(liteIntent)
    expect(decodeImportIntentV1(encoded)).toEqual(liteIntent)
  })

  it("does not embed widget id in blob", () => {
    const intent = {
      ...refIntent,
      w: "secret-widget",
    }
    const encoded = encodeImportIntentV1(intent)
    expect(encoded).not.toContain("secret-widget")
    expect(decodeImportIntentV1(encoded).w).toBeUndefined()
  })

  it("rejects invalid base64url", () => {
    expect(() => decodeImportIntentV1("!!!")).toThrow(/Base64url|Decompression|JSON/)
  })
})

describe("buildMeosLink", () => {
  it("builds canonical meos.do URL", () => {
    const url = buildMeosLink(
      buildImportIntentV1({ u: "https://example.com/article" }),
    )
    expect(url).toBe(
      `https://${MEOS_DO_HOST}/${DATABOX_IMPORT_RESOURCE}:${encodeImportIntentV1(
        buildImportIntentV1({ u: "https://example.com/article" }),
      )}`,
    )
  })

  it("appends ?w= outside the blob", () => {
    const intent = buildImportIntentV1({ u: "https://news.ycombinator.com/item?id=12345" })
    const url = buildMeosLink(intent, "hn-embed")
    const parsed = new URL(url)
    expect(parsed.hostname).toBe(MEOS_DO_HOST)
    expect(parsed.searchParams.get("w")).toBe("hn-embed")
    expect(url).not.toContain("hn-embed:")
  })

  it("is stable across calls", () => {
    const intent = buildImportIntentV1({
      u: "https://blog.example.org/posts/hello",
      t: "A short quoted passage from the article body.",
    })
    expect(buildMeosLink(intent, "demo")).toBe(buildMeosLink(intent, "demo"))
  })


  it("degrades IMG to LITE before REF when quoted text fits QR guard", () => {
    const intent = buildImportIntentV1({
      u: "https://example.com/article",
      t: "A short quoted passage.",
      images: ["https://example.com/a.jpg", "https://example.com/b.jpg"],
    })
    const url = buildMeosLink(intent, "demo", { maxUrlLength: 200 })
    expect(url.length).toBeLessThanOrEqual(200)
    const decoded = decodeMeosLink(url)
    expect(decoded.tier).toBe("LITE")
    expect(decoded.t).toBe(intent.t)
    expect(decoded.images).toBeUndefined()
  })

  it("degrades to REF when URL exceeds QR guard", () => {
    const intent = buildImportIntentV1({
      u: "https://example.com/long",
      t: "Quoted passage that would exceed a tight QR budget.",
    })
    const url = buildMeosLink(intent, "demo", { maxUrlLength: 120 })
    expect(url.length).toBeLessThanOrEqual(120)
    const decoded = decodeMeosLink(url)
    expect(decoded.tier).toBe("REF")
    expect(decoded.u).toBe(intent.u)
    expect(decoded.t).toBeUndefined()
  })

  it("respects default MDP_MAX_QR_URL_LENGTH guard", () => {
    const intent = buildImportIntentV1({ u: "https://example.com/article" })
    const url = buildMeosLink(intent)
    expect(url.length).toBeLessThanOrEqual(MDP_MAX_QR_URL_LENGTH)
  })
})

describe("decodeMeosLink", () => {
  it("roundtrips full URL without merging ?w= into intent", () => {
    const intent = buildImportIntentV1({ u: "https://example.com/article" })
    const url = buildMeosLink(intent, "my-widget")
    expect(decodeMeosLink(url)).toEqual(intent)
    expect(parseWidgetAttribution(url)).toBe("my-widget")
  })

  it("accepts path-only segments", () => {
    const intent = buildImportIntentV1({ u: "https://example.com/article" })
    const encoded = encodeImportIntentV1(intent)
    expect(decodeMeosLink(`${DATABOX_IMPORT_RESOURCE}:${encoded}`)).toEqual(intent)
  })
})

describe("wireToIntent decode guards", () => {
  it("rejects invalid encoded blobs on decode", () => {
    expect(() => decodeImportIntentV1("not-valid-blob")).toThrow()
  })

  it("strips extras from REF tier on decode via tier-specific fields only", () => {
    const ref = buildImportIntentV1({ u: "https://example.com/ref-only" })
    const encoded = encodeImportIntentV1(ref)
    expect(decodeImportIntentV1(encoded)).toEqual(ref)
    expect(decodeImportIntentV1(encoded).t).toBeUndefined()
    expect(decodeImportIntentV1(encoded).images).toBeUndefined()
  })
})

describe("buildMeosLink QR guard loop", () => {
  it("throws when REF tier still exceeds maxUrlLength", () => {
    const intent = buildImportIntentV1({ u: "https://example.com/a" })
    expect(() => buildMeosLink(intent, "demo", { maxUrlLength: 40 })).toThrow(/maxUrlLength/)
  })
})
