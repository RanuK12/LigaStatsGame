"use client"

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import { Player, Club } from '@/lib/types'

const posColors: Record<string, string> = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#06b6d4', RB: '#06b6d4',
  CM: '#10b981', CDM: '#059669', CAM: '#8b5cf6', LW: '#ef4444', RW: '#ef4444',
  ST: '#dc2626', CF: '#ea580c'
}

export default function RuletaPage() {
  const allPlayers = playersData as Player[]
  const allClubs = clubsData as Club[]
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Player | null>(null)
  const [spinCount, setSpinCount] = useState(0)
  const [history, setHistory] = useState<Player[]>([])
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef<HTMLDivElement>(null)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setResult(null)

    // Random player
    const randomIdx = Math.floor(Math.random() * allPlayers.length)
    const player = allPlayers[randomIdx]

    // Animate wheel
    const newRotation = rotation + 1440 + (360 * randomIdx / allPlayers.length)
    setRotation(newRotation)

    setTimeout(() => {
      setResult(player)
      setSpinning(false)
      setSpinCount(c => c + 1)
      setHistory(h => [player, ...h].slice(0, 10))
    }, 3000)
  }

  const getClubInfo = (player: Player): Club | undefined => {
    return allClubs.find(c =>
      player.clubs?.some(pc => pc.id === c.id || pc.name === c.name)
    )
  }

  // Wheel sectors - show first 12 players as examples
  const wheelPlayers = allPlayers.slice(0, 12)
  const sectorAngle = 360 / wheelPlayers.length

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">
            🎰 <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Ruleta del Fútbol</span>
          </h1>
          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Girá la ruleta y descubrí una leyenda de la Superliga Argentina.
          </p>
        </motion.div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-20 space-y-8">
        {/* Wheel */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          {/* Indicator */}
          <div className="text-3xl mb-2">▼</div>

          <div className="relative w-72 h-72 md:w-80 md:h-80">
            {/* Wheel */}
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-4 border-slate-600 overflow-hidden transition-transform duration-3000 ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {wheelPlayers.map((player, i) => {
                  const startAngle = i * sectorAngle
                  const endAngle = (i + 1) * sectorAngle
                  const startRad = (startAngle - 90) * Math.PI / 180
                  const endRad = (endAngle - 90) * Math.PI / 180
                  const x1 = 50 + 50 * Math.cos(startRad)
                  const y1 = 50 + 50 * Math.sin(startRad)
                  const x2 = 50 + 50 * Math.cos(endRad)
                  const y2 = 50 + 50 * Math.sin(endRad)
                  const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180
                  const textX = 50 + 30 * Math.cos(midRad)
                  const textY = 50 + 30 * Math.sin(midRad)
                  const colors = ['#1e293b', '#334155', '#1e3a5f', '#1a3a2a', '#3b1a1a', '#3b2e1a']
                  const textAngle = (startAngle + endAngle) / 2

                  return (
                    <g key={player.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                        fill={colors[i % colors.length]}
                        stroke="#475569"
                        strokeWidth="0.3"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="3.2"
                        fontWeight="bold"
                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                      >
                        {player.name.split(' ').pop()}
                      </text>
                    </g>
                  )
                })}
                {/* Center circle */}
                <circle cx="50" cy="50" r="8" fill="#0f172a" stroke="#475569" strokeWidth="0.5"/>
                <text x="50" y="51" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5">⚽</text>
              </svg>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/5 to-rose-500/5 pointer-events-none" />
          </div>

          {/* Spin Button */}
          <motion.button
            whileHover={{ scale: spinning ? 1 : 1.05 }}
            whileTap={{ scale: spinning ? 1 : 0.95 }}
            onClick={spin}
            disabled={spinning}
            className={`mt-8 px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl transition-all ${
              spinning
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-rose-500/30 hover:shadow-rose-500/50'
            }`}
          >
            {spinning ? '⏳ Girando...' : '🎲 ¡Girar Ruleta!'}
          </motion.button>

          <div className="mt-4 text-sm text-slate-500">
            {spinCount > 0 ? `${spinCount} giros realizados` : 'Tocá para girar'}
          </div>
        </motion.section>

        {/* Result Card */}
        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto max-w-md"
            >
              <div className="card-gradient rounded-2xl p-8 border border-slate-700 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="text-sm text-slate-400 mb-2">🎉 ¡LeyendaSorteada!</div>
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl text-white"
                      style={{ backgroundColor: posColors[result.position] || '#666' }}
                    >
                      {result.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-black">{result.name}</h2>
                      <div className="text-sm text-slate-400">
                        {result.position} • {result.decade}
                      </div>
                    </div>
                  </div>
                  {result.legendary && (
                    <div className="mt-2 text-sm text-yellow-400">⭐ Jugador Legendario</div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-black text-yellow-400">{result.rating}</div>
                    <div className="text-xs text-slate-400">Rating</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-black text-green-400">{result.goalsClub}</div>
                    <div className="text-xs text-slate-400">Goles Club</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-black text-blue-400">{result.capsClub}</div>
                    <div className="text-xs text-slate-400">Partidos</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-black text-purple-400">{result.goalsNationalTeam}</div>
                    <div className="text-xs text-slate-400">Goles Selección</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-black text-cyan-400">{result.capsNationalTeam}</div>
                    <div className="text-xs text-slate-400">Partidos Selección</div>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 rounded-xl">
                    <div className="text-2xl font-black text-orange-400">{result.assistsClub}</div>
                    <div className="text-xs text-slate-400">Asistencias</div>
                  </div>
                </div>

                {/* Club Info */}
                {result.clubs && result.clubs.length > 0 && (
                  <div className="mb-4 p-4 bg-slate-800/30 rounded-xl">
                    <div className="text-sm text-slate-400 mb-2">⚽ Clubes</div>
                    {result.clubs.map((club, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="font-semibold">{club.name}</span>
                        <span className="text-slate-400">{club.years}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trophies */}
                {result.trophies && result.trophies.length > 0 && (
                  <div className="p-4 bg-slate-800/30 rounded-xl">
                    <div className="text-sm text-slate-400 mb-2">🏆 Títulos</div>
                    <div className="flex flex-wrap gap-2">
                      {result.trophies.slice(0, 6).map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">
                          {t.competition} {t.year}
                        </span>
                      ))}
                      {result.trophies.length > 6 && (
                        <span className="px-2 py-1 bg-slate-700 rounded-lg text-xs text-slate-300">
                          +{result.trophies.length - 6} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h2 className="text-xl font-bold">📜 Historial ({history.length})</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((p, i) => (
                <div
                  key={`${p.id}-${i}`}
                  className="flex-shrink-0 w-40 p-3 rounded-xl bg-slate-800/50 border border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: posColors[p.position] }}
                    >
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-xs truncate">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.rating}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Back */}
        <div className="text-center pt-4">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-slate-700 rounded-xl font-bold text-lg hover:bg-slate-600 transition-all"
            >
              🏠 Volver al Inicio
            </motion.button>
          </Link>
        </div>
      </main>
    </div>
  )
}
