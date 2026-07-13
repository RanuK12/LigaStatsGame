"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import playersData from "@/data/players.json"
import squadsData from "@/data/squads.json"
import clubsData from "@/data/clubs.json"
import type { Player, Squad, Club, TournamentResult, TournamentPlayerStats } from "@/lib/types"
import {
  normalizePlayers,
  normalizeSquads,
  normalizeClubs,
} from "@/lib/data-normalizers"
import {
  formations,
  canPlayHere,
  getSquadPlayers,
  calculateTeamScore,
  calculateFullTeamScore,
  GAME_MODES,
  POS_LABELS,
  simulateSeasonWithStats,
  simulateCopaWithStats,
  spinSquadWithPity,
  updatePity,
  PITY_LOW_THRESHOLD,
} from "@/lib/game-engine"

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */
const PC: Record<string, string> = {
  GK: "#f59e0b", CB: "#3b82f6", LB: "#06b6d4", RB: "#06b6d4",
  CDM: "#059669", CM: "#10b981", CAM: "#8b5cf6",
  LW: "#ef4444", RW: "#ef4444", ST: "#dc2626", CF: "#ea580c",
  LM: "#14b8a6", RM: "#14b8a6", LWB: "#0891b2", RWB: "#0891b2",
}
const getPC = (pos?: string) => (pos && PC[pos]) || "#6b7280"

const POS_GROUPS: { label: string; positions: string[]; icon: string }[] = [
  { label: "Arquero", positions: ["GK"], icon: "🧤" },
  { label: "Defensa", positions: ["CB", "LB", "RB", "LWB", "RWB"], icon: "🛡️" },
  { label: "Mediocampo", positions: ["CDM", "CM", "CAM", "LM", "RM"], icon: "⚙️" },
  { label: "Ataque", positions: ["LW", "RW", "ST", "CF"], icon: "⚡" },
]

function getEligibleSquadsForSlot(
  squads: Squad[], players: Player[], slotPosition: string, draftedIds: Set<string>
): Squad[] {
  return squads.filter(squad => {
    const sp = players.filter(p => squad.playerIds.includes(p.id))
    return sp.some(p => !draftedIds.has(p.id) && canPlayHere(p, slotPosition))
  })
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type Phase = "start" | "ready" | "pos-select" | "spinning" | "picking" | "done" | "sim"

interface EnrichedPlayer extends Player { isCompatible: boolean }

interface PityState {
  consecutiveLow: number
  lastRatings: number[]
  pityActive: boolean
}

/* ═══════════════════════════════════════════════════════════════
   PITCH COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function Pitch({ f, draft, activeSlot, onSlotClick, phase }: {
  f: any; draft: (Player | null)[]; activeSlot: number
  onSlotClick: (idx: number) => void; phase: Phase
}) {
  return (
    <div className="pitch w-full max-w-[360px] aspect-[68/105] mx-auto relative">
      <div className="pitch-lines" />
      <div className="pitch-center" />
      <div className="pitch-center-dot" />
      <div className="pitch-area-top" />
      <div className="pitch-area-bottom" />
      {f.positions.map((pos: any, i: number) => {
        const pl = draft[i]
        const isActive = i === activeSlot
        return (
          <div key={i}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute cursor-pointer transition-all duration-200 hover:scale-110 z-10"
            onClick={() => onSlotClick(i)}>
            {pl ? (
              <div className={`flex flex-col items-center ${isActive ? "scale-110" : ""}`}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 shadow-lg transition-all"
                  style={{ backgroundColor: getPC(pos.pos), borderColor: isActive ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                  {pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="text-[9px] text-white font-semibold mt-0.5 bg-black/40 px-1 rounded max-w-[70px] truncate text-center">
                  {pl.name.split(" ").pop()}
                </div>
                <div className="text-[7px] text-slate-400">{POS_LABELS[pos.pos] || pos.pos}</div>
              </div>
            ) : (
              <div className={`flex flex-col items-center ${isActive ? "scale-110" : ""}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dashed transition-all ${
                  isActive ? "border-yellow-400 bg-yellow-400/10 text-yellow-400 animate-pulse" : "border-slate-500 bg-slate-800/50 text-slate-500"
                }`}>
                  {POS_LABELS[pos.pos] || pos.pos}
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5">{pos.label}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PLAYER CARD
   ═══════════════════════════════════════════════════════════════ */
function PlayerCard({ player, onSelect, showRating }: {
  player: EnrichedPlayer; onSelect: () => void; showRating: boolean
}) {
  return (
    <button onClick={onSelect}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-150 ${
        player.isCompatible
          ? "bg-slate-800/80 border border-[#75AADB]/30 hover:border-[#75AADB] hover:bg-slate-700/80 cursor-pointer"
          : "bg-slate-900/40 border border-slate-800 opacity-40 hover:opacity-60 cursor-not-allowed"
      }`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: getPC(player.position) }}>
        {player.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{player.name}</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            player.isCompatible ? "bg-[#75AADB]/20 text-[#75AADB]" : "bg-slate-800 text-slate-500"
          }`}>
            {POS_LABELS[player.position] || player.position}
          </span>
          <span className="text-[10px] text-slate-500">{player.goalsClub}⚽ {player.capsClub}📋</span>
          {player.legendary && <span className="text-[10px]">⭐</span>}
        </div>
      </div>
      {showRating && (
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-[#75AADB]">{player.rating}</div>
        </div>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ROULETTE WHEEL
   ═══════════════════════════════════════════════════════════════ */
function RouletteWheel({ squads, spinning, result }: {
  squads: Squad[]; spinning: boolean; result: Squad | null
}) {
  const [rotation, setRotation] = useState(0)
  const visible = useMemo(() => squads.slice(0, 18), [squads])
  const segAngle = visible.length > 0 ? 360 / visible.length : 360
  const abbrev = (label: string) => label.replace(/['']/g, "").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 4).toUpperCase()
  const colors = ['#dc2626','#ea580c','#d97706','#65a30d','#16a34a','#0d9488','#0891b2','#0284c7','#2563eb','#4f46e5','#7c3aed','#9333ea','#c026d3','#db2777','#e11d48','#dc2626','#ea580c','#d97706']

  useEffect(() => {
    if (spinning && result && visible.length > 0) {
      const idx = visible.findIndex(s => s.id === result.id)
      if (idx >= 0) setRotation(prev => prev + 360 * 6 + (360 - idx * segAngle - segAngle / 2))
    }
  }, [spinning, result, visible, segAngle])

  if (visible.length === 0) return (
    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-center text-sm text-slate-400">
      No hay planteles disponibles para esta posición.
    </div>
  )

  return (
    <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-full border-4 border-slate-600 bg-slate-950 shadow-[0_0_0_8px_rgba(117,170,219,0.08),0_0_50px_rgba(249,115,22,0.18)]">
      <div className="absolute -inset-8 rounded-full bg-orange-500/15 blur-2xl" />
      <div className="absolute -top-1 left-1/2 z-30 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]" />
      <motion.div
        animate={{ rotate: rotation, scale: spinning ? [1, 1.03, 1] : 1 }}
        transition={{ rotate: { duration: spinning ? 3.4 : 0, ease: [0.17, 0.67, 0.12, 0.99] }, scale: { duration: 0.35, repeat: spinning ? Infinity : 0 } }}
        className="absolute inset-0 z-10">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {visible.map((sq, idx) => {
            const s = idx * segAngle, e = (idx + 1) * segAngle
            const sr = (s - 90) * Math.PI / 180, er = (e - 90) * Math.PI / 180
            const x1 = 50 + 50 * Math.cos(sr), y1 = 50 + 50 * Math.sin(sr)
            const x2 = 50 + 50 * Math.cos(er), y2 = 50 + 50 * Math.sin(er)
            const mr = ((s + e) / 2 - 90) * Math.PI / 180
            const tx = 50 + 31 * Math.cos(mr), ty = 50 + 31 * Math.sin(mr)
            return (
              <g key={sq.id}>
                <path d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                  fill={spinning && result?.id === sq.id ? "#f97316" : colors[idx % colors.length]}
                  stroke="#94a3b8" strokeWidth="0.25" />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="3.1" fontWeight="900"
                  transform={`rotate(${(s + e) / 2}, ${tx}, ${ty})`}>
                  {abbrev(sq.label)}
                </text>
              </g>
            )
          })}
          <circle cx="50" cy="50" r="10" fill="#020617" stroke="#f97316" strokeWidth="0.8" />
          <text x="50" y="51.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6">⚽</text>
        </svg>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PITY INDICATOR
   ═══════════════════════════════════════════════════════════════ */
function PityIndicator({ pity }: { pity: PityState }) {
  if (pity.consecutiveLow === 0) return null
  const isPityActive = pity.pityActive
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
        isPityActive
          ? "bg-yellow-500/20 border-yellow-400/50 text-yellow-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
          : "bg-orange-500/10 border-orange-400/30 text-orange-300"
      }`}>
      {isPityActive ? (
        <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>✨</motion.span>
      ) : "🔥"}
      {isPityActive ? "¡Pity activado! Próximo sorteo será épico" : `${pity.consecutiveLow} pick${pity.consecutiveLow > 1 ? "s" : ""} bajo — el siguiente mejora`}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POSITION SELECTOR MODAL
   ═══════════════════════════════════════════════════════════════ */
function PositionSelector({ formation, onSelect, onClose, currentPos }: {
  formation: any
  onSelect: (pos: string) => void
  onClose: () => void
  currentPos: string
}) {
  // Get unique positions from the formation's remaining slots
  const positions = formation.positions.map((p: any) => p.pos)
  const unique = [...new Set<string>(positions)]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-700 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-black text-xl mb-1 text-center">¿Qué posición sorteás?</h3>
        <p className="text-slate-400 text-sm text-center mb-5">Elegí la posición para el próximo spin</p>
        <div className="space-y-3">
          {POS_GROUPS.map(group => {
            const available = group.positions.filter(p => unique.includes(p))
            if (available.length === 0) return null
            return (
              <div key={group.label}>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                  {group.icon} {group.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {available.map(pos => (
                    <button key={pos} onClick={() => onSelect(pos)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all hover:scale-105 ${
                        pos === currentPos
                          ? "bg-[#75AADB] text-white border-[#75AADB] shadow-lg shadow-[#75AADB]/30"
                          : "bg-slate-800 border-slate-600 text-slate-200 hover:border-[#75AADB]/60 hover:bg-slate-700"
                      }`}
                      style={{ borderColor: pos === currentPos ? undefined : getPC(pos) + "55" }}>
                      <span className="inline-block w-5 h-5 rounded-full text-white text-[9px] font-black mr-1 leading-5 text-center" style={{ backgroundColor: getPC(pos) }}>
                        {POS_LABELS[pos]?.slice(0, 3) || pos.slice(0, 3)}
                      </span>
                      {POS_LABELS[pos] || pos}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={onClose} className="w-full mt-5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 text-sm transition-all">
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT RESULTS VIEW
   ═══════════════════════════════════════════════════════════════ */
function TournamentView({ result, onBack, onReset, onDownloadPDF }: {
  result: TournamentResult
  onBack: () => void
  onReset: () => void
  onDownloadPDF: () => void
}) {
  const [tab, setTab] = useState<"table" | "stats" | "assisters" | "schedule">("table")
  const isChamp = result.isChampion
  const tabs = result.type === "liga"
    ? [{ id: "table", label: "📊 Tabla" }, { id: "stats", label: "⚽ Goleadores" }, { id: "assisters", label: "🅰️ Asistencias" }]
    : [{ id: "stats", label: "⚽ Goles" }, { id: "assisters", label: "🅰️ Asistencias" }]

  return (
    <div className="min-h-screen gradient-bg px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Champion / Result banner */}
          <div className={`rounded-2xl p-6 mb-5 text-center border ${
            isChamp
              ? "bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-yellow-600/10 border-yellow-400/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]"
              : result.type === "copa" && result.eliminated
              ? "card-gradient border-slate-700"
              : "card-gradient border-[#75AADB]/30"
          }`}>
            {isChamp && (
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-3">🏆</motion.div>
            )}
            <h1 className="font-display text-3xl font-black mb-1">
              {isChamp
                ? "¡CAMPEÓN!"
                : result.type === "copa" && result.eliminated
                ? `Eliminado en ${result.eliminatedRound}`
                : result.type === "liga"
                ? `Posición ${result.playerPos}° de ${result.table?.length}`
                : "Subcampeón"}
            </h1>
            {isChamp && (
              <p className="text-yellow-300 font-bold text-lg mb-2">
                🎉 ¡{result.teamLabel} es campeón! ¡Felicitaciones!
              </p>
            )}
            {!isChamp && (
              <p className="text-slate-400 text-sm mb-2">
                {result.type === "copa" && result.eliminated
                  ? "Seguí intentando, el próximo equipo será mejor 💪"
                  : `El campeón fue ${result.champion}. Mejor suerte la próxima 💪`}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
              <span className="text-slate-400">{result.teamLabel}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{result.formation}</span>
              <span className="text-slate-600">·</span>
              <span className="text-[#75AADB] font-bold">Score: {result.teamScore} pts</span>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="card-gradient rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-green-400">{result.playerStats.reduce((s, p) => s + p.goals, 0)}</div>
              <div className="text-xs text-slate-400">Goles del equipo</div>
            </div>
            <div className="card-gradient rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-blue-400">{result.playerStats.reduce((s, p) => s + p.assists, 0)}</div>
              <div className="text-xs text-slate-400">Asistencias</div>
            </div>
            <div className="card-gradient rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-yellow-400">{result.playerStats[0]?.matchesPlayed || 0}</div>
              <div className="text-xs text-slate-400">Partidos jugados</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  tab === t.id ? "bg-[#75AADB] text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* TABLE TAB */}
          {tab === "table" && result.table && (
            <div className="card-gradient rounded-2xl p-4 mb-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs border-b border-slate-700">
                      <th className="py-1.5 text-left">#</th>
                      <th className="py-1.5 text-left">Equipo</th>
                      <th className="py-1.5 text-center">PJ</th>
                      <th className="py-1.5 text-center">Pts</th>
                      <th className="py-1.5 text-center">GF</th>
                      <th className="py-1.5 text-center">GC</th>
                      <th className="py-1.5 text-center">DG</th>
                      <th className="py-1.5 text-center">Forma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.table.map((t: any, i: number) => {
                      const isMe = t.name === result.teamLabel
                      return (
                        <tr key={i} className={`border-b border-slate-800 ${isMe ? "bg-[#75AADB]/10 font-semibold" : ""}`}>
                          <td className="py-1.5 text-slate-400">{i + 1}</td>
                          <td className="py-1.5 text-white truncate max-w-[150px]">
                            {isMe ? <span className="text-[#75AADB]">▶ {t.name}</span> : t.name}
                          </td>
                          <td className="py-1.5 text-center text-slate-400">{t.w + t.d + t.l}</td>
                          <td className="py-1.5 text-center text-[#75AADB] font-bold">{t.pts}</td>
                          <td className="py-1.5 text-center text-slate-400">{t.gf}</td>
                          <td className="py-1.5 text-center text-slate-400">{t.ga}</td>
                          <td className={`py-1.5 text-center ${t.gf - t.ga > 0 ? "text-green-400" : t.gf - t.ga < 0 ? "text-red-400" : "text-slate-400"}`}>{t.gf - t.ga > 0 ? "+" : ""}{t.gf - t.ga}</td>
                          <td className="py-1.5 text-center text-xs">
                            {t.form.map((r: string, j: number) => (
                              <span key={j} className={`inline-block w-5 h-5 leading-5 text-center rounded text-[10px] font-bold ${
                                r === "V" ? "bg-green-600 text-white" : r === "E" ? "bg-yellow-600 text-white" : "bg-red-600 text-white"
                              }`}>{r}</span>
                            ))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCORERS TAB */}
          {tab === "stats" && (
            <div className="card-gradient rounded-2xl p-4 mb-5">
              <h3 className="font-display font-bold mb-3">⚽ Tabla de Goleadores</h3>
              <div className="space-y-2">
                {result.topScorers.map((p, i) => (
                  <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                    i === 0 ? "bg-yellow-500/10 border border-yellow-400/30" : "bg-slate-800/50"
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      i === 0 ? "bg-yellow-500 text-black" : "bg-slate-700 text-slate-300"
                    }`}>{i + 1}</div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: getPC(p.position) }}>
                      {p.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{p.playerName}</div>
                      <div className="text-[10px] text-slate-400">{POS_LABELS[p.position] || p.position} · {p.matchesPlayed}P</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-green-400">{p.goals}</div>
                      <div className="text-[10px] text-slate-500">{p.assists}A</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ASSISTERS TAB */}
          {tab === "assisters" && (
            <div className="card-gradient rounded-2xl p-4 mb-5">
              <h3 className="font-display font-bold mb-3">🅰️ Tabla de Asistencias</h3>
              <div className="space-y-2">
                {result.topAssisters.map((p, i) => (
                  <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                    i === 0 ? "bg-blue-500/10 border border-blue-400/30" : "bg-slate-800/50"
                  }`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      i === 0 ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"
                    }`}>{i + 1}</div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: getPC(p.position) }}>
                      {p.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white truncate">{p.playerName}</div>
                      <div className="text-[10px] text-slate-400">{POS_LABELS[p.position] || p.position} · {p.matchesPlayed}P</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-blue-400">{p.assists}</div>
                      <div className="text-[10px] text-slate-500">{p.goals}⚽</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copa rounds */}
          {result.type === "copa" && result.rounds && tab === "stats" && (
            <div className="card-gradient rounded-2xl p-4 mb-5 mt-4">
              <h3 className="font-display font-bold mb-3">📋 Cruces</h3>
              {result.rounds.map((round: any, ri: number) => (
                <div key={ri} className="mb-4">
                  <h4 className="text-sm font-bold text-slate-400 mb-2">{round.round}</h4>
                  <div className="space-y-1">
                    {round.matches.map((m: any, mi: number) => {
                      const isMe = m.home === result.teamLabel || m.away === result.teamLabel
                      return (
                        <div key={mi} className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${isMe ? "bg-[#75AADB]/10 border border-[#75AADB]/20" : "bg-slate-800/30"}`}>
                          <span className={`flex-1 text-right ${m.homeGoals > m.awayGoals ? "font-bold text-white" : "text-slate-400"}`}>{m.home}</span>
                          <span className="px-3 font-bold text-slate-300">{m.homeGoals} - {m.awayGoals}{m.penalties && <span className="text-slate-500 ml-1">({m.penalties}p)</span>}</span>
                          <span className={`flex-1 ${m.awayGoals > m.homeGoals ? "font-bold text-white" : "text-slate-400"}`}>{m.away}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 justify-center flex-wrap mb-6">
            <button onClick={onDownloadPDF}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl font-bold text-white shadow-lg hover:scale-[1.03] transition-all">
              📄 Descargar PDF
            </button>
            <button onClick={onBack} className="btn-secondary px-6 py-3">← Ver equipo</button>
            <button onClick={onReset} className="btn-secondary px-6 py-3">🔄 Nuevo Draft</button>
          </div>
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm text-center block">
            ← Volver al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PDF GENERATOR
   ═══════════════════════════════════════════════════════════════ */
async function generatePDF(result: TournamentResult, draftedPlayers: (Player | null)[], formation: any) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const W = 210, pad = 18

  // Background
  doc.setFillColor(10, 14, 27)
  doc.rect(0, 0, W, 297, "F")

  // Header accent line
  doc.setFillColor(117, 170, 219)
  doc.rect(0, 0, W, 3, "F")

  let y = 14

  // Title
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("LigaStats Game", W / 2, y, { align: "center" })
  y += 8

  doc.setTextColor(180, 180, 200)
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Temporada · ${new Date().toLocaleDateString("es-AR")}`, W / 2, y, { align: "center" })
  y += 10

  // Champion banner
  if (result.isChampion) {
    doc.setFillColor(251, 191, 36, 0.15)
    doc.roundedRect(pad, y - 4, W - pad * 2, 20, 4, 4, "F")
    doc.setTextColor(251, 191, 36)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("🏆 ¡CAMPEÓN! 🏆", W / 2, y + 9, { align: "center" })
    y += 24
  } else {
    doc.setTextColor(200, 200, 220)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    const msg = result.type === "liga"
      ? `Posición ${result.playerPos}° de ${result.table?.length || "?"}`
      : result.eliminated ? `Eliminado en ${result.eliminatedRound}` : "Subcampeón"
    doc.text(msg, W / 2, y + 6, { align: "center" })
    y += 16
  }

  // Team info
  doc.setFillColor(20, 27, 50)
  doc.roundedRect(pad, y, W - pad * 2, 26, 4, 4, "F")
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(result.teamLabel, W / 2, y + 10, { align: "center" })
  doc.setTextColor(140, 150, 180)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Formación: ${result.formation}   ·   Score: ${result.teamScore} pts`, W / 2, y + 20, { align: "center" })
  y += 34

  // Players list
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Plantilla", pad, y)
  y += 6
  doc.setFillColor(117, 170, 219, 0.1)
  doc.rect(pad, y, W - pad * 2, 0.5, "F")
  y += 5

  draftedPlayers.filter(Boolean).forEach((p, i) => {
    if (!p) return
    const slot = formation.positions[i]
    doc.setFillColor(i % 2 === 0 ? 15 : 20, i % 2 === 0 ? 20 : 27, i % 2 === 0 ? 40 : 50)
    doc.rect(pad, y - 3, W - pad * 2, 8, "F")
    doc.setTextColor(200, 210, 230)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`${POS_LABELS[slot?.pos] || slot?.pos || "?"}`, pad + 2, y + 2)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(230, 235, 250)
    doc.text(p.name, pad + 22, y + 2)
    doc.setTextColor(117, 170, 219)
    doc.text(`${p.rating}`, W - pad - 2, y + 2, { align: "right" })
    y += 8
  })
  y += 6

  // Stats
  const totalGoals = result.playerStats.reduce((s, p) => s + p.goals, 0)
  const totalAssists = result.playerStats.reduce((s, p) => s + p.assists, 0)
  const topScorer = result.topScorers[0]
  const topAssister = result.topAssisters[0]

  doc.setFillColor(20, 27, 50)
  doc.roundedRect(pad, y, W - pad * 2, 32, 4, 4, "F")
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Estadísticas del torneo", pad + 6, y + 9)
  doc.setTextColor(200, 210, 230)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`⚽ Goles del equipo: ${totalGoals}`, pad + 6, y + 18)
  doc.text(`🅰️ Asistencias: ${totalAssists}`, pad + 6, y + 25)
  if (topScorer) doc.text(`🥇 Goleador: ${topScorer.playerName} (${topScorer.goals} goles)`, W / 2 + 4, y + 18)
  if (topAssister) doc.text(`🥇 Asistidor: ${topAssister.playerName} (${topAssister.assists} asist.)`, W / 2 + 4, y + 25)
  y += 40

  // Footer
  doc.setFillColor(117, 170, 219)
  doc.rect(0, 294, W, 3, "F")
  doc.setTextColor(100, 110, 140)
  doc.setFontSize(8)
  doc.text("LigaStats Game · ligastatsgame.com · Generado automáticamente", W / 2, 291, { align: "center" })

  doc.save(`LigaStats_${result.teamLabel.replace(/\s+/g, "_")}_${result.type}.pdf`)
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DRAFT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico

  const allP = useMemo(() => normalizePlayers(playersData), [])
  const allS = useMemo(() => normalizeSquads(squadsData), [])

  // ── Game State ──
  const [started, setStarted] = useState(false)
  const [fm, setFm] = useState<string>("4-3-3")
  const [phase, setPhase] = useState<Phase>("start")
  const [drafted, setDrafted] = useState<(Player | null)[]>([])
  const [draftedIds, setDraftedIds] = useState<Set<string>>(new Set())
  const [activeSlotIdx, setActiveSlotIdx] = useState(0)
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [wildcards, setWildcards] = useState(mode.rerolls || 3)
  const [search, setSearch] = useState("")
  const [simResult, setSimResult] = useState<TournamentResult | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [spinNotice, setSpinNotice] = useState<string | null>(null)
  const [showPosSelector, setShowPosSelector] = useState(false)
  const [pity, setPity] = useState<PityState>({ consecutiveLow: 0, lastRatings: [], pityActive: false })

  const f = formations[fm as keyof typeof formations] || formations["4-3-3"]
  const totalSlots = f.positions.length
  const currentPos = f.positions[activeSlotIdx] || f.positions[0]
  const filledCount = drafted.filter(Boolean).length
  const eligibleSquads = useMemo(
    () => getEligibleSquadsForSlot(allS, allP, currentPos.pos, draftedIds),
    [allS, allP, currentPos.pos, draftedIds]
  )
  const teamScore = useMemo(() => calculateFullTeamScore(drafted, f), [drafted, f])
  const partialScore = useMemo(() => calculateTeamScore(drafted, f), [drafted, f])

  const findNextEmpty = useCallback((from: number, board: (Player | null)[]) => {
    let idx = from
    while (idx < totalSlots && board[idx] !== null) idx++
    return idx < totalSlots ? idx : -1
  }, [totalSlots])

  // ── START ──
  const startGame = useCallback(() => {
    const empty = new Array(totalSlots).fill(null)
    setDrafted(empty)
    setDraftedIds(new Set())
    setActiveSlotIdx(0)
    setCurrentSquad(null)
    setWildcards(mode.rerolls || 3)
    setSearch("")
    setSimResult(null)
    setSpinNotice(null)
    setStarted(true)
    setPity({ consecutiveLow: 0, lastRatings: [], pityActive: false })
    setPhase("ready")
  }, [totalSlots, mode])

  // ── SPIN WHEEL ──
  const spinWheel = useCallback((forcedPos?: string) => {
    if (spinning) return
    const posToUse = forcedPos || currentPos.pos
    // Find the slot index for the forced pos (first empty matching slot)
    if (forcedPos) {
      const idx = f.positions.findIndex((p: any, i: number) => p.pos === forcedPos && !drafted[i])
      if (idx >= 0) setActiveSlotIdx(idx)
    }
    const eligible = getEligibleSquadsForSlot(allS, allP, posToUse, draftedIds)
    if (eligible.length === 0) {
      setSpinNotice("No hay planteles disponibles para esta posición. Probá cambiar de posición o reiniciar.")
      setCurrentSquad(null)
      setPhase("ready")
      return
    }
    // Apply pity system
    const result = spinSquadWithPity(eligible, allP, pity)
    setSpinNotice(null)
    setCurrentSquad(result)
    setSpinning(true)
    setPhase("spinning")
    setTimeout(() => { setSpinning(false); setPhase("picking"); setSearch("") }, 2800)
  }, [spinning, allS, allP, currentPos.pos, draftedIds, pity, f, drafted])

  // ── REROLL ──
  const rerollTeam = useCallback(() => {
    if (wildcards <= 0) return
    setWildcards((w: number) => w - 1)
    spinWheel()
  }, [wildcards, spinWheel])

  // ── PICK PLAYER ──
  const pickPlayer = useCallback((player: Player, slotIdx: number) => {
    if (draftedIds.has(player.id)) return
    const requiredPos = f.positions[slotIdx]?.pos
    if (requiredPos && !canPlayHere(player, requiredPos)) return

    const newDrafted = [...drafted]
    newDrafted[slotIdx] = player
    setDrafted(newDrafted)
    setDraftedIds(prev => new Set(prev).add(player.id))

    // Update pity state based on picked player rating
    const newPity = updatePity(pity, player.rating || 60)
    setPity(newPity)

    let nextIdx = slotIdx + 1
    while (nextIdx < newDrafted.length && newDrafted[nextIdx] !== null) nextIdx++

    if (nextIdx < newDrafted.length) {
      setTimeout(() => { setActiveSlotIdx(nextIdx); setCurrentSquad(null); setPhase("ready"); setSearch("") }, 300)
    } else {
      setTimeout(() => { setConfetti(true); setTimeout(() => setConfetti(false), 4000); setPhase("done") }, 300)
    }
  }, [drafted, draftedIds, f, pity])

  // ── SLOT CLICK ──
  const handleSlotClick = useCallback((idx: number) => {
    if (phase === "done") {
      const old = drafted[idx]
      if (old) setDraftedIds(prev => { const n = new Set(prev); n.delete(old.id); return n })
      setDrafted(prev => { const nd = [...prev]; nd[idx] = null; return nd })
      setActiveSlotIdx(idx)
      setCurrentSquad(null)
      setSearch("")
      setSpinNotice(null)
      setPhase("ready")
    } else if (phase === "ready") {
      setActiveSlotIdx(idx)
    }
  }, [phase, drafted])

  // ── REMOVE PLAYER ──
  const removePlayer = useCallback((idx: number) => {
    const old = drafted[idx]
    if (old) setDraftedIds(prev => { const n = new Set(prev); n.delete(old.id); return n })
    setDrafted(prev => { const nd = [...prev]; nd[idx] = null; return nd })
    setActiveSlotIdx(idx)
    setCurrentSquad(null)
    setSpinNotice(null)
    setPhase("ready")
  }, [drafted])

  // ── SIMULATION ──
  const startSim = useCallback((type: "liga" | "copa") => {
    const isP = (x: any): x is Player => x && typeof x.id === "string"
    const players = drafted.filter(isP)
    if (players.length < 11) return
    const virtualSquad: Squad = {
      id: "mi-11-fantasy", clubId: "mi-11", season: "2026",
      competition: "Liga Profesional", label: "Mi 11 Fantasy",
      playerIds: players.map(p => p.id) as [string, ...string[]],
    }
    const score = teamScore || partialScore
    const r = type === "liga"
      ? simulateSeasonWithStats(players, virtualSquad, allS, allP, f, score)
      : simulateCopaWithStats(players, virtualSquad, allS, allP, f, score)
    setSimResult(r)
    setPhase("sim")
  }, [drafted, allS, allP, f, teamScore, partialScore])

  // ── RESET ──
  const resetGame = useCallback(() => {
    setStarted(false); setPhase("start"); setDrafted([]); setDraftedIds(new Set())
    setCurrentSquad(null); setSimResult(null); setSpinNotice(null); setActiveSlotIdx(0)
    setPity({ consecutiveLow: 0, lastRatings: [], pityActive: false })
  }, [])

  // ── PICKER PLAYERS ──
  const pickerPlayers = useMemo(() => {
    if (!currentSquad) return []
    const targetPos = f.positions[activeSlotIdx]?.pos || "CM"
    const squadPlayers = getSquadPlayers(currentSquad, allP)
    const available = squadPlayers.filter(p => !draftedIds.has(p.id))
    const enriched: EnrichedPlayer[] = available.map(p => ({ ...p, isCompatible: canPlayHere(p, targetPos) }))
    enriched.sort((a, b) => {
      if (a.isCompatible !== b.isCompatible) return a.isCompatible ? -1 : 1
      return (b.rating || 0) - (a.rating || 0)
    })
    return enriched.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
  }, [currentSquad, allP, f, activeSlotIdx, search, draftedIds])

  const compatibleCount = pickerPlayers.filter(p => p.isCompatible).length

  /* ── RENDER: START ── */
  if (phase === "start" || !started) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">Liga Argentina Fans</h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Elegí tu formación</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.values(formations).map((fmt: any) => (
                <button key={fmt.id} onClick={() => setFm(fmt.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    fm === fmt.id ? "bg-[#75AADB] text-white shadow-lg shadow-[#75AADB]/20" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}>{fmt.name}</button>
              ))}
            </div>
            <div className="mt-4"><Pitch f={f} draft={[]} activeSlot={-1} onSlotClick={() => {}} phase="start" /></div>
          </div>
          <div className="card-gradient rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-display font-bold text-lg mb-3">Cómo Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Elegís la <strong className="text-slate-200">posición</strong> que querés sortear</li>
              <li>2. Girás la ruleta — te toca un <strong className="text-slate-200">equipo + año</strong></li>
              <li>3. Elegís <strong className="text-slate-200">un solo jugador</strong> de esa posición</li>
              <li>4. El <strong className="text-yellow-300">sistema Pity</strong> garantiza que no te salgan solo jugadores bajos</li>
              <li>5. Armá los 11 y <strong className="text-slate-200">simulá el torneo con estadísticas</strong></li>
            </ol>
          </div>
          <button onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#75AADB] to-blue-600 rounded-xl font-bold text-lg shadow-lg shadow-[#75AADB]/25 hover:shadow-[#75AADB]/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
            🚀 Comenzar Draft
          </button>
          <Link href="/" className="block mt-6 text-slate-400 hover:text-white transition-colors text-sm">← Volver al inicio</Link>
        </motion.div>
      </div>
    )
  }

  /* ── RENDER: SIM RESULTS ── */
  if (phase === "sim" && simResult) {
    return (
      <TournamentView
        result={simResult}
        onBack={() => { setPhase("done"); setSimResult(null) }}
        onReset={resetGame}
        onDownloadPDF={() => generatePDF(simResult, drafted, f)}
      />
    )
  }

  /* ── RENDER: MAIN GAME ── */
  return (
    <div className="min-h-screen gradient-bg">
      {/* Position Selector Modal */}
      <AnimatePresence>
        {showPosSelector && (
          <PositionSelector
            formation={f}
            currentPos={currentPos.pos}
            onSelect={(pos) => {
              setShowPosSelector(false)
              spinWheel(pos)
            }}
            onClose={() => setShowPosSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="pt-6 pb-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-6 h-6" />
          <span className="text-xs font-medium text-slate-500">{mode.icon} {mode.name}</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black gradient-text">Armá tu 11</h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm flex-wrap">
          <span className="text-slate-400">
            Posición: <strong className="text-white">{POS_LABELS[currentPos.pos] || currentPos.pos}</strong>
            <span className="text-slate-500 ml-1">({activeSlotIdx + 1}/{totalSlots})</span>
          </span>
          <span className="text-slate-400">Equipo: <strong className="text-[#75AADB]">{filledCount}/11</strong></span>
          {teamScore > 0 && <span className="text-[#75AADB] font-bold">⭐ {teamScore} pts</span>}
          {wildcards > 0 && <span className="text-yellow-400">💎 {wildcards}</span>}
        </div>
        {/* Pity indicator */}
        <div className="flex justify-center mt-2">
          <PityIndicator pity={pity} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
          <div className="bg-gradient-to-r from-[#75AADB] to-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / totalSlots) * 100}%` }} />
        </div>

        {/* PHASE: READY */}
        {phase === "ready" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {spinNotice && (
              <div className="card-gradient rounded-xl p-3 mb-4 text-sm text-amber-200 border border-amber-400/20">{spinNotice}</div>
            )}
            <div className="card-gradient rounded-xl p-4 mb-4 text-center">
              <div className="text-sm text-slate-400 mb-1">Posición {filledCount + 1} de {totalSlots}:</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos]}</div>
                <span className="font-display font-bold text-xl text-white">{currentPos.label}</span>
              </div>
            </div>
            <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} /></div>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => spinWheel()}
                className="px-10 py-4 bg-gradient-to-r from-[#75AADB] to-blue-600 rounded-xl font-bold text-lg shadow-lg shadow-[#75AADB]/25 hover:shadow-[#75AADB]/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
                🎲 ¡Girar Ruleta!
              </button>
              <button onClick={() => setShowPosSelector(true)}
                className="px-6 py-4 bg-slate-800 border border-slate-600 rounded-xl font-bold text-slate-200 hover:border-[#75AADB]/60 hover:bg-slate-700 transition-all">
                🎯 Elegir posición
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Girá para la posición actual · o elegí otra posición manualmente
            </p>
          </motion.div>
        )}

        {/* PHASE: SPINNING */}
        {phase === "spinning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            {pity.pityActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-xl text-yellow-300 text-sm font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                ✨ ¡Modo Pity Activado! Buscando un plantel de élite...
              </motion.div>
            )}
            <p className="text-slate-400 mb-4 text-sm">🎰 Girando para{" "}
              <strong style={{ color: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos]}</strong>
              {" "}({filledCount + 1}/{totalSlots})
            </p>
            <RouletteWheel squads={eligibleSquads} spinning={true} result={currentSquad} />
            <p className="mt-4 text-sm text-slate-500">Buscando el plantel perfecto para tu equipo...</p>
          </motion.div>
        )}

        {/* PHASE: PICKING */}
        {phase === "picking" && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card-gradient rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`/LigaStatsGame/logos/clubs/${currentSquad.clubId}.png`} alt=""
                  className="w-12 h-12 rounded-lg object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                <div>
                  <div className="font-display font-bold text-lg">{currentSquad.label}</div>
                  <div className="text-xs text-slate-400">
                    <span className="text-[#75AADB]">{compatibleCount}</span> compatible{compatibleCount !== 1 ? "s" : ""} para{" "}
                    <strong className="text-white">{POS_LABELS[currentPos.pos]}</strong>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={rerollTeam} disabled={wildcards <= 0}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  🔄 Re-sortear ({wildcards})
                </button>
              </div>
            </div>
            <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} /></div>
            <div className="card-gradient rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm">
                  ⚡ Elegí{" "}
                  <span style={{ color: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos] || currentPos.pos}</span>
                  {" "}— 1 solo jugador
                </h3>
                <span className="text-xs text-slate-500">{pickerPlayers.length} disp. · {filledCount}/{totalSlots}</span>
              </div>
              <input type="text" placeholder="🔍 Buscar jugador..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-full mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {pickerPlayers.length === 0 && (
                  <p className="text-slate-500 text-sm text-center col-span-2 py-4">
                    {draftedIds.size > 0 && currentSquad
                      ? "🔄 Todos los jugadores ya fueron elegidos. Girá de nuevo."
                      : "Sin jugadores para esta posición. Usá 🔄 Re-sortear."}
                  </p>
                )}
                {pickerPlayers.map(player => (
                  <PlayerCard key={player.id} player={player}
                    onSelect={() => pickPlayer(player, activeSlotIdx)}
                    showRating={mode.ratingsVisible} />
                ))}
              </div>
              {pickerPlayers.length > 0 && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  {compatibleCount > 0
                    ? `✅ ${compatibleCount} compatible${compatibleCount !== 1 ? "s" : ""} — elegí uno y girá de nuevo`
                    : "⚠️ Ninguno compatible — usá 🔄 Re-sortear"}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE: DONE */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {confetti && (
              <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} transition={{ duration: 0.6 }} className="text-8xl">🎉</motion.div>
              </div>
            )}
            <div className="card-gradient rounded-2xl p-6 mb-6">
              <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Armado!</h2>
              <p className="text-slate-400 text-sm mb-4">Tocá cualquier posición para cambiar el jugador</p>
              <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} /></div>
              {/* Player chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {f.positions.map((pos: any, i: number) => {
                  const pl = drafted[i]
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700 group relative">
                      <button onClick={() => removePlayer(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                        style={{ backgroundColor: getPC(pos.pos) }}>
                        {pl ? pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : POS_LABELS[pos.pos]}
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-white truncate max-w-[80px]">
                          {pl ? pl.name.split(" ").pop() : <span className="text-slate-500 italic">vacío</span>}
                        </div>
                        <div className="text-[8px] text-slate-500">{POS_LABELS[pos.pos] || pos.pos}</div>
                      </div>
                      {pl && mode.ratingsVisible && <span className="text-[10px] font-bold text-[#75AADB]">{pl.rating}</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-2xl font-display font-black text-[#75AADB]">Score: {teamScore || partialScore} pts</div>
            </div>
            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={() => startSim("liga")} className="btn-primary text-lg px-8 py-3">🏆 Simular Liga</button>
              <button onClick={() => startSim("copa")} className="btn-primary text-lg px-6 py-3">🏅 Simular Copa</button>
              <button onClick={resetGame} className="btn-secondary px-6 py-3">🔄 Nuevo Draft</button>
            </div>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Volver al inicio</Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WRAPPER
   ═══════════════════════════════════════════════════════════════ */
export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center text-slate-400">Cargando...</div>}>
      <DraftInner />
    </Suspense>
  )
}
