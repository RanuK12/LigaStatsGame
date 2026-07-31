"use client"
// El mazo de datos curiosos: qué sale, cuántas tiradas quedan y qué ya viste.
//
// El mazo lo arma scripts/data/build-curiosidades.mjs en el build. Acá solo se reparte.

import datos from '@/data/derived/curiosidades.json'
import { localYmd } from './daily-challenge'
import { completadoHoy } from './daily-progress'

export type Rareza = 'comun' | 'insolito' | 'leyenda'

export interface Curiosidad {
  id: string
  origen: 'derivado' | 'curado'
  rareza: Rareza
  texto: string
  clubId?: string
  squadId?: string
  playerId?: string
  temporada?: string
  fuentes?: string[]
}

export interface Efemeride {
  anio: number
  clubId: string
  squadId: string
  texto: string
  label: string
}

const MAZO = (datos as { mazo: Curiosidad[] }).mazo
const EFEMERIDES = (datos as unknown as { efemerides: Efemeride[] }).efemerides

/** Tiradas del día. Tres gratis, y una cuarta si completaste el reto diario. */
export const TIRADAS_BASE = 3
export const TIRADA_EXTRA_POR_RETO = 1

const KEY = 'gambeta_datos_v1'

interface Estado {
  dia: string
  tiradas: number
  vistos: string[]
}

function leer(): Estado {
  const vacio: Estado = { dia: localYmd(), tiradas: 0, vistos: [] }
  if (typeof window === 'undefined') return vacio
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return vacio
    const e = JSON.parse(raw) as Estado
    // Las tiradas se renuevan cada día; lo que ya viste NO, para que el mazo se sienta una
    // colección y no una bolsa que se vacía y se llena sola.
    if (e.dia !== vacio.dia) return { dia: vacio.dia, tiradas: 0, vistos: e.vistos || [] }
    return { dia: e.dia, tiradas: e.tiradas || 0, vistos: e.vistos || [] }
  } catch {
    return vacio
  }
}

function guardar(e: Estado) {
  try {
    localStorage.setItem(KEY, JSON.stringify(e))
  } catch {
    /* modo privado: se juega igual, sin memoria */
  }
}

export function tiradasDisponibles(): number {
  const e = leer()
  const tope = TIRADAS_BASE + (completadoHoy() ? TIRADA_EXTRA_POR_RETO : 0)
  return Math.max(0, tope - e.tiradas)
}

export function totalDelMazo(): number {
  return MAZO.length
}

export function vistos(): number {
  return leer().vistos.length
}

/**
 * Tira el dado.
 *
 * No repite hasta agotar el mazo: es el mismo criterio que el bombo del draft, y es lo que hace
 * que quieras volver a tirar. Devuelve null si no quedan tiradas.
 */
export function tirar(): Curiosidad | null {
  const e = leer()
  const tope = TIRADAS_BASE + (completadoHoy() ? TIRADA_EXTRA_POR_RETO : 0)
  if (e.tiradas >= tope) return null

  const noVistos = MAZO.filter((c) => !e.vistos.includes(c.id))
  const bolsa = noVistos.length > 0 ? noVistos : MAZO
  // Si el mazo se agotó, se empieza de nuevo pero sin perder el conteo de la colección.
  const elegido = bolsa[Math.floor(Math.random() * bolsa.length)]

  guardar({
    dia: e.dia,
    tiradas: e.tiradas + 1,
    vistos: e.vistos.includes(elegido.id) ? e.vistos : [...e.vistos, elegido.id],
  })
  return elegido
}

/** La efeméride del año en curso menos N: "hace tantos años". */
export function efemerideDelDia(hoy: Date = new Date()): (Efemeride & { hace: number }) | null {
  if (EFEMERIDES.length === 0) return null
  const anioActual = hoy.getFullYear()
  // Determinística por día: el mismo día del año muestra la misma, para que sea "la de hoy" y no
  // una ruleta que cambia si recargás.
  const diaDelAnio = Math.floor((hoy.getTime() - new Date(anioActual, 0, 0).getTime()) / 86400000)
  const e = EFEMERIDES[diaDelAnio % EFEMERIDES.length]
  return { ...e, hace: anioActual - e.anio }
}

export const ESTILO_RAREZA: Record<Rareza, { label: string; color: string; borde: string; fondo: string }> = {
  comun: { label: 'Dato', color: '#9CCBF0', borde: 'rgba(148,163,184,0.28)', fondo: 'rgba(2,8,19,0.6)' },
  insolito: { label: 'Insólito', color: '#74ACDF', borde: 'rgba(116,172,223,0.45)', fondo: 'rgba(116,172,223,0.07)' },
  leyenda: { label: 'Leyenda', color: '#F6C750', borde: 'rgba(246,199,80,0.5)', fondo: 'rgba(246,199,80,0.08)' },
}
