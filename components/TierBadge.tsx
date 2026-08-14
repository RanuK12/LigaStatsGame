"use client"
import { rankFromElo } from "@/lib/ranking"
import { useRango } from "@/lib/i18n"

/** Chip de tier/división derivado del ELO. */
export default function TierBadge({ elo, showElo = false, className = "" }: { elo: number; showElo?: boolean; className?: string }) {
  const rango = useRango()
  const r = rankFromElo(elo)
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black font-sport uppercase tracking-wider border ${className}`}
      style={{ color: r.tier.color, borderColor: `${r.tier.color}55`, background: `${r.tier.color}14` }}
      title={`${r.label}${r.toNext > 0 ? ` · faltan ${r.toNext} para ${r.nextLabel}` : ""}`}
    >
      <span>{r.tier.icon}</span>
      {rango(r.label)}
      {showElo && <span className="opacity-70">· {elo}</span>}
    </span>
  )
}
