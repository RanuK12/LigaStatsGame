import { describe, it, expect } from "vitest"
import { calculateAttributes } from "../lib/attributes-engine"

describe("Data Science Charts & FIFA Attributes", () => {
  it("calcula los 6 atributos FIFA para un delantero de 85 OVR", () => {
    const attrs = calculateAttributes(85, "ST")
    expect(attrs.pac).toBeGreaterThanOrEqual(80)
    expect(attrs.sho).toBeGreaterThanOrEqual(85)
    expect(attrs.dri).toBeGreaterThanOrEqual(80)
    expect(attrs.def).toBeLessThan(60)
    expect(attrs.pac).toBeLessThanOrEqual(99)
    expect(attrs.sho).toBeLessThanOrEqual(99)
  })

  it("calcula los 6 atributos FIFA para un mediocampista / enganche de 90 OVR", () => {
    const attrs = calculateAttributes(90, "CAM")
    expect(attrs.pas).toBeGreaterThanOrEqual(90)
    expect(attrs.dri).toBeGreaterThanOrEqual(85)
    expect(attrs.pas).toBeLessThanOrEqual(99)
  })

  it("calcula los 6 atributos FIFA para un defensor central de 80 OVR", () => {
    const attrs = calculateAttributes(80, "CB")
    expect(attrs.def).toBeGreaterThanOrEqual(80)
    expect(attrs.phy).toBeGreaterThanOrEqual(80)
    expect(attrs.sho).toBeLessThan(60)
  })

  it("calcula los 6 atributos FIFA para un arquero de 88 OVR", () => {
    const attrs = calculateAttributes(88, "GK")
    expect(attrs.def).toBeGreaterThanOrEqual(80)
    expect(attrs.phy).toBeGreaterThanOrEqual(75)
    expect(attrs.sho).toBeLessThan(40)
  })

  it("garantiza que ningún atributo supere 99 ni sea menor que 0 para un OVR extremo (99)", () => {
    const attrs = calculateAttributes(99, "ST")
    Object.values(attrs).forEach((val) => {
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThanOrEqual(99)
      expect(Number.isNaN(val)).toBe(false)
    })
  })
})
