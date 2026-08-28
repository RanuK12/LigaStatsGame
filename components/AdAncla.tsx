"use client"

import { useEffect, useRef, useState } from "react"
import { AD_CLIENT, AD_SLOT_ANCLA } from "@/lib/ads"
import { estaEmbebido } from "@/lib/embebido"

/** Una vez cerrado, no vuelve en toda la sesión. Es lo que lo hace soportable. */
const CERRADO = "gambeta_ancla_cerrada"

/**
 * El cartelito anclado abajo, el que tiene medio internet.
 *
 * Es el formato que más rinde por visita en una página que se lee, porque se ve todo el rato sin
 * comerle lugar al texto. Y es también el que peor fama tiene, así que acá va con tres frenos:
 *
 * 1. **Solo en las páginas que se leen.** Nunca en el draft, la carrera, el DT, el reto ni la
 *    portada: en una pantalla de juego un cartel fijo abajo tapa botones.
 * 2. **Se cierra con una cruz** y no vuelve hasta que se cierre la pestaña. Un aviso que no se
 *    puede sacar es el que hace que la gente no vuelva.
 * 3. **Nunca adentro del reproductor de un portal**, igual que el resto.
 *
 * Sin `NEXT_PUBLIC_ADSENSE_SLOT_ANCLA` no se dibuja: es opcional y se puede apagar sin tocar
 * código, borrando el secreto.
 */
export default function AdAncla() {
  const [visible, setVisible] = useState(false)
  const ins = useRef<HTMLModElement | null>(null)
  const pedido = useRef(false)

  useEffect(() => {
    if (!AD_CLIENT || !AD_SLOT_ANCLA) return
    if (estaEmbebido(window)) return
    try {
      if (sessionStorage.getItem(CERRADO)) return
    } catch {
      /* sin sessionStorage se muestra igual */
    }
    setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible || pedido.current || !ins.current) return
    pedido.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* bloqueador de anuncios */
    }
  }, [visible])

  const cerrar = () => {
    try {
      sessionStorage.setItem(CERRADO, "1")
    } catch {
      /* da igual: se cierra para esta vista */
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* El hueco que deja el cartel fijo. Sin esto tapa lo último de la página, que en varias
          es justo el link para volver al inicio. */}
      <div aria-hidden className="h-[70px]" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#020813]/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-3xl items-center justify-center px-2 py-1">
        <button
          onClick={cerrar}
          aria-label="Cerrar publicidad"
          className="absolute right-1 top-1 z-10 rounded-full bg-slate-900/90 px-2 py-0.5 font-sport text-[11px] font-bold text-slate-400 hover:text-white"
        >
          ✕
        </button>
        <ins
          ref={ins}
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight: 50, maxHeight: 100 }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOT_ANCLA}
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
        </div>
      </div>
    </>
  )
}
