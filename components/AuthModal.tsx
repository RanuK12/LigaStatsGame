"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FcGoogle } from "react-icons/fc"
import { FaXTwitter } from "react-icons/fa6"
import { useUserStore } from "@/lib/user-store"
import { signInWithProvider, isSupabaseConfigured } from "@/lib/auth"

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginGuest } = useUserStore()
  const [usernameInput, setUsernameInput] = useState("")
  const [tab, setTab] = useState<"guest" | "login">("guest")

  // Close on ESC while the modal is open.
  useEffect(() => {
    if (!isAuthModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isAuthModalOpen, closeAuthModal])

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameInput.trim()) return
    loginGuest(usernameInput.trim())
  }

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          key="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="card-gradient rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#74ACDF]/30 shadow-[0_0_50px_rgba(116,172,223,0.15)] relative overflow-hidden cursor-default"
          >
            {/* Close button */}
            <button
              onClick={closeAuthModal}
              aria-label="Cerrar"
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
                Cuenta Social
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
              <div className="space-y-4">
                <p className="text-center text-xs text-slate-400 leading-relaxed">
                  Iniciá sesión con tu cuenta social para guardar tu progreso y ELO en la nube.
                </p>

                <button
                  type="button"
                  disabled={!isSupabaseConfigured}
                  onClick={() => signInWithProvider("google")}
                  title={isSupabaseConfigured ? undefined : "Configura Supabase para habilitar login social"}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-white text-slate-900 text-sm font-bold font-sport shadow-lg transition-all hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FcGoogle className="text-xl" />
                  Continuar con Google
                </button>

                <button
                  type="button"
                  disabled={!isSupabaseConfigured}
                  onClick={() => signInWithProvider("twitter")}
                  title={isSupabaseConfigured ? undefined : "Configura Supabase para habilitar login social"}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-black border border-slate-700 text-white text-sm font-bold font-sport shadow-lg transition-all hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FaXTwitter className="text-lg" />
                  Continuar con X
                </button>

                {!isSupabaseConfigured && (
                  <p className="text-center text-[10px] text-amber-400/80 leading-relaxed">
                    Login social deshabilitado: falta configurar Supabase (ver .env.local.example).
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
