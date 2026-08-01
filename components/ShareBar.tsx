"use client"

import { useState } from "react"
import { trackEvent, EVENTOS } from "@/components/Analytics"

const SITE_URL = "https://gambetafutbol.games/"
const CUENTA_X = "GambetafutbolAR"

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
  destino,
}: {
  texto: string
  /** Devuelve la imagen para la historia (1080x1920). Sin esto, el botón de IG no aparece. */
  imagen?: () => Promise<Blob>
  className?: string
  titulo?: string
  /**
   * A dónde lleva el link. Por defecto, al home.
   *
   * Todo lo que se compartía apuntaba a la portada, así que el que abría el link no podía jugar
   * lo mismo que vos: llegaba a un draft distinto y no había con qué compararse. Pasándole el
   * reto del día acá, el link lleva al MISMO bombo y "mirá cómo me fue" se convierte en "jugá vos".
   * Es el mecanismo de Wordle.
   */
  destino?: string
}) {
  const [estado, setEstado] = useState<"" | "generando" | "listo" | "copiada" | "error">("")
  const [copiado, setCopiado] = useState(false)

  const urlBase = destino || SITE_URL

  /**
   * El link, etiquetado según a dónde va.
   *
   * Sin esto el 15 % del tráfico llegaba a Analytics como "Unassigned": WhatsApp, Instagram y las
   * apps de mensajería no mandan de dónde viene la visita, así que la sesión queda huérfana y no
   * se sabe qué red trae gente de verdad. La etiqueta la pone el botón, no la persona: nadie se
   * va a acordar de pegarla a mano.
   */
  const conEtiqueta = (red: string) => {
    try {
      const u = new URL(urlBase)
      u.searchParams.set("utm_source", red)
      u.searchParams.set("utm_medium", "social")
      u.searchParams.set("utm_campaign", destino ? "reto_diario" : "compartir")
      return u.toString()
    } catch {
      return urlBase
    }
  }

  const url = conEtiqueta("directo")
  const textoConLink = `${texto}\n\n🎮 ${url}`
  // La mención es lo que convierte un compartido en un seguidor: sin ella el tweet no lleva a
  // ninguna cuenta. Y sin hashtags: amontonados no traen a nadie y hacen ver la cuenta como marca.
  const textoX = `${texto}\n\nvía @${CUENTA_X}`
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textoX)}&url=${encodeURIComponent(conEtiqueta("x"))}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(conEtiqueta("facebook"))}&quote=${encodeURIComponent(texto)}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${texto}\n\n🎮 ${conEtiqueta("whatsapp")}`)}`

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
    trackEvent(EVENTOS.compartido, { red: "instagram" })
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

  /**
   * Compartir en X con la imagen.
   *
   * El intent de X no acepta adjuntos: solo texto y link. Un tweet con imagen rinde mucho más que
   * uno con link pelado, así que se prepara la imagen antes de abrir el compositor. En el celular
   * va por el share nativo (que sí adjunta); en escritorio se deja en el portapapeles para pegar
   * con ⌘V, y si el navegador no lo permite, se descarga. Nunca se queda sin abrir el compositor.
   */
  async function compartirEnX(e: React.MouseEvent<HTMLAnchorElement>) {
    trackEvent(EVENTOS.compartido, { red: "x" })
    if (!imagen) return // sin imagen, el link abre normal

    e.preventDefault()
    setEstado("generando")
    let blob: Blob
    try {
      blob = await imagen()
    } catch {
      setEstado("error")
      window.open(xUrl, "_blank", "noopener,noreferrer")
      return
    }

    const file = new File([blob], "gambeta.png", { type: "image/png" })
    const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
    if (nav.share && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], text: `${textoX}\n\n${conEtiqueta("historia")}`, title: "Gambeta" })
        setEstado("listo")
        return
      } catch {
        /* canceló o no se pudo: sigue por el compositor web */
      }
    }

    try {
      const CI = (window as unknown as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem
      if (CI && navigator.clipboard?.write) {
        await navigator.clipboard.write([new CI({ "image/png": blob })])
        setEstado("copiada")
      } else {
        descargar(blob)
        setEstado("listo")
      }
    } catch {
      descargar(blob)
      setEstado("listo")
    }
    window.open(xUrl, "_blank", "noopener,noreferrer")
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(textoConLink)
      trackEvent(EVENTOS.compartido, { red: "copiar" })
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sin permiso de portapapeles: el usuario tiene el texto a la vista */
    }
  }

  const base =
    "share-btn inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[11px] font-black uppercase tracking-widest font-sport"

  return (
    <div className={`panel-in relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1728]/90 to-[#050a14]/90 p-5 ${className}`}>
      {/* Banda argentina y resplandor: la barra es parte de la marca */}
      <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-80" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#74ACDF]/10 blur-3xl" />

      <div className="relative text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#74ACDF]/30 bg-[#74ACDF]/10 px-3 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#74ACDF] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#74ACDF]" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF] font-sport">{titulo}</span>
        </div>

        <p className="mx-auto mt-3 max-w-md rounded-2xl border border-white/[0.06] bg-black/25 px-4 py-3 text-[12px] leading-relaxed text-slate-300 font-sans">
          {texto}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={compartirEnX}
            className={`${base} border-white/15 bg-[#0b0b0d] text-white hover:border-white/50`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {estado === "generando" ? "Preparando" : "Postear"}
          </a>

          {imagen && (
            <button
              onClick={compartirHistoria}
              disabled={estado === "generando"}
              className={`${base} border-pink-400/40 bg-gradient-to-br from-fuchsia-600/30 via-rose-500/20 to-orange-500/25 text-pink-100 hover:border-pink-300/80 disabled:opacity-60`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0 6.999a2.838 2.838 0 1 0 0 5.676 2.838 2.838 0 0 0 0-5.676zm0-1.802a4.64 4.64 0 1 1 0 9.28 4.64 4.64 0 0 1 0-9.28zm5.884-.406a1.084 1.084 0 1 1-2.168 0 1.084 1.084 0 0 1 2.168 0z" />
              </svg>
              {estado === "generando" ? "Generando" : "Historia"}
            </button>
          )}

          <a
            href={fbUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTOS.compartido, { red: "facebook" })}
            className={`${base} border-[#1877F2]/50 bg-[#1877F2]/15 text-[#A8CBF9] hover:border-[#1877F2]`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
            </svg>
            Facebook
          </a>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent(EVENTOS.compartido, { red: "whatsapp" })}
            className={`${base} border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300/80`}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 2C6.5 2 2 6.5 2 12.05c0 1.78.47 3.45 1.28 4.9L2 22l5.2-1.24a10 10 0 0 0 4.85 1.24h.01c5.54 0 10.04-4.5 10.04-10.05C22.1 6.5 17.6 2 12.05 2z" />
            </svg>
            WhatsApp
          </a>
        </div>

        <button
          onClick={copiarLink}
          className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 font-sport transition-colors hover:text-white"
        >
          {copiado ? "✓ Copiado" : "🔗 Copiar texto y link"}
        </button>

        {estado === "listo" && (
          <p className="mt-2 text-[10px] text-emerald-300 font-sport uppercase tracking-wider">
            Imagen lista: subila a tu historia
          </p>
        )}
        {estado === "copiada" && (
          <p className="mt-2 text-[10px] text-emerald-300 font-sport uppercase tracking-wider">
            Imagen copiada: pegala en el tweet con ⌘V
          </p>
        )}
        {estado === "error" && (
          <p className="mt-2 text-[10px] text-red-300 font-sport uppercase tracking-wider">
            No se pudo generar la imagen
          </p>
        )}
      </div>
    </div>
  )
}
