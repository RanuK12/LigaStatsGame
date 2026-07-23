"use client"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/lib/user-store"

export default function UserProfileModal() {
  const { user, isProfileModalOpen, closeProfileModal, logout } = useUserStore()

  if (!isProfileModalOpen || !user) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="card-gradient rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#74ACDF]/30 shadow-[0_0_50px_rgba(116,172,223,0.15)] relative overflow-hidden text-center"
        >
          <button
            onClick={closeProfileModal}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/60 border border-slate-800"
          >
            ✕
          </button>

          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#74ACDF] to-blue-600 border-2 border-white/20 flex items-center justify-center text-3xl font-black text-white font-display mb-4 shadow-lg">
            {user.username.slice(0, 2).toUpperCase()}
          </div>

          <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            {user.username}
          </h3>
          <p className="text-slate-400 text-xs font-sport uppercase tracking-wider mt-0.5">
            {user.elo >= 1200 ? "⭐ DIRECTOR TÉCNICO ÉLITE" : "⚡ DIRECTOR TÉCNICO EN PROGRESO"}
          </p>

          <div className="grid grid-cols-3 gap-3 my-6">
            <div className="card-glass p-3 rounded-2xl border border-white/5">
              <div className="text-xl font-black text-[#74ACDF] font-display">{user.elo}</div>
              <div className="text-[9px] text-slate-400 uppercase font-sport tracking-wider mt-0.5">Rating ELO</div>
            </div>
            <div className="card-glass p-3 rounded-2xl border border-white/5">
              <div className="text-xl font-black text-amber-400 font-display">🏆 {user.titles}</div>
              <div className="text-[9px] text-slate-400 uppercase font-sport tracking-wider mt-0.5">Títulos</div>
            </div>
            <div className="card-glass p-3 rounded-2xl border border-white/5">
              <div className="text-xl font-black text-emerald-400 font-display">{user.draftsCompleted}</div>
              <div className="text-[9px] text-slate-400 uppercase font-sport tracking-wider mt-0.5">Drafts</div>
            </div>
          </div>

          <button
            onClick={() => {
              logout()
              closeProfileModal()
            }}
            className="w-full py-3 bg-red-600/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-bold font-sport uppercase tracking-wider hover:bg-red-600/30 transition-colors"
          >
            Cerrar Sesión
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
