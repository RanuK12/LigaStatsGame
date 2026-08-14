"use client"

import { useEffect } from "react"

/**
 * Corrige el `lang` del documento en las versiones traducidas.
 *
 * El `<html lang="es-AR">` lo escribe el layout raíz y desde un layout anidado no se puede tocar
 * esa etiqueta. Importa más de lo que parece: el lector de pantalla elige la voz por ahí, y el
 * navegador ofrece traducir una página que dice ser española cuando ya está en inglés.
 */
export default function LangDelDocumento({ lang }: { lang: string }) {
  useEffect(() => {
    const anterior = document.documentElement.lang
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = anterior
    }
  }, [lang])

  return null
}
