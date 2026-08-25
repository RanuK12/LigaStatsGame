"use client"

import { useEffect, useRef, useState } from "react"
import { AD_CLIENT, AD_SLOT_CONTENIDO } from "@/lib/ads"
import { estaEmbebido } from "@/lib/embebido"

/**
 * Un bloque de publicidad de display, para las páginas que se LEEN.
 *
 * Dónde va y dónde no:
 *
 * - **Sí**: equipos, datos, cómo jugar, ranking. Son páginas de texto, con scroll, donde un
 *   bloque al final no le pisa nada a nadie.
 * - **No**: el draft, la carrera, el modo DT, el reto diario y la portada. Ahí el jugador está
 *   jugando; ahí van los formatos que él elige (el recompensado) o los que caen entre partidas.
 *
 * Va siempre DESPUÉS del contenido y rotulado. Un bloque sin rótulo arriba del contenido sube el
 * clic un rato y baja todo lo demás para siempre; además AdSense prohíbe que un aviso se pueda
 * confundir con el sitio.
 *
 * Sin cliente o sin bloque configurado no dibuja nada: ni el rótulo ni el hueco.
 */
export default function AdSlot({ etiqueta = "contenido" }: { etiqueta?: string }) {
  const [visible, setVisible] = useState(false)
  const ins = useRef<HTMLModElement | null>(null)
  const pedido = useRef(false)

  useEffect(() => {
    if (!AD_CLIENT || !AD_SLOT_CONTENIDO) return
    if (estaEmbebido(window)) return
    setVisible(true)
  }, [])

  useEffect(() => {
    // El push tiene que salir una sola vez por elemento: en desarrollo React monta dos veces y
    // AdSense contesta "already have ads in them" al segundo intento.
    if (!visible || pedido.current || !ins.current) return
    pedido.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* bloqueador de anuncios: la página sigue igual */
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="mx-auto my-8 w-full max-w-3xl px-4" data-ad-ubicacion={etiqueta}>
      <div className="mb-1 text-center font-sport text-[10px] uppercase tracking-widest text-slate-600">
        Publicidad
      </div>
      <ins
        ref={ins}
        className="adsbygoogle block"
        style={{ display: "block", minHeight: 100 }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT_CONTENIDO}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
