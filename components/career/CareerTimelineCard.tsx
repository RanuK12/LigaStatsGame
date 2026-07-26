"use client"

import { TROPHY_META, findClub, type CareerState } from "@/lib/career-engine"

// Abreviatura de posición en español (estilo Copero: ED, DC, ARQ...).
const POS_ES: Record<string, string> = {
  GK: "ARQ", CB: "DFC", LB: "LI", RB: "LD", LWB: "CAI", RWB: "CAD",
  CDM: "MCD", CM: "MC", CAM: "MP", LM: "MI", RM: "MD", LW: "EI", RW: "ED", CF: "DC", ST: "DC",
}

function ovrColor(ovr: number): { bg: string; text: string } {
  if (ovr >= 90) return { bg: "#a9d3ff", text: "#0a2540" } // celeste (élite)
  if (ovr >= 70) return { bg: "#f6c750", text: "#3a2600" } // dorado
  return { bg: "#e0913c", text: "#3a1e00" } // naranja
}
function ageColor(age: number): { bg: string; text: string } {
  if (age <= 20) return { bg: "#2f6fd6", text: "#fff" } // joven, azul
  if (age <= 25) return { bg: "#c0392b", text: "#fff" } // prime, rojo
  if (age <= 35) return { bg: "#f2f2f2", text: "#111" } // veterano, blanco
  return { bg: "#c0392b", text: "#fff" }
}

// Trofeos ganados en esa temporada (íconos inline).
function seasonTrophies(s: CareerState["history"][number]): string[] {
  const t: string[] = []
  if (s.liga) t.push("🏆")
  if (s.copaArgentina) t.push("🥇")
  if (s.continentalWon) t.push(TROPHY_META[s.continental || ""]?.icon || "🌎")
  if (s.topScorer) t.push("👟")
  return t
}

export default function CareerTimelineCard({ career }: { career: CareerState }) {
  const { player } = career
  const club = findClub(career.clubId)
  const oc = ovrColor(player.ovr)
  const pos = POS_ES[player.position] || player.position
  const value = player.marketValueM >= 1 ? `€${player.marketValueM}M` : `€${Math.round(player.marketValueM * 1000)}K`
  const ntCaps = career.milestones.ntCaps || 0

  return (
    <div className="w-full rounded-[28px] overflow-hidden bg-gradient-to-b from-[#100a12] via-[#0b0710] to-[#050308] border border-white/10 text-white font-sans p-5 sm:p-6">
      {/* HEADER */}
      <div className="flex items-center gap-4 pb-5 border-b border-white/10">
        <div className="shrink-0 w-24 h-24 rounded-[22px] flex flex-col items-center justify-center shadow-lg" style={{ background: oc.bg, color: oc.text }}>
          <span className="text-[11px] font-black tracking-widest font-sport">OVR</span>
          <span className="font-impact text-5xl font-black leading-none">{player.ovr}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl leading-none">{player.flag}</span>
            <span className="rounded-md bg-[#3a1020] border border-white/10 px-2 py-0.5 text-[11px] font-black tracking-wider font-sport">#{player.number} {pos}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {club && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/logos/clubs/${club.id}.png`} alt="" className="w-9 h-9 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
            )}
            <h3 className="font-impact text-3xl font-black uppercase leading-none truncate">{club?.name || "Libre"}</h3>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 font-sport tracking-widest">EDAD</div>
          <div className="font-impact text-3xl font-black leading-none">{player.age}</div>
          <div className="text-[10px] text-slate-400 font-sport tracking-widest mt-1">VALOR</div>
          <div className="font-impact text-xl font-black leading-none">{value}</div>
        </div>
      </div>

      {/* COLUMNAS */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 sm:gap-x-3 items-center px-1 pt-4 pb-2 text-[9px] font-black text-slate-500 font-sport uppercase tracking-widest">
        <span>Edad</span><span>Club</span><span className="text-center">OVR</span>
        <span className="text-center">🟩 PJ</span><span className="text-center">⚽ G</span><span className="text-center">👟 A</span>
      </div>

      {/* FILAS (timeline) */}
      <div className="space-y-1.5">
        {career.history.map((s, i) => {
          const rowOvr = s.nextOvr ?? s.ovr
          const roc = ovrColor(rowOvr)
          const ac = ageColor(s.age)
          const trophies = seasonTrophies(s)
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 sm:gap-x-3 items-center rounded-xl bg-white/[0.03] px-1.5 py-1.5">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center font-impact font-black text-lg shrink-0" style={{ background: ac.bg, color: ac.text }}>{s.age}</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <img src={`/logos/clubs/${s.clubId}.png`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                <span className="font-bold text-sm text-white truncate">{s.clubName}</span>
                {trophies.length > 0 && <span className="text-xs shrink-0">{trophies.join("")}</span>}
              </div>
              <span className="w-9 h-7 rounded-md flex items-center justify-center font-impact font-black text-base shrink-0" style={{ background: roc.bg, color: roc.text }}>{rowOvr}</span>
              <span className="text-center font-bold text-sm text-slate-200 min-w-[28px] font-sport">{s.matchesPlayed}</span>
              <span className="text-center font-bold text-sm text-emerald-400 min-w-[24px] font-sport">{s.goals}</span>
              <span className="text-center font-bold text-sm text-orange-400 min-w-[24px] font-sport">{s.assists}</span>
            </div>
          )
        })}

        {/* SELECCIÓN (totales) */}
        {ntCaps > 0 && (
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 sm:gap-x-3 items-center rounded-xl bg-[#74ACDF]/10 border border-[#74ACDF]/20 px-1.5 py-1.5 mt-2">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-xl shrink-0">{player.flag}</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm text-white truncate">{player.nationality}</span>
              {career.milestones.worldCup && <span className="text-xs">🏆</span>}
            </div>
            <span className="w-9" />
            <span className="text-center font-bold text-sm text-slate-200 font-sport">{ntCaps}</span>
            <span className="text-center font-bold text-sm text-emerald-400 font-sport">{career.milestones.ntGoals || 0}</span>
            <span className="text-center font-bold text-sm text-orange-400 font-sport">—</span>
          </div>
        )}
      </div>

      {/* FOOTER marca */}
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sport font-bold uppercase tracking-wider">
        <span className="font-impact font-black text-white tracking-[0.15em]">GAMBETA</span>
        <span className="text-[#74ACDF] text-[9px] tracking-[0.2em]">GAMBETAFUTBOL.GAMES</span>
      </div>
    </div>
  )
}
