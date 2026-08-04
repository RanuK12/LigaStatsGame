export interface PlayerAttributes {
  pac: number // Ritmo / Velocidad
  sho: number // Tiro / Finalización
  pas: number // Pase / Visión
  dri: number // Regate / Gambeta
  def: number // Defensa / Intercepción
  phy: number // Físico / Potencia
}

export function calculateAttributes(ovr: number, position: string): PlayerAttributes {
  const isGK = position === "GK"
  const isDEF = ["CB", "LB", "RB", "CDM"].includes(position)
  const isMID = ["CM", "CAM", "LM", "RM"].includes(position)
  const isATT = ["ST", "CF", "LW", "RW"].includes(position)

  if (isGK) {
    return {
      pac: Math.min(99, Math.round(ovr * 0.75)),
      sho: Math.min(99, Math.round(ovr * 0.3)),
      pas: Math.min(99, Math.round(ovr * 0.65)),
      dri: Math.min(99, Math.round(ovr * 0.7)),
      def: Math.min(99, Math.round(ovr * 0.95)),
      phy: Math.min(99, Math.round(ovr * 0.88)),
    }
  }

  if (isATT) {
    return {
      pac: Math.min(99, Math.round(ovr * 1.05)),
      sho: Math.min(99, Math.round(ovr * 1.08)),
      pas: Math.min(99, Math.round(ovr * 0.88)),
      dri: Math.min(99, Math.round(ovr * 1.02)),
      def: Math.min(99, Math.round(ovr * 0.42)),
      phy: Math.min(99, Math.round(ovr * 0.85)),
    }
  }

  if (isMID) {
    return {
      pac: Math.min(99, Math.round(ovr * 0.92)),
      sho: Math.min(99, Math.round(ovr * 0.88)),
      pas: Math.min(99, Math.round(ovr * 1.08)),
      dri: Math.min(99, Math.round(ovr * 1.04)),
      def: Math.min(99, Math.round(ovr * 0.72)),
      phy: Math.min(99, Math.round(ovr * 0.86)),
    }
  }

  // DEF
  return {
    pac: Math.min(99, Math.round(ovr * 0.88)),
    sho: Math.min(99, Math.round(ovr * 0.52)),
    pas: Math.min(99, Math.round(ovr * 0.78)),
    dri: Math.min(99, Math.round(ovr * 0.75)),
    def: Math.min(99, Math.round(ovr * 1.08)),
    phy: Math.min(99, Math.round(ovr * 1.05)),
  }
}
