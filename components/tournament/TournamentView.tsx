"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import type { TournamentResult } from "@/lib/types"
import { POS_LABELS } from "@/lib/game-engine"
import { getPC } from "@/lib/ui-constants"

export default
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
          <div className="flex gap-3 justify-center flex-wrap mb-6 font-sport">
            <button onClick={onDownloadPDF} className="btn-primary px-6 py-3">
              Descargar PDF
            </button>
            <button onClick={onBack} className="btn-secondary px-6 py-3">Ver equipo</button>
            <button onClick={onReset} className="btn-secondary px-6 py-3">Nuevo Draft</button>
          </div>
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm text-center block">
            ← Volver al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
