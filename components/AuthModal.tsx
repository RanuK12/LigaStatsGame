"use client"
import { useState, useEffect } from "react"
import { FcGoogle } from "react-icons/fc"
import { FaXTwitter } from "react-icons/fa6"
import { useUserStore } from "@/lib/user-store"
import { signInWithProvider, signUpWithEmail, signInWithEmail, isSupabaseConfigured } from "@/lib/auth"
import { nombreEnUso } from "@/lib/supabase"
import { useT } from "@/lib/i18n"

type Tab = "guest" | "account"

export default function AuthModal() {
  const t = useT()
  const { isAuthModalOpen, closeAuthModal, loginGuest } = useUserStore()
  const [tab, setTab] = useState<Tab>("account")
  const [mode, setMode] = useState<"signup" | "login">("signup")

  const [usernameInput, setUsernameInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  // Close on ESC while the modal is open.
  useEffect(() => {
    if (!isAuthModalOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAuthModal()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isAuthModalOpen, closeAuthModal])

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nombre = usernameInput.trim()
    if (!nombre) return
    // Dos personas con el mismo nombre son, en la tabla, la misma persona. Si el nombre ya está
    // tomado se pide otro, y de paso es el momento exacto para ofrecer la cuenta: registrarse es
    // lo único que te reserva el nombre.
    setBusy(true)
    const tomado = await nombreEnUso(nombre)
    setBusy(false)
    if (tomado) {
      setFeedback({
        ok: false,
        text: `"${nombre}" ya lo está usando otro DT. Elegí otro, o creá una cuenta y te lo quedás.`,
      })
      return
    }
    loginGuest(nombre)
  }

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim() || !passwordInput) return
    setBusy(true)
    setFeedback(null)
    const res =
      mode === "signup"
        ? await signUpWithEmail(emailInput.trim(), passwordInput, usernameInput.trim() || emailInput.split("@")[0])
        : await signInWithEmail(emailInput.trim(), passwordInput)
    setBusy(false)
    setFeedback({ ok: res.ok, text: res.message })
    // On a successful login with an active session, the Header's auth listener
    // hydrates the store and we can close. Sign-ups may need email confirmation.
    if (res.ok && mode === "login") setTimeout(closeAuthModal, 600)
  }

  const disabled = !isSupabaseConfigured

  if (!isAuthModalOpen) return null

  return (
    <div
      onClick={closeAuthModal}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer overflow-y-auto animate-[fadeIn_0.15s_ease-out]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#74ACDF]/30 shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-y-auto max-h-[90vh] cursor-default bg-gradient-to-b from-[#0c1526] to-[#060b16] animate-[popIn_0.18s_ease-out]"
      >
            <button
              onClick={closeAuthModal}
              aria-label={t('AuthModal.cerrar', 'Cerrar')}
              className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white text-lg w-8 h-8 rounded-full flex items-center justify-center bg-slate-900/80 border border-slate-800"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
                {t('AuthModal.perfilCompetitivo', 'PERFIL COMPETITIVO')}
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {t('AuthModal.ingresarAlGame', 'INGRESAR AL GAME')}
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                {t('AuthModal.registrateParaGuardarTu', 'Registrate para guardar tu progreso, figurar en la Tabla de Líderes y sumar ELO.')}
              </p>
            </div>

            {/* Selector de modo */}
            <div className="flex gap-2 mb-6 font-sport">
              <button
                onClick={() => { setTab("account"); setFeedback(null) }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === "account" ? "bg-[#74ACDF] text-white shadow-md shadow-[#74ACDF]/20" : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                {t('AuthModal.cuenta', 'Cuenta')}
              </button>
              <button
                onClick={() => { setTab("guest"); setFeedback(null) }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === "guest" ? "bg-[#74ACDF] text-white shadow-md shadow-[#74ACDF]/20" : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                {t('AuthModal.invitado', 'Invitado')}
              </button>
            </div>

            {tab === "guest" && (
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 font-sport">
                    {t('AuthModal.nombreOApodoDe', 'Nombre o Apodo de Director Técnico')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('AuthModal.ejScaloniDtEl', 'Ej: Scaloni_DT, El_Romi_10, Marcelo')}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="input-dark"
                  />
                </div>
                {feedback && !feedback.ok && (
                  <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-200">
                    {feedback.text}{" "}
                    <button type="button" onClick={() => { setTab("account"); setFeedback(null) }} className="font-bold underline">
                      {t('AuthModal.crearCuenta', 'Crear cuenta')}
                    </button>
                  </p>
                )}
                <div className="card-glass rounded-xl p-3 flex items-center gap-3 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-lg">⚡</div>
                  <div className="text-xs">
                    <div className="font-bold text-white">{t('AuthModal.ratingInicial1000Elo', 'Rating Inicial: 1000 ELO')}</div>
                    <div className="text-[10px] text-slate-400">{t('AuthModal.jugasAlToqueSin', 'Jugás al toque, sin registro. El progreso queda en este dispositivo.')}</div>
                  </div>
                </div>
                {/* Lo que se pierde sin cuenta, dicho de frente: es más honesto y convierte mejor
                    que esconderlo hasta que el jugador se choca con el límite. */}
                <div className="rounded-xl border border-[#74ACDF]/20 bg-[#74ACDF]/5 p-3 text-[10px] leading-relaxed text-slate-400">
                  {t('AuthModal.comoInvitadoNoEntras', 'Como invitado no entrás al')} <strong className="text-slate-200">{t('AuthModal.rankingGlobal', 'ranking global')}</strong>, no guardás la
                  plaza a la <strong className="text-slate-200">{t('AuthModal.libertadores', 'Libertadores')}</strong> ni a la Sudamericana, y el nombre
                  no queda reservado. Con cuenta, sí.
                </div>
                <button type="submit" disabled={busy} className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg mt-2 disabled:opacity-50">
                  {busy ? "VERIFICANDO..." : "INGRESAR COMO DT"}
                </button>
              </form>
            )}

            {tab === "account" && (
              <div className="space-y-4">
                {/* OAuth */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => signInWithProvider("google")}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-white text-slate-900 text-sm font-bold font-sport shadow-lg transition-all hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FcGoogle className="text-xl" /> {t('AuthModal.continuarConGoogle', 'Continuar con Google')}
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => signInWithProvider("twitter")}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-black border border-slate-700 text-white text-sm font-bold font-sport shadow-lg transition-all hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FaXTwitter className="text-lg" /> {t('AuthModal.continuarConX', 'Continuar con X')}
                  </button>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-sport uppercase tracking-wider">
                  <span className="flex-1 h-px bg-white/10" /> {t('AuthModal.oConTuEmail', 'o con tu email')} <span className="flex-1 h-px bg-white/10" />
                </div>

                {/* Email / password */}
                <form onSubmit={handleAccountSubmit} className="space-y-3">
                  {mode === "signup" && (
                    <input
                      type="text"
                      placeholder={t('AuthModal.nombreDeUsuario', 'Nombre de usuario')}
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="input-dark"
                    />
                  )}
                  <input
                    type="email"
                    required
                    placeholder={t('AuthModal.tuemailEjemploCom', 'tuemail@ejemplo.com')}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="input-dark"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder={t('AuthModal.contrasenaMin6', 'Contraseña (mín. 6)')}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="input-dark"
                  />

                  {feedback && (
                    <p className={`text-xs leading-relaxed ${feedback.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {feedback.text}
                    </p>
                  )}
                  {disabled && (
                    <p className="text-[10px] text-amber-400/80 leading-relaxed">
                      {t('AuthModal.lasCuentasSeHabilitan', 'Las cuentas se habilitan cuando Supabase esté configurado. Mientras tanto podés jugar como Invitado.')}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={disabled || busy}
                    className="btn-primary w-full py-3.5 text-xs font-bold tracking-widest uppercase font-sport rounded-2xl shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {busy ? "..." : mode === "signup" ? "CREAR CUENTA" : "INICIAR SESIÓN"}
                  </button>
                </form>

                <button
                  onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setFeedback(null) }}
                  className="w-full text-center text-[11px] text-slate-400 hover:text-white font-sport transition-colors"
                >
                  {mode === "signup" ? "¿Ya tenés cuenta? Iniciá sesión" : "¿No tenés cuenta? Registrate"}
                </button>
              </div>
            )}
          </div>
      </div>
  )
}
