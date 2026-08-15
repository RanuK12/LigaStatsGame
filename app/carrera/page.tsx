"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"

// Camiseta 3D (WebGL) solo en cliente: R3F no soporta SSR y el sitio es export estático.
const Jersey3D = dynamic(() => import("@/components/career/Jersey3D"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-slate-800/50" />,
})
import CareerCardView from "@/components/pitch/CareerCardView"
import SeasonReveal from "@/components/career/SeasonReveal"
import CareerFinale from "@/components/career/CareerFinale"
import CareerTimelineCard from "@/components/career/CareerTimelineCard"
import BallonDorReveal from "@/components/career/BallonDorReveal"
import EventBurst, { type BurstTone } from "@/components/ui/EventBurst"
import ShareBar from "@/components/ShareBar"
import SeasonProgress, { SEASON_PROGRESS_MS } from "@/components/career/SeasonProgress"
import IdolatriaBar from "@/components/career/IdolatriaBar"
import EventoCarrera, { type EventoPendiente } from "@/components/career/EventoCarrera"
import { idolatriaActual } from "@/lib/career-idolatria"
import type { SeasonResult } from "@/lib/career-engine"
import { usePlayersCore } from "@/lib/data-loader"
import {
  POSITIONS,
  ARG_CLUBS,
  SUDAM_CLUBS,
  LIGAS,
  PAISES_CARRERA,
  clubesDeLiga,
  nivelDeLiga,
  etiquetaDeNivel,
  findClub,
  MAX_SEASONS,
  marketValueFor,
  formatMarketValue,
  ovrCapForAge,
  TROPHY_META,
  CAREER_DILEMMAS,
  SUBSTANCE_DECISION,
  BARRABRAVAS_DECISION,
  academyInterest,
  LEGEND_CAREERS,
  positionCategory,
} from "@/lib/career-engine"
import { useCareerStore, buildCareerCardData, type CareerSetup } from "@/lib/career-store"
import { urlDeCarrera } from "@/lib/career-link"
import { storyBlob, type FormatoFicha } from "@/lib/story-card"
import { downloadFichaPng, downloadFichaJpg, downloadFichaPdf } from "@/lib/career-pdf"
import { trackEvent, EVENTOS } from "@/components/Analytics"

import CareerMomentumChart from "@/components/charts/CareerMomentumChart"
import { useT } from "@/lib/i18n"

const NATIONALITIES: { name: string; flag: string }[] = [
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "México", flag: "🇲🇽" },
  { name: "Perú", flag: "🇵🇪" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "Ecuador", flag: "🇪🇨" },
  { name: "Venezuela", flag: "🇻🇪" },
  { name: "Bolivia", flag: "🇧🇴" },
  { name: "Costa Rica", flag: "🇨🇷" },
  { name: "Honduras", flag: "🇭🇳" },
  { name: "Panamá", flag: "🇵🇦" },
  { name: "Estados Unidos", flag: "🇺🇸" },
  { name: "España", flag: "🇪🇸" },
  { name: "Italia", flag: "🇮🇹" },
  { name: "Francia", flag: "🇫🇷" },
]

const JERSEY_PATTERNS = [
  { id: "solid", name: "Sólida Tradicional" },
  { id: "sash", name: "Banda Diagonal" },
  { id: "stripes", name: "Bastones Verticales" },
  { id: "hoops", name: "Franja Horizontal" },
]

function flagFor(nationality: string): string {
  return NATIONALITIES.find((n) => n.name === nationality)?.flag || "🇦🇷"
}

export default function CarreraPage() {
  const t = useT()
  const career = useCareerStore((s) => s.career)
  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg text-white px-4 py-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card-gradient rounded-3xl p-6 sm:p-8 border border-[#74ACDF]/20 text-center relative overflow-hidden shadow-2xl">
          {/* Acá decía "COPERO ENGINE". Copero es el competidor directo: su marca no va en
              nuestra propia página, y menos en la portada del modo que compite con el suyo.
              El motor de la carrera es nuestro y está en lib/career-engine.ts. */}
          <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
            {t('carrera.simuladorDeCarrera409', 'SIMULADOR DE CARRERA · 409 CLUBES DE 8 PAÍSES')}
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            {t('carrera.tuCaminoALa', 'TU CAMINO A LA GLORIA')}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-2 leading-relaxed font-sans">
            {t('carrera.creaTuCrackEn', 'Creá tu crack en 3D, tomá decisiones clave de pretemporada y transferencias, y viví la simulación completa temporada a temporada.')}
          </p>
        </div>

        {career ? <CareerDashboard /> : <CareerSetupWizard />}

        <div className="text-center pt-2">
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

// ---------------- SETUP WIZARD WITH 3D JERSEY CREATOR ----------------

// Nombres genéricos para el default (el usuario puede cambiarlo); evita el fijo "Ranucoli".
const RANDOM_PLAYER_NAMES = [
  "Juan Gómez", "Mateo Fernández", "Thiago Sosa", "Lucas Romero", "Bruno Díaz",
  "Nico Herrera", "Santiago Ruiz", "Valentín Silva", "Tomás Acosta", "Facundo Molina",
  "Joaquín Ríos", "Benja Cabrera", "Ciro Ledesma", "Álvaro Núñez", "Ramiro Vega",
]

function CareerSetupWizard() {
  const t = useT()
  const startCareer = useCareerStore((s) => s.startCareer)
  const [mode, setMode] = useState<"create" | "real">("create")

  const [name, setName] = useState("")
  const [number, setNumber] = useState(10)
  // Nombre random básico al iniciar (como Copero), no uno fijo. Se hace en mount para
  // no romper la hidratación del static export.
  useEffect(() => {
    setName((n) => n || RANDOM_PLAYER_NAMES[Math.floor(Math.random() * RANDOM_PLAYER_NAMES.length)])
    setNumber(Math.floor(Math.random() * 25) + 1)
  }, [])
  const [position, setPosition] = useState("CAM")
  const [nationality, setNationality] = useState("Argentina")
  const [ovr, setOvr] = useState(60) // canterano básico (~€300K); sube con el slider hasta el tope por edad
  const [age, setAge] = useState(18)
  const [jerseyPattern, setJerseyPattern] = useState("sash")
  const [jerseyColor, setJerseyColor] = useState("#74ACDF")

  const { players, error } = usePlayersCore()
  const [query, setQuery] = useState("")
  const results = useMemo(() => {
    if (!players || query.trim().length < 2) return []
    const q = query.toLowerCase()
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12)
  }, [players, query])

  const [clubId, setClubId] = useState("gimnasia-lp")

  const setup: CareerSetup | null = clubId
    ? {
        name: name || "Mi Crack",
        number,
        position,
        nationality,
        flag: flagFor(nationality),
        ovr,
        age,
        clubId,
      }
    : null

  const previewValue = marketValueFor(ovr, age)

  function pickReal(p: { name: string; position: string; rating: number; nationality?: string }) {
    setName(p.name)
    setPosition(p.position)
    setOvr(p.rating)
    setNationality(p.nationality || "Argentina")
    setAge(20)
    setMode("create")
  }

  function loadLegend(key: "messi" | "maradona") {
    const l = LEGEND_CAREERS[key]
    setName(l.name)
    setNumber(l.number)
    setPosition(l.position)
    setNationality(l.nationality)
    setOvr(l.ovr)
    setAge(l.age)
    setClubId(l.clubId)
    setMode("create")
  }

  const [rotarCantera, setRotarCantera] = useState(0)

  // Interés de la cantera al arrancar: dinámico según OVR, país de origen y rotación.
  const academySeed = (name.length * 31 + ovr * 13 + (nationality ? nationality.length * 17 : 0) + rotarCantera * 101 + 13) >>> 0
  const academyClubs = academyInterest(ovr, academySeed, nationality)

  return (
    <div className="space-y-6">
      {/* STEP 1: PLAYER & 3D JERSEY */}
      <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-5 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#74ACDF] text-slate-950 font-black flex items-center justify-center text-sm font-sport">1</span>
          <h3 className="font-display text-xl font-black uppercase">{t('carrera.creacionDeJugadorCamiseta', 'Creación de Jugador & Camiseta 3D')}</h3>
        </div>

        <div className="flex gap-2 font-sport">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "create" ? "bg-[#74ACDF] text-white shadow-lg" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            {t('carrera.crearJugadorCamiseta', 'Crear Jugador & Camiseta')}
          </button>
          <button
            onClick={() => setMode("real")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "real" ? "bg-[#74ACDF] text-white shadow-lg" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            {t('carrera.elegirReal', 'Elegir Real')}
          </button>
        </div>

        {/* Modo debug: cargar carrera de leyenda (valores aproximados). */}
        {process.env.NODE_ENV === "development" && (
          <div className="flex items-center gap-2 font-sport text-[10px]">
            <span className="uppercase tracking-wider text-slate-500">{t('carrera.debug', 'Debug:')}</span>
            <button onClick={() => loadLegend("messi")} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 transition-all hover:border-[#74ACDF]/40 hover:text-white">
              {t('carrera.carreraDeMessi', 'Carrera de Messi')}
            </button>
            <button onClick={() => loadLegend("maradona")} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 font-bold text-slate-300 transition-all hover:border-[#D4AF37]/40 hover:text-white">
              {t('carrera.carreraDeMaradona', 'Carrera de Maradona')}
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* 3D JERSEY GRAPHIC DISPLAY */}
            <div className="card-glass p-5 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center space-y-3 shadow-2xl">
              <span className="text-[10px] font-bold text-[#74ACDF] font-sport uppercase tracking-wider">
                {t('carrera.vistaPreviaCamiseta3d', 'VISTA PREVIA CAMISETA 3D')}
              </span>

              <div className="relative h-60 w-52 filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]">
                <Jersey3D color={jerseyColor} pattern={jerseyPattern} number={number} name={name} />
              </div>
              <span className="text-[11px] text-slate-500 font-sans">{t('carrera.arrastraParaGirar', 'Arrastrá para girar')}</span>

              <div className="text-xs font-bold text-white font-display uppercase tracking-wider">
                #{number} · {name || "JUGADOR"}
              </div>
            </div>

            {/* INPUT FIELDS */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre del Jugador">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('carrera.tuNombreDeCrack', 'Tu nombre de crack')}
                  className="input-dark"
                />
              </Field>
              <Field label="Dorsal / Camiseta">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={number}
                  onChange={(e) => setNumber(clampNum(parseInt(e.target.value) || 1, 1, 99))}
                  className="input-dark"
                />
              </Field>
              <Field label="Posición">
                <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-dark">
                  {POSITIONS.map((p) => (
                    <option key={p.code} value={p.code}>{p.code} · {p.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nacionalidad">
                <select value={nationality} onChange={(e) => setNationality(e.target.value)} className="input-dark">
                  {NATIONALITIES.map((n) => (
                    <option key={n.name} value={n.name}>{n.flag} {n.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Diseño de Camiseta">
                <select value={jerseyPattern} onChange={(e) => setJerseyPattern(e.target.value)} className="input-dark">
                  {JERSEY_PATTERNS.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>{pattern.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Color de Camiseta">
                <input
                  type="color"
                  value={jerseyColor}
                  onChange={(e) => setJerseyColor(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl p-1 cursor-pointer"
                />
              </Field>
              <Field label={`OVR inicial: ${ovr} (máx ${ovrCapForAge(age)} a los ${age})`}>
                <input type="range" min={55} max={ovrCapForAge(age)} value={Math.min(ovr, ovrCapForAge(age))} onChange={(e) => setOvr(parseInt(e.target.value))} className="rango-tocable w-full accent-[#74ACDF]" />
              </Field>
              <Field label={`Edad: ${age} · Valor ~${formatMarketValue(previewValue)}`}>
                <input type="range" min={16} max={30} value={age} onChange={(e) => { const a = parseInt(e.target.value); setAge(a); setOvr((o) => Math.min(o, ovrCapForAge(a))) }} className="rango-tocable w-full accent-[#74ACDF]" />
              </Field>
            </div>
          </div>
        )}

        {mode === "real" && (
          <div className="space-y-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('carrera.buscarJugadorEjRiquelme', 'Buscar jugador (ej: Riquelme, Messi, Francescoli)')}
              className="input-dark"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {!players && !error && <p className="text-xs text-slate-400">{t('carrera.cargandoBaseDeJugadores', 'Cargando base de jugadores...')}</p>}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickReal(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-[#74ACDF]/50 text-left transition-colors"
                >
                  <span className="text-sm font-bold text-white truncate">{p.name}</span>
                  <span className="text-[10px] font-sport text-slate-400 shrink-0 ml-2">{p.position} · {p.rating} OVR</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: CLUB */}
      <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#74ACDF] text-slate-950 font-black flex items-center justify-center text-sm font-sport">2</span>
          <h3 className="font-display text-xl font-black uppercase">{t('carrera.clubDeInicio', 'Club de Inicio')}</h3>
        </div>

        {/* Interés de la cantera: clubes que te quieren desde las inferiores. */}
        <div className="rounded-2xl border border-[#74ACDF]/20 bg-[#74ACDF]/5 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[11px] font-black text-[#74ACDF] font-sport uppercase tracking-wider flex items-center gap-1.5">
              <span>👀 {academyClubs.length} clubes te buscan de la cantera de {nationality} (OVR {ovr})</span>
            </div>
            <button
              onClick={() => setRotarCantera((c) => c + 1)}
              className="px-2.5 py-1 bg-[#74ACDF]/20 hover:bg-[#74ACDF]/30 text-[#74ACDF] text-[10px] font-black uppercase tracking-wider font-sport rounded-lg border border-[#74ACDF]/40 transition-all flex items-center gap-1 shrink-0"
            >
              <span>{t('carrera.rotarOfertas', '🔄 Rotar Ofertas')}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {academyClubs.map((c) => (
              <button
                key={c.id}
                onClick={() => setClubId(c.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold font-sport transition-all ${clubId === c.id ? "border-[#74ACDF] bg-[#74ACDF]/20 text-white shadow-md scale-105" : "border-white/10 bg-slate-950/70 text-slate-300 hover:text-white hover:border-[#74ACDF]/50"}`}
              >
                {/* `c.escudo` y no la ruta armada a mano: desde que la cantera busca clubes del
                    país del jugador acá pueden aparecer clubes del Ascenso, y esos tienen el
                    escudo en /logos/carrera o /logos/ligas, no en /logos/clubs. Arsenal FC y
                    Chaco For Ever daban 404. */}
                <img src={c.escudo ?? `/logos/clubs/${c.id}.png`} alt="" className="w-5 h-5 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                <span>{c.name}</span>
                <span className="text-[10px] text-amber-400 ml-1">nv.{c.strength}</span>
              </button>
            ))}
          </div>
        </div>

        <ClubPicker selected={clubId} onSelect={setClubId} initialPais={nationality} />
      </div>

      {/* STEP 3: START */}
      <button
        disabled={!setup}
        onClick={() => { if (!setup) return; startCareer(setup); trackEvent(EVENTOS.carreraIniciada, { club: setup.clubId, posicion: setup.position }) }}
        className="btn-primary w-full py-4 text-sm font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {setup ? "COMENZAR CARRERA ⚽" : "ELEGÍ UN CLUB PARA EMPEZAR"}
      </button>
    </div>
  )
}

function ClubPicker({ selected, onSelect, initialPais }: { selected: string; onSelect: (id: string) => void; initialPais?: string }) {
  const t = useT()
  const [paso, setPaso] = useState<"pais" | "liga" | "club">("pais")
  const [pais, setPais] = useState<string | null>(null)
  const [ligaId, setLigaId] = useState<string | null>(null)

  useEffect(() => {
    if (initialPais && PAISES_CARRERA.some((p) => p.nombre === initialPais)) {
      setPais(initialPais)
      setPaso("liga")
    }
  }, [initialPais])

  const ligasDelPais = useMemo(
    () => (pais ? LIGAS.filter((l) => l.pais === pais).sort((a, b) => a.division - b.division) : []),
    [pais],
  )
  const liga = ligaId ? LIGAS.find((l) => l.id === ligaId) : null
  const clubes = useMemo(() => (ligaId ? clubesDeLiga(ligaId) : []), [ligaId])

  function elegirPais(p: string) {
    setPais(p)
    setLigaId(null)
    setPaso("liga")
  }

  function elegirLiga(id: string) {
    setLigaId(id)
    setPaso("club")
  }

  return (
    <div className="space-y-4">
      {/* Botón flecha volver atrás intuitivo */}
      {paso !== "pais" && (
        <button
          onClick={() => setPaso(paso === "club" ? "liga" : "pais")}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#74ACDF]/40 bg-[#74ACDF]/10 hover:bg-[#74ACDF]/20 text-[#74ACDF] font-sport text-xs font-black uppercase tracking-wider transition-all transform hover:-translate-x-1"
        >
          <span className="text-sm">←</span>
          <span>Volver a {paso === "club" ? "Categorías" : "Selección de Países"}</span>
        </button>
      )}

      {/* Las migas: se ve dónde se está y se puede volver sin perder lo elegido. */}
      <div className="flex flex-wrap items-center gap-1.5 font-sport text-[11px] font-bold uppercase tracking-wider">
        <button
          onClick={() => setPaso("pais")}
          className={paso === "pais" ? "text-white" : "text-[#74ACDF] hover:text-white"}
        >
          {pais ? `${PAISES_CARRERA.find((p) => p.nombre === pais)?.bandera ?? ""} ${pais}` : "Elegí el país"}
        </button>
        {pais && (
          <>
            <span className="text-slate-600">›</span>
            <button
              onClick={() => setPaso("liga")}
              className={paso === "liga" ? "text-white" : "text-[#74ACDF] hover:text-white"}
              disabled={!pais}
            >
              {liga ? liga.nombre : "Categoría"}
            </button>
          </>
        )}
        {liga && (
          <>
            <span className="text-slate-600">›</span>
            <span className={paso === "club" ? "text-white" : "text-slate-500"}>{t('carrera.club', 'Club')}</span>
          </>
        )}
      </div>

      {paso === "pais" && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PAISES_CARRERA.map((p) => {
            const divisiones = LIGAS.filter((l) => l.pais === p.nombre)
            const tope = Math.max(...divisiones.map((l) => nivelDeLiga(l.id)))
            return (
              <button
                key={p.nombre}
                onClick={() => elegirPais(p.nombre)}
                className={`rounded-2xl border p-3 text-left transition-all ${
                  pais === p.nombre
                    ? "border-[#74ACDF] bg-[#74ACDF]/15"
                    : "border-white/5 bg-slate-950/50 hover:border-white/25"
                }`}
              >
                <div className="text-2xl leading-none">{p.bandera}</div>
                <div className="mt-1.5 font-display text-sm font-black uppercase text-white">{p.nombre}</div>
                <div className="font-sport text-[10px] uppercase tracking-wider text-slate-500">
                  {divisiones.length} {divisiones.length === 1 ? "categoría" : "categorías"} · nivel {tope}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {paso === "liga" && pais && (
        <div className="space-y-2">
          {ligasDelPais.map((l) => {
            const nivel = nivelDeLiga(l.id)
            return (
              <button
                key={l.id}
                onClick={() => elegirLiga(l.id)}
                className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                  ligaId === l.id
                    ? "border-[#74ACDF] bg-[#74ACDF]/15"
                    : "border-white/5 bg-slate-950/50 hover:border-white/25"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-base font-black uppercase text-white">{l.nombre}</span>
                  <span className="font-sport text-[10px] uppercase tracking-wider text-slate-500">
                    {l.division}ª · {clubesDeLiga(l.id).length} clubes
                  </span>
                </div>
                {/* La barra de nivel: es lo que hace visible que arrancar en el Federal A no es
                    lo mismo que arrancar en la Série A. */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#74ACDF] to-[#F6C750]"
                      style={{ width: `${nivel}%` }}
                    />
                  </div>
                  <span className="font-sport text-[10px] font-bold uppercase tracking-wider text-[#F6C750]">
                    {etiquetaDeNivel(nivel)} {nivel}
                  </span>
                </div>
                {l.asciende > 0 && (
                  <p className="mt-1.5 font-sport text-[10px] uppercase tracking-wider text-[#34d399]">
                    Suben {l.asciende} · se puede ascender
                  </p>
                )}
                {l.nota && <p className="mt-1 text-[11px] leading-snug text-slate-500">{l.nota}</p>}
              </button>
            )
          })}
        </div>
      )}

      {paso === "club" && liga && (
        <ClubGroup
          title={`${liga.bandera} ${liga.nombre} · ${clubes.length} clubes`}
          clubs={clubes}
          selected={selected}
          onSelect={onSelect}
        />
      )}
    </div>
  )
}

function ClubGroup({
  title,
  clubs,
  selected,
  onSelect,
}: {
  title: string
  clubs: { id: string; name: string; strength: number; escudo?: string; ciudad?: string }[]
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.2em] mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {clubs.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all ${selected === c.id ? "bg-[#74ACDF]/20 border-[#74ACDF]" : "bg-slate-950/50 border-white/5 hover:border-white/20"}`}
          >
            {/* Cada club sabe dónde está su escudo: los de siempre en logos/clubs, los de las
                ligas nuevas en logos/ligas. */}
            <img src={c.escudo ?? `/logos/clubs/${c.id}.png`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
            <span className="text-[11px] font-bold text-white truncate flex-1">{c.name}</span>
            <span className="text-[11px] font-sport text-amber-400 shrink-0">{c.strength}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------- DASHBOARD MULTI-TAB ----------------

function CareerDashboard() {
  const t = useT()
  const { career, simulateNextSeason, acceptOffer, declineOffers, retire, resetCareer } = useCareerStore()
  const fichaRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const [selectedOptionId, setSelectedOptionId] = useState<string>("train_finishing")
  const [revealSeason, setRevealSeason] = useState<SeasonResult | null>(null)
  const [ballonDorData, setBallonDorData] = useState<{ year: number; playerName: string; flag: string; ovr: number } | null>(null)
  const [showFinale, setShowFinale] = useState(false)
  const [burst, setBurst] = useState<{ label: string; tone: BurstTone } | null>(null)
  const [lote, setLote] = useState<{ temporadas: number } | null>(null)
  const [simulando, setSimulando] = useState<{ temporadas: number } | null>(null)
  // El evento que está en pantalla ahora mismo. `null` = no hay ninguno abierto.
  const [eventoAbierto, setEventoAbierto] = useState<EventoPendiente | null>(null)

  if (!career) return null
  const cardData = buildCareerCardData(career)
  const club = findClub(career.clubId)
  const hasOffers = career.pendingOffers.length > 0
  const hayOfertaEuropea = career.pendingOffers.some((o) => o.region === "euro")
  // La capitanía solo aparece cuando ya sos un referente (edad/OVR), no en tu 2da temporada.
  const eligibleDilemmas = CAREER_DILEMMAS.filter(
    (d) => d.id !== "captaincy" || career.player.age >= 25 || career.player.ovr >= 79,
  )
  const dilemma = eligibleDilemmas[career.seasonsPlayed % eligibleDilemmas.length]
  const barraActive = career.history[career.history.length - 1]?.barrabravas === true

  /**
   * El texto que se comparte, para la carrera terminada y para la que va por la mitad.
   *
   * La versión de en curso no dice "terminé": dice dónde está parado y con qué. Es lo que a
   * Copero le funciona —una carrera a medias también se cuenta— y es lo único que puede
   * mostrar el 96 % que nunca llega al retiro.
   */
  const titulosGanados = career.history.reduce(
    (a, s) => a + (s.liga ? 1 : 0) + (s.copaArgentina ? 1 : 0) + (s.continentalWon ? 1 : 0),
    0,
  )
  const textoCompartir = career.finished
    ? `🏆 Terminé la carrera de ${career.player.name} (${career.seasonsPlayed} temporadas) en ${club?.name || "Gambeta"} con ${titulosGanados} ${titulosGanados === 1 ? "título" : "títulos"}. 🔥 ¿Podés superarme?`
    : `⚽ ${career.player.name}, ${career.player.age} años, ${career.player.ovr} de media en ${club?.name || "Gambeta"}. ${career.seasonsPlayed} ${career.seasonsPlayed === 1 ? "temporada" : "temporadas"}, ${career.totals.goals} goles${titulosGanados > 0 ? ` y ${titulosGanados} ${titulosGanados === 1 ? "título" : "títulos"}` : ""}. 🔥 A ver hasta dónde llegás vos.`

  /**
   * El link lleva a TU carrera, no a la portada.
   *
   * Es el mismo circuito que ya usa la ficha final (`CareerFinale`) y que copiamos de El Ídolo:
   * un PNG descargado no se previsualiza, no se clickea y no lo indexa nadie; una URL sí, y el
   * que la abre ve la carrera entera con un botón para crear la suya. La carrera a mitad de
   * camino no tiene leyenda con la que compararse ni historia de retiro todavía, y `/c/` ya
   * resuelve las dos ausencias ("La carrera de Fulano").
   */
  const urlCarrera = urlDeCarrera({ card: cardData, temporadas: career.seasonsPlayed })

  /** La placa para historias e Instagram, la misma que arma la ficha final. */
  const placaCarrera = (formato: FormatoFicha) =>
    storyBlob(
      {
        volanta: "Modo Carrera",
        titulo: career.finished
          ? `La carrera de ${career.player.name}`
          : `${career.player.name}, ${career.player.ovr} de media`,
        subtitulo: [
          cardData.idolatria && `${cardData.idolatria.nivel} de ${cardData.idolatria.clubName}`,
          club?.name,
          `${career.seasonsPlayed} ${career.seasonsPlayed === 1 ? "temporada" : "temporadas"}`,
        ]
          .filter(Boolean)
          .join(" · "),
        stats: [
          { valor: `${titulosGanados}`, label: "Títulos" },
          { valor: `${career.totals.matchesPlayed}`, label: "Partidos" },
          positionCategory(career.player.position) === "GK"
            ? { valor: `${cardData.cleanSheets ?? 0}`, label: "Vallas" }
            : { valor: `${career.totals.goals}`, label: "Goles" },
          { valor: `${career.player.age}`, label: "Años" },
        ],
        acento: titulosGanados > 0 ? "#D4AF37" : undefined,
      },
      formato,
    )

  /**
   * El evento que interrumpe esta temporada, y de qué tipo es.
   *
   * Hay uno por temporada y en este orden: si te apretaron los barras eso manda, después la
   * sustancia (cada tres años), y si no, el dilema de pretemporada. Dos modales seguidos serían
   * peor que el panel fijo que estamos sacando.
   */
  const eventoDeLaTemporada: EventoPendiente | null = career.finished
    ? null
    : barraActive
      ? { decision: BARRABRAVAS_DECISION, tono: "duro" }
      : career.seasonsPlayed % 3 === 1
        ? { decision: SUBSTANCE_DECISION, tono: "raro" }
        : dilemma
          ? { decision: dilemma, tono: "dificil" }
          : null

  async function handleExport(kind: "png" | "jpg" | "pdf") {
    if (!fichaRef.current) return
    setExporting(true)
    setExportError(null)
    try {
      if (kind === "png") await downloadFichaPng(fichaRef.current, career!.player.name)
      else if (kind === "jpg") await downloadFichaJpg(fichaRef.current, career!.player.name)
      else await downloadFichaPdf(fichaRef.current, career!.player.name)
      trackEvent(EVENTOS.fichaDescargada, { formato: kind })
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "No se pudo generar la ficha")
    } finally {
      setExporting(false)
    }
  }

  // El momento que merece pantalla completa. Los hitos de carrera (Selección, Europa) van
  // primero: pasan una sola vez y son los que el jugador se acuerda.
  function bigMoment(s: SeasonResult): { label: string; tone: BurstTone } | null {
    if (s.worldCup?.campeon) return { label: "¡CAMPEÓN DEL MUNDO!", tone: "oro" }
    if (s.mundialClubesGanado) return { label: "¡Campeón del Mundo de Clubes!", tone: "oro" }
    if (s.ballonDor) return { label: "¡Balón de Oro!", tone: "oro" }
    if (s.ntDebut) return { label: "¡Te llamó la Selección!", tone: "celeste" }
    if (s.euroOffer) return { label: "¡Te vienen a buscar de Europa!", tone: "oro" }
    if (s.continentalWon) return { label: "¡Campeón de América!", tone: "oro" }
    if (s.liga) return { label: "¡Campeón!", tone: "oro" }
    if (s.copaArgentina) return { label: "¡Copa Argentina!", tone: "celeste" }
    if (s.clasificoLibertadores) return { label: "¡A la Libertadores!", tone: "celeste" }
    if ((s.nextOvr ?? s.ovr) - s.ovr >= 4) return { label: "¡Explotaste de nivel!", tone: "celeste" }
    return null
  }

  /**
   * Simular una temporada pasa primero por el evento, si lo hay.
   *
   * En lote (simular 5 años) NO se pregunta: pedir cinco decisiones seguidas en un modal es
   * peor que no pedir ninguna, así que se usa la opción que estuviera elegida y se sigue.
   */
  function handleSimulate(yearsCount = 1) {
    if (yearsCount === 1 && eventoDeLaTemporada) {
      setEventoAbierto(eventoDeLaTemporada)
      return
    }
    correrConAnimacion(yearsCount, selectedOptionId)
  }

  /** Elegiste en el modal: se cierra y arranca la temporada con esa decisión. */
  function resolverEvento(optionId: string) {
    setSelectedOptionId(optionId)
    setEventoAbierto(null)
    // El modal tarda ~200 ms en irse: si la temporada arranca antes, se pisan las animaciones.
    window.setTimeout(() => correrConAnimacion(1, optionId), 220)
  }

  function correrConAnimacion(yearsCount: number, optionId: string) {
    // El cálculo es instantáneo: se corre igual, pero el resultado se revela después de que
    // la temporada "se juegue" en pantalla. Si no, aparece todo de golpe y no se siente nada.
    setSimulando({ temporadas: yearsCount })
    const resultado = correrTemporadas(yearsCount, optionId)
    window.setTimeout(() => {
      setSimulando(null)
      revelar(resultado, yearsCount)
    }, SEASON_PROGRESS_MS + 120)
  }

  function correrTemporadas(yearsCount: number, optionId: string) {
    let simuladas = 0
    for (let i = 0; i < yearsCount; i++) {
      const cur = useCareerStore.getState().career
      if (!cur || cur.finished) break
      // Las ofertas BLOQUEAN la simulación. En lote se resuelven solas (si no, "simular 5
      // años" terminaba simulando una sola temporada): te vas si el club que te busca es
      // mejor que el actual, y si no te quedás.
      if (cur.pendingOffers.length > 0) {
        if (yearsCount === 1) break
        const actual = findClub(cur.clubId)
        const mejor = [...cur.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
        if (mejor && actual && mejor.strength > actual.strength) acceptOffer(mejor.clubId)
        else declineOffers()
      }
      simulateNextSeason(optionId)
      simuladas++
    }
    return simuladas
  }

  function revelar(simuladas: number, yearsCount: number) {
    const fin = useCareerStore.getState().career
    // Dónde quedó la carrera. Sin esto solo sabemos cuántas empiezan (155) y cuántas llegan al
    // retiro (4): el 96 % que abandona lo hace en un punto que no medimos. `temporada` es la
    // acumulada, así que el máximo por usuario es el año en el que dejó de jugar.
    if (fin?.history.length) {
      trackEvent(EVENTOS.carreraTemporada, { temporada: fin.history.length, edad: fin.player.age })
    }
    if (fin?.finished) {
      // El final natural, a las 15 temporadas, no disparaba nada: `carrera_retiro` sale del
      // botón "Retirarme del fútbol", así que solo medía a los que se van antes. Medido del
      // 7 al 13/8: 78 personas terminaron temporadas y 3 dispararon `carrera_retiro`, y con
      // eso se estaba concluyendo que nadie termina la carrera. Se cuenta acá el final que
      // llega jugando. `simuladas > 0` para no contar dos veces si se vuelve a esta vista.
      if (simuladas > 0) {
        trackEvent(EVENTOS.carreraFinalizada, { temporadas: fin.history.length, edad: fin.player.age })
      }
      // Llegó al final de la carrera: ficha final directo.
      setShowFinale(true)
      return
    }
    if (!fin?.history.length) return
    const ultima = fin.history[fin.history.length - 1]
    // De a una: el momento dramático. En lote: resumen de dónde quedaste + cuántas jugaste.
    setRevealSeason(ultima)
    if (yearsCount === 1) setBurst(bigMoment(ultima))
    else setLote({ temporadas: simuladas })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* FICHA — durante la carrera: player card; al terminar: timeline estilo Copero */}
      <div ref={fichaRef} className="rounded-[36px] overflow-hidden">
        {career.finished ? <CareerTimelineCard career={career} /> : <CareerCardView data={cardData} />}
      </div>

      {/* PANEL DE JUEGO — todo en un flujo, sin pestañas */}
      <div className="space-y-4">
          {/* Estado de la temporada: cabecera de diario deportivo */}
          <div className="relative card-gradient rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden">
            <div className="banda-argentina absolute inset-x-0 top-0 h-1.5 opacity-90" />
            {club && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={club.escudo ?? `/logos/clubs/${club.id}.png`}
                alt=""
                className="pointer-events-none absolute -right-6 -bottom-8 w-40 h-40 object-contain opacity-[0.07]"
                onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
              />
            )}
            <div className="relative flex items-center gap-4">
              {club && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={club.escudo ?? `/logos/clubs/${club.id}.png`} alt="" className="w-16 h-16 object-contain shrink-0 drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-black tracking-[0.2em] uppercase text-amber-300 font-sport">
                    Temporada {career.seasonsPlayed + (career.finished ? 0 : 1)} / {MAX_SEASONS}
                  </span>
                  <span key={career.seasonsPlayed} className="contador-in text-[11px] font-black tracking-[0.2em] uppercase text-slate-500 font-sport">
                    {career.startYear + career.seasonsPlayed}
                  </span>
                </div>
                <h3 className="font-impact text-3xl font-black uppercase text-white leading-[0.95] truncate mt-1.5">
                  {career.finished ? "Carrera finalizada 🏁" : club?.name}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 font-sport">
                  {[
                    { l: "Edad", v: `${career.player.age}` },
                    { l: "OVR", v: `${career.player.ovr}` },
                    { l: "Valor", v: formatMarketValue(career.player.marketValueM) },
                  ].map((chip, i) => (
                    <span
                      key={chip.l}
                      style={{ animationDelay: `${i * 70}ms` }}
                      className="cartel-in rounded-lg border border-white/10 bg-slate-950/60 px-2.5 py-1 text-[10px] font-bold text-slate-300"
                    >
                      <span className="text-slate-500 uppercase tracking-wider">{chip.l} </span>
                      <span className="text-white">{chip.v}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Progreso de la carrera: se llena temporada a temporada */}
            <div className="relative mt-4">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 font-sport">
                <span>{t('carrera.caminoALaGloria', 'Camino a la gloria')}</span>
                <span className="text-[#74ACDF]">{career.seasonsPlayed}/{MAX_SEASONS}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  key={career.seasonsPlayed}
                  className="barra-crece h-full rounded-full bg-gradient-to-r from-[#74ACDF] via-[#9CCBF0] to-[#F6C750]"
                  style={{ width: `${Math.round((career.seasonsPlayed / MAX_SEASONS) * 100)}%` }}
                />
              </div>
            </div>

            {career.history.length > 0 && (
              <IdolatriaBar idolatria={idolatriaActual(career)} clubName={club?.name ?? "tu club"} />
            )}
          </div>

          {/* OFERTAS: si hay, se resuelven primero (bloquean la simulación) */}
          {!career.finished && hasOffers && (
            <div className={`panel-in card-gradient rounded-3xl p-5 space-y-3 shadow-2xl border ${
              hayOfertaEuropea ? "border-[#F6C750]/50 shadow-[0_0_30px_rgba(246,199,80,0.15)]" : "border-[#74ACDF]/40"
            }`}>
              {/* Que te busquen de Europa no es una oferta más: se anuncia como lo que es */}
              {hayOfertaEuropea && (
                <div className="cartel-in cartel-shine -mx-1 mb-1 rounded-2xl border border-[#F6C750]/40 bg-gradient-to-r from-[#F6C750]/15 to-transparent px-4 py-3">
                  <div className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#F6C750]">
                    ✈️ Te vienen a buscar de Europa
                  </div>
                  <div className="mt-1 text-[12px] text-slate-300 font-sans leading-snug">
                    {t('carrera.esElSaltoQue', 'Es el salto que cambia una carrera. Del otro lado del charco se juega otro fútbol.')}
                  </div>
                </div>
              )}
              <h4 className="text-xs font-black text-[#74ACDF] font-sport uppercase tracking-wider">{t('carrera.teLlegaronOfertas', '📩 Te llegaron ofertas')}</h4>
              <div className="space-y-2.5 font-sport">
                {career.pendingOffers.map((o) => {
                  const euro = o.region === "euro"
                  return (
                    <div key={o.clubId} className={`flex items-center gap-2 rounded-xl p-3 border ${euro ? "bg-amber-400/10 border-amber-400/40" : "bg-slate-950/60 border-white/5"}`}>
                      <img src={findClub(o.clubId)?.escudo ?? `/logos/clubs/${o.clubId}.png`} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate flex items-center gap-1.5 font-display">
                          {o.clubName}
                          {euro && <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1 rounded uppercase">{t('carrera.europa', 'Europa')}</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sport">Oferta {formatMarketValue(o.valueM)}</div>
                      </div>
                      <button onClick={() => acceptOffer(o.clubId)} className="btn-primary px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg">{t('carrera.fichar', 'Fichar')}</button>
                    </div>
                  )
                })}
                <button onClick={declineOffers} className="w-full py-2 bg-slate-900 border border-white/10 text-slate-300 rounded-xl text-xs font-bold font-sport uppercase">
                  Quedarme en {club?.name}
                </button>
              </div>
            </div>
          )}

          {/* Las decisiones ya no viven acá: interrumpen al simular (EventoCarrera). Como panel
              fijo se quedaban en pantalla temporada tras temporada, sin señal de que hubiera
              algo que resolver ni de que ya estuviera resuelto, y se leían como algo roto. */}
          {!career.finished && !hasOffers && eventoDeLaTemporada && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-center">
              <span className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                {t('carrera.alSimularVasA', 'Al simular vas a tener que decidir')}
              </span>
            </div>
          )}

          {/* SIMULAR — botón principal, siempre visible cuando toca */}
          {!career.finished && !hasOffers && (
            <div className="space-y-2 font-sport">
              <button
                onClick={() => handleSimulate(1)}
                className="latido btn-primary w-full py-5 text-sm font-black tracking-widest uppercase rounded-2xl shadow-xl"
              >
                ▶ Simular Temporada {career.seasonsPlayed + 1}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleSimulate(5)} className="py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors">
                  ⚡ Simular 5 años
                </button>
                <button onClick={() => handleSimulate(15)} className="py-2.5 bg-slate-900 border border-slate-800 text-amber-300 hover:text-amber-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors">
                  🏁 Simular completa
                </button>
              </div>
            </div>
          )}

          {/* Carrera terminada */}
          {career.finished && (
            <button onClick={() => setShowFinale(true)} className="btn-gold w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest">
              🏆 Ver resumen de carrera
            </button>
          )}

          {/* MOMENTUM & EVOLUCIÓN DE CARRERA (DATA SCIENCE ANALYTICS) */}
          {career.history.length > 0 && (
            <CareerMomentumChart history={career.history} />
          )}

          {/* FEED DE TEMPORADAS — la narrativa dinámica, en la misma pantalla.
              Cada puesto muestra lo suyo: el arquero vallas invictas y penales atajados. */}
          {career.history.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.3em] px-1">{t('carrera.tuHistoria', 'Tu historia')}</h4>
              {[...career.history].reverse().map((s, i) => {
                const cat = positionCategory(career.player.position)
                const esArquero = cat === "GK"
                const esDefensor = cat === "DEF"
                const trophies: string[] = []
                if (s.liga) trophies.push("⭐ Liga")
                if (s.copaArgentina) trophies.push("🥛 Copa Argentina")
                if (s.mundialClubesGanado) trophies.push("🌐 Mundial de Clubes")
                if (s.continentalWon) trophies.push(`${TROPHY_META[s.continental || ""]?.icon || "🌎"} ${TROPHY_META[s.continental || ""]?.name || "Continental"}`)
                const delta = (s.nextOvr ?? s.ovr) - s.ovr
                return (
                  <div
                    key={i}
                    style={{ animationDelay: `${Math.min(i, 6) * 80}ms` }}
                    className="cartel-in relative overflow-hidden card-gradient rounded-2xl p-4 border border-white/10 shadow-lg transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={findClub(s.clubId)?.escudo ?? `/logos/clubs/${s.clubId}.png`}
                      alt=""
                      className="pointer-events-none absolute -right-4 -bottom-6 w-28 h-28 object-contain opacity-[0.06]"
                      onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                    />
                    <div className="relative flex items-center gap-2.5 mb-2">
                      <img src={findClub(s.clubId)?.escudo ?? `/logos/clubs/${s.clubId}.png`} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-white font-display truncate">{s.year} · {s.clubName}</div>
                        <div className="text-[10px] text-slate-400 font-sport">{s.age} años · Nota {(s.rating ?? 7).toFixed(1)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-sport text-[11px]">
                        <span className="text-blue-300">{s.matchesPlayed} PJ</span>
                        {esArquero ? (
                          <>
                            <span className="text-green-400">{s.cleanSheets ?? 0} VI</span>
                            <span className="text-orange-400">{s.penaltiesSaved ?? 0} PA</span>
                          </>
                        ) : esDefensor ? (
                          <>
                            <span className="text-green-400">{s.cleanSheets ?? 0} VI</span>
                            <span className="text-orange-400">{s.goals}G {s.assists}A</span>
                          </>
                        ) : (
                          <>
                            <span className="text-green-400">{s.goals} G</span>
                            <span className="text-orange-400">{s.assists} A</span>
                          </>
                        )}
                        {delta !== 0 && <span className={`px-1.5 py-0.5 rounded font-black ${delta > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>{delta > 0 ? "+" : ""}{delta}</span>}
                      </div>
                    </div>
                    {trophies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {trophies.map((t, j) => (
                          <span key={j} className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-2 py-0.5 font-sport">{t}</span>
                        ))}
                      </div>
                    )}
                    {s.cronica && <p className="text-[11px] italic text-slate-300 leading-snug font-sans">{s.cronica}</p>}
                    {s.highlights && s.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {s.highlights.map((h, j) => {
                          const esLesion = /🏥|🩹/.test(h)
                          const esArabia = /🐪|💰/.test(h)
                          const grande = /🏆|🥇|🌍|🏅|⭐|🧤 Héroe|BALÓN DE ORO|EUROPA/.test(h)
                          let estilo = "text-slate-300 bg-white/[0.03] border-white/5"
                          if (esLesion) {
                            estilo = "text-red-300 bg-red-500/10 border-red-500/30 font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                          } else if (esArabia) {
                            estilo = "text-amber-200 bg-amber-500/10 border-amber-500/30 font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                          } else if (grande) {
                            estilo = "cartel-shine text-[#FFE9A8] bg-[#D4AF37]/10 border-[#D4AF37]/40 font-bold shadow-[0_0_18px_rgba(212,175,55,0.15)]"
                          }
                          return (
                            <li
                              key={j}
                              className={`cartel-in text-[11px] font-sans rounded-xl px-2.5 py-1.5 border ${estilo}`}
                              style={{ animationDelay: `${j * 90}ms` }}
                            >
                              {h}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ACCIONES: ficha y compartir (en cualquier momento de la carrera), retiro, reset.
              Hasta hoy la ficha y el botón de compartir estaban detrás de `career.finished`, y
              acá decía "vas a poder descargarla cuando termines". Medido del 11/7 al 7/8: 108
              personas empiezan una carrera y 4 llegan al retiro, así que el artefacto que se
              comparte —lo que a Copero le dio 9.901 seguidores— lo producían 4 personas por mes.
              El que va tres temporadas también tiene algo para mostrar: se lo damos ahí. */}
          <div className="card-gradient rounded-3xl p-5 border border-white/10 space-y-3 shadow-xl">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block text-center font-sport">
              {career.finished ? "Descargá tu ficha final HD" : "Descargá tu ficha HD como va"}
            </span>
            <div className="grid grid-cols-3 gap-2 font-sport">
              <button disabled={exporting} onClick={() => handleExport("png")} className="btn-gold py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl shadow-md disabled:opacity-50">{exporting ? "Generando…" : "PNG HD"}</button>
              <button disabled={exporting} onClick={() => handleExport("jpg")} className="btn-gold py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl shadow-md disabled:opacity-50">{exporting ? "Generando…" : "JPG HD"}</button>
              <button disabled={exporting} onClick={() => handleExport("pdf")} className="btn-gold py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl shadow-md disabled:opacity-50">{exporting ? "Generando…" : "PDF HD"}</button>
            </div>
            {exportError && (
              <p className="text-center text-[10px] text-red-300 font-sport uppercase tracking-wider">{exportError}</p>
            )}
            <div className="mt-4">
              <ShareBar
                titulo={career.finished ? "Compartí tu Carrera en Redes" : "Compartí cómo va tu carrera"}
                texto={textoCompartir}
                destino={urlCarrera}
                campana="carrera_share"
                imagen={placaCarrera}
              />
            </div>
            {!career.finished && (
              <button
                onClick={() => { trackEvent(EVENTOS.carreraRetiro, { temporadas: career.history.length, edad: career.player.age }); retire(); setRevealSeason(null); setShowFinale(true) }}
                className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:text-red-200 hover:bg-red-500/20 text-[11px] font-bold uppercase tracking-wider transition-all font-sport"
              >
                🎬 Retirarme del fútbol
              </button>
            )}
            <button
              onClick={() => { if (confirmReset()) resetCareer() }}
              className="w-full py-2.5 bg-red-600/10 border border-red-500/20 text-red-300/80 rounded-xl text-[11px] font-bold font-sport uppercase tracking-wider hover:bg-red-600/20 transition-colors"
            >
              {t('carrera.reiniciarCarrera', 'Reiniciar carrera')}
            </button>
          </div>
      </div>

      <SeasonProgress
        activo={simulando !== null}
        anio={career.startYear + career.seasonsPlayed}
        club={club?.name}
        temporadas={simulando?.temporadas ?? 1}
        continental={
          club?.region === "euro"
            ? career.nextContinental === "libertadores" ? "champions" : "europa"
            : career.nextContinental
        }
        mundialClubes={Boolean(career.playsMundialClubes)}
        esArgentino={club?.region === "arg"}
        mundial={(career.startYear + career.seasonsPlayed) % 4 === 2 && career.milestones.nationalTeam}
      />

      <EventBurst
        show={burst !== null}
        label={burst?.label}
        tone={burst?.tone || "oro"}
        onDone={() => setBurst(null)}
      />

      {lote && (
        <div className="fixed bottom-5 left-1/2 z-[130] -translate-x-1/2 cartel-in rounded-2xl border border-[#74ACDF]/40 bg-[#0b1526] px-5 py-3 text-center shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          <div className="font-sport text-[10px] font-black uppercase tracking-widest text-[#74ACDF]">{t('carrera.simulacionRapida', 'Simulación rápida')}</div>
          <div className="font-display text-lg font-black text-white">
            {lote.temporadas} {lote.temporadas === 1 ? "temporada jugada" : "temporadas jugadas"}
          </div>
        </div>
      )}

      {/* El evento de la temporada: interrumpe, se decide, se va. */}
      <EventoCarrera evento={eventoAbierto} posicion={career.player.position} onElegir={resolverEvento} />

      <SeasonReveal
        season={revealSeason}
        position={career.player.position}
        onClose={() => {
          const s = revealSeason
          setRevealSeason(null)
          setLote(null)
          if (s?.ballonDor) {
            setBallonDorData({ year: s.year, playerName: career.player.name, flag: career.player.flag, ovr: s.nextOvr ?? s.ovr })
          } else if (useCareerStore.getState().career?.finished) {
            setShowFinale(true)
          }
        }}
      />
      <BallonDorReveal
        data={ballonDorData}
        onClose={() => {
          setBallonDorData(null)
          if (useCareerStore.getState().career?.finished) setShowFinale(true)
        }}
      />
      <CareerFinale
        career={showFinale ? career : null}
        onClose={() => setShowFinale(false)}
        onNewCareer={() => {
          setShowFinale(false)
          resetCareer()
        }}
      />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-sport">{label}</label>
      {children}
    </div>
  )
}

function clampNum(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function confirmReset(): boolean {
  return typeof window === "undefined" ? true : window.confirm("¿Reiniciar tu carrera? Se perderá el progreso.")
}
