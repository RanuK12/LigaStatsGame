"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect } from "react"
import { LOCALES, NOMBRES, conLocale, localeDeRuta } from "@/lib/i18n"

const MEMORIA = "gambeta_idioma"

/**
 * El conmutador de idioma: ES · EN · PT.
 *
 * Cambia el segmento de la URL manteniendo la página, así que el que está en el draft en español
 * y toca EN sigue en el draft. Y recuerda la elección, porque el que ya eligió no quiere volver a
 * elegir cada vez que abre el sitio.
 *
 * La memoria NO redirige sola desde la raíz. Redirigir por `navigator.language` a alguien que
 * llegó de Google a `gambetafutbol.games` significaría mandarlo a otra URL de la que buscó, y el
 * 87 % del tráfico entra justo así. Se guarda para que el próximo link interno lo respete y para
 * que quede constancia de qué prefiere cada uno.
 */
export default function SelectorIdioma({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/"
  const actual = localeDeRuta(pathname)

  useEffect(() => {
    try {
      localStorage.setItem(MEMORIA, actual)
    } catch {
      /* sin localStorage (modo privado viejo): el selector anda igual, solo no recuerda */
    }
  }, [actual])

  return (
    <div className={`flex items-center gap-0.5 rounded-xl border border-white/10 p-0.5 ${className}`}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={conLocale(pathname, l)}
          hrefLang={NOMBRES[l].htmlLang}
          aria-current={l === actual ? "true" : undefined}
          className={`font-sport rounded-lg px-1.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
            l === actual ? "bg-[#74ACDF]/20 text-white" : "text-slate-500 hover:text-white"
          }`}
        >
          <span aria-hidden className="mr-0.5">{NOMBRES[l].bandera}</span>
          {NOMBRES[l].label}
        </Link>
      ))}
    </div>
  )
}
