"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { loadLocalScores, type GameScore } from '@/lib/scores'
import { fetchOnlineScores, fetchRankGlobal } from '@/lib/supabase'
import { useUserStore } from '@/lib/user-store'
import { SEED_RIVALS } from '@/lib/leaderboard-seed'
import TierBadge from '@/components/TierBadge'
import EloExplainer from '@/components/EloExplainer'
import Podio from '@/components/leaderboard/Podio'
import { trackEvent, EVENTOS } from '@/components/Analytics'

function LeaderboardRow({ rank, s, esVos, historial }: {
  rank: number
  s: GameScore & { seed?: boolean; lema?: string }
  esVos?: boolean
  /** En "mis partidas" cada fila es una partida, no un puesto del ranking. */
  historial?: boolean
}) {
  const top3 = !historial && rank < 3
  const medal = historial ? `${rank + 1}` : ['🥇', '🥈', '🥉'][rank] || `${rank + 1}°`
  const fecha = historial && s.date ? new Date(s.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : null
  return (
    <motion.div
      initial={{ x: -20 }}
      animate={{ x: 0 }}
      transition={{ delay: Math.min(rank, 12) * 0.04 }}
      className={`card-gradient rounded-xl p-3.5 flex items-center gap-3 transition-colors hover:border-[#74ACDF]/30 ${
        esVos ? 'border border-[#74ACDF]/60 shadow-[0_0_20px_rgba(116,172,223,0.18)]' : top3 ? 'border border-amber-400/30' : 'border border-white/5'
      }`}
    >
      <div className={`w-9 shrink-0 text-center font-display ${historial ? 'text-sm font-black text-slate-600' : 'text-xl'}`}>{medal}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm truncate max-w-[160px]">{s.username}</span>
          {esVos && <span className="text-[9px] font-black font-sport uppercase tracking-wider text-[#74ACDF] bg-[#74ACDF]/10 border border-[#74ACDF]/30 rounded px-1.5 py-0.5">VOS</span>}
          {s.seed && <span className="text-[9px] font-black font-sport uppercase tracking-wider text-slate-500 border border-slate-700 rounded px-1.5 py-0.5">DT de la casa</span>}
          <TierBadge elo={s.elo} />
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {s.lema
            ? s.lema
            : historial
            ? `${s.clubName || 'Mi 11'} · OVR ${s.rating} · salió ${s.pos}°${fecha ? ` · ${fecha}` : ''}`
            : `Rating ${s.rating} • ${s.players}/11 • ${s.pos}° pos`}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-lg font-black font-display leading-none ${s.pts < 0 ? "text-red-400" : "text-green-400"}`}>
          {s.pts > 0 ? "+" : ""}{s.pts}
        </div>
        <div className="text-[10px] text-[#74ACDF] font-bold">⚡{s.elo}</div>
      </div>
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<GameScore[]>([])
  const [tab, setTab] = useState<'global' | 'online'>('global')
  const [loadingOnline, setLoadingOnline] = useState(false)
  // Puesto contado en la base, no dentro de las filas descargadas.
  const [rankGlobal, setRankGlobal] = useState<{ puesto: number; total: number } | null>(null)
  const user = useUserStore((s) => s.user)

  useEffect(() => {
    setScores(loadLocalScores())
  }, [])

  useEffect(() => {
    if (tab !== 'online') return
    setLoadingOnline(true)
    trackEvent(EVENTOS.rankingVisto)
    fetchOnlineScores(200)
      .then((online) => {
        setScores(
          online.map((o, i) => ({
            id: o.id || `online-${i}`,
            username: o.username,
            club: o.club,
            clubName: o.clubName,
            rating: o.rating,
            players: o.players,
            pts: o.pts,
            pos: o.pos,
            elo: o.elo,
            date: o.date,
          })),
        )
      })
      .finally(() => setLoadingOnline(false))
    if (user?.isLoggedIn) fetchRankGlobal(user.elo).then(setRankGlobal)
  }, [tab, user])

  // En "mis partidas" se suman los DTs de la casa para tener contra quién medirse. En el ranking
  // global NO: son jugadores de mentira y correrían de puesto a los reales.
  //
  // Y una fila por persona: la tabla guarda una por partida, así que el que jugó veinte veces
  // ocupaba veinte puestos y empujaba a todos los demás para abajo. Se queda su mejor ELO.
  const ranked = useMemo(() => {
    // "Mis partidas" es el historial: ahí TIENEN que estar todas, una por partida jugada, porque
    // es lo que el jugador viene a ver. La reducción a una fila por persona es del ranking global,
    // donde el que jugó veinte veces ocupaba veinte puestos y corría a todos los demás.
    if (tab !== 'online') {
      return [...SEED_RIVALS, ...scores].sort((a, b) => b.elo - a.elo || b.pts - a.pts)
    }
    const mejorPorNombre = new Map<string, GameScore>()
    for (const f of scores) {
      const clave = (f.username || '').trim().toLowerCase()
      const previa = mejorPorNombre.get(clave)
      if (!previa || f.elo > previa.elo || (f.elo === previa.elo && f.pts > previa.pts)) {
        mejorPorNombre.set(clave, f)
      }
    }
    return [...mejorPorNombre.values()].sort((a, b) => b.elo - a.elo || b.pts - a.pts)
  }, [scores, tab])
  const miPuesto = useMemo(() => {
    if (!user?.isLoggedIn) return null
    // Online: el puesto lo cuenta la base, así vale aunque estés fuera del top que se descargó.
    if (tab === 'online') return rankGlobal
    const idx = ranked.findIndex((s) => s.username === user.username)
    if (idx >= 0) return { puesto: idx + 1, total: ranked.length }
    const porEncima = ranked.filter((s) => s.elo > user.elo).length
    return { puesto: porEncima + 1, total: ranked.length + 1 }
  }, [ranked, user, tab, rankGlobal])

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider font-display uppercase"><span className="gradient-text">TABLA DE LÍDERES</span></h1>
          <p className="mt-3 text-sm text-slate-400">Rankeá tu ELO y peleá por llegar a Leyenda</p>
        </motion.div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-20">

        {miPuesto && (
          <div className="card-gradient rounded-2xl border border-[#74ACDF]/30 p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black font-sport uppercase tracking-widest text-[#74ACDF]">Tu puesto</div>
              <div className="font-display text-2xl font-black text-white leading-none mt-1">
                #{miPuesto.puesto} <span className="text-slate-500 text-base">de {miPuesto.total}</span>
              </div>
            </div>
            <div className="text-right">
              <TierBadge elo={user!.elo} showElo />
              <div className="text-[10px] text-slate-400 mt-1.5 font-sport uppercase tracking-wider">
                {miPuesto.puesto <= 3 ? '🔥 Estás en el podio' : miPuesto.puesto <= 10 ? '💪 Top 10, seguí así' : 'A escalar posiciones'}
              </div>
            </div>
          </div>
        )}

        {/* Selector con forma de interruptor: se entiende de un vistazo cuál está activa */}
        <div className="mx-auto mb-7 flex w-full max-w-sm rounded-2xl border border-white/10 bg-slate-950/60 p-1 font-sport">
          {([
            { id: 'online' as const, label: 'Ranking global', sub: 'los mejores' },
            { id: 'global' as const, label: 'Mis partidas', sub: 'tu historial' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex-1 rounded-xl px-3 py-3 text-center transition-all ${
                tab === t.id ? 'bg-gradient-to-r from-[#74ACDF] to-blue-600 text-white shadow-lg shadow-[#74ACDF]/20' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="block text-[11px] font-black uppercase tracking-widest">{t.label}</span>
              <span className={`block text-[9px] uppercase tracking-wider ${tab === t.id ? 'text-white/70' : 'text-slate-600'}`}>{t.sub}</span>
            </button>
          ))}
        </div>

        {loadingOnline ? (
          <p className="text-center text-sm text-slate-400 py-10">Cargando ranking global...</p>
        ) : ranked.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-slate-300 font-bold">{tab === 'online' ? 'Todavía no hay ranking global.' : 'Jugá tu primera temporada para entrar al ranking.'}</p>
            <Link href="/draft?mode=liga" className="btn-primary inline-block mt-5 px-7 py-3 text-xs">JUGAR AHORA</Link>
          </div>
        ) : (
          <>
            {tab === 'online' && <Podio top={ranked.slice(0, 3)} usuario={user?.username} />}
            <div className="space-y-2">
              {(tab === 'online' ? ranked.slice(3, 50) : ranked).map((s, i) => (
                <LeaderboardRow
                  key={s.id}
                  rank={tab === 'online' ? i + 3 : i}
                  s={s}
                  esVos={!!user?.isLoggedIn && s.username === user.username}
                  historial={tab !== 'online'}
                />
              ))}
            </div>
          </>
        )}

        <div className="text-center mt-8 text-xs text-slate-500">
          <p>{tab === 'online'
            ? `Top ${Math.min(ranked.length, 50)} del ranking global${rankGlobal ? ` · ${rankGlobal.total} jugadores` : ''} · una fila por DT, con su mejor ELO`
            : `${ranked.length} partidas registradas en este dispositivo`}</p>
          {tab === 'online' && !user?.isLoggedIn && (
            <p className="mt-2 text-[11px] text-amber-300/80">
              Como invitado no entrás acá. Creá una cuenta para que tus torneos cuenten.
            </p>
          )}
        </div>

        {/* Las reglas van DESPUÉS de la tabla: el que entra viene a ver puestos, no a leer. */}
        <div className="mt-12">
          <EloExplainer />
        </div>
      </main>
      <div className="text-center pb-8"><Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm py-2.5 px-4 inline-block">← Volver al inicio</Link></div>
    </div>
  )
}
