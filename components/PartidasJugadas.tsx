"use client"

import { useEffect, useState } from "react"
import { contarPartidas } from "@/lib/supabase"
import { useT, useLocaleIntl } from "@/lib/i18n"

/**
 * Cuántas partidas se jugaron, en la portada.
 *
 * Es prueba social para el que llega —"esto lo juega gente"— y es el número que la prensa pide
 * cuando cubre un juego así: todas las notas de Copero, El Ídolo y 7a0 se apoyan en una cifra que
 * dieron los creadores. Si no se puede contar, no se dibuja nada.
 */
export default function PartidasJugadas() {
  const [partidas, setPartidas] = useState<number | null>(null)
  const t = useT()
  const localeNumero = useLocaleIntl()

  useEffect(() => {
    contarPartidas().then(setPartidas)
  }, [])

  if (!partidas) return null

  return (
    <p className="font-sport mt-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
      <span className="text-[#D4AF37]">{partidas.toLocaleString(localeNumero)}</span> {t("home.partidas", "partidas jugadas")}
    </p>
  )
}
