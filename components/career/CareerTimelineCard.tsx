"use client"

import { findClub, retirementStory, formatMarketValue, positionCategory, type CareerState } from "@/lib/career-engine"
import Trofeo, { nombreDeTrofeo } from "@/components/ui/Trofeo"
import { useT } from "@/lib/i18n"

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
function seasonTrophies(s: CareerState["history"][number]): { trofeo?: string; emoji?: string }[] {
  const t: { trofeo?: string; emoji?: string }[] = []
  if (s.liga) t.push({ trofeo: "lpf" })
  if (s.copaArgentina) t.push({ trofeo: "copa-arg" })
  if (s.continentalWon && s.continental) t.push({ trofeo: s.continental })
  if (s.ascendio) t.push({ trofeo: "ascenso" })
  if (s.topScorer) t.push({ emoji: "👟" })
  return t
}

// Palmarés: chips resumen (Mundial, copas por tipo con contador, Balón de Oro, Bota de Oro).
function palmares(career: CareerState): { trofeo?: string; emoji?: string; label: string }[] {
  const chips: { trofeo?: string; emoji?: string; label: string }[] = []
  if (career.milestones.worldCup) chips.push({ trofeo: "mundial", label: "Campeón del Mundo" })
  // El Balón de Oro y la Bota son premios individuales, no copas: siguen con su símbolo.
  if (career.milestones.balonDeOro > 0) chips.push({ emoji: "🏅", label: `Balón de Oro ×${career.milestones.balonDeOro}` })
  // Copas ganadas por tipo (liga, copa nacional, libertadores, sudamericana...).
  for (const [comp, n] of Object.entries(career.trophies).sort((a, b) => b[1] - a[1])) {
    if (n > 0) chips.push({ trofeo: comp, label: `${nombreDeTrofeo(comp, paisDeCarrera(career))} ×${n}` })
  }
  if (career.milestones.goldenBoots > 0) chips.push({ emoji: "👟", label: `Bota de Oro ×${career.milestones.goldenBoots}` })
  return chips
}

/** El país del club donde terminó: decide qué copa nacional se dibuja. */
function paisDeCarrera(career: CareerState): string | undefined {
  return findClub(career.clubId)?.pais
}

export default function CareerTimelineCard({ career }: { career: CareerState }) {
  const t = useT()
  const { player } = career
  const club = findClub(career.clubId)
  // La carta muestra su MEJOR versión: el pico. El resumen de carrera mostraba el pico y la
  // ficha el OVR con el que se retiraba, así que daban números distintos sin decir por qué.
  const peak = Math.max(player.ovr, ...career.history.map((s) => s.nextOvr ?? s.ovr))
  const oc = ovrColor(peak)
  const pos = POS_ES[player.position] || player.position
  const value = formatMarketValue(player.marketValueM)
  const ntCaps = career.milestones.ntCaps || 0
  const chips = palmares(career)
  // Las columnas cambian según el puesto: un arquero no se mide por goles.
  const cat = positionCategory(player.position)
  const esArquero = cat === "GK"
  const esDefensor = cat === "DEF"

  return (
    <div className="w-full rounded-[28px] overflow-hidden bg-gradient-to-b from-[#100a12] via-[#0b0710] to-[#050308] border border-white/10 text-white font-sans p-5 sm:p-6">
      {/* MARCA: la ficha se comparte, así que lleva el sello de la casa */}
      <div className="flex items-center gap-3 pb-4 mb-1 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/gambeta.svg" alt="Gambeta" className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-impact text-lg font-black tracking-[0.14em] text-white leading-none">GAMBETA</span>
            <span className="text-[#F6C750] text-[11px] leading-none tracking-[0.15em]">★★★</span>
          </div>
          <div className="text-[10px] font-sport font-bold uppercase tracking-[0.28em] text-[#74ACDF] mt-1">
            {t('ficha.bajada', 'El juego del fútbol argentino')}
          </div>
        </div>
        <div className="ml-auto banda-argentina h-8 w-16 rounded-md opacity-80" />
      </div>

      {/* HEADER */}
      <div className="flex items-center gap-4 pb-5 border-b border-white/10">
        <div className="shrink-0 w-24 h-24 rounded-[22px] flex flex-col items-center justify-center shadow-lg" style={{ background: oc.bg, color: oc.text }}>
          <span className="text-[10px] font-black tracking-widest font-sport">{t('ficha.ovrPico', 'OVR PICO')}</span>
          <span className="font-impact text-5xl font-black leading-none">{peak}</span>
          {peak !== player.ovr && (
            <span className="text-[11px] font-bold font-sport opacity-70">se retiró en {player.ovr}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl leading-none">{player.flag}</span>
            <span className="rounded-md bg-[#3a1020] border border-white/10 px-2 py-0.5 text-[11px] font-black tracking-wider font-sport">#{player.number} {pos}</span>
          </div>
          <h3 className="font-impact text-3xl sm:text-[2rem] font-black uppercase leading-none truncate">{player.name}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            {club && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/logos/clubs/${club.id}.png`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
            )}
            <span className="font-bold text-base text-slate-300 truncate">{club?.name || "Libre / retirado"}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 font-sport tracking-widest">{t('ficha.edadMayus', 'EDAD')}</div>
          <div className="font-impact text-3xl font-black leading-none">{player.age}</div>
          <div className="text-[10px] text-slate-400 font-sport tracking-widest mt-1">{t('ficha.valor', 'VALOR')}</div>
          <div className="font-impact text-xl font-black leading-none">{value}</div>
        </div>
      </div>

      {/* PALMARÉS (Mundial, copas, Balón de Oro) */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-4">
          {chips.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-100">
              {c.trofeo ? (
                <Trofeo id={c.trofeo} pais={paisDeCarrera(career)} size={16} />
              ) : (
                <span className="text-sm leading-none">{c.emoji}</span>
              )}
              {c.label}
            </span>
          ))}
        </div>
      )}

      {/* COLUMNAS */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-2 sm:gap-x-3 items-center px-1 pt-4 pb-2 text-[11px] font-black text-slate-500 font-sport uppercase tracking-widest">
        <span>{t('ficha.edad', 'Edad')}</span><span>{t('ficha.club', 'Club')}</span><span className="text-center">OVR</span>
        <span className="text-center">🟩 PJ</span>
        <span className="text-center">{esArquero || esDefensor ? "🧤 VI" : "⚽ G"}</span>
        <span className="text-center">{esArquero ? "🖐️ PA" : esDefensor ? "⚽ G" : "👟 A"}</span>
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
                <img src={findClub(s.clubId)?.escudo ?? `/logos/clubs/${s.clubId}.png`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                <span className="font-bold text-sm text-white truncate">{s.clubName}</span>
                {trophies.length > 0 && (
                  <span className="flex shrink-0 items-center gap-0.5">
                    {trophies.map((t, j) =>
                      t.trofeo ? (
                        <Trofeo key={j} id={t.trofeo} pais={paisDeCarrera(career)} size={15} />
                      ) : (
                        <span key={j} className="text-xs leading-none">{t.emoji}</span>
                      ),
                    )}
                  </span>
                )}
              </div>
              <span className="w-9 h-7 rounded-md flex items-center justify-center font-impact font-black text-base shrink-0" style={{ background: roc.bg, color: roc.text }}>{rowOvr}</span>
              <span className="text-center font-bold text-sm text-slate-200 min-w-[28px] font-sport">{s.matchesPlayed}</span>
              <span className="text-center font-bold text-sm text-emerald-400 min-w-[24px] font-sport">
                {esArquero || esDefensor ? s.cleanSheets ?? 0 : s.goals}
              </span>
              <span className="text-center font-bold text-sm text-orange-400 min-w-[24px] font-sport">
                {esArquero ? s.penaltiesSaved ?? 0 : esDefensor ? s.goals : s.assists}
              </span>
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

      {/* MINI-HISTORIA DE RETIRO */}
      {career.finished && (
        <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
          <div className="text-[11px] font-black text-slate-500 font-sport uppercase tracking-widest mb-1">{t('ficha.trasElRetiro', 'Tras el retiro')}</div>
          <p className="text-[13px] leading-snug text-slate-200">📖 {retirementStory(career)}</p>
        </div>
      )}

      {/* FOOTER marca */}
      <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sport font-bold uppercase tracking-wider">
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/gambeta.svg" alt="" className="h-4 w-4" />
          <span className="font-impact font-black text-white tracking-[0.15em]">GAMBETA</span>
          <span className="text-[#F6C750] text-[11px]">★★★</span>
        </span>
        <span className="text-[#74ACDF] text-[11px] tracking-[0.2em]">GAMBETAFUTBOL.GAMES</span>
      </div>
    </div>
  )
}
