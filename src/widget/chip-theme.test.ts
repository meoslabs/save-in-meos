import { describe, expect, it } from "vitest"
import {
  resolveChipCustomisation,
  resolveChipCustomisationVars,
  SAVE_CHIP_PRESETS,
} from "./chip-theme.js"

describe("resolveChipCustomisationVars", () => {
  it("clamps height", () => {
    expect(resolveChipCustomisationVars({ height: 99 })).toEqual({
      "--meos-save-chip-height": "40px",
    })
    expect(resolveChipCustomisationVars({ height: 10 })).toEqual({
      "--meos-save-chip-height": "28px",
    })
  })

  it("applies radius, padding, and icon size", () => {
    expect(resolveChipCustomisationVars({ radius: 8, paddingX: 12, iconSize: 14 })).toEqual({
      "--meos-save-chip-radius": "8px",
      "--meos-save-chip-padding-x": "12px",
      "--meos-save-icon-size": "14px",
    })
  })

  it("returns empty object when chip omitted", () => {
    expect(resolveChipCustomisationVars()).toEqual({})
  })
})

describe("resolveChipCustomisation", () => {
  it("merges preset with overrides", () => {
    expect(resolveChipCustomisation({ paddingX: 12 }, "compact")).toEqual({
      ...SAVE_CHIP_PRESETS.compact,
      paddingX: 12,
    })
  })

  it("returns preset alone", () => {
    expect(resolveChipCustomisation(undefined, "comfortable")).toEqual(
      SAVE_CHIP_PRESETS.comfortable,
    )
  })
})
