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
} from "@/lib/career-engine"
import { useCareerStore, buildCareerCardData, type CareerSetup } from "@/lib/career-store"
import { downloadFichaPng, downloadFichaPdf } from "@/lib/career-pdf"

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
            MODO CARRERA / LEYENDA
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            TU CAMINO A LA GLORIA
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto mt-2 leading-relaxed">
            Creá o elegí tu jugador, sumá temporadas en la Liga, Copa Argentina, Libertadores y
            Sudamericana, recibí ofertas y armá tu ficha de leyenda.
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

  // create-player form
  const [name, setName] = useState("")
  const [number, setNumber] = useState(10)
  const [position, setPosition] = useState("ST")
  const [nationality, setNationality] = useState("Argentina")
  const [ovr, setOvr] = useState(72)
  const [age, setAge] = useState(18)

  // real-player selection
  const { players, error } = usePlayersCore()
  const [query, setQuery] = useState("")
  const results = useMemo(() => {
    if (!players || query.trim().length < 2) return []
    const q = query.toLowerCase()
    return players.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12)
  }, [players, query])

  const [clubId, setClubId] = useState("")

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
    setMode("create") // fall through to review the prefilled fields
  }

  return (
    <div className="space-y-6">
      {/* STEP 1: player */}
      <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#74ACDF] text-slate-950 font-black flex items-center justify-center text-sm">1</span>
          <h3 className="font-display text-xl font-black uppercase">Tu Jugador</h3>
        </div>

        <div className="flex gap-2 font-sport">
          <button
            onClick={() => setMode("create")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "create" ? "bg-[#74ACDF] text-white" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            Crear Jugador
          </button>
          <button
            onClick={() => setMode("real")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${mode === "real" ? "bg-[#74ACDF] text-white" : "bg-slate-900 text-slate-400 border border-slate-800"}`}
          >
            Elegir Real
          </button>
        </div>

        {mode === "create" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Franco Ordoñes"
                className="input-dark"
              />
            </Field>
            <Field label="Dorsal">
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
            <Field label={`OVR inicial: ${ovr}`}>
              <input type="range" min={60} max={85} value={ovr} onChange={(e) => setOvr(parseInt(e.target.value))} className="w-full accent-[#74ACDF]" />
            </Field>
            <Field label={`Edad: ${age} · Valor ~€${previewValue}M`}>
              <input type="range" min={16} max={30} value={age} onChange={(e) => setAge(parseInt(e.target.value))} className="w-full accent-[#74ACDF]" />
            </Field>
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
              {query.trim().length >= 2 && results.length === 0 && players && (
                <p className="text-xs text-slate-500">Sin resultados. Probá otro nombre.</p>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Al elegir uno se cargan sus datos y podés ajustarlos en "Crear Jugador".</p>
          </div>
        )}
      </div>

      {/* STEP 2: club */}
      <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#74ACDF] text-slate-950 font-black flex items-center justify-center text-sm">2</span>
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

// ---------------- DASHBOARD ----------------

function CareerDashboard() {
  const { career, simulateNextSeason, acceptOffer, declineOffers, resetCareer } = useCareerStore()
  const fichaRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)

  if (!career) return null
  const cardData = buildCareerCardData(career)
  const club = findClub(career.clubId)
  const hasOffers = career.pendingOffers.length > 0

  async function handleExport(kind: "png" | "pdf") {
    if (!fichaRef.current) return
    setExporting(true)
    try {
      if (kind === "png") await downloadFichaPng(fichaRef.current, career!.player.name)
      else await downloadFichaPdf(fichaRef.current, career!.player.name)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
      {/* FICHA */}
      <div ref={fichaRef}>
        <CareerCardView data={cardData} />
      </div>

      {/* CONTROLS */}
      <div className="space-y-4">
        <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase font-sport block mb-1">
              TEMPORADA {career.seasonsPlayed + (career.finished ? 0 : 1)} / {MAX_SEASONS} · {club?.name}
            </span>
            <h3 className="font-display text-2xl font-black uppercase text-white">
              {career.finished ? "CARRERA COMPLETA" : "DESARROLLO DE CARRERA"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {career.player.age} años · {career.player.ovr} OVR · €{career.player.marketValueM}M
            </p>
          </div>

          {hasOffers ? (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[#74ACDF] font-sport uppercase tracking-wider">📩 Ofertas de transferencia</p>
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
                      <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        {o.clubName}
                        {euro && <span className="text-[8px] font-black bg-amber-400 text-slate-950 px-1 rounded uppercase tracking-wider">Europa</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sport">Fuerza {o.strength} · Oferta €{o.valueM}M</div>
                    </div>
                    <button onClick={() => acceptOffer(o.clubId)} className="btn-primary px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg">Fichar</button>
                  </div>
                )
              })}
              <button onClick={declineOffers} className="w-full py-2.5 bg-slate-900 border border-white/10 text-slate-300 rounded-xl text-xs font-bold font-sport uppercase tracking-wider hover:bg-slate-800 transition-colors">
                Quedarme en {club?.name}
              </button>
            </div>
          ) : career.finished ? (
            <div className="card-glass rounded-xl p-3 border border-amber-400/20 text-center">
              <p className="text-sm font-black text-amber-400 font-display">🏁 {MAX_SEASONS} temporadas jugadas</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {cardData.trophies.reduce((a, t) => a + t.count, 0)} títulos · {career.totals.goals} goles · {career.totals.assists} asistencias
              </p>
            </div>
          ) : (
            <button
              onClick={simulateNextSeason}
              className="btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg"
            >
              SIMULAR SIGUIENTE TEMPORADA ⏩
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 font-sport">
            <button disabled={exporting} onClick={() => handleExport("pdf")} className="btn-gold py-3 text-[11px] font-bold tracking-widest uppercase rounded-2xl shadow-lg disabled:opacity-50">
              {exporting ? "..." : "FICHA PDF"}
            </button>
            <button disabled={exporting} onClick={() => handleExport("png")} className="btn-gold py-3 text-[11px] font-bold tracking-widest uppercase rounded-2xl shadow-lg disabled:opacity-50">
              {exporting ? "..." : "FICHA PNG"}
            </button>
          </div>

          <button
            onClick={() => { if (confirmReset()) resetCareer() }}
            className="w-full py-2.5 bg-red-600/10 border border-red-500/20 text-red-300/80 rounded-xl text-[11px] font-bold font-sport uppercase tracking-wider hover:bg-red-600/20 transition-colors"
          >
            Reiniciar carrera
          </button>
        </div>

        {/* MOMENTOS + PREMIOS */}
        {career.history.length > 0 && (() => {
          const last = career.history[career.history.length - 1]
          const m = career.milestones || { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false }
          const rating = typeof last.rating === "number" ? last.rating : 7
          const highlights = last.highlights || []
          return (
            <div className="card-gradient rounded-3xl p-5 border border-amber-400/20 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold text-amber-400 font-sport uppercase tracking-[0.2em]">Temporada {last.year} · Momentos</h4>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-display ${rating >= 8 ? "bg-emerald-500/20 text-emerald-300" : rating >= 6.8 ? "bg-amber-500/20 text-amber-300" : "bg-slate-800 text-slate-300"}`}>
                  Nota {rating.toFixed(1)}
                </span>
              </div>
              {highlights.length > 0 ? (
                <ul className="space-y-1.5">
                  {highlights.map((h, i) => (
                    <li key={i} className="text-xs text-slate-200 leading-snug flex gap-2">
                      <span className="text-amber-400 mt-0.5">›</span>{h}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Temporada tranquila. A meterle para la próxima. 💪</p>
              )}
              {(m.balonDeOro > 0 || m.goldenBoots > 0 || m.nationalTeam) && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {m.balonDeOro > 0 && <Award icon="🏅" label={`Balón de Oro ×${m.balonDeOro}`} />}
                  {m.goldenBoots > 0 && <Award icon="👟" label={`Botín de Oro ×${m.goldenBoots}`} />}
                  {m.nationalTeam && <Award icon={career.player.flag} label="Selección" />}
                </div>
              )}
            </div>
          )
        })()}

        {/* HISTORY */}
        {career.history.length > 0 && (
          <div className="card-gradient rounded-3xl p-5 border border-white/10">
            <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.2em] mb-3">Historial</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="text-slate-500 font-sport uppercase">
                  <tr>
                    <th className="py-1 pr-2">Año</th>
                    <th className="py-1 pr-2">Club</th>
                    <th className="py-1 pr-2 text-center">PJ</th>
                    <th className="py-1 pr-2 text-center">G</th>
                    <th className="py-1 pr-2 text-center">A</th>
                    <th className="py-1 pr-2 text-center">Nota</th>
                    <th className="py-1 text-right">Títulos</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {career.history.map((s, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-1.5 pr-2 font-bold text-white">{s.year}</td>
                      <td className="py-1.5 pr-2 truncate max-w-[90px]">{s.clubName}</td>
                      <td className="py-1.5 pr-2 text-center">{s.matchesPlayed}</td>
                      <td className="py-1.5 pr-2 text-center text-green-400">{s.goals}</td>
                      <td className="py-1.5 pr-2 text-center text-blue-400">{s.assists}</td>
                      <td className={`py-1.5 pr-2 text-center font-bold ${(s.rating ?? 7) >= 8 ? "text-emerald-400" : (s.rating ?? 7) >= 6.8 ? "text-amber-400" : "text-slate-400"}`}>{(s.rating ?? 7).toFixed(1)}</td>
                      <td className="py-1.5 text-right">
                        {[s.liga && "⭐", s.copaArgentina && "🥛", s.continentalWon && (s.continental ? ({ libertadores: "🏆", sudamericana: "🥇", champions: "🌟", europa: "🎖️" }[s.continental] || "🏆") : "")].filter(Boolean).join(" ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- helpers ----------------

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

function Award({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 border border-amber-400/30 text-[10px] font-bold font-sport text-amber-200">
      <span className="text-sm">{icon}</span>
      {label}
    </span>
  )
}

function confirmReset(): boolean {
  return typeof window === "undefined" ? true : window.confirm("¿Reiniciar tu carrera? Se perderá el progreso.")
}
