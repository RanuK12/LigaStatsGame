"use client"

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import wheelData from '@/data/derived/ruleta-wheel.json'
import clubsData from '@/data/clubs.json'
import type { Player, Club } from '@/lib/types'
import { normalizePlayers, normalizeClubs } from '@/lib/data-normalizers'

const posColors: Record<string, string> = {
  GK: '#f59e0b',
  CB: '#3b82f6',
  LB: '#06b6d4',
  RB: '#06b6d4',
  CM: '#10b981',
  CDM: '#059669',
  CAM: '#8b5cf6',
  LW: '#ef4444',
  RW: '#ef4444',
  ST: '#dc2626',
  CF: '#ea580c',
  LM: '#ef4444',
  RM: '#ef4444',
  LWB: '#06b6d4',
  RWB: '#06b6d4',
}

const FULL_SPINS = 7
const ANIMATION_DURATION_MS = 3600

export default function RuletaPage() {
  const allPlayers = useMemo(() => normalizePlayers(wheelData), [])
  const allClubs = useMemo(() => normalizeClubs(clubsData), [])
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Player | null>(null)
  const [spinCount, setSpinCount] = useState(0)
  const [history, setHistory] = useState<Player[]>([])
  const [rotation, setRotation] = useState(0)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)

  const wheelPlayers = useMemo(() => {
    const sorted = [...allPlayers]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 16)

    return sorted.length > 0 ? sorted : allPlayers.slice(0, 16)
  }, [allPlayers])

  const sectorAngle = wheelPlayers.length > 0 ? 360 / wheelPlayers.length : 360

  const spin = () => {
    if (spinning || wheelPlayers.length === 0) return

    setSpinning(true)
    setResult(null)

    const randomIdx = Math.floor(Math.random() * wheelPlayers.length)
    const player = wheelPlayers[randomIdx]
    const sectorCenter = randomIdx * sectorAngle + sectorAngle / 2
    const pointerAngle = 360 - sectorCenter
    const newRotation = rotation + FULL_SPINS * 360 + pointerAngle

    setTargetIndex(randomIdx)
    setRotation(newRotation)

    setTimeout(() => {
      setResult(player)
      setSpinning(false)
      setSpinCount((count) => count + 1)
      setHistory((current) => [player, ...current].slice(0, 10))
    }, ANIMATION_DURATION_MS)
  }

  const getClubInfo = (player: Player): Club | undefined => {
    return allClubs.find((club) =>
      player.clubs?.some((playerClub) => playerClub.id === club.id || playerClub.name === club.name)
    )
  }

  const resultClub = result ? getClubInfo(result) : undefined

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-orange-300">
            Scouting argentino
          </p>

          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight">
            🎰 <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Ruleta del Fútbol</span>
          </h1>

          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Girá la ruleta y descubrí una leyenda o figura histórica del fútbol argentino.
          </p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-20 space-y-8">
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="relative z-20 mb-[-6px]">
            <div className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-orange-400 drop-shadow-[0_0_14px_rgba(251,146,60,0.8)]" />
          </div>

          <div className="relative h-72 w-72 md:h-96 md:w-96">
            <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-[#75AADB]/10 blur-2xl" />
            <div className="absolute -inset-2 rounded-full border border-orange-300/20" />
            <div className="absolute inset-0 rounded-full bg-slate-950/50 shadow-2xl shadow-orange-500/20" />

            <motion.div
              className="relative z-10 h-full w-full overflow-hidden rounded-full border-[10px] border-slate-800 bg-slate-900 shadow-inner"
              animate={{
                rotate: rotation,
                scale: spinning ? [1, 1.025, 1] : 1,
                filter: spinning ? 'blur(0.4px)' : 'blur(0px)',
              }}
              transition={{
                rotate: { duration: ANIMATION_DURATION_MS / 1000, ease: [0.12, 0.75, 0.22, 1] },
                scale: { duration: 0.35, repeat: spinning ? Infinity : 0 },
              }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
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
                  const textX = 50 + 31 * Math.cos(midRad)
                  const textY = 50 + 31 * Math.sin(midRad)
                  const colors = ['#172554', '#0f766e', '#7f1d1d', '#78350f', '#312e81', '#14532d', '#881337', '#1e293b']
                  const textAngle = (startAngle + endAngle) / 2
                  const selected = targetIndex === i && spinning

                  return (
                    <g key={player.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                        fill={selected ? '#f97316' : colors[i % colors.length]}
                        stroke="#94a3b8"
                        strokeWidth="0.25"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="3"
                        fontWeight="900"
                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                      >
                        {player.name.split(' ').pop()?.slice(0, 10)}
                      </text>
                    </g>
                  )
                })}

                <circle cx="50" cy="50" r="10" fill="#020617" stroke="#f97316" strokeWidth="0.8"/>
                <text x="50" y="51.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6">⚽</text>
              </svg>
            </motion.div>

            <motion.div
              className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-3xl"
              animate={spinning ? { rotate: [0, -8, 8, -4, 4, 0] } : { rotate: 0 }}
              transition={{ duration: 0.35, repeat: spinning ? Infinity : 0 }}
            >
              ⚽
            </motion.div>
          </div>

          {spinning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200"
            >
              Buscando una joya del fútbol argentino...
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: spinning ? 1 : 1.05 }}
            whileTap={{ scale: spinning ? 1 : 0.95 }}
            onClick={spin}
            disabled={spinning || wheelPlayers.length === 0}
            className={`mt-8 rounded-2xl px-10 py-5 text-xl font-bold shadow-2xl transition-all ${
              spinning
                ? 'cursor-not-allowed bg-gradient-to-r from-rose-600 to-orange-600 text-white opacity-50'
                : 'bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-rose-500/30 hover:shadow-rose-500/50'
            }`}
          >
            {spinning ? '⏳ Girando...' : '🎲 ¡Girar Ruleta!'}
          </motion.button>

          <div className="mt-4 text-sm text-slate-500">
            {spinCount > 0 ? `${spinCount} giros realizados` : `${wheelPlayers.length} candidatos en la rueda`}
          </div>
        </motion.section>

        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto max-w-md"
            >
              <div className="card-gradient rounded-2xl border border-orange-400/20 p-8 shadow-2xl">
                <div className="mb-6 text-center">
                  <div className="mb-2 text-sm text-slate-400">🎉 ¡Leyenda sorteada!</div>

                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg"
                      style={{ backgroundColor: posColors[result.position] || '#666' }}
                    >
                      {result.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="text-left">
                      <h2 className="text-2xl font-black">{result.name}</h2>
                      <div className="text-sm text-slate-400">
                        {result.position} • {result.decade}
                      </div>

                      {result.clubs && result.clubs.length > 0 && (
                        <div className="mt-1 text-sm text-slate-400">
                          {result.clubs[0].name} ({result.clubs[0].years})
                        </div>
                      )}

                      {resultClub && (
                        <div className="mt-1 text-xs text-[#75AADB]">
                          {resultClub.nickname}
                        </div>
                      )}
                    </div>
                  </div>

                  {result.legendary && (
                    <div className="mt-2 text-sm text-yellow-400">⭐ Jugador legendario</div>
                  )}
                </div>

                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                    <div className="text-2xl font-black text-yellow-400">{result.rating}</div>
                    <div className="text-xs text-slate-400">Rating</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                    <div className="text-2xl font-black text-green-400">{result.goalsClub}</div>
                    <div className="text-xs text-slate-400">Goles Club</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                    <div className="text-2xl font-black text-blue-400">{result.capsClub}</div>
                    <div className="text-xs text-slate-400">Partidos</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                    <div className="text-2xl font-black text-purple-400">{result.goalsNationalTeam}</div>
                    <div className="text-xs text-slate-400">Goles Selección</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                    <div className="text-2xl font-black text-cyan-400">{result.capsNationalTeam}</div>
                    <div className="text-xs text-slate-400">Partidos Selección</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                    <div className="text-2xl font-black text-orange-400">{result.assistsClub}</div>
                    <div className="text-xs text-slate-400">Asistencias</div>
                  </div>
                </div>

                {result.clubs && result.clubs.length > 0 && (
                  <div className="mb-4 rounded-xl bg-slate-800/30 p-4">
                    <div className="mb-2 text-sm text-slate-400">⚽ Clubes</div>
                    {result.clubs.map((club, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="font-semibold">{club.name}</span>
                        <span className="text-slate-400">{club.years}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.trophies && result.trophies.length > 0 && (
                  <div className="rounded-xl bg-slate-800/30 p-4">
                    <div className="mb-2 text-sm text-slate-400">🏆 Títulos</div>
                    <div className="flex flex-wrap gap-2">
                      {result.trophies.slice(0, 6).map((t, i) => (
                        <span key={i} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300">
                          {t.competition} {t.year}
                        </span>
                      ))}
                      {result.trophies.length > 6 && (
                        <span className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300">
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
                  className="w-40 flex-shrink-0 rounded-xl border border-slate-700 bg-slate-800/50 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: posColors[p.position] }}
                    >
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="truncate text-xs font-semibold">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.rating}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="pt-4 text-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-slate-700 px-8 py-4 text-lg font-bold transition-all hover:bg-slate-600"
            >
              🏠 Volver al Inicio
            </motion.button>
          </Link>
        </div>
      </main>
    </div>
  )
}
