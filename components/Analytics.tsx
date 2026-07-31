"use client"

import Script from "next/script"
import { Suspense, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ""

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Google Analytics 4.
 *
 * El sitio es un export estático con navegación del lado del cliente: gtag solo cuenta la
 * primera carga, así que cada cambio de ruta dispara su propio page_view a mano. Sin
 * NEXT_PUBLIC_GA_ID no se carga nada (ni un byte de script), igual que el resto de las
 * integraciones del proyecto.
 */
function PageViews() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") return
    const query = searchParams.toString()
    window.gtag("event", "page_view", {
      page_path: query ? `${pathname}?${query}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [pathname, searchParams])

  return null
}

export default function Analytics() {
  if (!GA_ID) return null

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          // send_page_view false: los page_view los manda PageViews en cada cambio de ruta,
          // si no la primera carga se contaría dos veces.
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  )
}

/** Evento propio (draft terminado, carrera finalizada, reto diario...). No hace nada sin GA. */
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!GA_ID || typeof window === "undefined" || typeof window.gtag !== "function") return
  window.gtag("event", name, params)
}

/**
 * Los momentos del juego que queremos medir, en un solo lugar.
 *
 * Sin esto Analytics solo veía page_view y scroll: 640 usuarios en 28 días y ni un dato de
 * cuántos terminan un draft, juegan una carrera o comparten algo. Los nombres van en español
 * porque es como se leen después en los informes.
 *
 * Los que marcamos como evento clave en GA: draft_completado, carrera_retiro, compartido y
 * donacion_click.
 */
export const EVENTOS = {
  draftIniciado: "draft_iniciado",
  draftCompletado: "draft_completado",
  torneoSimulado: "torneo_simulado",
  carreraIniciada: "carrera_iniciada",
  carreraTemporada: "carrera_temporada_fin",
  carreraRetiro: "carrera_retiro",
  fichaDescargada: "ficha_descargada",
  compartido: "compartido",
  retoDiario: "reto_diario_jugado",
  rankingVisto: "ranking_visto",
  sugerenciaEnviada: "sugerencia_enviada",
  donacionClick: "donacion_click",
} as const
