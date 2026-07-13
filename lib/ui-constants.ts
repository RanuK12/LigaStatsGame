// Colores por posición y agrupaciones para la UI del draft
export const PC: Record<string, string> = {
  GK: "#f59e0b", CB: "#3b82f6", LB: "#06b6d4", RB: "#06b6d4",
  CDM: "#059669", CM: "#10b981", CAM: "#8b5cf6",
  LW: "#ef4444", RW: "#ef4444", ST: "#dc2626", CF: "#ea580c",
  LM: "#14b8a6", RM: "#14b8a6", LWB: "#0891b2", RWB: "#0891b2",
}
export const getPC = (pos?: string) => (pos && PC[pos]) || "#6b7280"

export const POS_GROUPS: { label: string; positions: string[]; icon: string }[] = [
  { label: "Arquero", positions: ["GK"], icon: "🧤" },
  { label: "Defensa", positions: ["CB", "LB", "RB", "LWB", "RWB"], icon: "🛡️" },
  { label: "Mediocampo", positions: ["CDM", "CM", "CAM", "LM", "RM"], icon: "⚙️" },
  { label: "Ataque", positions: ["LW", "RW", "ST", "CF"], icon: "⚡" },
]
