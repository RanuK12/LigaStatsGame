"use client"

import { useState } from "react"
import { trackEvent, EVENTOS } from "@/components/Analytics"
import { useEmbebido } from "@/lib/embebido"

/**
 * Compartir la página de un equipo histórico.
 *
 * Distinto de ShareBar, que comparte el resultado de una partida: acá lo que se manda es una
 * página que se lee sin jugar. "Mirá el plantel del Vélez del 94" entra en cualquier grupo de
 * WhatsApp de hinchas; "mirá mi 11" solo entra si el otro ya juega.
 *
 * Es un componente de cliente chico a propósito: la página es de servidor para que Google lea el
 * plantel en el HTML, y solo esto necesita el navegador.
 */
export default function CompartirEquipo({
  label,
  hito,
  slug,
}: {
  label: string
  hito: string | null
  slug: string
}) {
  const [copiado, setCopiado] = useState(false)
  const embebido = useEmbebido()

  const url = `https://gambetafutbol.games/equipos/${slug}/?utm_source=directo&utm_medium=social&utm_campaign=equipo`
  const texto = hito ? `${label}. ${hito}` : `El plantel completo del ${label}.`

  const compartir = async (red: "nativo" | "whatsapp" | "x") => {
    trackEvent(EVENTOS.compartido, { red, equipo: slug })

    if (red === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${texto}\n\n${url}`)}`, "_blank", "noopener,noreferrer")
      return
    }
    if (red === "x") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer",
      )
      return
    }

    // En el teléfono abre la hoja del sistema; en escritorio no existe y se copia el link.
    try {
      if (navigator.share) {
        await navigator.share({ title: label, text: texto, url })
        return
      }
      await navigator.clipboard.writeText(`${texto}\n\n${url}`)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1800)
    } catch {
      /* el usuario canceló, o el navegador no deja: no hay nada que avisar */
    }
  }

  // Igual que ShareBar: adentro del reproductor de un portal, un link a nuestro sitio es un
  // link a la versión jugable de afuera, que es lo que su reglamento no permite.
  if (embebido) return null

  const boton =
    "rounded-xl border border-white/10 px-4 py-2.5 font-sport text-[11px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:border-[#74ACDF]/40 hover:text-white"

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <h2 className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
        Pasáselo a un hincha
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => compartir("whatsapp")} className={boton}>
          WhatsApp
        </button>
        <button onClick={() => compartir("x")} className={boton}>
          X
        </button>
        <button onClick={() => compartir("nativo")} className={boton}>
          {copiado ? "¡Link copiado!" : "Copiar link"}
        </button>
      </div>
    </section>
  )
}
