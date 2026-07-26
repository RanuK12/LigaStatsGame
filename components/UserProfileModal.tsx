"use client"
import { useEffect, useState } from "react"
import { useUserStore } from "@/lib/user-store"
import { rankFromElo } from "@/lib/ranking"
import { SEED_RIVALS } from "@/lib/leaderboard-seed"
import { loadLocalScores } from "@/lib/scores"
import TierBadge from "./TierBadge"

export default function UserProfileModal() {
  const { user, isProfileModalOpen, closeProfileModal, logout } = useUserStore()
  // Puesto en la tabla: contra los DTs de la casa + tus propias partidas.
  const [puesto, setPuesto] = useState<{ n: number; total: number } | null>(null)
  useEffect(() => {
    if (!isProfileModalOpen || !user) return
    const tabla = [...SEED_RIVALS.map((r) => r.elo), ...loadLocalScores().map((s) => s.elo)]
    const porEncima = tabla.filter((e) => e > user.elo).length
    setPuesto({ n: porEncima + 1, total: tabla.length + 1 })
  }, [isProfileModalOpen, user])

  // Close on ESC while the modal is open.
  useEffect(() => {
    if (!isProfileModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProfileModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isProfileModalOpen, closeProfileModal])

  if (!isProfileModalOpen || !user) return null

  return (
    <div
      onClick={closeProfileModal}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer overflow-y-auto animate-[fadeIn_0.15s_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#74ACDF]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden text-center cursor-default max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#0c1526] to-[#060b16] animate-[popIn_0.18s_ease-out]"
      >
            <button
              onClick={closeProfileModal}
              aria-label="Cerrar"
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/60 border border-slate-800"
            >
              ✕
            </button>

            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                referrerPolicy="no-referrer"
                className="w-20 h-20 mx-auto rounded-full object-cover border-2 border-white/20 mb-4 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#74ACDF] to-blue-600 border-2 border-white/20 flex items-center justify-center text-3xl font-black text-white font-display mb-4 shadow-lg">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
            )}

            <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
              {user.username}
            </h3>
            <div className="flex justify-center mt-2">
              <TierBadge elo={user.elo} showElo />
            </div>
            {(() => {
              const r = rankFromElo(user.elo)
              return r.toNext > 0 ? (
                <div className="mt-3 px-2">
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.progressPct}%`, background: r.tier.color }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-sport uppercase tracking-wider">
                    Faltan {r.toNext} ELO para {r.nextLabel}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-amber-400 mt-2 font-sport uppercase tracking-wider">👑 Cima del ranking</p>
              )
            })()}

            {puesto && (
              <div className="mt-5 rounded-2xl border border-[#74ACDF]/30 bg-[#74ACDF]/[0.07] p-3.5">
                <div className="text-[9px] font-black font-sport uppercase tracking-widest text-[#74ACDF]">Puesto en el ranking</div>
                <div className="font-display text-3xl font-black text-white leading-none mt-1">
                  #{puesto.n} <span className="text-slate-500 text-base">de {puesto.total}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-sport uppercase tracking-wider">
                  {puesto.n === 1 ? '👑 Número uno' : puesto.n <= 3 ? '🔥 En el podio' : puesto.n <= 10 ? '💪 Top 10' : 'Jugá más torneos para escalar'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 my-6">
              <div className="card-glass p-3 rounded-2xl border border-white/5">
                <div className="text-xl font-black text-[#74ACDF] font-display">{user.elo}</div>
                <div className="text-[9px] text-slate-400 uppercase font-sport tracking-wider mt-0.5">Rating ELO</div>
              </div>
              <div className="card-glass p-3 rounded-2xl border border-white/5">
                <div className="text-xl font-black text-amber-400 font-display">🏆 {user.titles}</div>
                <div className="text-[9px] text-slate-400 uppercase font-sport tracking-wider mt-0.5">Títulos</div>
              </div>
              <div className="card-glass p-3 rounded-2xl border border-white/5">
                <div className="text-xl font-black text-emerald-400 font-display">{user.draftsCompleted}</div>
                <div className="text-[9px] text-slate-400 uppercase font-sport tracking-wider mt-0.5">Drafts</div>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                closeProfileModal()
              }}
              className="w-full py-3 bg-red-600/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold font-sport uppercase tracking-wider hover:bg-red-600/30 transition-colors"
            >
              Cerrar Sesión
            </button>
      </div>
    </div>
  )
}
