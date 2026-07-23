"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import CareerCardView, { CareerCardData } from "@/components/pitch/CareerCardView"

export default function CarreraPage() {
  const [inCareer, setInCareer] = useState(false)
  const [season, setSeason] = useState(1)
  const [careerData, setCareerData] = useState<CareerCardData>({
    playerName: "FRANCO ORDOÑES",
    number: 62,
    position: "DFC",
    overall: 80,
    marketValue: "€14M",
    matchesPlayed: 142,
    goals: 8,
    assists: 5,
    clubs: [
      { id: "talleres", name: "Talleres (CBA)", logoUrl: "/LigaStatsGame/logos/clubs/talleres-cba.png" },
      { id: "atl-tucuman", name: "Atlético Tucumán", logoUrl: "/LigaStatsGame/logos/clubs/atl-tucuman.png" },
      { id: "palmeiras", name: "Palmeiras" },
    ],
    trophies: [
      { id: "libertadores", name: "Libertadores", count: 2, icon: "🏆" },
      { id: "sudamericana", name: "Sudamericana", count: 1, icon: "🥇" },
      { id: "lpf", name: "Liga Profesional", count: 2, icon: "⭐" },
      { id: "copa-arg", name: "Copa Argentina", count: 1, icon: "🥛" },
    ],
  })

  const handleSimulateSeason = () => {
    setSeason((prev) => prev + 1)
    setCareerData((prev) => {
      const addedMatches = Math.floor(Math.random() * 15) + 30
      const addedGoals = Math.floor(Math.random() * 4)
      const addedAssists = Math.floor(Math.random() * 3)
      const newOvr = Math.min(94, prev.overall + (Math.random() > 0.5 ? 1 : 0))
      const newVal = `€${Math.min(95, parseInt(prev.marketValue.replace(/\D/g, "")) + 3)}M`

      return {
        ...prev,
        overall: newOvr,
        marketValue: newVal,
        matchesPlayed: prev.matchesPlayed + addedMatches,
        goals: prev.goals + addedGoals,
        assists: prev.assists + addedAssists,
        trophies: prev.trophies.map((t) => (t.id === "libertadores" ? { ...t, count: t.count + 1 } : t)),
      }
    })
  }

  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg text-white px-4 py-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="card-gradient rounded-3xl p-6 sm:p-8 border border-[#74ACDF]/20 text-center relative overflow-hidden">
          <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
            NUEVO MODO DE JUEGO
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            MODO CARRERA MULTI-TEMPORADA
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-2 leading-relaxed">
            Armá tu trayectoria año a año, competí en la Liga Argentina, Copa Libertadores y Sudamericana, y ganá valor de mercado en millones.
          </p>
        </div>

        {/* CARREERA CARD DEMO / SIMULATOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* LEFT: FICHA ESTILO COPERO */}
          <div>
            <CareerCardView data={careerData} />
          </div>

          {/* RIGHT: CONTROLES DE SIMULACIÓN */}
          <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-5">
            <div>
              <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase font-sport block mb-1">
                TEMPORADA {season} (2026)
              </span>
              <h3 className="font-display text-2xl font-black uppercase text-white">
                DESARROLLO DE CARRERA
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-slate-400 font-sport">Jugador:</span>
                <span className="font-bold text-white">{careerData.playerName}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-slate-400 font-sport">Posición / Rating:</span>
                <span className="font-bold text-[#74ACDF]">{careerData.position} • {careerData.overall} OVR</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-slate-400 font-sport">Valor de Mercado:</span>
                <span className="font-bold text-amber-400">{careerData.marketValue}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-2">
                <span className="text-slate-400 font-sport">Títulos Ganados:</span>
                <span className="font-bold text-white">
                  {careerData.trophies.reduce((acc, t) => acc + t.count, 0)} Títulos
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-3 font-sport">
              <button
                onClick={handleSimulateSeason}
                className="btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg"
              >
                SIMULAR SIGUIENTE TEMPORADA ⏩
              </button>
              <button
                onClick={() => window.print()}
                className="btn-gold w-full py-3.5 text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg"
              >
                DESCARGAR FICHA HD (PDF / PNG)
              </button>
            </div>
          </div>
        </div>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider inline-block py-2.5 px-4"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
