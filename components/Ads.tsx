"use client"

import Script from "next/script"
import { useEffect, useState } from "react"
import { AD_CLIENT, FRECUENCIA_INTERSTICIALES } from "@/lib/ads"
import { estaEmbebido } from "@/lib/embebido"

/**
 * El cargador de AdSense. Va una sola vez, en el layout.
 *
 * Se decide DESPUÉS del montaje si se carga o no, porque la respuesta depende de si estamos
 * adentro del reproductor de un portal —y eso solo se sabe en el navegador—. Adentro de un
 * portal no se carga: su reglamento no permite que el juego traiga publicidad propia.
 *
 * El fragmento que define `adBreak` y `adConfig` es el oficial de la Ad Placement API: las dos
 * funciones empujan al mismo arreglo `adsbygoogle`, así que una llamada hecha antes de que baje
 * el script del cargador no se pierde, queda en la cola.
 *
 * Sin `NEXT_PUBLIC_ADSENSE_CLIENT` esto devuelve null y el sitio queda exactamente como estaba.
 */
export default function Ads() {
  const [cargar, setCargar] = useState(false)

  useEffect(() => {
    if (AD_CLIENT && !estaEmbebido(window)) setCargar(true)
  }, [])

  if (!cargar) return null

  return (
    <>
      <Script id="ads-init" strategy="afterInteractive">
        {`
          window.adsbygoogle = window.adsbygoogle || [];
          window.adBreak = window.adConfig = function(o) { window.adsbygoogle.push(o); };
          window.adConfig({ preloadAdBreaks: 'on' });
        `}
      </Script>
      <Script
        id="ads-adsense"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        data-ad-frequency-hint={FRECUENCIA_INTERSTICIALES}
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`}
      />
    </>
  )
}
