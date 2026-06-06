"use client"
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import {
  formations, positionCompatibility, spinSquad, getSquadPlayers,
  calculateTeamScore, simulateSeason, GAME_MODES, generateShareText
} from '@/lib/game-engine'
import { Player, Club, Squad, Formation, FormationConfig, GameMode } from '@/lib/types'

const PC: Record<string, string> = { GK:'#f59e0b', CB:'#3b82f6', LB:'#06b6d4', RB:'#06b6d4', CM:'#10b981', CDM:'#059669', CAM:'#8b5cf6', LW:'#ef4444', RW:'#ef4444', ST:'#dc2626', CF:'#ea580c' }

function DraftContent() {
  const sp = useSearchParams()
  const modeParam = (sp.get('mode') || 'clasico') as GameMode
  const mode = GAME_MODES[modeParam] || GAME_MODES.clasico
  
  const allPlayers = playersData as Player[]
  const allClubs = clubsData as Club[]
  const allSquads = squadsData as Squad[]
  const clubsMap = new Map(allClubs.map(c => [c.id, c]))
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false)
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null)
  const [formation, setFormation] = useState<Formation>('4-3-3')
  const [drafted, setDrafted] = useState<(Player | null)[]>([])
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [posFilter, setPosFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [rerollsLeft, setRerollsLeft] = useState(mode.rerolls)
  const [showResult, setShowResult] = useState(false)
  const [seasonResult, setSeasonResult] = useState<any>(null)
  const [showRatings, setShowRatings] = useState(mode.ratingsVisible)
  const [shareText, setShareText] = useState('')
  
  const form = formations[formation] as FormationConfig
  const squadPlayers = currentSquad ? getSquadPlayers(currentSquad, allPlayers) : []
  const club = currentSquad ? clubsMap.get(currentSquad.clubId) : null
  
  const filled = drafted.filter(Boolean).length
  const totalSlots = form.positions.length
  const score = gameStarted ? calculateTeamScore(drafted, form) : 0
  
  // Start new game
  const startGame = () => {
    const sq = spinSquad(allSquads)
    setCurrentSquad(sq)
    setDrafted(new Array(totalSlots).fill(null))
    setActiveSlot(0)
    setGameStarted(true)
    setShowResult(false)
    setSeasonResult(null)
    setRerollsLeft(mode.rerolls)
    setShowRatings(mode.ratingsVisible)
  }
  
  // Reroll squad
  const reroll = () => {
    if (rerollsLeft <= 0) return
    const sq = spinSquad(allSquads)
    setCurrentSquad(sq)
    setDrafted(new Array(totalSlots).fill(null))
    setActiveSlot(0)
    setRerollsLeft(r => r - 1)
    setShowResult(false)
    setSeasonResult(null)
  }
  
  // Draft a player into active slot
  const draftPlayer = (p: Player) => {
    if (activeSlot === null) return
    const d = [...drafted]
    d[activeSlot] = p
    setDrafted(d)
    // Move to next empty slot
    const next = d.findIndex((x, i) => i > activeSlot && x === null)
    setActiveSlot(next !== -1 ? next : d.findIndex(x => x === null))
  }
  
  const removePlayer = (i: number) => {
    const d = [...drafted]
    d[i] = null
    setDrafted(d)
    setActiveSlot(i)
  }
  
  const reset = () => {
    setDrafted(new Array(totalSlots).fill(null))
    setActiveSlot(0)
    setShowResult(false)
    setSeasonResult(null)
  }
  
  const simulate = () => {
    const teamPlayers = drafted.filter(Boolean) as Player[]
    const opponents = allSquads
      .filter(s => s.id !== currentSquad?.id && s.playerIds.length >= 11)
      .slice(0, 38)
      .map(s => getSquadPlayers(s, allPlayers).slice(0, 11))
    const result = simulateSeason(teamPlayers, opponents)
    setSeasonResult(result)
    setShowResult(true)
  }
  
  const doShare = () => {
    const txt = generateShareText(currentSquad!, score, formation)
    setShareText(txt)
    navigator.clipboard?.writeText(txt)
  }
  
  // Filter squad players by position and search
  const filtered = squadPlayers.filter(p => {
    const posOk = posFilter === 'all' || p.position === posFilter
    const searchOk = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const notDrafted = !drafted.some(d => d?.id === p.id)
    return posOk && searchOk && notDrafted
  })
  
  const canSimulate = filled >= 7
  
  // ═══ SETUP SCREEN ═══
  if (!gameStarted) {
    return (
      <div className="min-h-screen gradient-bg py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 btn-secondary text-sm mb-8">← Volver al inicio</Link>
          
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black font-display gradient-text">{mode.name}</h1>
            <p className="text-slate-400 mt-3 text-lg">{mode.desc}</p>
          </motion.div>
          
          <div className="card-gradient rounded-2xl p-8 max-w-xl mx-auto">
            <h2 className="text-xl font-bold mb-6 font-display">📐 Elegí formación</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {Object.values(formations).map(f => (
                <button key={f.id} onClick={() => setFormation(f.id as Formation)}
                  className={`p-3 rounded-xl text-center transition-all duration-200 ${formation === f.id ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                  <div className="text-2xl font-bold font-display">{f.id}</div>
                  <div className="text-xs mt-1 opacity-75">{Object.values(f.requirements).reduce((a,b)=>a+b,0)} jugadores</div>
                </button>
              ))}
            </div>
            
            {!mode.ratingsVisible && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                <p className="text-amber-400 text-sm font-semibold">🧠 Modo Almanaque: los ratings están OCULTOS. ¡Usá tu memoria futbolera!</p>
              </div>
            )}
            
            <button onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              🎲 ¡Girar y Empezar!
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // ═══ MAIN GAME SCREEN ═══
  const clubColors = club?.colors || ['#1e293b', '#0f172a']
  
  return (
    <div className="min-h-screen gradient-bg py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2