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
    const query = searchParams.toString()
    // Por `trackEvent` y no por `gtag` directo: la primera carga también puede llegar antes que
    // los scripts de GA, y ahí la vista se perdía igual que los eventos de montaje.
    trackEvent("page_view", {
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
      <Script id="ga-init" strategy="afterInteractive" onReady={vaciarCola}>
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

/**
 * Los eventos que se disparan ANTES de que cargue gtag.
 *
 * Medido el 17/8: `equipo_link_visto` y `carrera_link_visto` tenían CERO eventos en 28 días, con
 * la instrumentación puesta y las páginas andando. El motivo no era que nadie abriera los links:
 * los dos se disparan en el efecto de montaje de la página, los scripts de GA van
 * `afterInteractive` —o sea después de la hidratación— y `trackEvent` se iba en silencio si
 * `window.gtag` todavía no existía. Justo la métrica del circuito viral era la que no se podía
 * medir, porque es la única que se manda al entrar y no al tocar algo.
 *
 * Se guardan y se sueltan cuando aparece `gtag`, o sea después del `config` de `ga-init`: un
 * evento empujado antes del config no tiene destino y GA lo tira.
 *
 * La cola se vacía preguntando cada 200 ms y no en el `onReady` del <Script>: probado en
 * producción el 17/8, con el `onReady` solo el evento seguía sin salir. Se deja de preguntar a los
 * 10 segundos: si en diez segundos gtag no apareció, es que el visitante bloquea Analytics y los
 * eventos guardados no van a ninguna parte.
 */
const enCola: [string, Record<string, string | number | boolean>][] = []
let reloj: ReturnType<typeof setInterval> | null = null

function vaciarCola() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return
  while (enCola.length) {
    const [name, params] = enCola.shift()!
    window.gtag("event", name, params)
  }
}

function esperarAGtag() {
  if (reloj) return
  let intentos = 0
  reloj = setInterval(() => {
    intentos++
    if (typeof window.gtag === "function") {
      vaciarCola()
    } else if (intentos < 50) {
      return
    } else {
      enCola.length = 0
    }
    clearInterval(reloj!)
    reloj = null
  }, 200)
}

/** Evento propio (draft terminado, carrera finalizada, reto diario...). No hace nada sin GA. */
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (!GA_ID || typeof window === "undefined") return
  if (typeof window.gtag !== "function") {
    enCola.push([name, params])
    esperarAGtag()
    return
  }
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
  // El final que llega jugando las 15 temporadas. `carrera_retiro` es el que se va antes: son
  // dos cosas distintas y contarlas juntas era lo que hacía parecer que nadie termina.
  carreraFinalizada: "carrera_finalizada",
  fichaDescargada: "ficha_descargada",
  compartido: "compartido",
  // El link de una carrera abierto por otra persona. Es la métrica del circuito viral: si
  // `carrera_link_visto` no sube, la ficha no está circulando y lo demás no importa.
  carreraLinkVisto: "carrera_link_visto",
  carreraLinkCta: "carrera_link_cta",
  // Lo mismo para el once del draft. El link del draft llevaba a la portada, así que el que lo
  // abría no veía el equipo de nadie: 13 personas compartieron en una semana y la página que los
  // recibía tuvo 1 visita.
  equipoLinkVisto: "equipo_link_visto",
  equipoLinkCta: "equipo_link_cta",
  // Cómo elige el jugador vivir el torneo: partido a partido, media temporada o entero. Es lo
  // que decide si las tres opciones tienen sentido o si sobra alguna.
  torneoVista: "torneo_vista",
  retoDiario: "reto_diario_jugado",
  rankingVisto: "ranking_visto",
  sugerenciaEnviada: "sugerencia_enviada",
  donacionClick: "donacion_click",
} as const
