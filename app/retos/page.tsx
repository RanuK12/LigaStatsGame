"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  RETOS_GAMBETA,
  getRetosCompletados,
  marcarRetoCompletado,
  calcularPorcentajeRetos,
  type Reto,
} from "@/lib/retos-engine"
import { useUserStore } from "@/lib/user-store"
import CertificadoPlatinadoModal from "@/components/retos/CertificadoPlatinadoModal"
import { tocar } from "@/lib/sonido"

export default function RetosPage() {
  const user = useUserStore((s) => s.user)
  const openAuthModal = useUserStore((s) => s.openAuthModal)

  const [completados, setCompletados] = useState<string[]>([])
  const [filterTier, setFilterTier] = useState<string>("todos")
  const [showCertificado, setShowCertificado] = useState(false)

  useEffect(() => {
    setCompletados(getRetosCompletados())
  }, [])

  const { pct, total } = calcularPorcentajeRetos()

  const handleToggleSimulate = (id: string) => {
    marcarRetoCompletado(id)
    const nuevos = getRetosCompletados()
    setCompletados(nuevos)
    tocar("ficha")
  }

  const filteredRetos = filterTier === "todos"
    ? RETOS_GAMBETA
    : RETOS_GAMBETA.filter((r) => r.tier === filterTier)

  const tierColors = {
    bronce: "border-amber-700/40 text-amber-500 bg-amber-950/20",
    plata: "border-slate-400/40 text-slate-300 bg-slate-900/40",
    oro: "border-amber-400/50 text-amber-300 bg-amber-500/10",
    platino: "border-purple-400/50 text-purple-300 bg-purple-950/30",
  }

  return (
    <div className="gradient-bg arg-stripe-bg min-h-screen text-white pb-24 pt-10 px-4 font-sans">
      <main className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="text-center space-y-3">
          <span className="badge-gold font-sport text-[10px] font-black uppercase tracking-widest px-3 py-1">
            🏆 PLATINAR GAMBETA · 52 DESAFÍOS
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight">
            Retos y <span className="gradient-text">Logros</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans leading-relaxed">
            Completá los 52 desafíos del fútbol argentino para desbloquear el Certificado Oficial de Leyenda firmado por el Equipo de Gambeta.
          </p>
        </header>

        {/* BANNER REGISTRO EN SUPABASE */}
        {!user && (
          <div className="rounded-3xl border border-[#74ACDF]/30 bg-gradient-to-r from-[#0c1728] to-[#050a14] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black font-sport uppercase tracking-widest text-[#74ACDF]">
                🆔 CUENTA Y PROGRESO EN LA NUBE
              </span>
              <p className="text-xs text-slate-300 font-sans">
                Registrate gratis para guardar tus retos completados, conservar tu ELO y firmar tu Ficha Certificado Oficial.
              </p>
            </div>
            <button
              onClick={openAuthModal}
              className="btn-primary py-2.5 px-6 font-sport text-xs font-bold uppercase tracking-wider shrink-0"
            >
              CREAR CUENTA / INGRESAR
            </button>
          </div>
        )}

        {/* BARRA DE PROGRESO GLOBAL */}
        <div className="card-gradient rounded-3xl p-6 border border-white/10 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-sport font-bold text-slate-400 uppercase tracking-wider">
                TU PROGRESO DE PLATINADO
              </span>
              <div className="font-display text-2xl font-black text-white">
                {completados.length} <span className="text-slate-500 text-lg">/ {total} RETOS</span>
              </div>
            </div>
            <button
              onClick={() => setShowCertificado(true)}
              className="btn-gold px-5 py-2.5 font-sport text-xs font-black uppercase tracking-wider shadow-lg"
            >
              📜 VER CERTIFICADO
            </button>
          </div>

          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#74ACDF] via-amber-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-sport text-slate-400">
            <span>Completado: <strong className="text-emerald-400">{pct}%</strong></span>
            <span>Estatus: <strong className="text-amber-400">{pct === 100 ? "👑 LEYENDA PLATINADA" : "⚽ EN CAMINO"}</strong></span>
          </div>
        </div>

        {/* TIER FILTERS */}
        <div className="flex flex-wrap justify-center gap-2 font-sport text-xs font-bold uppercase">
          {["todos", "bronce", "plata", "oro", "platino"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`px-4 py-2 rounded-xl transition-all ${
                filterTier === t
                  ? "bg-[#74ACDF] text-slate-950 font-black shadow-lg"
                  : "bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white"
              }`}
            >
              {t === "todos" ? `TODOS (${RETOS_GAMBETA.length})` : `${t.toUpperCase()}`}
            </button>
          ))}
        </div>

        {/* LISTA DE RETOS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredRetos.map((r) => {
            const isDone = completados.includes(r.id)
            return (
              <motion.div
                key={r.id}
                whileHover={{ y: -3 }}
                className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                  isDone
                    ? "bg-slate-950/80 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "bg-slate-950/40 border-white/5 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xl">{r.icon}</span>
                  <span className={`text-[9px] font-sport font-black uppercase px-2 py-0.5 rounded-md border ${tierColors[r.tier]}`}>
                    {r.tier}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-white">{r.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">{r.description}</p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className={`text-[10px] font-sport font-bold uppercase ${isDone ? "text-emerald-400" : "text-slate-500"}`}>
                    {isDone ? "✓ COMPLETADO" : "🔒 PENDIENTE"}
                  </span>
                  {!isDone && (
                    <button
                      onClick={() => handleToggleSimulate(r.id)}
                      className="text-[9px] font-sport font-bold text-[#74ACDF] hover:underline uppercase"
                    >
                      [PROBAR LOGRO]
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* MODAL CERTIFICADO */}
        <CertificadoPlatinadoModal
          isOpen={showCertificado}
          onClose={() => setShowCertificado(false)}
          pct={pct}
          completados={completados.length}
        />
      </main>
    </div>
  )
}
