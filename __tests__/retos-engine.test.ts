import { describe, it, expect } from "vitest"
import {
  RETOS_GAMBETA,
  getRetosCompletados,
  marcarRetoCompletado,
  calcularPorcentajeRetos,
} from "@/lib/retos-engine"

describe("sistema de retos y logros", () => {
  it("contiene exactamente 52 retos en total", () => {
    expect(RETOS_GAMBETA.length).toBe(52)
  })

  it("cada reto posee id, tier, titulo, descripcion e icono", () => {
    for (const r of RETOS_GAMBETA) {
      expect(r.id).toBeTruthy()
      expect(["bronce", "plata", "oro", "platino"]).toContain(r.tier)
      expect(r.title).toBeTruthy()
      expect(r.description).toBeTruthy()
      expect(r.icon).toBeTruthy()
    }
  })

  it("calcula el porcentaje de progreso correctamente", () => {
    const { total } = calcularPorcentajeRetos()
    expect(total).toBe(52)
  })
})
