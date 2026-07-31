"use client"

import { useEffect, useState } from "react"
import { sonidoActivo, setSonidoActivo, tocar } from "@/lib/sonido"

/**
 * Prender y apagar el sonido.
 *
 * Arranca apagado a propósito: un sitio que suena sin que se lo pidan es un sitio que se cierra,
 * y encima los navegadores no dejan reproducir nada antes del primer gesto del usuario. Al
 * prenderlo suena una nota, que es la única forma de saber que quedó andando.
 */
export default function BotonSonido({ className = "" }: { className?: string }) {
  const [activo, setActivo] = useState(false)
  const [montado, setMontado] = useState(false)

  // localStorage no existe en el servidor: se lee después de montar o el HTML no coincide.
  useEffect(() => {
    setActivo(sonidoActivo())
    setMontado(true)
  }, [])

  if (!montado) return null

  const alternar = () => {
    const nuevo = !activo
    setSonidoActivo(nuevo)
    setActivo(nuevo)
    if (nuevo) tocar("ficha")
  }

  return (
    <button
      onClick={alternar}
      aria-label={activo ? "Apagar el sonido" : "Prender el sonido"}
      title={activo ? "Sonido prendido" : "Sonido apagado"}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl border border-white/5 p-2.5 transition-all duration-300 hover:bg-white/5 ${
        activo ? "text-[#74ACDF]" : "text-slate-500 hover:text-white"
      } ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {activo ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <>
            <path d="M22 9l-6 6" />
            <path d="M16 9l6 6" />
          </>
        )}
      </svg>
    </button>
  )
}
