"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/lib/user-store"

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginGuest } = useUserStore()
  const [usernameInput, setUsernameInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [tab, setTab] = useState<"guest" | "login">("guest")

  if (!isAuthModalOpen) return null

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameInput.trim()) return
    loginGuest(usernameInput.trim())
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="card-gradient rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#74ACDF]/30 shadow-[0_0_50px_rgba(116,172,223,0.15)] relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/60 border border-slate-800"
          >
            ✕
          </button>

          <div className="text-center mb-6">
            <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
              PERFIL COMPETITIVO
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              INGRESAR AL GAME
            </h2>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Creá tu usuario para figurar en la Tabla de Líderes Global y sumar ELO en cada torneo.
            </p>
          </div>

          {/* Selector de modo */}
          <div className="flex gap-2 mb-6 font-sport">
            <button
              onClick={() => setTab("guest")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "guest" ? "bg-[#74ACDF] text-white shadow-md shadow-[#74ACDF]/20" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Nombre de DT
            </button>
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                tab === "login" ? "bg-[#74ACDF] text-white shadow-md shadow-[#74ACDF]/20" : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              Cuenta / Email
            </button>
          </div>

          {tab === "guest" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-sport">
                  Nombre o Apodo de Director Técnico
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Scaloni_DT, El_Romi_10, Marcelo"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#74ACDF] font-sans"
                />
              </div>

              <div className="card-glass rounded-xl p-3 flex items-center gap-3 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white">Rating Inicial: 1000 ELO</div>
                  <div className="text-[10px] text-slate-400">Sumás ELO si salís campeón o top 4 en cada liga</div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg mt-2"
              >
                INGRESAR COMO DT
              </button>
            </form>
          )}

          {tab === "login" && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-sport">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="tuemail@ejemplo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#74ACDF] font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-sport">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  required
                  placeholder="TuUsuario"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#74ACDF] font-sans"
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg mt-2"
              >
                REGISTRAR / INICIAR SESIÓN
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
