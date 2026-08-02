import { describe, it, expect } from 'vitest'
import equipos from '@/data/derived/equipos.json'
import squadsData from '@/data/squads.json'

/**
 * Las páginas de equipos existen por SEO: son 36 de las 48 URLs del sitio y responden a lo que la
 * gente busca de verdad ("Vélez 1994 plantel"), contra la home, que responde a "juego de fútbol
 * argentino", que no lo busca nadie.
 *
 * Lo que se protege acá es que sigan siendo páginas con contenido: una página de equipo sin
 * plantel es una página vacía, y Google las castiga más de lo que ayuda tenerlas.
 */
const squads = (Array.isArray(squadsData) ? squadsData : (squadsData as { squads: unknown[] }).squads) as {
  id: string
  historico?: boolean
}[]

describe('las páginas de equipos históricos', () => {
  it('hay una por cada plantel histórico del dataset', () => {
    const historicos = squads.filter((s) => s.historico).map((s) => s.id)
    expect(equipos).toHaveLength(historicos.length)
    for (const id of historicos) {
      expect(equipos.some((e) => e.slug === id), `falta la página de ${id}`).toBe(true)
    }
  })

  it('ninguna queda vacía: todas tienen al menos once jugadores', () => {
    for (const e of equipos) {
      expect(e.plantel.length, `${e.slug} tiene ${e.plantel.length} jugadores`).toBeGreaterThanOrEqual(11)
    }
  })

  it('todas tienen lo que va en el título y en la descripción de Google', () => {
    for (const e of equipos) {
      expect(e.club, `${e.slug} sin club`).toBeTruthy()
      expect(e.season, `${e.slug} sin temporada`).toBeTruthy()
      expect(e.label, `${e.slug} sin nombre`).toBeTruthy()
    }
  })

  it('los slugs son únicos y sirven como URL', () => {
    const vistos = new Set<string>()
    for (const e of equipos) {
      expect(vistos.has(e.slug), `slug repetido: ${e.slug}`).toBe(false)
      vistos.add(e.slug)
      // Sin mayúsculas, espacios ni acentos: lo que se puede pegar en un chat sin que se rompa.
      expect(e.slug).toMatch(/^[a-z0-9-]+$/)
    }
  })

  it('cada jugador del plantel tiene nombre y puesto, que es lo que se muestra', () => {
    for (const e of equipos) {
      for (const p of e.plantel) {
        expect(p.name, `${e.slug} tiene un jugador sin nombre`).toBeTruthy()
        expect(p.position, `${p.name} en ${e.slug} sin puesto`).toBeTruthy()
      }
    }
  })

  it('el plantel arranca por el arquero, no por el goleador', () => {
    // Una formación se lee de atrás para adelante. Ordenar por rating pone al nueve arriba y no
    // se parece a cómo un hincha mira un plantel.
    const conArquero = equipos.filter((e) => e.plantel.some((p) => p.position === 'GK'))
    expect(conArquero.length).toBeGreaterThan(0)
    for (const e of conArquero) {
      expect(e.plantel[0].position, `${e.slug} no empieza por el arquero`).toBe('GK')
    }
  })

  it('la figura es el mejor del plantel', () => {
    for (const e of equipos) {
      const tope = Math.max(...e.plantel.map((p) => p.rating ?? 0))
      expect(e.figura?.rating, `${e.slug}`).toBe(tope)
    }
  })
})
