"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { calculateAttributes, type PlayerAttributes } from "@/lib/attributes-engine"

export default function PlayerRadarChart({
  ovr,
  position,
}: {
  ovr: number
  position: string
}) {
  const [activeStat, setActiveStat] = useState<string | null>(null)
  const attrs = calculateAttributes(ovr, position)

  const stats = [
    { key: "PAC", label: "Ritmo", value: attrs.pac },
    { key: "SHO", label: "Tiro", value: attrs.sho },
    { key: "PAS", label: "Pase", value: attrs.pas },
    { key: "DRI", label: "Gambeta", value: attrs.dri },
    { key: "DEF", label: "Defensa", value: attrs.def },
    { key: "PHY", label: "Físico", value: attrs.phy },
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
    <div className="card-glass rounded-3xl p-5 border border-amber-400/20 text-center font-sans space-y-3 relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#74ACDF] font-sport uppercase tracking-wider">
          {"📊 RADAR DE ATRIBUTOS FIFA"}
        </span>
        <span className="text-[10px] font-black text-amber-400 font-sport">
          {ovr} OVR
        </span>
      </div>

      <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#74ACDF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Concentric Hexagons */}
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

          {/* Axis Lines */}
          {stats.map((_, i) => {
            const { x, y } = getCoordinates(i, stats.length, 100)
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />
            )
          })}

          {/* Player Data Polygon */}
          <polygon
            points={polygonPoints}
            fill="url(#radarFill)"
            stroke="#F59E0B"
            strokeWidth="2.5"
            className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          />

          {/* Interactive Vertex Nodes */}
          {stats.map((s, i) => {
            const { x, y } = getCoordinates(i, stats.length, s.value)
            const isHovered = activeStat === s.key
            return (
              <g
                key={s.key}
                onMouseEnter={() => setActiveStat(s.key)}
                onMouseLeave={() => setActiveStat(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill="#ffffff"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  className="transition-all"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* STATS TILES GRID */}
      <div className="grid grid-cols-3 gap-2 font-sport text-xs pt-1">
        {stats.map((s) => (
          <div
            key={s.key}
            onMouseEnter={() => setActiveStat(s.key)}
            onMouseLeave={() => setActiveStat(null)}
            className={`p-2 rounded-xl border text-center transition-all ${
              activeStat === s.key
                ? "bg-[#74ACDF]/20 border-[#74ACDF] text-white scale-105"
                : "bg-slate-950/60 border-white/5 text-slate-300"
            }`}
          >
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {s.key} · {s.label}
            </div>
            <div className="text-sm font-black text-amber-300 font-display mt-0.5">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
