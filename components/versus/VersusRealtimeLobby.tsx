"use client"

import React, { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useUserStore } from "@/lib/user-store"
import { tocar } from "@/lib/sonido"
import { useT } from "@/lib/i18n"

export default function VersusRealtimeLobby({
  onStartMatch,
}: {
  onStartMatch: (roomCode: string, isHost: boolean, opponentName: string) => void
}) {
  const t = useT()
  const user = useUserStore((s) => s.user)
  const [roomCode, setRoomCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [inRoom, setInRoom] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [opponent, setOpponent] = useState<{ username: string; elo: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [statusText, setStatusText] = useState("Creá una sala o unite con el código de tu amigo")

  // Generate random 6 char room code
  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    setRoomCode(code)
    setIsHost(true)
    setInRoom(true)
    tocar("ficha")
  }

  const joinRoom = () => {
    if (!joinCode.trim() || joinCode.trim().length < 4) return
    const code = joinCode.trim().toUpperCase()
    setRoomCode(code)
    setIsHost(false)
    setInRoom(true)
    tocar("ficha")
  }

  // Supabase Realtime Channel Subscription
  useEffect(() => {
    if (!inRoom || !roomCode || !supabase) return

    const myName = user?.username || (isHost ? "Jugador 1" : "Jugador 2")
    const myElo = user?.elo || 1000

    const channel = supabase.channel(`versus:${roomCode}`, {
      config: { broadcast: { self: false } },
    })

    channel
      .on("broadcast", { event: "presence" }, (payload) => {
        if (payload.payload.username) {
          setOpponent({
            username: payload.payload.username,
            elo: payload.payload.elo || 1000,
          })
          setStatusText(`⚔️ ¡Rival conectado! ${payload.payload.username} se unió al duelo.`)
          tocar("legendario")
        }
      })
      .on("broadcast", { event: "start_game" }, () => {
        if (opponent) {
          onStartMatch(roomCode, isHost, opponent.username)
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Announce presence
          await channel.send({
            type: "broadcast",
            event: "presence",
            payload: { username: myName, elo: myElo },
          })
        }
      })

    return () => {
      void channel.unsubscribe()
    }
  }, [inRoom, roomCode, isHost, user, opponent, onStartMatch])

  const copyLink = () => {
    const url = `${window.location.origin}/versus?room=${roomCode}`
    void navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStartGame = () => {
    if (!opponent) return
    tocar("campeon")
    onStartMatch(roomCode, isHost, opponent.username)
  }

  return (
    <div className="card-gradient rounded-3xl p-6 border border-white/10 shadow-2xl space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <span className="badge-gold text-[10px] font-black uppercase tracking-widest px-3 py-1">
          🌐 MULTIJUGADOR 1V1 REALTIME
        </span>
        <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
          {t('VersusRealtimeLobby.salasDeDuelo', 'Salas de Duelo')} <span className="gradient-text">{t('VersusRealtimeLobby.enVivo', 'En Vivo')}</span>
        </h3>
        <p className="text-slate-400 text-xs font-sans max-w-md mx-auto">
          {t('VersusRealtimeLobby.armaTu11En', 'Armá tu 11 en tiempo real contra un amigo desde cualquier dispositivo.')}
        </p>
      </div>

      {!inRoom ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* CREAR SALA */}
          <div className="rounded-2xl bg-slate-950/60 border border-amber-500/20 p-5 text-center flex flex-col justify-between space-y-4">
            <div>
              <div className="text-3xl mb-2">🏆</div>
              <h4 className="font-display text-base font-black text-amber-400 uppercase">{t('VersusRealtimeLobby.crearSala', 'Crear Sala')}</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                {t('VersusRealtimeLobby.generaUnCodigoUnico', 'Generá un código único y compartilo con tu rival por WhatsApp o X.')}
              </p>
            </div>
            <button
              onClick={createRoom}
              className="btn-gold w-full py-2.5 rounded-xl font-sport text-xs font-black uppercase tracking-wider"
            >
              👑 CREAR SALA ONLINE
            </button>
          </div>

          {/* UNIRSE A SALA */}
          <div className="rounded-2xl bg-slate-950/60 border border-[#74ACDF]/20 p-5 text-center flex flex-col justify-between space-y-4">
            <div>
              <div className="text-3xl mb-2">⚔️</div>
              <h4 className="font-display text-base font-black text-[#74ACDF] uppercase">{t('VersusRealtimeLobby.unirseASala', 'Unirse a Sala')}</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                {t('VersusRealtimeLobby.ingresaElCodigoDe', 'Ingresá el código de 6 letras que te envió tu amigo.')}
              </p>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder={t('VersusRealtimeLobby.codigoEjGamb77', 'CÓDIGO (EJ: GAMB77)')}
                className="w-full text-center bg-slate-900 border border-slate-700 rounded-xl py-2 text-xs font-mono font-bold tracking-widest text-white uppercase"
              />
              <button
                onClick={joinRoom}
                disabled={joinCode.length < 4}
                className="btn-primary w-full py-2.5 rounded-xl font-sport text-xs font-black uppercase tracking-wider disabled:opacity-40"
              >
                🚀 UNIRSE A DUELO
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SALA ACTIVA */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5 rounded-2xl bg-slate-950/80 border border-[#74ACDF]/30 p-5"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-sport font-bold text-slate-400 uppercase tracking-wider">
                {t('VersusRealtimeLobby.codigoDeSala', 'CÓDIGO DE SALA')}
              </span>
              <div className="font-mono text-2xl font-black text-[#74ACDF] tracking-widest">
                {roomCode}
              </div>
            </div>
            <button
              onClick={copyLink}
              className="btn-secondary px-4 py-2 text-[10px] font-sport font-bold uppercase tracking-wider rounded-xl"
            >
              {copied ? "✅ COPIADO" : "📋 COPIAR LINK"}
            </button>
          </div>

          {/* JUGADORES EN SALA */}
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-900/60 p-3 border border-emerald-500/30">
              <span className="text-[9px] font-sport text-emerald-400 font-bold block uppercase">
                {isHost ? "ANFITRIÓN (VOS)" : "ANFITRIÓN"}
              </span>
              <span className="font-bold text-sm text-white truncate block mt-0.5">
                {isHost ? user?.username || "Jugador 1" : opponent?.username || "Cargando..."}
              </span>
            </div>

            <div className="rounded-xl bg-slate-900/60 p-3 border border-amber-500/30">
              <span className="text-[9px] font-sport text-amber-400 font-bold block uppercase">
                {!isHost ? "INVITADO (VOS)" : "RIVAL"}
              </span>
              <span className="font-bold text-sm text-white truncate block mt-0.5">
                {!isHost
                  ? user?.username || "Jugador 2"
                  : opponent
                  ? opponent.username
                  : "⏳ ESPERANDO RIVAL..."}
              </span>
            </div>
          </div>

          <p className="text-center text-xs font-sport text-amber-300 animate-pulse">
            {statusText}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setInRoom(false)
                setOpponent(null)
              }}
              className="w-1/3 py-2.5 rounded-xl border border-red-500/30 text-red-400 font-sport text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/10 transition-colors"
            >
              {t('VersusRealtimeLobby.salirDeSala', 'SALIR DE SALA')}
            </button>
            <button
              onClick={handleStartGame}
              disabled={!opponent}
              className="w-2/3 btn-gold py-2.5 rounded-xl font-sport text-xs font-black uppercase tracking-wider disabled:opacity-40"
            >
              ⚔️ INICIAR DUELO ONLINE
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
