"use client"

import React from "react"

export interface TeamTacticalMetrics {
  attack: number // Poder Ofensivo
  creation: number // Creación de Juego
  defense: number // Solidez Defensiva
  chemistry: number // Química
  starPower: number // Jerarquía Estrella
  experience: number // Experiencia Campeona
}

export default function TeamTacticalRadar({
  metrics,
}: {
  metrics: TeamTacticalMetrics
}) {
  const stats = [
    { key: "ATA", label: "Ataque", value: metrics.attack },
    { key: "CRE", label: "Creación", value: metrics.creation },
    { key: "DEF", label: "Defensa", value: metrics.defense },
    { key: "QUI", label: "Química", value: metrics.chemistry },
    { key: "JER", label: "Jerarquía", value: metrics.starPower },
    { key: "EXP", label: "Experiencia", value: metrics.experience },
  ]

  const center = 100
  const radius = 70

  function getCoordinates(index: number, total: number, val: number) {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2
    const r = (val / 100) * radius
    const x = center + r * Math.cos(angle)
    const y = center + r * Math.sin(angle)
    return { x, y }
  }

  const polygonPoints = stats
    .map((s, i) => {
      const { x, y } = getCoordinates(i, stats.length, s.value)
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="card-glass rounded-3xl p-5 border border-[#74ACDF]/30 text-center font-sans space-y-3 relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#74ACDF] font-sport uppercase tracking-wider">
          ⚔️ ANÁLISIS TÁCTICO DE PLANTEL FANTASY
        </span>
        <span className="text-[10px] font-black text-amber-400 font-sport">
          FANTASY XI
        </span>
      </div>

      <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="teamRadarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1.0].map((level, lvlIdx) => {
            const levelPoints = stats
              .map((_, i) => {
                const { x, y } = getCoordinates(i, stats.length, 100 * level)
                return `${x},${y}`
              })
              .join(" ")
            return (
              <polygon
                key={lvlIdx}
                points={levelPoints}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
              />
            )
          })}

          <polygon
            points={polygonPoints}
            fill="url(#teamRadarGrad)"
            stroke="#38BDF8"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"
          />

          {stats.map((s, i) => {
            const { x, y } = getCoordinates(i, stats.length, s.value)
            return (
              <circle
                key={s.key}
                cx={x}
                cy={y}
                r={4}
                fill="#ffffff"
                stroke="#38BDF8"
                strokeWidth="2"
              />
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 font-sport text-xs">
        {stats.map((s) => (
          <div key={s.key} className="p-2 rounded-xl bg-slate-950/60 border border-white/5 text-center">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
            <div className="text-sm font-black text-amber-300 font-display mt-0.5">{s.value}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
