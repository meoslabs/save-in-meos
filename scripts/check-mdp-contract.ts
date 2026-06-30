#!/usr/bin/env tsx
/**
 * WHY: MDP codec is the cross-repo contract — drift breaks app, desktop, and widget.
 * WHAT: Golden fixture roundtrips, URL grammar, QR size guard, stable buildMeosLink.
 * HOW: Loads fixtures/mdp/*.json; exercises encode/decode/buildMeosLink/decodeMeosLink.
 * WHERE: save-in-meos/scripts/check-mdp-contract.ts
 * WHEN: Pre-commit (BLOCKING).
 * GUARDED: Fixture filenames pinned; renames require explicit checker update.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  MDP_CONTRACT_VERSION,
  DATABOX_IMPORT_RESOURCE,
  MDP_MAX_QR_URL_LENGTH,
  buildMeosLink,
  decodeImportIntentV1,
  decodeMeosLink,
  encodeImportIntentV1,
  type ImportIntentV1,
} from "../src/import-intent-v1.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const FIXTURES_DIR = path.join(ROOT, "fixtures/mdp")

const violations: string[] = []

interface MdpFixture {
  name: string
  description?: string
  intent: ImportIntentV1
  widgetId?: string | null
  expectedHost: string
  expectedResource: string
  maxUrlLength: number
}

function fail(message: string): void {
  violations.push(message)
}

function loadFixtures(): MdpFixture[] {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fail(`Missing fixtures directory: fixtures/mdp/`)
    return []
  }

  const files = fs
    .readdirSync(FIXTURES_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()

  const pinned = [
    "ref-minimal.json",
    "lite-quote.json",
    "ref-with-widget.json",
    "lite-with-title-flags.json",
    "full-blocks.json",
  ]
  for (const name of pinned) {
    if (!files.includes(name)) {
      fail(`Missing pinned fixture: fixtures/mdp/${name}`)
    }
  }

  return files.map((file) => {
    const raw = fs.readFileSync(path.join(FIXTURES_DIR, file), "utf8")
    return JSON.parse(raw) as MdpFixture
  })
}

function assertUrlGrammar(url: string, fixture: MdpFixture): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    fail(`${fixture.name}: buildMeosLink returned invalid URL: ${url}`)
    return
  }

  if (parsed.hostname !== fixture.expectedHost) {
    fail(`${fixture.name}: expected host ${fixture.expectedHost}, got ${parsed.hostname}`)
  }

  const pathAndQuery = `${parsed.pathname}${parsed.search}`
  if (!pathAndQuery.includes(fixture.expectedResource)) {
    fail(
      `${fixture.name}: URL must contain resource "${fixture.expectedResource}" — got ${pathAndQuery}`,
    )
  }

  if (!url.startsWith(`https://${fixture.expectedHost}/`)) {
    fail(`${fixture.name}: URL must use https://${fixture.expectedHost}/ — got ${url}`)
  }

  const encodedSegment = pathAndQuery.split(`${fixture.expectedResource}:`)[1]?.split("?")[0]
  if (!encodedSegment || encodedSegment.length < 4) {
    fail(`${fixture.name}: encoded payload segment missing or too short after databox:import:`)
  }

  if (fixture.widgetId) {
    const w = parsed.searchParams.get("w")
    if (w !== fixture.widgetId) {
      fail(`${fixture.name}: expected ?w=${fixture.widgetId}, got ?w=${w ?? "(missing)"}`)
    }
  }
}

function deepEqualIntent(a: ImportIntentV1, b: ImportIntentV1): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function runFixture(fixture: MdpFixture): void {
  const widgetId = fixture.widgetId ?? undefined

  let encoded: string
  let url: string
  let roundtripFromSegment: ImportIntentV1
  let roundtripFromUrl: ImportIntentV1

  try {
    encoded = encodeImportIntentV1(fixture.intent)
  } catch (err) {
    fail(
      `${fixture.name}: encodeImportIntentV1 threw — ${err instanceof Error ? err.message : String(err)}`,
    )
    return
  }

  try {
    url = buildMeosLink(fixture.intent, widgetId)
  } catch (err) {
    fail(
      `${fixture.name}: buildMeosLink threw — ${err instanceof Error ? err.message : String(err)}`,
    )
    return
  }

  assertUrlGrammar(url, fixture)

  if (url.length > (fixture.maxUrlLength ?? MDP_MAX_QR_URL_LENGTH)) {
    fail(
      `${fixture.name}: URL length ${url.length} exceeds QR guard ${fixture.maxUrlLength ?? MDP_MAX_QR_URL_LENGTH}`,
    )
  }

  // Stable output: two builds must match
  try {
    const url2 = buildMeosLink(fixture.intent, widgetId)
    if (url !== url2) {
      fail(`${fixture.name}: buildMeosLink is not stable across calls`)
    }
  } catch (err) {
    fail(`${fixture.name}: buildMeosLink stability check threw — ${String(err)}`)
  }

  try {
    roundtripFromSegment = decodeImportIntentV1(encoded)
  } catch (err) {
    fail(
      `${fixture.name}: decodeImportIntentV1 threw — ${err instanceof Error ? err.message : String(err)}`,
    )
    return
  }

  try {
    roundtripFromUrl = decodeMeosLink(url)
  } catch (err) {
    fail(`${fixture.name}: decodeMeosLink threw — ${err instanceof Error ? err.message : String(err)}`)
    return
  }

  if (!deepEqualIntent(roundtripFromSegment, fixture.intent)) {
    fail(`${fixture.name}: decodeImportIntentV1 roundtrip mismatch`)
  }

  if (!deepEqualIntent(roundtripFromUrl, fixture.intent)) {
    fail(`${fixture.name}: decodeMeosLink roundtrip mismatch`)
  }
}

// ── Contract version export ─────────────────────────────────────────────────
if (!MDP_CONTRACT_VERSION || !/^\d+\.\d+\.\d+$/.test(MDP_CONTRACT_VERSION)) {
  fail(`MDP_CONTRACT_VERSION must be semver — got "${MDP_CONTRACT_VERSION}"`)
}

if (DATABOX_IMPORT_RESOURCE !== "databox:import") {
  fail(`DATABOX_IMPORT_RESOURCE must be "databox:import" — got "${DATABOX_IMPORT_RESOURCE}"`)
}

// ── Golden fixtures ─────────────────────────────────────────────────────────
const fixtures = loadFixtures()
for (const fixture of fixtures) {
  runFixture(fixture)
}

// ── Report ──────────────────────────────────────────────────────────────────
if (violations.length > 0) {
  console.error("check-mdp-contract: FAIL")
  console.error(`MDP_CONTRACT_VERSION=${MDP_CONTRACT_VERSION}`)
  for (const v of violations) {
    console.error(`  ✗ ${v}`)
  }
  console.error("")
  console.error("Hint: implement encode/decode/buildMeosLink in src/import-intent-v1.ts")
  process.exit(1)
}

console.log("check-mdp-contract: PASS")
console.log(`MDP_CONTRACT_VERSION=${MDP_CONTRACT_VERSION}`)
console.log(`fixtures: ${fixtures.length} roundtrips OK`)
