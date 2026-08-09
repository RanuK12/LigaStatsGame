"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import TeamTacticalRadar from "@/components/charts/TeamTacticalRadar"
import type { Player, ScheduleMatch, Squad, TournamentResult } from "@/lib/types"
import { usePlayersCore, useSquads } from "@/lib/data-loader"
import { useUserStore } from "@/lib/user-store"
import { calculateElo, submitOnlineScore } from "@/lib/supabase"
import { tournamentPoints, plazaPorPuesto, BASE_POR_TORNEO, type TorneoTipo } from "@/lib/ranking"
import { simulateContinentalTournament } from "@/lib/copa-libertadores"
import { saveLocalScore, type GameScore } from "@/lib/scores"
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
  getSquadTier,
  STAR_RATING,
  updatePity,
  PITY_LOW_THRESHOLD,
} from "@/lib/game-engine"
import { loadLifetimeStats, saveLifetimeStats, applyDraftCompleted, applyTournament, saveLastResult } from "@/lib/storage"
import { trackEvent, EVENTOS } from "@/components/Analytics"
import { tocar } from "@/lib/sonido"
import { challengeForDate, challengeNumber, localYmd, CHALLENGES } from "@/lib/daily-challenge"
import { claimDailyBonus, completadoHoy } from "@/lib/daily-progress"
import { textoDeBloques, lineaDePuesto } from "@/lib/reto-bloques"
import { calculateChemistry } from "@/lib/chemistry"
import ChemistryPanel from "@/components/ChemistryPanel"
import TournamentView from "@/components/tournament/TournamentView"
import SquadRoulette from "@/components/roulette/SquadRoulette"
import PackReveal from "@/components/roulette/PackReveal"
import Pitch from "@/components/pitch/Pitch"
import PlayerTradingCard from "@/components/pitch/PlayerTradingCard"
import { generatePDF } from "@/lib/pdf"
import TorneoEnVivo from "@/components/tournament/TorneoEnVivo"

/** Cómo se llama cada torneo en el cartel del partido a partido. */
const NOMBRE_TORNEO: Record<TorneoTipo, string> = {
  liga: "Liga Profesional",
  copa: "Copa Argentina",
  libertadores: "Copa Libertadores",
  sudamericana: "Copa Sudamericana",
}
import { getPC, POS_GROUPS } from "@/lib/ui-constants"
import MagneticButton from "@/components/ui/MagneticButton"
import EventBurst, { type BurstTone } from "@/components/ui/EventBurst"

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */

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
type Phase = "start" | "ready" | "pos-select" | "spinning" | "reveal" | "picking" | "done" | "sim"

interface EnrichedPlayer extends Player { isCompatible: boolean }

interface PityState {
  consecutiveLow: number
  lastRatings: number[]
  pityActive: boolean
  spinsSinEstrella: number
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
      className={`flex flex-col sm:flex-row items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border ${
        isPityActive
          ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]"
          : "bg-blue-500/10 border-blue-400/20 text-[#74ACDF]"
      }`}>
      <div className="flex items-center gap-1.5 uppercase tracking-wider">
        <span className="font-bold text-[10px] text-yellow-400 font-sport uppercase tracking-widest">CÁBALA:</span>
        <span>LA CÁBALA (ANTI-MUFA):</span>
      </div>
      <span className="font-medium text-[11px] text-slate-300">
        {isPityActive
          ? "¡ACTIVADA! Próximo spin de élite garantizado por meter 2 picks bajos seguidos."
          : `Llevás ${pity.consecutiveLow} pick${pity.consecutiveLow > 1 ? "s" : ""} de bajo rating (<=60). ¡Si sumás otro, el siguiente se potencia!`}
      </span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POSITION SELECTOR MODAL
   ═══════════════════════════════════════════════════════════════ */
function PositionSelector({ formation, drafted, onSelect, onClose, currentPos }: {
  formation: any
  drafted: (Player | null)[]
  onSelect: (pos: string) => void
  onClose: () => void
  currentPos: string
}) {
  // Get unique positions from the formation's remaining empty slots
  const positions = formation.positions
    .filter((p: any, i: number) => !drafted[i])
    .map((p: any) => p.pos)
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
        className="w-full max-w-sm card-glass p-6 shadow-2xl"
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
                      className={`px-3 py-1.5 rounded-2xl text-sm font-bold border transition-all duration-300 ease-out hover:scale-[1.02] ${
                        pos === currentPos
                          ? "bg-[#75AADB] text-white border-[#75AADB] shadow-lg shadow-[#75AADB]/30"
                          : "bg-slate-800 border-slate-600 text-slate-200 hover:border-[#75AADB]/60 hover:bg-slate-700"
                      }`}
                      style={{ borderColor: pos === currentPos ? undefined : getPC(pos) + "55" }}>
                      <span className="inline-block w-5 h-5 rounded-full text-white text-[11px] font-black mr-1 leading-5 text-center" style={{ backgroundColor: getPC(pos) }}>
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
        <button onClick={onClose} className="w-full mt-5 py-2 rounded-2xl btn-secondary text-sm">
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DRAFT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico
  // Si venís del Reto Diario, terminar el torneo suma ELO extra (una vez por día).
  const retoId = sp.get("reto")

  const { players: playersCore, error: playersError } = usePlayersCore()
    // ── EL RETO DIARIO FILTRA EL BOMBO DE VERDAD ──
  // Antes el reto solo servía para cobrar el bono de ELO: los catorce retos producían el mismo
  // draft aleatorio, cambiaba el título y nada más. Sin regla aplicada no hay resultado comparable
  // entre dos personas, y sin eso compartir no significa nada. Ahora el bombo se recorta.
  const retoDelDia = useMemo(() => {
    if (!retoId) return null
    return CHALLENGES.find((c) => c.id === retoId) ?? null
  }, [retoId])

  const allP = useMemo(() => {
    const base = playersCore ?? []
    if (!retoDelDia) return base
    const filtrados = base.filter((pl) => retoDelDia.filtro(pl))
    // Si el filtro dejara un bombo imposible de completar, se juega sin restricción antes que
    // dejar al jugador trabado. No debería pasar: cada filtro está medido, pero la base cambia.
    return filtrados.length >= 60 ? filtrados : base
  }, [playersCore, retoDelDia])
  const { squads: squadsCore, error: squadsError } = useSquads()
  const allS = squadsCore ?? []
  // El bombo necesita las dos cosas: sin planteles, un giro no tiene de dónde sacar jugadores.
  const datosListos = Boolean(playersCore && squadsCore)
  const { user, updateElo, addTitle, otorgarPlaza, usarPlaza } = useUserStore()

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
  /**
   * Qué torneos ya jugó ESTE equipo.
   *
   * Desde el resumen se puede volver al once ("Ver equipo") y ahí estaban los botones de
   * simular otra vez: con el mismo equipo se podía repetir la Liga hasta sacar un buen puesto y
   * sumar ELO cada vez. Eso vacía el ranking de sentido. Un equipo juega cada torneo UNA vez;
   * para volver a jugar hay que armar otro draft, que es lo que cuesta.
   *
   * Se limpia al armar un draft nuevo (resetGame) y cuando cambia el once.
   */
  const [torneosJugados, setTorneosJugados] = useState<Set<TorneoTipo>>(new Set())
  const [confetti, setConfetti] = useState(false)
  const [burst, setBurst] = useState<{ label: string; tone: BurstTone } | null>(null)
  const [retoGanado, setRetoGanado] = useState<{ elo: number; streak: number } | null>(null)
  const [spinNotice, setSpinNotice] = useState<string | null>(null)
  const [showPosSelector, setShowPosSelector] = useState(false)
  const [pity, setPity] = useState<PityState>({ consecutiveLow: 0, lastRatings: [], pityActive: false, spinsSinEstrella: 0 })
  // Clubes que ya salieron en este draft: el bombo no los repite mientras queden otros.
  const [clubesUsados, setClubesUsados] = useState<Set<string>>(new Set())
  // Lo que movió el último torneo en el ranking, para mostrarlo en la ficha de cierre.
  const [eloTorneo, setEloTorneo] = useState<{ nuevo: number; delta: number; pts: number } | null>(null)
  /**
   * El torneo revelándose partido a partido, antes de mostrar la tabla.
   *
   * El motor calcula todo de una, así que sin esto tocabas "Simular Liga" y aparecía el resultado
   * final sin un solo momento de "¿cómo vamos?". Los partidos ya están jugados: esto solo los
   * muestra, y se puede saltar tocando la pantalla.
   */
  const [enVivo, setEnVivo] = useState<{
    partidos: ScheduleMatch[]
    equipos?: string[]
    equipo: string
    torneo: string
    onListo: () => void
  } | null>(null)

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
  const chemBreakdown = useMemo(() => calculateChemistry(drafted, f), [drafted, f])

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
    setClubesUsados(new Set())
    setActiveSlotIdx(0)
    setCurrentSquad(null)
    setWildcards(mode.rerolls || 3)
    setSearch("")
    setSimResult(null)
    setSpinNotice(null)
    setStarted(true)
    setPity({ consecutiveLow: 0, lastRatings: [], pityActive: false, spinsSinEstrella: 0 })
    setPhase("ready")
    trackEvent(EVENTOS.draftIniciado, { modo: mode.id, formacion: f.id })
  }, [totalSlots, mode, f.id])

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
    // Apply pity system (incluye la chance de que salga un plantel con estrella para el puesto)
    const result = spinSquadWithPity(eligible, allP, pity, { position: posToUse, drafted: draftedIds }, clubesUsados)
    setSpinNotice(null)
    setCurrentSquad(result)
    setClubesUsados(prev => new Set(prev).add(result.clubId))
    tocar("giro")
    setSpinning(true)
    setPhase("spinning")
  }, [spinning, allS, allP, currentPos.pos, draftedIds, pity, f, drafted, clubesUsados])

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
    const esEstrella = Boolean(player.legendary) || (player.rating || 0) >= STAR_RATING
    const newPity = updatePity(pity, player.rating || 60, esEstrella)
    setPity(newPity)

    // Fichaje de campanillas: estallido en pantalla (leyenda / 85+ / 80+).
    if (player.legendary || (player.rating || 0) >= 85) {
      setBurst({ label: player.legendary ? "¡LEYENDA!" : "¡FICHAJE BOMBA!", tone: "oro" })
    } else if ((player.rating || 0) >= 80) {
      setBurst({ label: "¡GRAN REFUERZO!", tone: "celeste" })
    }

    const isTeamComplete = newDrafted.filter(Boolean).length === totalSlots
    if (!isTeamComplete) {
      let nextIdx = (slotIdx + 1) % totalSlots
      while (newDrafted[nextIdx] !== null) {
        nextIdx = (nextIdx + 1) % totalSlots
      }
      setTimeout(() => { setActiveSlotIdx(nextIdx); setCurrentSquad(null); setPhase("ready"); setSearch("") }, 300)
    } else {
      setTimeout(() => {
        setConfetti(true)
        setBurst({ label: "¡EQUIPO ARMADO!", tone: "celeste" })
        setTimeout(() => setConfetti(false), 4000)
        setPhase("done")
        trackEvent(EVENTOS.draftCompletado, { formacion: f.id, puntaje: Math.round(calculateFullTeamScore(newDrafted, f)) })
      }, 300)
    }
  }, [drafted, draftedIds, f, pity, totalSlots])

  // ── COMPLETAR EL RESTO ──
  // El once completo son 22 toques: once giros con animación más once elecciones. Medido, el
  // jugador promedio tiene 44 segundos dentro del juego, así que casi nadie llegaba a simular y
  // todo lo que da ganas de volver —ELO, ranking, ficha, compartir— quedaba detrás de esa pared.
  // Esto llena los puestos que falten con el mejor disponible y deja jugar. El once armado a mano
  // sigue siendo la partida buena; esto es la puerta de entrada.
  const completarEquipo = useCallback(() => {
    const nuevos = [...drafted]
    const ids = new Set(draftedIds)
    let sumados = 0

    f.positions.forEach((slot: any, i: number) => {
      if (nuevos[i]) return
      // Mismo bombo que el giro manual: solo planteles que tengan a alguien para ese puesto.
      const elegibles = getEligibleSquadsForSlot(allS, allP, slot.pos, ids)
      if (elegibles.length === 0) return
      const sq = spinSquadWithPity(elegibles, allP, pity, { position: slot.pos, drafted: ids }, clubesUsados)
      clubesUsados.add(sq.clubId)
      const mejor = allP
        .filter(pl => sq.playerIds.includes(pl.id) && !ids.has(pl.id) && canPlayHere(pl, slot.pos))
        .sort((x, y) => (y.rating || 0) - (x.rating || 0))[0]
      if (!mejor) return
      nuevos[i] = mejor
      ids.add(mejor.id)
      sumados++
    })

    if (sumados === 0) return
    setDrafted(nuevos)
    setDraftedIds(ids)
    setClubesUsados(new Set(clubesUsados))
    setCurrentSquad(null)
    setPhase("done")
    setBurst({ label: "¡EQUIPO ARMADO!", tone: "celeste" })
    trackEvent(EVENTOS.draftCompletado, {
      formacion: f.id,
      puntaje: Math.round(calculateFullTeamScore(nuevos, f)),
      // Cuántos puestos llenó el botón. Sin esto no se puede saber si el express sirvió o si la
      // gente completa el once igual: es el número que decide si la mecánica se queda.
      autocompletado: sumados,
      via: "express",
    })
  }, [drafted, draftedIds, allS, allP, f, pity, clubesUsados])

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
  const startSim = useCallback((type: TorneoTipo) => {
    // Los carteles que hay que mostrar cuando termine el partido a partido, no antes.
    const celebraciones: { label: string; tone: "oro" | "celeste" }[] = []
    const isP = (x: any): x is Player => x && typeof x.id === "string"
    const players = drafted.filter(isP)
    if (players.length < 11) return
    // Un equipo, un torneo. Si ya lo jugó, no se repite: el botón está deshabilitado, pero el
    // guard va acá también porque es lo que protege el ranking.
    if (torneosJugados.has(type)) return
    const virtualSquad: Squad = {
      id: "mi-11-fantasy", clubId: "mi-11", season: "2026",
      competition: "Liga Profesional", label: "Mi 11 Fantasy",
      playerIds: players.map(p => p.id) as [string, ...string[]],
    }
    const score = teamScore || partialScore
    const continental = type === "libertadores" || type === "sudamericana"
    const r = continental
      ? simulateContinentalTournament(players, virtualSquad, f, score, type)
      : type === "liga"
      ? simulateSeasonWithStats(players, virtualSquad, allS, allP, f, score)
      : simulateCopaWithStats(players, virtualSquad, allS, allP, f, score)
    // La plaza se gasta al jugarla: una clasificación, una copa.
    if (continental) usarPlaza()
    setSimResult(r)
    setTorneosJugados((prev) => new Set(prev).add(type))
    trackEvent(EVENTOS.torneoSimulado, { tipo: type, puntaje: Math.round(score), campeon: !!r.isChampion })
    if (retoDelDia) {
      trackEvent(EVENTOS.retoDiario, { reto: retoDelDia.id, puntaje: Math.round(score), tipo: type })
    }
    // Récords de por vida + último equipo para /results
    saveLifetimeStats(applyTournament(applyDraftCompleted(loadLifetimeStats(), players, score), r))
    saveLastResult({
      label: virtualSquad.label, score, formation: f.id,
      players: players.map(p => ({ name: p.name, rating: p.rating, position: p.position })),
    })

    // ── RANKING: ELO + Tabla de Líderes ──
    // Las copas continentales se juegan con 32 equipos: el puesto sale del motor y la escala tiene
    // que ser la de la copa, no la de la liga de 28.
    const total = continental ? 32 : (r.table?.length || 28)
    const pos = r.playerPos ?? (r.isChampion ? 1 : Math.round(total / 2))
    const pts = tournamentPoints({ type, pos, totalTeams: total, isChampion: r.isChampion })
    const currentElo = user?.elo ?? 1000
    const { newElo, delta } = calculateElo(currentElo, pos, total)
    if (user?.isLoggedIn) {
      updateElo(delta)
      if (r.isChampion) addTitle()
    }
    const entry: GameScore = {
      id: `${Date.now()}`,
      username: user?.username || "Invitado",
      club: "mi-11",
      clubName: virtualSquad.label,
      rating: score,
      players: players.length,
      pts,
      pos,
      elo: newElo,
      date: new Date().toISOString(),
    }
    setEloTorneo({ nuevo: newElo, delta, pts })

    // Clasificación continental: la deja SOLO la Liga, y hay que tener cuenta para guardarla.
    // Es el mejor motivo para registrarse que tiene el juego: te la ganaste jugando.
    if (type === "liga" && user?.isLoggedIn) {
      const plaza = plazaPorPuesto(pos)
      if (plaza) {
        otorgarPlaza({ torneo: plaza, puesto: pos, equipo: virtualSquad.label, fecha: new Date().toISOString() })
        // El cartel va DESPUÉS del partido a partido: anunciar "¡CLASIFICASTE!" mientras todavía
        // se están revelando las fechas cuenta el final antes de tiempo.
        celebraciones.push({
          label: plaza === "libertadores" ? "¡CLASIFICASTE A LA LIBERTADORES!" : "¡CLASIFICASTE A LA SUDAMERICANA!",
          tone: "oro",
        })
      }
    }

    saveLocalScore(entry)
    // Al ranking global entran SOLO los registrados. Antes subía todo el mundo como "Invitado", así
    // que el podio lo peleaban filas sin dueño contra gente con cuenta, y el ranking dejaba de
    // significar algo. El invitado sigue viendo sus partidas en "mis partidas", que es local.
    if (user?.isLoggedIn) {
      const { id: _omit, ...online } = entry
      void submitOnlineScore(online) // fire & forget (no-op sin Supabase)
    }

    // ── RETO DIARIO: bono de ELO al completarlo (uno por día, con racha) ──
    if (retoId && retoId === challengeForDate(localYmd()).id && !completadoHoy()) {
      const premio = claimDailyBonus()
      if (premio) {
        if (user?.isLoggedIn) updateElo(premio.elo)
        celebraciones.push({ label: `¡RETO DIARIO! +${premio.elo} ELO`, tone: "celeste" })
        setRetoGanado(premio)
      }
    }

    // ── El torneo, fecha por fecha ──
    // Los partidos ya están jugados; esto solo los revela. En la liga van TODOS los de la zona,
    // porque con ellos se arma el fixture y la tabla en vivo; en las copas, solo los tuyos.
    const mostrarResultado = () => {
      setEnVivo(null)
      setPhase("sim")
      // De a uno, no encimados: el segundo cartel pisaba al primero y no se leía ninguno.
      celebraciones.forEach((c, i) => setTimeout(() => setBurst(c), i * 2600))
    }
    const todos = r.schedule ?? r.rounds?.flatMap((x) => x.matches) ?? []
    const equipos = r.type === "liga" ? (r.table ?? []).map((t) => t.name) : undefined
    const aMostrar = equipos ? todos : todos.filter((m) => m.home === virtualSquad.label || m.away === virtualSquad.label)
    if (aMostrar.length >= 3) {
      setEnVivo({ partidos: aMostrar, equipos, equipo: virtualSquad.label, torneo: NOMBRE_TORNEO[type], onListo: mostrarResultado })
    } else mostrarResultado()
  }, [drafted, allS, allP, f, teamScore, partialScore, user, updateElo, addTitle, retoId, torneosJugados])

  // ── RESET ──
  const resetGame = useCallback(() => {
    setStarted(false); setPhase("start"); setDrafted([]); setDraftedIds(new Set())
    setTorneosJugados(new Set())
    setCurrentSquad(null); setSimResult(null); setSpinNotice(null); setActiveSlotIdx(0)
    setPity({ consecutiveLow: 0, lastRatings: [], pityActive: false, spinsSinEstrella: 0 })
  }, [])

  // ── PICKER PLAYERS ──
  const pickerPlayers = useMemo(() => {
    if (!currentSquad) return []
    const targetPos = f.positions[activeSlotIdx]?.pos || "CM"
    const squadPlayers = getSquadPlayers(currentSquad, allP)
    const available = squadPlayers.filter(p => !draftedIds.has(p.id))
    const enriched: EnrichedPlayer[] = available.map(p => ({ ...p, isCompatible: canPlayHere(p, targetPos) }))
    
    // Filter to keep ONLY compatible players so that incompatible players are not shown in the grid
    const compatible = enriched.filter(p => p.isCompatible)
    
    compatible.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return compatible.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
  }, [currentSquad, allP, f, activeSlotIdx, search, draftedIds])

  const compatibleCount = pickerPlayers.filter(p => p.isCompatible).length

  /* ── RENDER: START ── */
  if (phase === "start" || !started) {
    // El padding de abajo es para que la barra fija del teléfono no tape "Volver al inicio".
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4 pb-28 sm:pb-0">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center">
          <img src="/logos/afa.png" alt="AFA" className="h-20 w-auto object-contain mx-auto block mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">Liga Argentina Fans</h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>
          <div className="card-gradient rounded-3xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Elegí tu formación</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.values(formations).map((fmt: any) => (
                <button key={fmt.id} onClick={() => setFm(fmt.id)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold uppercase tracking-widest transition-all duration-300 ease-out ${
                    fm === fmt.id ? "bg-[#75AADB] text-white shadow-lg shadow-[#75AADB]/20" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}>{fmt.name}</button>
              ))}
            </div>
            <div className="mt-4"><Pitch f={f} draft={[]} activeSlot={-1} onSlotClick={() => {}} phase="start" /></div>
          </div>
          <div className="card-gradient rounded-3xl p-6 mb-6 text-left">
            <h3 className="font-display font-bold text-lg mb-3">Cómo Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Elegís la <strong className="text-slate-200">posición</strong> que querés sortear</li>
              <li>2. Girás la ruleta — te toca un <strong className="text-slate-200">equipo + año</strong></li>
              <li>3. Elegís <strong className="text-slate-200">un solo jugador</strong> de esa posición</li>
              <li>4. El sistema de <strong className="text-yellow-300">La Cábala (Anti-Mufa)</strong> garantiza que no te salgan solo jugadores de bajo nivel seguidos</li>
              <li>5. Armá los 11 y <strong className="text-slate-200">simulá el torneo con estadísticas</strong></li>
            </ol>
          </div>
          {/* Lo que hay en juego, antes de empezar. El que arranca sin saber que puede clasificar
              a la Libertadores juega un draft suelto; el que lo sabe, juega una temporada. */}
          <div className="card-gradient rounded-3xl p-6 mb-6 text-left border border-[#F6C750]/25">
            <h3 className="font-display font-bold text-lg mb-3 text-[#F6C750]">Lo que está en juego</h3>
            <ul className="text-sm text-slate-400 space-y-2.5">
              <li>
                🏆 <strong className="text-slate-200">Clasificá a la Libertadores.</strong> Si terminás entre los
                cuatro primeros de la Liga te ganás la plaza (5° a 8°, la Sudamericana). No se eligen desde un
                menú: se clasifica, y valen <strong className="text-white">150 y 120</strong> puntos contra los
                100 de la Liga. Es lo que más ELO reparte del juego.
              </li>
              <li>
                ⭐ <strong className="text-slate-200">Los mejores equipos argentinos de los últimos 35 años</strong>{" "}
                están en el bombo: el Vélez del 94, los Boca de Bianchi, el River del 96, el Estudiantes de Verón.
                Sale uno cada cuatro giros, más o menos tres por draft.
              </li>
              <li>
                📈 <strong className="text-slate-200">Todo suma al ranking.</strong> Cada torneo mueve tu ELO según
                dónde termines.{" "}
                {user?.isLoggedIn ? "Ya tenés cuenta: te cuenta todo." : "Como invitado no entrás al ranking global ni guardás la plaza continental."}
              </li>
            </ul>
          </div>

          {/* En escritorio el botón vive acá abajo, después de todo lo que hay para leer. */}
          {/* El `hidden` va en el contenedor, no en el botón: `.btn-primary` fija `inline-flex` en
              globals.css y le gana a la utilidad de Tailwind, así que el botón seguía a la vista. */}
          <div className="hidden sm:block">
            <MagneticButton>
              <button onClick={startGame} disabled={!datosListos} className="btn-primary px-10 py-4 font-sport">
                {datosListos ? "Comenzar Draft" : "Cargando jugadores..."}
              </button>
            </MagneticButton>
          </div>
          {(playersError || squadsError) && (
            <p className="mt-3 text-xs text-red-400">No se pudo cargar la base: {playersError || squadsError}. Recargá la página.</p>
          )}
          <Link href="/" className="block mt-6 text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider inline-block py-2.5 px-3">Volver al inicio</Link>
        </motion.div>

        {/* En el teléfono, no.
            Medido en producción: la pantalla útil son 664 px y este botón arrancaba en el 1715,
            o sea a dos pantallas y media de scroll. Es la única acción de la página y había que ir
            a buscarla. Es lo que explica que el móvil sea la mitad del público y un quinto de los
            eventos clave (0,049 por usuario contra 0,205 en escritorio).
            Fijo abajo: se lee todo lo de arriba igual, pero se puede empezar en cualquier momento. */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#020813]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:hidden">
          <button
            onClick={startGame}
            disabled={!datosListos}
            className="btn-primary w-full py-4 font-sport text-sm"
          >
            {datosListos ? "Comenzar Draft" : "Cargando jugadores..."}
          </button>
        </div>
      </div>
    )
  }

  /* ── RENDER: SIM RESULTS ── */
  if (phase === "sim" && simResult) {
    return (
      <>
        {retoGanado && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 cartel-in cartel-shine rounded-2xl border border-[#74ACDF]/40 bg-[#0b1526] px-5 py-3 text-center shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            <div className="font-sport text-[10px] font-black uppercase tracking-widest text-[#74ACDF]">Reto diario completado</div>
            <div className="font-display text-lg font-black text-white">
              +{retoGanado.elo} ELO · racha de {retoGanado.streak} {retoGanado.streak === 1 ? "día" : "días"}
            </div>
            {!user?.isLoggedIn && (
              <div className="mt-1 text-[10px] text-amber-300 font-sport uppercase tracking-wider">Ingresá para que sume a tu ranking</div>
            )}
          </div>
        )}
        <TournamentView
        result={simResult}
        onBack={() => { setPhase("done"); setSimResult(null) }}
        onReset={resetGame}
        onDownloadPDF={() => generatePDF(simResult, drafted, f)}
        elo={eloTorneo}
        reto={retoDelDia ? { id: retoDelDia.id, titulo: retoDelDia.title } : undefined}
        bloques={
          retoDelDia
            ? textoDeBloques({
                numero: challengeNumber(),
                titulo: retoDelDia.title,
                jugadores: drafted
                  .map((p, i) => (p ? { rating: p.rating || 50, linea: lineaDePuesto(f.positions[i].pos) } : null))
                  .filter((x): x is { rating: number; linea: string } => x !== null),
                puntaje: teamScore,
                campeon: simResult.isChampion,
                puesto: simResult.playerPos,
                racha: retoGanado?.streak,
              })
            : undefined
        }
        />
      </>
    )
  }

  /* ── RENDER: MAIN GAME ── */
  return (
    <div className="min-h-screen gradient-bg">
      {enVivo && (
        <TorneoEnVivo
          partidos={enVivo.partidos}
          equipos={enVivo.equipos}
          equipo={enVivo.equipo}
          torneo={enVivo.torneo}
          onListo={enVivo.onListo}
        />
      )}

      <EventBurst
        show={burst !== null}
        label={burst?.label}
        tone={burst?.tone || "oro"}
        onDone={() => setBurst(null)}
      />

      {/* Position Selector Modal */}
      <AnimatePresence>
        {showPosSelector && (
          <PositionSelector
            formation={f}
            drafted={drafted}
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
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <img src="/logos/afa.png" alt="AFA" className="w-[18px] h-[25px] object-contain drop-shadow" />
          <span className="text-[10px] font-bold text-slate-500 tracking-widest font-sport uppercase">{mode.name}</span>
        </div>
        <h1 className="font-bandera text-2xl md:text-4xl text-white tracking-[0.14em] uppercase">ARMÁ TU 11 DE SELECCIÓN</h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs flex-wrap font-sport uppercase tracking-widest text-slate-400">
          <span>
            Posición: <strong className="text-white font-bold">{POS_LABELS[currentPos.pos] || currentPos.pos}</strong>
            <span className="text-slate-500 ml-1">({activeSlotIdx + 1}/{totalSlots})</span>
          </span>
          <span>·</span>
          <span>Equipo: <strong className="text-[#75AADB] font-bold">{filledCount}/11</strong></span>
          {teamScore > 0 && (
            <>
              <span>·</span>
              <span className="text-[#75AADB] font-bold">OVR: {teamScore}</span>
            </>
          )}
          {wildcards > 0 && (
            <>
              <span>·</span>
              <span className="text-yellow-400 font-bold">COMODINES: {wildcards}</span>
            </>
          )}
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
              <div className="card-gradient rounded-2xl p-3 mb-4 text-sm text-amber-200 border border-amber-400/20">{spinNotice}</div>
            )}
            <div className="card-gradient rounded-2xl p-4 mb-4 text-center">
              <div className="text-sm text-slate-400 mb-1">Posición {filledCount + 1} de {totalSlots}:</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos]}</div>
                <span className="font-display font-bold text-xl text-white">{currentPos.label}</span>
              </div>
            </div>
            {/* La regla del día, a la vista mientras jugás: si no se ve, no se siente un reto. */}
            {retoDelDia && (
              <div className="mb-4 rounded-2xl border border-orange-400/30 bg-orange-500/[0.07] px-4 py-3 text-center">
                <p className="font-sport text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">
                  {retoDelDia.icon} Reto de hoy · {retoDelDia.title}
                </p>
                <p className="mt-1 font-sans text-[12px] leading-relaxed text-slate-300">{retoDelDia.rule}</p>
                <p className="mt-1 font-sport text-[10px] uppercase tracking-wider text-slate-500">
                  Bombo recortado: hoy todos juegan con los mismos jugadores
                </p>
              </div>
            )}
            <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} chemistry={chemBreakdown} /></div>
            {filledCount >= 2 && <div className="mb-4"><ChemistryPanel chemistry={chemBreakdown} /></div>}
            <div className="flex gap-3 justify-center flex-wrap font-sport">
              <MagneticButton>
                <button onClick={() => spinWheel()} className="btn-primary px-10 py-4">
                  Girar Ruleta
                </button>
              </MagneticButton>
              <button onClick={() => setShowPosSelector(true)} className="btn-secondary px-6 py-4">
                Elegir posición
              </button>
            </div>

            {/* La salida rápida, desde el primer giro. Sin esto hay que dar 22 toques antes de que
                exista cualquier resultado, y el jugador promedio tiene 44 segundos adentro. */}
            {filledCount >= 1 && filledCount < totalSlots && (
              <div className="mt-4 text-center">
                <button
                  onClick={completarEquipo}
                  className="rounded-2xl border border-[#F6C750]/40 bg-[#F6C750]/[0.08] px-6 py-3 font-sport text-[11px] font-black uppercase tracking-[0.18em] text-[#F6C750] transition-colors hover:bg-[#F6C750]/15 hover:text-white"
                >
                  ⚡ Completar los {totalSlots - filledCount} que faltan y jugar
                </button>
                <p className="mt-1.5 font-sans text-[11px] text-slate-500">
                  Te llena los puestos vacíos con lo mejor que haya y vas directo al torneo
                </p>
              </div>
            )}

            <p className="text-xs text-slate-400 mt-3 text-center">
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
                className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-xl text-yellow-300 text-xs font-bold tracking-wider uppercase font-sport shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                LA CÁBALA ACTIVADA - GENERANDO JUGADORES DE ÉLITE
              </motion.div>
            )}
            <p className="text-slate-400 mb-4 text-xs font-bold uppercase tracking-widest font-sport">SORTEANDO PLANTEL COMPATIBLE PARA{" "}
              <strong style={{ color: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos]}</strong>
              {" "}({filledCount + 1}/{totalSlots})
            </p>
            <SquadRoulette squads={eligibleSquads} spinning={true} result={currentSquad}
              onSpinComplete={() => { setSpinning(false); setPhase("reveal"); setSearch("") }} />
            <p className="mt-4 text-xs text-slate-500 font-bold uppercase tracking-wider font-sport">Buscando el plantel perfecto para tu equipo...</p>
          </motion.div>
        )}

        {/* PHASE: REVEAL (pack opening) */}
        <AnimatePresence>
          {phase === "reveal" && currentSquad && (() => {
            const { tier, avg } = getSquadTier(currentSquad, allP)
            return (
              <PackReveal squad={currentSquad} tier={tier} avg={avg}
                onContinue={() => setPhase("picking")} />
            )
          })()}
        </AnimatePresence>

        {/* PHASE: PICKING */}
        {phase === "picking" && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card-gradient rounded-2xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`/logos/clubs/${currentSquad.clubId}.png`} alt=""
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
              <div className="flex gap-2 font-sport">
                <button onClick={rerollTeam} disabled={wildcards <= 0}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed uppercase font-bold tracking-wider">
                  RE-SORTEAR ({wildcards})
                </button>
              </div>
            </div>
            <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} chemistry={chemBreakdown} /></div>
            <div className="card-gradient rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                  SELECCIONÁ{" "}
                  <span style={{ color: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos] || currentPos.pos}</span>
                  {" "}— 1 JUGADOR
                </h3>
                <span className="text-xs text-slate-500 font-sport">{pickerPlayers.length} disp. · {filledCount}/{totalSlots}</span>
              </div>
              <input type="text" placeholder="Buscar jugador..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="input-field mb-3 text-sm font-sans" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {pickerPlayers.length === 0 && (
                  <p className="text-slate-500 text-sm text-center col-span-2 py-4 font-sport uppercase tracking-wider">
                    {draftedIds.size > 0 && currentSquad
                      ? "Todos los jugadores ya fueron elegidos. Girá de nuevo."
                      : "Sin jugadores para esta posición. Usá Re-sortear."}
                  </p>
                )}
                {pickerPlayers.map(player => (
                  <PlayerTradingCard key={player.id} player={player}
                    onSelect={() => pickPlayer(player, activeSlotIdx)}
                    showRating={mode.ratingsVisible}
                    currentSquad={currentSquad} />
                ))}
              </div>
              {pickerPlayers.length > 0 && (
                <p className="text-xs text-slate-400 text-center mt-2 font-sport uppercase tracking-wider font-semibold">
                  {compatibleCount > 0
                    ? `${compatibleCount} COMPATIBLE${compatibleCount !== 1 ? "S" : ""} — ELEGÍ UNO Y GIRÁ DE NUEVO`
                    : "NINGUNO COMPATIBLE — USÁ RE-SORTEAR"}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE: DONE */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
            <div className="card-gradient rounded-3xl p-6">
              <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Armado!</h2>
              <p className="text-slate-400 text-sm mb-4">Tu equipo está listo para competir por el ranking ELO.</p>

              {/* TEAM TACTICAL RADAR (DATA SCIENCE ANALYTICS) */}
              {(() => {
                const validPlayers = drafted.filter(Boolean) as Player[]
                const avgRating = validPlayers.length > 0 ? validPlayers.reduce((a, b) => a + (b.rating || 70), 0) / validPlayers.length : 75
                const starCount = validPlayers.filter(p => (p.rating || 0) >= 80).length
                const metrics = {
                  attack: Math.min(99, Math.round(avgRating * 1.05)),
                  creation: Math.min(99, Math.round(avgRating * 0.98)),
                  defense: Math.min(99, Math.round(avgRating * 0.95)),
                  chemistry: chemBreakdown.total,
                  starPower: Math.min(99, Math.round(50 + starCount * 12)),
                  experience: Math.min(99, Math.round(65 + validPlayers.length * 3)),
                }
                return <TeamTacticalRadar metrics={metrics} />
              })()}
              <p className="text-slate-400 text-sm mb-4">Tocá cualquier posición para cambiar el jugador</p>
              <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} chemistry={chemBreakdown} /></div>
              <div className="mb-4"><ChemistryPanel chemistry={chemBreakdown} /></div>
              {/* Player chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {f.positions.map((pos: any, i: number) => {
                  const pl = drafted[i]
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700 group relative">
                      <button onClick={() => removePlayer(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: getPC(pos.pos) }}>
                        {pl ? pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : POS_LABELS[pos.pos]}
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-white truncate max-w-[80px]">
                          {pl ? pl.name.split(" ").pop() : <span className="text-slate-500 italic">vacío</span>}
                        </div>
                        <div className="text-[10px] text-slate-500">{POS_LABELS[pos.pos] || pos.pos}</div>
                      </div>
                      {pl && mode.ratingsVisible && <span className="text-[10px] font-bold text-[#75AADB]">{pl.rating}</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-2xl font-display font-black text-[#75AADB]">Score: {teamScore || partialScore} pts</div>
            </div>

            {/* La plaza que te ganaste clasificando con la Liga. No es un modo que se elige:
                está acá porque saliste entre los primeros, y se gasta al jugarla. */}
            {user?.plaza && (
              <div className="cartel-in cartel-shine mx-auto mb-5 max-w-xl rounded-2xl border-2 border-amber-400/60 bg-gradient-to-b from-amber-400/20 to-slate-950/40 px-5 py-5 text-center shadow-[0_0_40px_rgba(246,199,80,0.18)]">
                <p className="text-[10px] font-black font-sport uppercase tracking-widest text-[#F6C750]">
                  Clasificaste
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300 font-sans">
                  Saliste <strong className="text-white">{user.plaza.puesto}°</strong> con{" "}
                  {user.plaza.equipo}: te ganaste un lugar en la{" "}
                  <strong className="text-white">
                    {user.plaza.torneo === "libertadores" ? "Copa Libertadores" : "Copa Sudamericana"}
                  </strong>
                  . Se juega con el 11 que tengas armado ahora.
                </p>
                <MagneticButton>
                  <button
                    onClick={() => startSim(user.plaza!.torneo)}
                    className="btn-gold mt-4 rounded-2xl px-10 py-4 font-sport text-[12px] font-black uppercase tracking-widest"
                  >
                    Jugar la {user.plaza.torneo === "libertadores" ? "Libertadores" : "Sudamericana"}
                  </button>
                </MagneticButton>
              </div>
            )}

            {/* Qué te llevás por simular. Va acá y no solo en /leaderboard: es el momento en que
                se ganan los puntos, y sin esto el número del ranking no se entiende. */}
            <div className="max-w-xl mx-auto mb-5 rounded-2xl border border-[#74ACDF]/20 bg-slate-950/50 px-4 py-3 text-center">
              <p className="text-[10px] font-black font-sport uppercase tracking-widest text-[#74ACDF]">
                Esto suma al ranking
              </p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400 font-sans">
                Tu <strong className="text-slate-200">ELO</strong> se mueve según en qué puesto termines: salir
                campeón te catapulta, pelear el descenso te resta.
              </p>
              {/* Los números salen de BASE_POR_TORNEO, no escritos a mano: si mañana se recalibran,
                  el cartel se actualiza solo y no queda mintiendo. */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {([
                  { t: "copa" as const, label: "Copa", nota: "32 equipos, eliminación directa" },
                  { t: "liga" as const, label: "Liga", nota: "28 fechas, la más larga" },
                  { t: "sudamericana" as const, label: "Sudamericana", nota: "hay que clasificar" },
                  { t: "libertadores" as const, label: "Libertadores", nota: "la que más vale" },
                ]).map((x) => (
                  <div key={x.t} className={`rounded-xl border px-2 py-2 ${
                    x.t === "libertadores" ? "border-[#F6C750]/40 bg-[#F6C750]/[0.07]"
                    : x.t === "sudamericana" ? "border-[#74ACDF]/30 bg-[#74ACDF]/[0.05]"
                    : "border-white/5 bg-slate-950/40"}`}>
                    <div className={`font-display text-base font-black leading-none ${
                      x.t === "libertadores" ? "text-[#F6C750]" : x.t === "sudamericana" ? "text-[#9CCBF0]" : "text-white"}`}>
                      {BASE_POR_TORNEO[x.t]}
                    </div>
                    <div className="mt-0.5 text-[11px] font-black uppercase tracking-wider text-slate-300 font-sport">{x.label}</div>
                    <div className="text-[10px] leading-tight text-slate-500 font-sans">{x.nota}</div>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400 font-sans">
                Las dos copas continentales <strong className="text-slate-200">no se eligen</strong>: se clasifica
                terminando entre los 8 primeros de la Liga, y la plaza queda guardada en tu cuenta.{" "}
                {user?.isLoggedIn
                  ? "Se juega con el 11 que tengas armado, y la plaza se gasta al usarla."
                  : "Como invitado no se guarda: hay que tener cuenta para jugarlas y para entrar al ranking."}{" "}
                <Link href="/leaderboard" className="text-[#74ACDF] hover:text-white underline underline-offset-2">
                  Ver el ranking
                </Link>
              </p>
            </div>

            <div className="mb-6 flex flex-col items-center justify-center gap-3 font-sport sm:flex-row">
              {/* Un equipo juega cada torneo UNA vez. Antes se podía volver desde el resumen y
                  repetir la Liga hasta sacar un buen puesto, sumando ELO cada vez. */}
              {([["liga", "Simular Liga"], ["copa", "Simular Copa"]] as const).map(([tipo, texto]) => {
                const yaJugado = torneosJugados.has(tipo)
                return (
                  <MagneticButton key={tipo}>
                    <button
                      onClick={() => startSim(tipo)}
                      disabled={yaJugado}
                      title={yaJugado ? "Ya jugaste este torneo con este equipo. Armá otro draft." : undefined}
                      className={`w-full px-8 py-3 sm:w-auto ${yaJugado ? "btn-secondary opacity-50" : "btn-primary"}`}
                    >
                      {yaJugado ? `${texto.replace("Simular ", "")} jugada` : texto}
                    </button>
                  </MagneticButton>
                )
              })}
              <button onClick={resetGame} className="btn-secondary w-full px-6 py-3 sm:w-auto">Nuevo Draft</button>
            </div>
            {torneosJugados.size > 0 && (
              <p className="mb-5 text-center text-[11px] leading-relaxed text-slate-400 font-sans">
                Cada equipo juega cada torneo una sola vez. Para volver a competir,{" "}
                <button onClick={resetGame} className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
                  armá otro draft
                </button>
                .
              </p>
            )}
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider block text-center inline-block py-2.5 px-3">Volver al inicio</Link>
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
