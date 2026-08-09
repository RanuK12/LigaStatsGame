"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { usePlayersCore, useSquads } from "@/lib/data-loader"
import { useDTStore, clubesDeLaLiga, ligaDeSquads } from "@/lib/dt-store"
import { fichaDT, FORMACIONES_DT, PERFIL_FORMACION, type ClubDT } from "@/lib/dt-engine"
import FichaFinalDT from "@/components/dt/FichaFinalDT"
import ShareBar from "@/components/ShareBar"
import { storyBlob, type FormatoFicha } from "@/lib/story-card"
import EventBurst, { type BurstTone } from "@/components/ui/EventBurst"
import TorneoEnVivo from "@/components/tournament/TorneoEnVivo"
import type { ScheduleMatch } from "@/lib/types"
import { trackEvent, EVENTOS } from "@/components/Analytics"

/**
 * El modo DT.
 *
 * Cuatro pantallas y nada más: elegir club, mercado, la temporada corriendo y el resultado. El
 * bucle está probado con 312 carreras completas en `__tests__/dt-engine.test.ts`; acá se dibuja.
 *
 * La medida de éxito no es que se pueda jugar veinte temporadas, es que se llegue a la ficha
 * final. Está medido en el modo carrera de jugador: 108 personas lo empiezan y 4 lo terminan.
 * Por eso el mercado son tres decisiones y la temporada se juega de un botón.
 */

/** Los escudos viven en tres carpetas según de dónde salga el club. Se prueban en orden. */
function escudoDe(clubId: string): string {
  return `/logos/clubs/${clubId}.png`
}
function alFallarElEscudo(e: React.SyntheticEvent<HTMLImageElement>, clubId: string) {
  const img = e.target as HTMLImageElement
  const alternativas = [`/logos/carrera/${clubId}.png`, `/logos/ligas/${clubId}.svg`]
  const actual = new URL(img.src, location.origin).pathname
  const i = alternativas.indexOf(actual)
  if (i + 1 < alternativas.length) img.src = alternativas[i + 1]
  else img.style.visibility = "hidden"
}

export default function DTPage() {
  const { players } = usePlayersCore()
  const { squads } = useSquads()
  const listo = Boolean(players && squads)

  const clubes = useMemo(
    () => (players && squads ? clubesDeLaLiga(squads, players) : []),
    [players, squads],
  )

  const estado = useDTStore((s) => s.estado)

  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg px-4 py-8 font-sans text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* La portada del modo, entera, va SOLO antes de empezar.
            Medido en 390x844: con este cartel arriba, el dibujo del equipo caía en el píxel 610
            y el mercado de pases en el 935, o sea fuera del primer pantallazo en las dos cosas
            que hay para decidir. Se entraba a la temporada, se veía "te echan si no cumplís" y
            el botón de jugar, y parecía que el modo simulaba solo. Una vez que estás dirigiendo,
            explicar el modo ocupa la pantalla que necesitan la táctica y el mercado. */}
        <header className={`card-gradient relative overflow-hidden rounded-3xl border border-[#D4AF37]/20 text-center shadow-2xl ${estado ? "px-6 py-3" : "p-6 sm:p-8"}`}>
          <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-80" />
          <span className="font-sport block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">
            Modo DT · Liga Profesional
          </span>
          <h1
            className={`font-display font-black uppercase tracking-tight text-white ${
              estado ? "text-xl sm:text-2xl" : "text-3xl sm:text-5xl"
            }`}
          >
            El banco quema
          </h1>
          {!estado && (
            <p className="mx-auto mt-2 max-w-lg font-sans text-xs leading-relaxed text-slate-400 sm:text-sm">
              Te dan un club y un objetivo. Manejás el presupuesto, comprás y vendés, y dirigís la
              temporada. Si no cumplís, te echan y arrancás de nuevo en otro lado.
            </p>
          )}
        </header>

        {!listo && (
          <div className="card-gradient rounded-3xl border border-white/10 p-8 text-center">
            <p className="font-sport text-xs uppercase tracking-widest text-slate-400">
              Cargando planteles…
            </p>
          </div>
        )}

        {listo && !estado && <ElegirClub clubes={clubes} players={players!} squads={squads!} />}
        {listo && estado && <Temporada clubes={clubes} players={players!} squads={squads!} />}

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="font-sport inline-block px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── 1. Elegir club ───────────────────────────────────────────────────────── */

function ElegirClub({ clubes, players, squads }: { clubes: ClubDT[]; players: any[]; squads: any[] }) {
  const empezar = useDTStore((s) => s.empezar)
  const [nombre, setNombre] = useState("")
  const [clubId, setClubId] = useState<string | null>(null)

  // De más fuerte a más flojo: elegir el club es elegir la dificultad, y eso tiene que verse.
  const ordenados = useMemo(() => [...clubes].sort((a, b) => b.fuerza - a.fuerza), [clubes])
  const dificultad = (f: number, todos: ClubDT[]) => {
    const max = Math.max(...todos.map((c) => c.fuerza))
    const min = Math.min(...todos.map((c) => c.fuerza))
    const rel = (f - min) / Math.max(max - min, 1)
    if (rel > 0.75) return { texto: "Te exigen el título", color: "text-[#D4AF37]" }
    if (rel > 0.45) return { texto: "Te piden copas", color: "text-[#74ACDF]" }
    if (rel > 0.2) return { texto: "Pelear arriba", color: "text-emerald-300" }
    return { texto: "Sobrevivir", color: "text-slate-400" }
  }

  return (
    <div className="space-y-5">
      <div className="card-gradient rounded-3xl border border-white/10 p-5 shadow-xl">
        <label className="font-sport block text-[10px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Tu nombre
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="El DT"
          maxLength={28}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 font-sans text-sm text-white outline-none transition-colors focus:border-[#74ACDF]"
        />
      </div>

      <div className="card-gradient rounded-3xl border border-white/10 p-5 shadow-xl">
        <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">
          ¿Qué club agarrás?
        </h2>
        <p className="mt-1 font-sans text-xs text-slate-400">
          En un grande te exigen salir campeón desde el primer año. En un chico te dejan crecer.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ordenados.map((c) => {
            const d = dificultad(c.fuerza, clubes)
            const elegido = clubId === c.id
            return (
              <button
                key={c.id}
                onClick={() => setClubId(c.id)}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                  elegido
                    ? "border-[#74ACDF] bg-[#74ACDF]/15 shadow-lg"
                    : "border-white/10 bg-slate-950/60 hover:border-[#74ACDF]/50"
                }`}
              >
                <img
                  src={escudoDe(c.id)}
                  alt=""
                  className="h-9 w-9 shrink-0 object-contain"
                  onError={(e) => alFallarElEscudo(e, c.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-sport block truncate text-[13px] font-bold uppercase tracking-wide text-white">
                    {c.nombre}
                  </span>
                  <span className={`font-sport block text-[10px] uppercase tracking-wider ${d.color}`}>
                    {d.texto}
                  </span>
                </span>
                <span className="font-display shrink-0 text-lg font-black text-slate-500">{c.fuerza}</span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        disabled={!clubId}
        onClick={() => {
          if (!clubId) return
          empezar({ nombre, clubId, squads, players })
          trackEvent(EVENTOS.carreraIniciada, { modo: "dt", club: clubId })
        }}
        className="btn-primary font-sport w-full rounded-2xl py-4 text-sm font-black uppercase tracking-widest shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
      >
        {clubId ? "Firmar contrato ✍️" : "Elegí un club"}
      </button>
    </div>
  )
}

/* ── 2, 3 y 4. Mercado, temporada y resultado ─────────────────────────────── */

function Temporada({ clubes, players, squads }: { clubes: ClubDT[]; players: any[]; squads: any[] }) {
  const {
    estado, mercado, aceptados, caja, revelacion, simulando,
    alternarMovimiento, jugarTemporada, cerrarRevelacion, aceptarOferta, retirarse, reiniciar,
    elegirFormacion,
  } = useDTStore()
  const [burst, setBurst] = useState<{ label: string; tone: BurstTone } | null>(null)
  /**
   * La temporada revelándose fecha por fecha, antes del cartel de cierre.
   *
   * El motor juega el año entero en un milisegundo, así que sin esto tocabas "Jugar la temporada"
   * y aparecía el resultado: no había un solo momento de "¿cómo vamos?" ni una tabla que mirar.
   */
  const [revelando, setRevelando] = useState<{
    partidos: ScheduleMatch[]
    equipos: string[]
    equipo: string
    celebrar: () => void
  } | null>(null)

  if (!estado) return null
  const club = clubes.find((c) => c.id === estado.clubId)
  const ficha = useMemo(
    () => fichaDT(estado, (id) => clubes.find((c) => c.id === id)?.nombre ?? id),
    [estado, clubes],
  )

  // ── La carrera terminó: la ficha ──
  if (estado.terminada) {
    const titulos = ficha.titulos
    const mejorClub = ficha.titulosPorClub[0]?.clubNombre ?? ficha.mejorTemporada?.clubNombre ?? ""
    return (
      <div className="space-y-5">
        <FichaFinalDT ficha={ficha} escudoDe={escudoDe} />
        <ShareBar
          titulo="Contá tu carrera de DT"
          texto={`⚽ ${ficha.apodo}: dirigí ${ficha.temporadas} ${ficha.temporadas === 1 ? "temporada" : "temporadas"} en Gambeta, ${titulos} ${titulos === 1 ? "liga" : "ligas"}, ${ficha.copas} ${ficha.copas === 1 ? "copa" : "copas"} y ${ficha.despidos} ${ficha.despidos === 1 ? "despido" : "despidos"}. ${ficha.efectividad}% de efectividad. 🔥 A ver cuánto durás vos en el banco.`}
          destino="https://gambetafutbol.games/dt/"
          campana="dt"
          // Sin imagen no hay botón de Historia y el tweet sale con el link pelado. La placa se
          // dibuja en canvas y no es una captura del DOM: así no la arruina la barra de arriba
          // ni depende de cómo quedó el scroll.
          imagen={(formato: FormatoFicha) =>
            storyBlob(
              {
                volanta: "Modo DT",
                // El titular es el apodo, no un número: es lo que se comenta y lo que entiende
                // alguien que nunca jugó.
                titulo: ficha.apodo,
                subtitulo: [
                  ficha.nombre,
                  `${ficha.temporadas} ${ficha.temporadas === 1 ? "temporada" : "temporadas"}`,
                  ficha.clubes.length > 1 ? `${ficha.clubes.length} clubes` : mejorClub,
                ]
                  .filter(Boolean)
                  .join(" · "),
                stats: [
                  { valor: `${titulos}`, label: titulos === 1 ? "Liga" : "Ligas" },
                  { valor: `${ficha.copas}`, label: ficha.copas === 1 ? "Copa" : "Copas" },
                  { valor: `${ficha.despidos}`, label: ficha.despidos === 1 ? "Despido" : "Despidos" },
                  { valor: `${ficha.efectividad}%`, label: "Efectividad" },
                ],
                pie: ficha.mejorTemporada
                  ? ficha.mejorTemporada.campeon
                    ? `Campeón con ${ficha.mejorTemporada.clubNombre} en ${ficha.mejorTemporada.anio}.`
                    : `Su mejor año: ${ficha.mejorTemporada.puesto}º con ${ficha.mejorTemporada.clubNombre} en ${ficha.mejorTemporada.anio}.`
                  : undefined,
                // Las copas dibujadas, no contadas: es lo que hace que la ficha se entienda de
                // un vistazo, y lo que tienen las fichas de las otras apps.
                trofeos: [
                  { id: "lpf", cantidad: titulos },
                  { id: "copa-arg", cantidad: ficha.copas },
                ],
                acento: titulos > 0 ? "#D4AF37" : undefined,
              },
              formato,
            )
          }
        />
        <button
          onClick={reiniciar}
          className="font-sport w-full rounded-2xl border border-white/10 bg-slate-950/60 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-300 transition-colors hover:text-white"
        >
          Empezar otra carrera
        </button>
      </div>
    )
  }

  // ── Te echaron: elegir a dónde vas ──
  if (estado.despedido && estado.ofertas.length > 0) {
    return (
      <div className="space-y-5">
        <div className="card-gradient rounded-3xl border border-red-500/30 p-6 text-center shadow-xl">
          <span className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-red-300">
            Te quedaste sin club
          </span>
          <h2 className="mt-2 font-display text-2xl font-black uppercase text-white">
            ¿Quién te llama ahora?
          </h2>
          <p className="mt-2 font-sans text-xs text-slate-400">
            Con {estado.prestigio} de prestigio, estos son los que te abren la puerta.
          </p>
        </div>
        {estado.ofertas.map((o) => (
          <button
            key={o.clubId}
            onClick={() => aceptarOferta(o.clubId, { squads, players })}
            className="card-gradient flex w-full items-center gap-4 rounded-3xl border border-white/10 p-4 text-left transition-colors hover:border-[#74ACDF]/60"
          >
            <img
              src={escudoDe(o.clubId)}
              alt=""
              className="h-12 w-12 shrink-0 object-contain"
              onError={(e) => alFallarElEscudo(e, o.clubId)}
            />
            <span className="min-w-0 flex-1">
              <span className="font-display block text-lg font-black uppercase text-white">{o.nombre}</span>
              <span className="font-sans block text-[12px] leading-snug text-slate-400">{o.texto}</span>
            </span>
          </button>
        ))}
        <button
          onClick={retirarse}
          className="font-sport w-full rounded-2xl border border-white/10 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-white"
        >
          Colgar el buzo y ver mi carrera
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <EventBurst show={burst !== null} label={burst?.label} tone={burst?.tone || "oro"} onDone={() => setBurst(null)} />

      {/* El encabezado del año: club, objetivo, paciencia y plata */}
      <div className="card-gradient relative overflow-hidden rounded-3xl border border-white/10 p-5 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={escudoDe(estado.clubId)}
            alt=""
            className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.6)]"
            onError={(e) => alFallarElEscudo(e, estado.clubId)}
          />
          <div className="min-w-0 flex-1">
            <span className="font-sport text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
              Temporada {estado.temporada} · {estado.anio}
            </span>
            <h2 className="font-display truncate text-xl font-black uppercase text-white">
              {club?.nombre ?? estado.clubId}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display text-xl font-black text-emerald-300">€{estado.presupuesto}M</div>
            <div className="font-sport text-[9px] uppercase tracking-wider text-slate-500">Presupuesto</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.07] px-4 py-3">
          <span className="font-sport text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">
            La dirigencia pide
          </span>
          <p className="mt-1 font-display text-lg font-black uppercase text-white">{estado.objetivo.texto}</p>
        </div>

        {/* La paciencia: lo que hace que el modo tenga tensión */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <span className="font-sport text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Paciencia de la dirigencia
            </span>
            <span
              className={`font-sport text-[11px] font-black ${
                estado.paciencia > 55 ? "text-emerald-300" : estado.paciencia > 25 ? "text-amber-300" : "text-red-300"
              }`}
            >
              {estado.paciencia}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className={`h-full rounded-full ${
                estado.paciencia > 55 ? "bg-emerald-400" : estado.paciencia > 25 ? "bg-amber-400" : "bg-red-400"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${estado.paciencia}%` }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          {estado.paciencia <= 25 && (
            <p className="mt-1.5 font-sport text-[10px] uppercase tracking-wider text-red-300">
              Una más y te van a echar
            </p>
          )}
        </div>
      </div>

      {/* La táctica: la decisión de manager por excelencia, y hasta acá no existía.
          No es cosmética: `teamToStrength` reparte a los once en los puestos del dibujo, así que
          un 3-5-2 con el mismo plantel da otro ataque y otra defensa que un 4-3-3. */}
      <div className="card-gradient rounded-3xl border border-white/10 p-5 shadow-xl">
        <h3 className="font-display text-lg font-black uppercase text-white">Tu dibujo</h3>
        <p className="mt-1 font-sans text-[11px] text-slate-500">
          Cambia quién entra al once y cómo se para el equipo.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {FORMACIONES_DT.map((f) => (
            <button
              key={f}
              onClick={() => elegirFormacion(f)}
              className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                estado.formacion === f
                  ? "border-[#74ACDF] bg-[#74ACDF]/15"
                  : "border-white/10 bg-slate-950/60 hover:border-[#74ACDF]/50"
              }`}
            >
              <span className="font-display block text-base font-black text-white">
                {PERFIL_FORMACION[f].nombre}
              </span>
              <span className="font-sans mt-0.5 block text-[11px] leading-snug text-slate-400">
                {PERFIL_FORMACION[f].idea}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* El mercado: tres decisiones, no una base de datos */}
      {mercado.length > 0 && (
        <div className="card-gradient rounded-3xl border border-white/10 p-5 shadow-xl">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-lg font-black uppercase text-white">Mercado de pases</h3>
            <span className="font-sport text-[11px] font-black text-emerald-300">
              Te queda €{caja.toFixed(1)}M
            </span>
          </div>
          <p className="mt-1 font-sans text-[11px] text-slate-500">
            Vender suma plata. Comprar la gasta. Lo que no toques, queda como está.
          </p>

          <div className="mt-4 space-y-2">
            {mercado.map((m) => {
              const puesto = aceptados.includes(m.jugadorId)
              const noAlcanza = m.tipo === "compra" && !puesto && m.precio > caja
              return (
                <button
                  key={m.jugadorId}
                  disabled={noAlcanza}
                  onClick={() => alternarMovimiento(m.jugadorId, players)}
                  className={`w-full rounded-2xl border p-3 text-left transition-all ${
                    puesto
                      ? m.tipo === "venta"
                        ? "border-red-400/50 bg-red-500/10"
                        : "border-emerald-400/50 bg-emerald-500/10"
                      : noAlcanza
                        ? "cursor-not-allowed border-white/[0.06] bg-slate-950/40 opacity-45"
                        : "border-white/10 bg-slate-950/60 hover:border-[#74ACDF]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-sport shrink-0 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
                        m.tipo === "venta" ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {m.tipo === "venta" ? "Vender" : "Fichar"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-sport block truncate text-[13px] font-bold text-white">
                        {m.nombre}
                      </span>
                      <span className="font-sport block text-[10px] uppercase tracking-wider text-slate-500">
                        {m.posicion} · {m.rating} · {m.edad} años
                      </span>
                    </span>
                    <span
                      className={`font-display shrink-0 text-base font-black ${
                        m.tipo === "venta" ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {m.tipo === "venta" ? "+" : "−"}€{m.precio}M
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-[11px] leading-snug text-slate-400">{m.nota}</p>
                  {noAlcanza && (
                    <p className="mt-1 font-sport text-[10px] uppercase tracking-wider text-amber-300">
                      No te alcanza. Vendé a alguien primero.
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        disabled={simulando}
        onClick={() => {
          jugarTemporada({ squads, players })
          const r = useDTStore.getState().revelacion
          // Primero se ven los partidos, después el cartel. Anunciar "¡CAMPEONES!" antes de
          // revelar la temporada es contarle el final a alguien que todavía la está mirando.
          const celebrar = () => {
            if (r?.temporada.campeon) setBurst({ label: "¡CAMPEONES!", tone: "oro" })
            // No hay tono rojo en EventBurst: el despido ya se cuenta con el cartel entero en rojo.
            else if (r?.evaluacion.despedido) setBurst({ label: "TE ECHARON", tone: "plata" })
          }
          if (r && r.partidos.length >= 3)
            setRevelando({ partidos: r.partidos, equipos: r.equipos, equipo: r.miEquipo, celebrar })
          else celebrar()
          trackEvent(EVENTOS.carreraTemporada, { modo: "dt", temporada: estado.temporada })
        }}
        className="btn-primary latido font-sport w-full rounded-2xl py-5 text-sm font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
      >
        {simulando ? "Jugando la temporada…" : `▶ Jugar la temporada ${estado.anio}`}
      </button>

      {/* Colgar el buzo cuando quieras.
          Es el mismo error que tenía el modo carrera de jugador: la ficha —lo único que se
          comparte, y lo que hace crecer al juego— estaba detrás de llegar al final. Medido allá:
          108 empezaban y 4 terminaban, así que cuatro personas por mes tenían algo para mostrar.
          Acá se puede cerrar la carrera y ver la ficha en cualquier momento. */}
      {estado.historia.length > 0 && (
        <button
          onClick={retirarse}
          className="font-sport w-full rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/[0.07] py-3 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/15"
        >
          🎬 Colgar el buzo y ver mi ficha
        </button>
      )}

      {/* El historial: lo que ya pasó, que es lo que hace que la carrera se sienta larga */}
      {estado.historia.length > 0 && (
        <div className="card-gradient rounded-3xl border border-white/10 p-5 shadow-xl">
          <h3 className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Tu carrera
          </h3>
          <div className="mt-3 space-y-2">
            {[...estado.historia].reverse().map((t) => (
              <div
                key={`${t.anio}-${t.clubId}`}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 ${
                  t.campeon
                    ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.08]"
                    : t.despedido
                      ? "border-red-500/30 bg-red-500/[0.07]"
                      : "border-white/[0.06] bg-black/20"
                }`}
              >
                <span className="font-sport w-10 shrink-0 text-[11px] font-black text-slate-500">{t.anio}</span>
                <img
                  src={escudoDe(t.clubId)}
                  alt=""
                  className="h-6 w-6 shrink-0 object-contain"
                  onError={(e) => alFallarElEscudo(e, t.clubId)}
                />
                <span className="font-sport min-w-0 flex-1 truncate text-[12px] font-bold text-white">
                  {t.campeon ? "🏆 Campeón" : `${t.puesto}º de ${t.total}`}
                  {t.copa?.campeon && <span className="ml-1 text-[#D4AF37]">· 🏆 Copa</span>}
                  {t.despedido && <span className="ml-1 text-red-300">· despedido</span>}
                </span>
                <span className="font-sport shrink-0 text-[10px] uppercase tracking-wider text-slate-500">
                  {t.ganados}-{t.empatados}-{t.perdidos}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* El cartel del final de temporada */}
      {revelando && (
        <TorneoEnVivo
          partidos={revelando.partidos}
          equipos={revelando.equipos}
          equipo={revelando.equipo}
          torneo={`Liga Profesional ${estado.anio}`}
          onListo={() => {
            setRevelando(null)
            revelando.celebrar()
          }}
        />
      )}

      <AnimatePresence>
        {revelacion && !revelando && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(2,8,19,0.92)", backdropFilter: "blur(6px)" }}
            onClick={cerrarRevelacion}
          >
            <motion.div
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.96 }}
              transition={{ type: "spring", bounce: 0.24, duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md overflow-hidden rounded-3xl border p-6 shadow-2xl ${
                revelacion.temporada.campeon
                  ? "border-[#D4AF37]/50 bg-gradient-to-b from-[#1a1508] to-[#050a14]"
                  : revelacion.evaluacion.despedido
                    ? "border-red-500/40 bg-gradient-to-b from-[#1a0808] to-[#050a14]"
                    : "border-[#74ACDF]/30 bg-gradient-to-b from-[#0c1728] to-[#050a14]"
              }`}
            >
              <p className="font-sport text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                Temporada {revelacion.temporada.anio}
              </p>
              <h3
                className={`mt-2 text-center font-display text-3xl font-black uppercase leading-none ${
                  revelacion.temporada.campeon
                    ? "text-[#D4AF37]"
                    : revelacion.evaluacion.despedido
                      ? "text-red-300"
                      : "text-white"
                }`}
              >
                {revelacion.evaluacion.titulo}
              </h3>
              <p className="mt-3 text-center font-sans text-[13px] leading-relaxed text-slate-300">
                {revelacion.evaluacion.detalle}
              </p>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {[
                  { v: `${revelacion.temporada.puesto}º`, l: "Puesto" },
                  { v: revelacion.temporada.ganados, l: "Ganados" },
                  { v: revelacion.temporada.golesFavor, l: "Goles" },
                  { v: `${revelacion.evaluacion.prestigio >= 0 ? "+" : ""}${revelacion.evaluacion.prestigio}`, l: "Prestigio" },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl border border-white/[0.07] bg-black/25 py-2 text-center">
                    <div className="font-display text-lg font-black text-white">{s.v}</div>
                    <div className="font-sport text-[9px] uppercase tracking-wider text-slate-500">{s.l}</div>
                  </div>
                ))}
              </div>

              {/* La copa: un año malo en la liga se salva con una copa, y eso hay que contarlo */}
              {revelacion.temporada.copa && (
                <div
                  className={`mt-4 rounded-2xl border px-4 py-3 text-center ${
                    revelacion.temporada.copa.campeon
                      ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.1]"
                      : "border-white/[0.07] bg-black/25"
                  }`}
                >
                  <span className="font-sport text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    Copa Argentina
                  </span>
                  <p
                    className={`mt-1 font-display text-lg font-black uppercase ${
                      revelacion.temporada.copa.campeon ? "text-[#D4AF37]" : "text-white"
                    }`}
                  >
                    {revelacion.temporada.copa.campeon ? "🏆 Campeones" : revelacion.temporada.copa.hasta}
                  </p>
                </div>
              )}

              {/* La lesión del año: es lo que hace que el fondo del plantel valga algo */}
              {revelacion.lesion && (
                <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 text-center">
                  <span className="font-sport text-[10px] font-black uppercase tracking-[0.25em] text-red-300">
                    🏥 Se lesionó
                  </span>
                  <p className="mt-1 font-sans text-[13px] text-white">
                    <strong>{revelacion.lesion.nombre}</strong> · {revelacion.lesion.tipo}
                  </p>
                </div>
              )}

              {/* El plantel cambia solo: los pibes crecen y los veteranos bajan */}
              {(revelacion.evolucion.crecieron.length > 0 || revelacion.evolucion.retirados.length > 0) && (
                <div className="mt-4 rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3">
                  <span className="font-sport text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                    El plantel
                  </span>
                  {revelacion.evolucion.crecieron.slice(0, 3).map((c) => (
                    <p key={c.jugadorId} className="mt-1 font-sans text-[12px] text-slate-200">
                      📈 <strong className="text-white">{c.nombre}</strong> {c.antes} → {c.ahora}
                    </p>
                  ))}
                  {revelacion.evolucion.retirados.slice(0, 2).map((c) => (
                    <p key={c.jugadorId} className="mt-1 font-sans text-[12px] text-slate-400">
                      🎬 <strong className="text-slate-200">{c.nombre}</strong> colgó los botines
                    </p>
                  ))}
                </div>
              )}

              {revelacion.temporada.goleador && (
                <p className="mt-4 text-center font-sans text-[12px] text-slate-400">
                  Goleador del equipo:{" "}
                  <strong className="text-white">{revelacion.temporada.goleador.nombre}</strong> con{" "}
                  {revelacion.temporada.goleador.goles}
                </p>
              )}

              <button
                onClick={cerrarRevelacion}
                className="btn-primary font-sport mt-6 w-full rounded-2xl py-3 text-xs font-black uppercase tracking-widest"
              >
                Continuar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
