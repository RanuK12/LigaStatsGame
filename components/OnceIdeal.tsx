"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"
import once from "@/data/derived/once-ideal.json"
import { useT, useRuta } from "@/lib/i18n"
import { trackEvent } from "@/components/Analytics"

/**
 * El once ideal histórico, en la portada.
 *
 * Por qué está acá. Medido el 8 y el 14 de agosto: 403 personas entran a la portada por semana,
 * se quedan 20 segundos y 138 se van sin abrir ningún modo. La portada explicaba el juego con
 * palabras; esto lo muestra. El que llega ve el equipo que se puede armar jugando —Fillol,
 * Passarella, Maradona, Messi— y el botón que lleva al draft está abajo del once.
 *
 * El equipo no está escrito acá: sale de data/derived/once-ideal.json, que genera
 * scripts/data/build-once-ideal.mjs desde la base. Si entra una leyenda nueva o cambia un OVR,
 * el once se actualiza solo.
 */

type Jugador = (typeof once.once)[number]

/** Los escudos viven en tres carpetas según de dónde salga el club. Se prueban en orden. */
function alFallarElEscudo(e: React.SyntheticEvent<HTMLImageElement>, clubId: string) {
  const img = e.target as HTMLImageElement
  const alternativas = [`/logos/carrera/${clubId}.png`, `/logos/ligas/${clubId}.svg`]
  const actual = new URL(img.src, location.origin).pathname
  const i = alternativas.indexOf(actual)
  if (i + 1 < alternativas.length) img.src = alternativas[i + 1]
  else img.style.visibility = "hidden"
}

/**
 * La ficha mide 86 px sobre una cancha de 360, o sea un 24 % de ancho: centrada en el 12 %, un
 * lateral queda pegado al borde y la tarjeta —que recorta para mantener las esquinas
 * redondeadas— le come un pedazo. Las coordenadas tácticas se mapean de 12-88 a 14-86, que deja
 * dos puntos de aire de cada lado sin achatar el dibujo del equipo.
 */
const xSeguro = (x: number) => 14 + ((x - 12) / 76) * 72

function Ficha({ j, activo, onHover }: { j: Jugador; activo: boolean; onHover: (id: string | null) => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 220, damping: 18, delay: 0.03 * j.ovr % 0.4 }}
      onMouseEnter={() => onHover(j.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(j.id)}
      onBlur={() => onHover(null)}
      className="absolute z-10 flex w-[68px] flex-col items-center gap-1 outline-none sm:w-[86px]"
      // El centrado va acá y no con `-translate-x-1/2` de Tailwind: framer-motion escribe su
      // propio `transform` para animar la escala y pisa la clase, así que la ficha quedaba
      // anclada por la esquina y todo el equipo aparecía corrido media ficha a la derecha y
      // media hacia abajo. Pasándole `x` e `y`, framer los compone con la escala.
      style={{ left: `${xSeguro(j.x)}%`, top: `${j.y}%`, x: "-50%", y: "-50%" }}
      aria-label={`${j.nombre}, ${j.etiqueta}, ${j.ovr}`}
    >
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border font-display text-[15px] font-black transition-all duration-300 sm:h-12 sm:w-12 sm:text-base ${
          activo
            ? "border-[#D4AF37] bg-[#D4AF37] text-slate-950 shadow-[0_0_26px_rgba(212,175,55,0.65)]"
            : "border-[#D4AF37]/45 bg-slate-950/85 text-[#D4AF37] shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
        }`}
      >
        {j.ovr}
        {j.clubId && (
          <img
            src={`/logos/clubs/${j.clubId}.png`}
            alt=""
            onError={(e) => alFallarElEscudo(e, j.clubId!)}
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-slate-950/90 object-contain p-[2px] ring-1 ring-white/10"
          />
        )}
      </span>
      <span className="font-sport w-full truncate text-center text-[10px] font-bold leading-tight text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)] sm:text-[11px]">
        {j.nombre.split(" ").slice(-1)[0]}
      </span>
      <span className="hidden text-[9px] uppercase tracking-wider text-slate-400 sm:block">{j.puesto}</span>
    </motion.button>
  )
}

export default function OnceIdeal() {
  const t = useT()
  const ruta = useRuta()
  const [activo, setActivo] = useState<string | null>(null)
  const elegido = once.once.find((j) => j.id === activo) || null

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16">
      <div className="card-gradient relative overflow-hidden rounded-3xl border border-[#D4AF37]/25 shadow-2xl">
        <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-80" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />

        <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* Texto e invitación */}
          <div className="flex flex-col justify-center text-center lg:text-left">
            <span className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
              {t("once.volanta", "El once ideal de la historia")}
            </span>
            <h2 className="font-display mt-2 text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl">
              {t("once.titulo", "Once títulos, once leyendas")}
            </h2>
            <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-slate-400 lg:mx-0">
              {t(
                "once.bajada",
                "Este es el mejor equipo que se puede armar con la base entera del juego: el arquero del 78, el capitán del 78, el 10 del 86 y el mejor de todos. Vos podés armar el tuyo con planteles reales, año por año.",
              )}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-black leading-none text-[#D4AF37]">{once.ovr}</span>
                <span className="font-sport text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("once.ovrDelOnce", "OVR del once")}
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl font-black leading-none text-white">{once.formacion}</span>
                <span className="font-sport text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {t("once.formacion", "Formación")}
                </span>
              </div>
            </div>

            {/* Dos salidas y no una: el que se quedó mirando el once puede querer jugar o puede
                querer seguir mirando. Antes solo se podía ir al draft, y el que no estaba para
                armar un equipo no tenía a dónde ir desde la pieza más linda de la portada. */}
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href={ruta("/draft?mode=clasico")}
                onClick={() => trackEvent("once_ideal_cta")}
                className="btn-gold rounded-xl px-8 py-4 text-center shadow-[0_4px_24px_rgba(212,175,55,0.3)]"
              >
                {t("once.cta", "ARMÁ EL TUYO")}
              </Link>
              <Link
                href={ruta("/records")}
                onClick={() => trackEvent("once_ideal_leyendas")}
                className="font-sport rounded-xl border border-white/[0.08] px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-slate-300 transition-colors hover:border-[#D4AF37]/40 hover:text-white"
              >
                {t("once.verLeyendas", "VER LAS LEYENDAS")}
              </Link>
            </div>
            <p className="mt-2 font-sans text-[11px] text-slate-500">
              {t("once.pie", "Gratis, en el navegador y sin registrarte.")}
            </p>
          </div>

          {/* La cancha */}
          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="pitch relative aspect-[68/105] w-full shadow-[0_24px_70px_rgba(0,0,0,0.5)]">
              <div className="pitch-lines" />
              <div className="pitch-center" />
              <div className="pitch-center-dot" />
              <div className="pitch-area-top" />
              <div className="pitch-area-bottom" />
              {once.once.map((j) => (
                <Ficha key={j.id} j={j} activo={activo === j.id} onHover={setActivo} />
              ))}
            </div>

            {/* Quién es el que estás mirando. Sin esto la cancha es once números sueltos. */}
            <div className="mt-3 min-h-[46px] rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-center">
              {elegido ? (
                <>
                  <span className="font-display block text-sm font-black uppercase tracking-wide text-white">
                    {elegido.nombre}
                  </span>
                  <span className="font-sans text-[11px] text-slate-400">
                    {elegido.etiqueta}
                    {elegido.club ? ` · ${elegido.club}` : ""}
                  </span>
                </>
              ) : (
                <span className="font-sans text-[11px] leading-[42px] text-slate-500">
                  {t("once.tocaUno", "Tocá un jugador para ver quién es")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
