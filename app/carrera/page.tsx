"use client"

import { useState, useRef, useMemo } from "react"
import Link from "next/link"
import CareerCardView from "@/components/pitch/CareerCardView"
import { usePlayersCore } from "@/lib/data-loader"
import {
  POSITIONS,
  ARG_CLUBS,
  SUDAM_CLUBS,
  findClub,
  MAX_SEASONS,
  marketValueFor,
  CAREER_DILEMMAS,
} from "@/lib/career-engine"
import { useCareerStore, buildCareerCardData, type CareerSetup } from "@/lib/career-store"
import { downloadFichaPng, downloadFichaJpg, downloadFichaPdf } from "@/lib/career-pdf"

const NATIONALITIES: { name: string; flag: string }[] = [
  { name: "Argentina", flag: "🇦🇷" },
  { name: "Brasil", flag: "🇧🇷" },
  { name: "Uruguay", flag: "🇺🇾" },
  { name: "Chile", flag: "🇨🇱" },
  { name: "Colombia", flag: "🇨🇴" },
  { name: "Paraguay", flag: "🇵🇾" },
  { name: "España", flag: "🇪🇸" },
  { name: "Italia", flag: "🇮🇹" },
  { name: "Francia", flag: "🇫🇷" },
  { name: "México", flag: "🇲🇽" },
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
  const career = useCareerStore((s) => s.career)
  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg text-white px-4 py-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card-gradient rounded-3xl p-6 sm:p-8 border border-[#74ACDF]/20 text-center relative overflow-hidden">
          <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
            MODO CARRERA INTERACTIVO · COPERO ENGINE
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            TU CAMINO A LA GLORIA
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-2 leading-relaxed font-sans">
            Creá tu crack con camiseta 3D, tomá decisiones estratégicas de pretemporada y traspasos, y ganate todo hasta colgar los botines.
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

// ---------------- SETUP WIZARD ----------------

function CareerSetupWizard() {
  const startCareer = useCareerStore((s) => s.startCareer)
  const [mode, setMode] = useState<"create" | "real">("create")

  const [name, setName] = useState("Emilio Ranucoli")
  const [number, setNumber] = useState(12)
  const [position, setPosition] = useState("CAM")
  const [nationality, setNationality] = useState("Argentina")
  const [ovr, setOvr] = useState(72)
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

  return (
    <div className="space-y-6">
      {/* STEP 1: player & 3D jersey */}
      <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#74ACDF] text-slate-950 font-black flex items-center justify-center text-sm font-sport">1</span>
          <h3 className="font-display text-xl font-black uppercase">Tu Jugador y Camiseta 3D</h3>
        </div>

        <div className="flex gap-2 font-sport">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "create" ? "bg-[#74ACDF] text-white" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            Crear Jugador & Camiseta
          </button>
          <button
            onClick={() => setMode("real")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "real" ? "bg-[#74ACDF] text-white" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            Elegir Real
          </button>
        </div>

        {mode === "create" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* 3D JERSEY PREVIEW */}
            <div className="card-glass p-5 rounded-2xl border border-white/10 text-center flex flex-col items-center justify-center space-y-3">
              <span className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">
                VISTA PREVIA CAMISETA 3D
              </span>

              <div className="relative w-28 h-32 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
                <svg viewBox="0 0 100 120" className="w-full h-full">
                  <path
                    d="M 20 20 L 35 10 L 65 10 L 80 20 L 95 35 L 85 50 L 75 42 L 75 110 L 25 110 L 25 42 L 15 50 L 5 35 Z"
                    fill={jerseyColor}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  {jerseyPattern === "sash" && (
                    <path d="M 20 20 L 75 110 L 60 110 L 20 40 Z" fill="#ffffff" opacity="0.9" />
                  )}
                  {jerseyPattern === "stripes" && (
                    <>
                      <rect x="35" y="10" width="10" height="100" fill="#ffffff" opacity="0.85" />
                      <rect x="55" y="10" width="10" height="100" fill="#ffffff" opacity="0.85" />
                    </>
                  )}
                  {jerseyPattern === "hoops" && (
                    <rect x="25" y="50" width="50" height="20" fill="#ffffff" opacity="0.9" />
                  )}
                  <polygon points="35,10 50,22 65,10" fill="#050A14" />
                  <polygon points="35,10 50,22 65,10" fill="none" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="50" y="75" textAnchor="middle" fill="#ffffff" stroke="#000000" strokeWidth="1" fontSize="26" fontWeight="900" fontFamily="sans-serif">
                    {number}
                  </text>
                </svg>
              </div>

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
                  placeholder="Ej: Emilio Ranucoli"
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
              <Field label={`OVR inicial: ${ovr}`}>
                <input type="range" min={55} max={80} value={ovr} onChange={(e) => setOvr(parseInt(e.target.value))} className="w-full accent-[#74ACDF]" />
              </Field>
              <Field label={`Edad: ${age} · Valor ~€${previewValue}M`}>
                <input type="range" min={16} max={30} value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full accent-[#74ACDF]" />
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
              placeholder="Buscar jugador (ej: Riquelme, Messi, Francescoli)"
              className="input-dark"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            {!players && !error && <p className="text-xs text-slate-400">Cargando base de jugadores...</p>}
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

      {/* STEP 2: club */}
      <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#74ACDF] text-slate-950 font-black flex items-center justify-center text-sm font-sport">2</span>
          <h3 className="font-display text-xl font-black uppercase">Club de Inicio</h3>
        </div>
        <ClubPicker selected={clubId} onSelect={setClubId} />
      </div>

      {/* STEP 3: start */}
      <button
        disabled={!setup}
        onClick={() => setup && startCareer(setup)}
        className="btn-primary w-full py-4 text-sm font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {setup ? "COMENZAR CARRERA ⚽" : "ELEGÍ UN CLUB PARA EMPEZAR"}
      </button>
    </div>
  )
}

function ClubPicker({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <ClubGroup title="Liga Profesional Argentina" clubs={ARG_CLUBS} selected={selected} onSelect={onSelect} />
      <ClubGroup title="Sudamérica" clubs={SUDAM_CLUBS} selected={selected} onSelect={onSelect} />
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
  clubs: { id: string; name: string; strength: number }[]
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
            <img src={`/logos/clubs/${c.id}.png`} alt="" className="w-6 h-6 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
            <span className="text-[11px] font-bold text-white truncate flex-1">{c.name}</span>
            <span className="text-[9px] font-sport text-amber-400 shrink-0">{c.strength}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------- DASHBOARD & DECISION SYSTEM ----------------

function CareerDashboard() {
  const { career, simulateNextSeason, acceptOffer, declineOffers, resetCareer } = useCareerStore()
  const fichaRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  // Decision Dilemma State
  const [selectedOptionId, setSelectedOptionId] = useState<string>("train_finishing")

  if (!career) return null
  const cardData = buildCareerCardData(career)
  const club = findClub(career.clubId)
  const hasOffers = career.pendingOffers.length > 0
  const dilemma = CAREER_DILEMMAS[career.seasonsPlayed % CAREER_DILEMMAS.length]

  async function handleExport(kind: "png" | "jpg" | "pdf") {
    if (!fichaRef.current) return
    setExporting(true)
    try {
      if (kind === "png") await downloadFichaPng(fichaRef.current, career!.player.name)
      else if (kind === "jpg") await downloadFichaJpg(fichaRef.current, career!.player.name)
      else await downloadFichaPdf(fichaRef.current, career!.player.name)
    } finally {
      setExporting(false)
    }
  }

  function handleSimulate(yearsCount = 1) {
    for (let i = 0; i < yearsCount; i++) {
      const cur = useCareerStore.getState().career
      if (!cur || cur.finished || cur.pendingOffers.length > 0) break
      simulateNextSeason(selectedOptionId)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* FICHA HD DE CARRERA CON CAMISETA 3D */}
      <div ref={fichaRef} className="rounded-[32px] overflow-hidden shadow-2xl">
        <CareerCardView data={cardData} />
      </div>

      {/* PANEL DE CONTROL DE CARRERA & DECISIONES */}
      <div className="space-y-4">
        {/* PROGRESSION CARD */}
        <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase font-sport block mb-1">
              TEMPORADA {career.seasonsPlayed + (career.finished ? 0 : 1)} / {MAX_SEASONS} · {club?.name}
            </span>
            <h3 className="font-display text-2xl font-black uppercase text-white">
              {career.finished ? "CARRERA FINALIZADA 🏁" : "DESARROLLO DE CARRERA"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {career.player.age} años · {career.player.ovr} OVR · €{career.player.marketValueM}M
            </p>
          </div>

          {/* INTERACTIVE DECISION DILEMMA */}
          {!career.finished && !hasOffers && dilemma && (
            <div className="card-glass rounded-2xl p-4 border border-[#74ACDF]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#74ACDF] font-sport uppercase tracking-wider">
                  🧠 DECISIÓN DE CARRERA
                </span>
                <span className="text-[9px] text-amber-400 font-bold font-sport">ENFOQUE DE TEMPORADA</span>
              </div>
              <h4 className="text-sm font-bold text-white font-display">{dilemma.title}</h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">{dilemma.description}</p>

              <div className="space-y-2 pt-1 font-sport">
                {dilemma.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                      selectedOptionId === opt.id
                        ? "bg-[#74ACDF]/20 border-[#74ACDF] text-white"
                        : "bg-slate-950/60 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-amber-300 font-bold">{opt.effectDescription}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TRANSFERS OFFERS */}
          {hasOffers ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#74ACDF] font-sport uppercase tracking-wider">📩 OFERTAS DE TRANSFERENCIA</p>
              {career.pendingOffers.map((o) => {
                const euro = o.region === "euro"
                return (
                  <div key={o.clubId} className={`flex items-center gap-2 rounded-xl p-2.5 border ${euro ? "bg-amber-400/10 border-amber-400/40" : "bg-slate-950/60 border-white/5"}`}>
                    {euro ? (
                      <span className="w-8 h-8 shrink-0 flex items-center justify-center text-2xl">{o.flag || "🌍"}</span>
                    ) : (
                      <img src={`/logos/clubs/${o.clubId}.png`} alt="" className="w-8 h-8 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5 font-display">
                        {o.clubName}
                        {euro && <span className="text-[8px] font-black bg-amber-400 text-slate-950 px-1 rounded uppercase tracking-wider font-sport">Europa</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sport">Fuerza {o.strength} · Oferta €{o.valueM}M</div>
                    </div>
                    <button onClick={() => acceptOffer(o.clubId)} className="btn-primary px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg font-sport">Fichar</button>
                  </div>
                )
              })}
              <button onClick={declineOffers} className="w-full py-2.5 bg-slate-900 border border-white/10 text-slate-300 rounded-xl text-xs font-bold font-sport uppercase tracking-wider hover:bg-slate-800 transition-colors">
                Quedarme en {club?.name}
              </button>
            </div>
          ) : career.finished ? (
            <div className="card-glass rounded-xl p-3 border border-amber-400/20 text-center">
              <p className="text-sm font-black text-amber-400 font-display">🏁 {MAX_SEASONS} temporadas completadas</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {cardData.trophies.reduce((a, t) => a + t.count, 0)} títulos · {career.totals.goals} goles · {career.totals.assists} asistencias
              </p>
            </div>
          ) : (
            /* SIMULATION SPEED BUTTONS */
            <div className="space-y-2 font-sport">
              <button
                onClick={() => handleSimulate(1)}
                className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase rounded-2xl shadow-lg"
              >
                SIMULAR TEMPORADA {career.seasonsPlayed + 1} ⏩
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulate(5)}
                  className="py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  ⚡ Simular 5 Años
                </button>
                <button
                  onClick={() => handleSimulate(15)}
                  className="py-2.5 bg-slate-900 border border-slate-800 text-amber-300 hover:text-amber-200 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  🏁 Simular Completa
                </button>
              </div>
            </div>
          )}

          {/* EXPORT BUTTONS HD */}
          <div className="space-y-2 pt-2 font-sport border-t border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              DESCARGAR FICHA COPERO-STYLE HD
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button disabled={exporting} onClick={() => handleExport("png")} className="btn-gold py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl shadow-md disabled:opacity-50">
                {exporting ? "..." : "PNG HD"}
              </button>
              <button disabled={exporting} onClick={() => handleExport("jpg")} className="btn-gold py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl shadow-md disabled:opacity-50">
                {exporting ? "..." : "JPG HD"}
              </button>
              <button disabled={exporting} onClick={() => handleExport("pdf")} className="btn-gold py-2.5 text-[10px] font-bold tracking-wider uppercase rounded-xl shadow-md disabled:opacity-50">
                {exporting ? "..." : "PDF HD"}
              </button>
            </div>
          </div>

          <button
            onClick={() => { if (confirmReset()) resetCareer() }}
            className="w-full py-2.5 bg-red-600/10 border border-red-500/20 text-red-300/80 rounded-xl text-[11px] font-bold font-sport uppercase tracking-wider hover:bg-red-600/20 transition-colors mt-2"
          >
            Reiniciar carrera
          </button>
        </div>

        {/* HISTORIAL Y MOMENTOS NARRATIVOS */}
        {career.history.length > 0 && (() => {
          const last = career.history[career.history.length - 1]
          const rating = typeof last.rating === "number" ? last.rating : 7
          const highlights = last.highlights || []
          const cronica = last.cronica || ""
          return (
            <div className="card-gradient rounded-3xl p-5 border border-amber-400/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-amber-400 font-sport uppercase tracking-[0.2em]">
                  Temporada {last.year} · Momentos
                </h4>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-display ${rating >= 8 ? "bg-emerald-500/20 text-emerald-300" : rating >= 6.8 ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-300"}`}>
                  Nota {rating.toFixed(1)}
                </span>
              </div>
              {cronica && (
                <p className="text-[13px] text-slate-200 italic leading-relaxed border-l-2 border-[#74ACDF]/50 pl-3 font-sans">
                  {cronica}
                </p>
              )}
              {highlights.length > 0 && (
                <ul className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="text-xs text-slate-200 leading-snug flex gap-2">
                      <span className="text-amber-400 mt-0.5">›</span>{h}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })()}
      </div>
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
