"use client"

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Player, Club } from '@/lib/types'
import { getNationalityFlag } from '@/lib/ui-constants'

const posColors: Record<string, string> = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#06b6d4', RB: '#06b6d4', CM: '#10b981',
  CDM: '#059669', CAM: '#8b5cf6', LW: '#ef4444', RW: '#ef4444', ST: '#dc2626',
  CF: '#ea580c', LM: '#ef4444', RM: '#ef4444', LWB: '#06b6d4', RWB: '#06b6d4',
}

interface Props {
  player: Player | null
  club?: Club
  isIcon: boolean
  biography?: string
  onClose: () => void
}

// Carta de leyenda premium estilo "walkout": rayos girando, destello, carta que emerge con
// brillo holográfico y stats que aparecen. Íconos (Messi/Maradona) llevan corona y oro pleno.
export default function LegendCardReveal({ player, club, isIcon, biography, onClose }: Props) {
  const [phase, setPhase] = useState(0) // 0 backdrop, 1 destello, 2 carta, 3 stats

  useEffect(() => {
    if (!player) { setPhase(0); return }
    const t1 = setTimeout(() => setPhase(1), 120)
    const t2 = setTimeout(() => setPhase(2), 620)
    const t3 = setTimeout(() => setPhase(3), 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [player])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const initials = player ? player.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : ''
  const lastName = player ? (player.name.split(' ').pop() || player.name) : ''
  const gold = isIcon ? '#FFD700' : '#D4AF37'
  const stats = player
    ? [
        { v: player.rating, l: 'OVR', c: gold },
        { v: player.goalsClub, l: 'Goles', c: '#4ade80' },
        { v: player.capsClub, l: 'Partidos', c: '#60a5fa' },
        { v: player.capsNationalTeam, l: 'Selección', c: '#22d3ee' },
        { v: player.goalsNationalTeam, l: 'Goles Sel.', c: '#c084fc' },
        { v: player.assistsClub, l: 'Asist.', c: '#fb923c' },
      ]
    : []

  return (
    <AnimatePresence>
      {player && (
        <motion.div
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-5 overflow-y-auto p-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ background: 'radial-gradient(circle at center, rgba(6,10,20,0.86), rgba(2,4,10,0.97))', backdropFilter: 'blur(6px)' }}
        >
          {/* Rayos girando detrás de la carta */}
          <motion.div
            className="pointer-events-none absolute"
            style={{
              width: 900, height: 900,
              background: `conic-gradient(from 0deg, transparent 0deg, ${gold}22 8deg, transparent 16deg, transparent 30deg, ${gold}18 38deg, transparent 46deg)`,
              maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          />
          {/* Destello de aparición */}
          {phase >= 1 && phase < 3 && (
            <motion.div
              className="pointer-events-none absolute rounded-full"
              style={{ width: 420, height: 420, background: `radial-gradient(circle, ${gold}cc, transparent 65%)` }}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          )}
          {/* Sparkles */}
          {phase >= 2 && Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute text-lg"
              style={{ color: gold, left: `${50 + Math.cos((i / 18) * 6.28) * 34}%`, top: `${50 + Math.sin((i / 18) * 6.28) * 40}%` }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0.6] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: (i % 6) * 0.3 }}
            >
              ✦
            </motion.span>
          ))}

          {/* LA CARTA */}
          <motion.div
            className="relative w-[300px] max-w-[86vw]"
            initial={{ scale: 0.3, rotateY: 90, y: 60, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, rotateY: 0, y: 0, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            onClick={(e) => e.stopPropagation()}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {isIcon && (
              <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-5xl z-10 animate-bounce drop-shadow-[0_2px_10px_rgba(255,215,0,0.7)]">👑</div>
            )}

            <div
              className="relative overflow-hidden rounded-[26px] p-[3px]"
              style={{ background: `linear-gradient(150deg, ${gold}, #fff6c8 20%, ${gold} 40%, #8a6d1f 60%, ${gold} 85%)`, boxShadow: `0 0 70px ${gold}66, 0 20px 60px rgba(0,0,0,0.7)` }}
            >
              {/* Brillo holográfico que barre */}
              <div className="legend-shine pointer-events-none absolute inset-0 z-20" />

              <div
                className="relative rounded-[23px] px-5 pt-6 pb-5"
                style={{ background: isIcon
                  ? 'linear-gradient(165deg, #241a02 0%, #3a2c05 35%, #1a1400 70%, #0c0900 100%)'
                  : 'linear-gradient(165deg, #0f1830 0%, #16233f 40%, #0b1120 100%)' }}
              >
                <div className="text-center text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: gold }}>
                  {isIcon ? '★ Ícono Eterno ★' : 'Leyenda'}
                </div>

                {/* OVR + posición + retrato */}
                <div className="mt-3 flex items-start justify-between">
                  <div className="text-left leading-none">
                    <div className="font-black" style={{ fontSize: 46, color: gold, textShadow: `0 2px 10px ${gold}55` }}>{player.rating}</div>
                    <div className="mt-1 rounded px-1.5 py-0.5 text-center text-[11px] font-black text-white" style={{ background: posColors[player.position] || '#555' }}>{player.position}</div>
                    {club && <div className="mt-1 text-[10px] text-slate-400">{club.nickname || club.name}</div>}
                  </div>
                  <div className="relative">
                    {player.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={player.image} alt={player.name} className="h-24 w-24 rounded-full object-cover object-top" style={{ boxShadow: `0 0 26px ${gold}55`, border: `2px solid ${gold}` }} />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-black text-white" style={{ background: `radial-gradient(circle at 30% 30%, ${posColors[player.position] || '#444'}, #0a0f1e)`, boxShadow: `0 0 26px ${gold}55`, border: `2px solid ${gold}` }}>{initials}</div>
                    )}
                  </div>
                </div>

                {/* Nombre */}
                <div className="mt-3 border-t border-white/10 pt-3 text-center">
                  <div className="font-black uppercase tracking-wide text-white" style={{ fontSize: lastName.length > 9 ? 20 : 26, lineHeight: 1 }}>{lastName}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-sport">
                    <span>{getNationalityFlag(player.nationality)}</span>
                    <span>{player.name}</span>
                    <span>•</span>
                    <span>{player.decade}</span>
                  </div>
                </div>

                {/* Stats */}
                <motion.div
                  className="mt-3 grid grid-cols-3 gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {stats.map((s, i) => (
                    <div key={i} className="rounded-lg border border-white/5 bg-white/5 py-1.5 text-center">
                      <div className="text-base font-black" style={{ color: s.c }}>{s.v}</div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.l}</div>
                    </div>
                  ))}
                </motion.div>

                {biography && phase >= 3 && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="mt-3 border-l-2 pl-2 text-left text-[10px] italic leading-snug text-slate-300"
                    style={{ borderColor: gold }}
                  >
                    "{biography}"
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Continuar */}
          {phase >= 3 && (
            <motion.button
              initial={{ y: 10 }} animate={{ y: 0 }}
              onClick={onClose}
              className="relative z-10 shrink-0 rounded-full border bg-slate-950/70 px-8 py-2.5 text-xs font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-white/10"
              style={{ borderColor: `${gold}66` }}
            >
              Continuar
            </motion.button>
          )}

          <style jsx>{`
            .legend-shine {
              background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 48%, rgba(255,255,255,0.05) 54%, transparent 70%);
              background-size: 250% 250%;
              animation: legendSweep 3.2s ease-in-out infinite;
              mix-blend-mode: overlay;
            }
            @keyframes legendSweep {
              0% { background-position: 180% 0; }
              55% { background-position: -80% 0; }
              100% { background-position: -80% 0; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
