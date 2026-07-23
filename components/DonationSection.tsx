"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  mpAlias,
  mpLink,
  mpQrImage,
  mpAmounts,
  stripeTiers,
  mpConfigured,
  stripeConfigured,
} from "@/lib/donations"

export default function DonationSection() {
  const [copied, setCopied] = useState(false)

  function copyAlias() {
    if (!mpAlias || typeof navigator === "undefined") return
    navigator.clipboard?.writeText(mpAlias).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <section className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="card-gradient rounded-3xl p-6 sm:p-8 border border-amber-400/20 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500/40 via-yellow-400/70 to-amber-500/40 animate-pulse" />

        <span className="text-[10px] font-bold text-[#FFD700] uppercase tracking-widest font-sport block mb-2.5">
          ❤️ PROYECTO DE HINCHAS PARA HINCHAS
        </span>
        <h3 className="font-display text-xl sm:text-3xl font-black text-white mb-3 uppercase tracking-tight">
          BANCÁ EL SIMULADOR
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-8 max-w-xl mx-auto font-sans leading-relaxed">
          Desarrollo independiente, sin publicidad, hecho a pulmón. Tu aporte paga los servidores y
          nos deja seguir sumando plantillas históricas y funciones nuevas. Cada cafecito suma. 🙌
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
          {/* MERCADO PAGO */}
          <div className="card-glass rounded-2xl p-5 border border-white/5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🇦🇷</span>
              <h4 className="font-display text-base font-black uppercase text-white tracking-tight">Mercado Pago</h4>
              <span className="ml-auto text-[9px] font-sport text-slate-400 uppercase tracking-wider">ARS</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {mpAmounts.map((amt) => (
                <MpAmount key={amt} amount={amt} />
              ))}
            </div>

            {mpAlias && (
              <button
                onClick={copyAlias}
                className="flex items-center justify-between gap-2 bg-slate-950/70 border border-white/10 rounded-xl px-3 py-2.5 mb-3 hover:border-[#74ACDF]/50 transition-colors"
              >
                <span className="text-[10px] font-sport text-slate-400 uppercase tracking-wider">Alias</span>
                <span className="text-sm font-bold text-white truncate">{mpAlias}</span>
                <span className="text-[10px] font-bold text-[#74ACDF] shrink-0">{copied ? "¡Copiado!" : "Copiar"}</span>
              </button>
            )}

            {mpLink ? (
              <a
                href={mpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-3 text-[11px] font-bold tracking-widest uppercase rounded-xl mt-auto"
              >
                Donar con Mercado Pago
              </a>
            ) : (
              <DisabledNote label="Donar con Mercado Pago" />
            )}

            {mpConfigured && (
              <img
                src={mpQrImage}
                alt="QR Mercado Pago"
                className="w-24 h-24 mx-auto mt-4 rounded-lg bg-white p-1"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            )}
          </div>

          {/* STRIPE */}
          <div className="card-glass rounded-2xl p-5 border border-white/5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🌎</span>
              <h4 className="font-display text-base font-black uppercase text-white tracking-tight">Stripe</h4>
              <span className="ml-auto text-[9px] font-sport text-slate-400 uppercase tracking-wider">USD</span>
            </div>

            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">Para hinchas de todo el mundo 💳</p>

            <div className="space-y-2.5 mt-auto">
              {stripeTiers.map((t) =>
                t.link ? (
                  <a
                    key={t.usd}
                    href={t.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between bg-slate-950/70 border border-white/10 rounded-xl px-4 py-3 hover:border-[#635BFF]/60 transition-colors group"
                  >
                    <span className="text-sm font-bold text-white">Donar ${t.usd}</span>
                    <span className="text-[10px] font-sport text-[#635BFF] group-hover:translate-x-0.5 transition-transform">USD →</span>
                  </a>
                ) : (
                  <div key={t.usd} className="flex items-center justify-between bg-slate-950/40 border border-white/5 rounded-xl px-4 py-3 opacity-50">
                    <span className="text-sm font-bold text-slate-400">Donar ${t.usd}</span>
                    <span className="text-[10px] font-sport text-slate-500">USD</span>
                  </div>
                ),
              )}
            </div>

            {!stripeConfigured && (
              <p className="text-[10px] text-amber-400/70 mt-3 leading-relaxed">
                Stripe pendiente de configurar (ver .env.local.example).
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  )
}

function MpAmount({ amount }: { amount: number }) {
  const content = (
    <>
      <span className="text-[9px] font-sport text-slate-400">$</span>
      <span className="text-sm font-black text-white font-display">{amount.toLocaleString("es-AR")}</span>
    </>
  )
  if (mpLink) {
    return (
      <a
        href={mpLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center py-2.5 rounded-xl bg-slate-950/60 border border-white/10 hover:border-amber-400/60 transition-colors"
      >
        {content}
      </a>
    )
  }
  return (
    <div className="flex flex-col items-center py-2.5 rounded-xl bg-slate-950/40 border border-white/5 opacity-60">{content}</div>
  )
}

function DisabledNote({ label }: { label: string }) {
  return (
    <div className="mt-auto">
      <div className="w-full py-3 text-[11px] font-bold tracking-widest uppercase rounded-xl bg-slate-900 border border-white/10 text-slate-500 text-center cursor-not-allowed">
        {label}
      </div>
      <p className="text-[10px] text-amber-400/70 mt-2 leading-relaxed text-center">
        Mercado Pago pendiente de configurar (ver .env.local.example).
      </p>
    </div>
  )
}
