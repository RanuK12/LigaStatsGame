"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useT } from "@/lib/i18n"

/**
 * Las dos copas continentales, en el home.
 *
 * No son un modo más del menú: son lo único del juego que hay que GANARSE, y por eso van con su
 * propia banda. Decirlo en la portada es lo que convierte "otro juego de draft" en "hay algo que
 * perseguir", y de paso es el mejor motivo para crear cuenta que tiene el juego.
 */
const COPAS = [
  {
    id: "libertadores",
    nombre: "Copa Libertadores",
    corto: "Libertadores",
    color: "#F6C750",
    puntos: 150,
    como: "Terminá 1° a 4° en la Liga",
    detalle: "Fase de grupos ida y vuelta, llaves a doble partido y final única. Es lo más difícil del juego.",
  },
  {
    id: "sudamericana",
    nombre: "Copa Sudamericana",
    corto: "Sudamericana",
    color: "#F0883E",
    puntos: 120,
    como: "Terminá 5° a 8° en la Liga",
    detalle: "El mismo formato, un escalón más accesible. Con un buen once se gana una de cada cinco veces.",
  },
]

export default function ContinentalBanner() {
  const t = useT()
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <p className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#F6C750]">{t('ContinentalBanner.nuevo', 'Nuevo')}</p>
        <h3 className="mt-1.5 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
          {t('ContinentalBanner.lasCopas', 'Las copas')} <span className="gradient-text">{t('ContinentalBanner.noSeEligen', 'no se eligen')}</span>
        </h3>
        <p className="mx-auto mt-2 max-w-lg font-sans text-xs leading-relaxed text-slate-400">
          Se clasifica. Terminá entre los ocho primeros de la Liga con tu once y te ganás la plaza. Es lo que más
          ELO reparte y lo único que hay que merecer.
        </p>
      </motion.div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        {COPAS.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <Link href="/draft?mode=liga" className="group block h-full">
              <div
                className="flex h-full flex-col items-center rounded-3xl border-2 p-6 text-center transition-shadow"
                style={{
                  borderColor: `${c.color}55`,
                  background: `linear-gradient(180deg, ${c.color}14, rgba(2,8,19,0.6))`,
                }}
              >
                {/* Los de /logos/copas eran dos placeholders idénticos con una "L" y una "S"
                    adentro: no distinguían una copa de la otra ni se parecían a nada. Los de
                    /logos/trofeos son los del juego, y la Libertadores va en oro y la
                    Sudamericana en plata, como en la vida. */}
                <img
                  src={`/logos/trofeos/${c.id}.svg`}
                  alt={c.nombre}
                  className="h-20 w-20 object-contain drop-shadow-[0_0_18px_rgba(246,199,80,0.25)] transition-transform group-hover:scale-105"
                />
                <h4 className="mt-3 font-display text-lg font-black uppercase tracking-tight" style={{ color: c.color }}>
                  {c.nombre}
                </h4>
                <p className="mt-2 font-sans text-[12px] leading-relaxed text-slate-400">{c.detalle}</p>

                <div className="mt-4 flex items-center gap-4">
                  <div>
                    <div className="font-display text-2xl font-black leading-none" style={{ color: c.color }}>
                      {c.puntos}
                    </div>
                    <div className="font-sport text-[11px] uppercase tracking-wider text-slate-500">{t('ContinentalBanner.puntosBase', 'puntos base')}</div>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-left">
                    <div className="font-sport text-[10px] font-black uppercase tracking-wider text-slate-300">
                      {c.como}
                    </div>
                    <div className="font-sport text-[11px] uppercase tracking-wider text-slate-500">
                      {t('ContinentalBanner.conCuentaParaGuardarla', 'con cuenta, para guardarla')}
                    </div>
                  </div>
                </div>

                <span className="mt-5 font-sport text-[10px] font-black uppercase tracking-widest text-[#74ACDF] transition-colors group-hover:text-white">
                  {t('ContinentalBanner.jugarLaLigaY', 'Jugar la Liga y clasificar →')}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
