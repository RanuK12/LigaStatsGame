"use client"

import { useState } from "react"
import { submitSuggestion } from "@/lib/supabase"
import { trackEvent, EVENTOS } from "@/components/Analytics"
import { useT } from "@/lib/i18n"

const TEMAS = ["Draft", "Modo carrera", "Ranking", "Un bug", "Otra cosa"]

/**
 * Caja de sugerencias del home.
 *
 * `submitSuggestion` ya existía en lib/supabase.ts y no la usaba nadie: el backend estaba hecho y
 * no había dónde escribir. Va a la tabla `suggestions` de Supabase y lo leemos solo nosotros.
 *
 * Se pide lo mínimo: el mensaje. El contacto es opcional a propósito — pedir datos corta
 * sugerencias, y lo que queremos es que la gente escriba.
 */
export default function SuggestionBox() {
  const t = useT()
  const [mensaje, setMensaje] = useState("")
  const [contacto, setContacto] = useState("")
  const [tema, setTema] = useState(TEMAS[0])
  const [estado, setEstado] = useState<"" | "enviando" | "listo" | "error">("")

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (mensaje.trim().length < 5 || estado === "enviando") return
    setEstado("enviando")
    const ok = await submitSuggestion({
      mensaje: mensaje.trim(),
      contacto: contacto.trim() || undefined,
      tema,
      pagina: typeof window !== "undefined" ? window.location.pathname : undefined,
    })
    if (ok) {
      trackEvent(EVENTOS.sugerenciaEnviada, { tema })
      setEstado("listo")
      setMensaje("")
      setContacto("")
    } else {
      setEstado("error")
    }
  }

  return (
    <section className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1728]/90 to-[#050a14]/90 p-6 sm:p-8">
        <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-70" />

        <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          {t('SuggestionBox.queLeAgregariasAl', '¿Qué le agregarías al juego?')}
        </h3>
        <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400 font-sans max-w-xl">
          Lo leemos nosotros y de acá salen las mejoras. Si encontraste algo roto, también contanos:
          es la forma más rápida de que se arregle.
        </p>

        {estado === "listo" ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-5 text-center">
            <p className="font-display text-lg font-black text-emerald-300">{t('SuggestionBox.graciasChe', '¡Gracias, che!')}</p>
            <p className="mt-1 text-[12px] text-slate-400 font-sans">{t('SuggestionBox.loVamosALeer', 'Lo vamos a leer.')}</p>
            <button
              onClick={() => setEstado("")}
              className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500 font-sport hover:text-white"
            >
              {t('SuggestionBox.escribirOtra', 'Escribir otra')}
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {TEMAS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTema(t)}
                  className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider font-sport transition-colors ${
                    tema === t
                      ? "border-[#74ACDF] bg-[#74ACDF]/15 text-white"
                      : "border-white/10 bg-slate-950/50 text-slate-400 hover:border-[#74ACDF]/40"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder={t('SuggestionBox.escribiLoQueSe', 'Escribí lo que se te ocurra...')}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[13px] text-slate-200 placeholder:text-slate-600 font-sans outline-none focus:border-[#74ACDF]/60"
            />

            <input
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              maxLength={200}
              placeholder={t('SuggestionBox.tuMailOTu', 'Tu mail o tu @ (opcional, solo si querés que te contestemos)')}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[12px] text-slate-200 placeholder:text-slate-600 font-sans outline-none focus:border-[#74ACDF]/60"
            />

            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-600 font-sport uppercase tracking-wider">
                {estado === "error" ? "No se pudo enviar. Probá de nuevo." : `${mensaje.length}/2000`}
              </p>
              <button
                type="submit"
                disabled={mensaje.trim().length < 5 || estado === "enviando"}
                className="btn-primary px-7 py-3 text-[11px] font-black uppercase tracking-widest font-sport rounded-2xl disabled:opacity-40"
              >
                {estado === "enviando" ? "Enviando" : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
