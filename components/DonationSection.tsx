"use client"

import { useState } from "react"
import { trackEvent, EVENTOS } from "@/components/Analytics"
import { motion } from "framer-motion"
import { mpAlias, mpTiers } from "@/lib/donations"
import { useEmbebido } from "@/lib/embebido"

export default function DonationSection({ compacta = false }: { compacta?: boolean } = {}) {
  const [copied, setCopied] = useState(false)
  const embebido = useEmbebido()

  function copyAlias() {
    if (typeof navigator === "undefined") return
    navigator.clipboard?.writeText(mpAlias).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  // Embebido en un portal no se pide plata: es un cobro afuera de su plataforma, que es
  // justo lo que su revisión no deja pasar. En el sitio propio queda igual.
  if (embebido) return null

  return (
    <section id="apoyar" className={`relative z-10 mx-auto scroll-mt-20 ${compacta ? "max-w-2xl px-0 pt-6" : "max-w-4xl px-4 pb-20"}`}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl p-6 sm:p-9 border border-amber-400/25 overflow-hidden card-gradient"
      >
        {/* glow accents */}
        <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

        <div className="text-center relative">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#FFD700] uppercase tracking-widest font-sport mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Hecho por hinchas, sin publicidad
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-black text-white mb-2.5 uppercase tracking-tight">
            Bancá el proyecto ⚽
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mb-2 max-w-lg mx-auto font-sans leading-relaxed">
            Somos un grupo chico de programadores argentinos y a Gambeta lo pagamos de nuestro bolsillo.
            No hay publicidad, no vendemos datos y no hay nada pago adentro del juego: lo hicimos para que
            la gente se divierta.
          </p>
          <p className="text-slate-400 text-xs sm:text-sm mb-7 max-w-md mx-auto font-sans leading-relaxed">
            Lo que entra va a los servidores y a sumar jugadores y equipos nuevos. Te lleva 10 segundos.
          </p>
        </div>

        {/* TIERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative">
          {mpTiers.map((t, i) => {
            const popular = i === 1
            return (
              <motion.a
                key={t.ars}
                href={t.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent(EVENTOS.donacionClick, { via: "mercadopago", monto: t.ars })}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`group relative flex flex-col items-center text-center rounded-2xl p-5 border transition-colors ${
                  popular
                    ? "bg-gradient-to-b from-amber-400/15 to-slate-950/40 border-amber-400/50 shadow-[0_0_30px_rgba(255,215,0,0.12)]"
                    : "bg-slate-950/50 border-white/10 hover:border-amber-400/40"
                }`}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black font-sport uppercase tracking-wider whitespace-nowrap shadow-md">
                    ★ El más elegido
                  </span>
                )}
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{t.emoji}</span>
                <span className="font-display text-2xl font-black text-white leading-none">
                  ${t.ars.toLocaleString("es-AR")}
                </span>
                <span className="text-[10px] font-sport text-slate-500 uppercase tracking-wider mt-0.5">ARS</span>
                <span className="text-sm font-bold text-white font-sport uppercase tracking-wide mt-2.5">{t.label}</span>
                <span className="text-[11px] text-slate-400 leading-snug mt-1">{t.sub}</span>
                <span
                  className={`mt-4 w-full py-2.5 rounded-xl text-[11px] font-bold font-sport uppercase tracking-widest transition-colors ${
                    popular
                      ? "bg-amber-400 text-slate-950 group-hover:bg-amber-300"
                      : "bg-slate-900 text-amber-300 border border-amber-400/30 group-hover:bg-amber-400/10"
                  }`}
                >
                  Donar
                </span>
              </motion.a>
            )
          })}
        </div>

        {/* ALIAS + TRUST */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-[11px] text-slate-500 font-sans">o transferí al alias</span>
          <button
            onClick={() => { trackEvent(EVENTOS.donacionClick, { via: 'alias' }); copyAlias() }}
            className="inline-flex items-center gap-2 bg-slate-950/70 border border-white/10 rounded-xl px-3.5 py-2 hover:border-amber-400/50 transition-colors"
          >
            <span className="text-sm font-black text-white tracking-wide">{mpAlias}</span>
            <span className="text-[10px] font-bold font-sport uppercase text-amber-300">
              {copied ? "¡Copiado!" : "Copiar"}
            </span>
          </button>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-600 font-sport uppercase tracking-wider">
          🔒 Pago protegido con Mercado Pago
        </p>
      </motion.div>
    </section>
  )
}
