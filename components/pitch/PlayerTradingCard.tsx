"use client"

import type { Player } from "@/lib/types"
import { POS_LABELS } from "@/lib/game-engine"
import { getPC } from "@/lib/ui-constants"

type EnrichedPlayer = Player & { isCompatible: boolean }

// Marco por tier: legendario dorado, élite (>=80) celeste-plata, resto slate
function tierClasses(p: EnrichedPlayer): string {
  if (!p.isCompatible) return "border-slate-800 bg-slate-900/40 opacity-40 hover:opacity-60 cursor-not-allowed"
  if (p.legendary) return "border-[#D4AF37]/70 bg-gradient-to-b from-yellow-900/40 to-slate-900/80 hover:border-[#FFD700] cursor-pointer"
  if ((p.rating || 0) >= 80) return "border-[#75AADB]/60 bg-gradient-to-b from-slate-700/60 to-slate-900/80 hover:border-[#75AADB] cursor-pointer"
  return "border-slate-700 bg-slate-800/80 hover:border-[#75AADB]/60 cursor-pointer"
}

/** Card de jugador estilo figurita para la grilla de reclutamiento */
export default function PlayerTradingCard({ player, onSelect, showRating }: {
  player: EnrichedPlayer; onSelect: () => void; showRating: boolean
}) {
  const ratingColor = player.legendary ? "text-[#FFD700]" : (player.rating || 0) >= 80 ? "text-[#75AADB]" : "text-slate-300"
  const firstClub = player.clubs?.[0]

  return (
    <button onClick={onSelect}
      className={`card-shine group relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-150 ${tierClasses(player)}`}>
      {/* Rating grande a la izquierda, estilo carta */}
      {showRating && (
        <div className="flex w-9 shrink-0 flex-col items-center">
          <span className={`font-display text-xl font-black leading-none ${ratingColor}`}>{player.rating}</span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
            {POS_LABELS[player.position]?.slice(0, 3) || player.position.slice(0, 3)}
          </span>
        </div>
      )}
      {/* Escudo de iniciales */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-inner"
        style={{ backgroundColor: getPC(player.position) }}>
        {player.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">
          {player.name}
          {player.legendary && <span className="ml-1 text-[10px]">⭐</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            player.isCompatible ? "bg-[#75AADB]/20 text-[#75AADB]" : "bg-slate-800 text-slate-500"
          }`}>
            {POS_LABELS[player.position] || player.position}
          </span>
          <span className="text-[10px] text-slate-500">{player.goalsClub}⚽ {player.capsClub}📋</span>
        </div>
        {firstClub && (
          <div className="mt-0.5 truncate text-[9px] text-slate-500">
            {firstClub.name}{firstClub.years ? ` · ${firstClub.years}` : ""}
          </div>
        )}
      </div>
    </button>
  )
}
