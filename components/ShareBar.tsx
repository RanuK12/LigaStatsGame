"use client"

import { useState } from "react"

const SITE_URL = "https://gambetafutbol.games/"

/**
 * Barra para compartir el resultado (draft o carrera) con un texto ya armado.
 *
 * X y Facebook abren su intent web. Instagram no tiene URL de publicación, así que el botón
 * genera la imagen 1080x1920 y usa el share nativo del celular (donde aparece "Historia de
 * Instagram"); en escritorio la descarga para subirla a mano.
 */
export default function ShareBar({
  texto,
  imagen,
  className = "",
  titulo = "Compartí tu resultado",
}: {
  texto: string
  /** Devuelve la imagen para la historia (1080x1920). Sin esto, el botón de IG no aparece. */
  imagen?: () => Promise<Blob>
  className?: string
  titulo?: string
}) {
  const [estado, setEstado] = useState<"" | "generando" | "listo" | "error">("")

  const textoConLink = `${texto}\n\n🎮 ${SITE_URL}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(SITE_URL)}&hashtags=Gambeta,FutbolArgentino`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(texto)}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(textoConLink)}`

  function descargar(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gambeta-historia.png"
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function compartirHistoria() {
    if (!imagen) return
    setEstado("generando")
    let blob: Blob
    try {
      blob = await imagen()
    } catch {
      setEstado("error")
      return
    }
    // Share nativo (en el celular ofrece "Historia de Instagram"). Si el navegador lo rechaza
    // —escritorio, o el usuario cancela— igual se descarga: nunca se queda sin imagen.
    try {
      const file = new File([blob], "gambeta-historia.png", { type: "image/png" })
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
      if (nav.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: textoConLink, title: "Gambeta" })
        setEstado("listo")
        return
      }
    } catch {
      /* sin share nativo: se descarga */
    }
    descargar(blob)
    setEstado("listo")
  }

  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-widest font-sport transition-all hover:-translate-y-0.5"

  return (
    <div className={`card-gradient rounded-2xl border border-white/10 p-4 ${className}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#74ACDF] font-sport text-center">
        {titulo}
      </div>
      <p className="mt-2 text-center text-[11px] leading-snug text-slate-400 font-sans">“{texto}”</p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border-white/15 bg-black text-white hover:border-white/40`}
        >
          <span className="text-sm leading-none">𝕏</span> Postear
        </a>

        {imagen && (
          <button
            onClick={compartirHistoria}
            disabled={estado === "generando"}
            className={`${base} border-pink-400/40 bg-gradient-to-r from-fuchsia-600/25 to-orange-500/25 text-pink-200 hover:border-pink-300/70 disabled:opacity-60`}
          >
            <span className="text-sm leading-none">📸</span>
            {estado === "generando" ? "Generando..." : "Historia IG"}
          </button>
        )}

        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border-[#1877F2]/50 bg-[#1877F2]/15 text-[#9CC3F7] hover:border-[#1877F2]`}
        >
          <span className="text-sm leading-none">f</span> Facebook
        </a>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300/70`}
        >
          <span className="text-sm leading-none">💬</span> WhatsApp
        </a>
      </div>

      {estado === "listo" && (
        <p className="mt-2 text-center text-[10px] text-emerald-300 font-sport uppercase tracking-wider">
          Imagen lista: subila a tu historia
        </p>
      )}
      {estado === "error" && (
        <p className="mt-2 text-center text-[10px] text-red-300 font-sport uppercase tracking-wider">
          No se pudo generar la imagen
        </p>
      )}
    </div>
  )
}
