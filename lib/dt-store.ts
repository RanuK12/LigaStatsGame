"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, Squad } from './types'
import { formations, simulateSeasonWithStats, simulateCopaWithStats, calculateFullTeamScore } from './game-engine'
import {
  fuerzaDeClub,
  ligaParaSimular,
  jugadoresParaSimular,
  rivalesParaSimular,
  onceIdeal,
  objetivoDeTemporada,
  presupuestoDe,
  mercadoDePases,
  evaluar,
  clubesQueTeLlaman,
  resumenDeTemporada,
  resumenDeCopa,
  iniciarDT,
  MAX_TEMPORADAS_DT,
  type ClubDT,
  type DTState,
  type Movimiento,
  type TemporadaDT,
  type EvaluacionDT,
  type OfertaTrabajo,
} from './dt-engine'

/**
 * El estado del modo DT y su bucle, para la pantalla.
 *
 * Las decisiones del juego viven en `dt-engine`, que está probado con 312 carreras completas.
 * Acá solo se ordena el turno: preparar el mercado, resolverlo, jugar y guardar.
 *
 * Los datos pesados —jugadores y planteles— NO se importan: llegan por parámetro desde la
 * página, que los pide con `usePlayersCore` y `useSquads`. Meterlos acá pondría 2,4 MB de
 * players.json en el bundle, que es justo lo que se sacó de la portada y del draft.
 */

/** El resultado de la temporada que se le muestra al jugador antes de seguir. */
export interface RevelacionDT {
  temporada: TemporadaDT
  evaluacion: EvaluacionDT
  tabla: { name: string; pts: number; w: number; d: number; l: number; gf: number; ga: number }[]
  ofertas: OfertaTrabajo[]
}

interface DTStore {
  estado: DTState | null
  /** Lo que hay sobre la mesa este año. Se arma al entrar a la temporada. */
  mercado: Movimiento[]
  /** Lo que el jugador aceptó del mercado, para poder mostrarlo y deshacerlo. */
  aceptados: string[]
  caja: number
  revelacion: RevelacionDT | null
  simulando: boolean

  empezar: (o: { nombre: string; clubId: string; squads: Squad[]; players: Player[] }) => void
  prepararMercado: (players: Player[]) => void
  alternarMovimiento: (jugadorId: string, players: Player[]) => void
  jugarTemporada: (o: { squads: Squad[]; players: Player[] }) => void
  cerrarRevelacion: () => void
  aceptarOferta: (clubId: string, o: { squads: Squad[]; players: Player[] }) => void
  retirarse: () => void
  reiniciar: () => void
}

/* ── Helpers que necesitan los datos, y por eso no viven en el motor ──────── */

/** Los clubes jugables: los que tienen plantel de la temporada en curso. */
export function clubesDeLaLiga(squads: Squad[], players: Player[]): ClubDT[] {
  return ligaDeSquads(squads).map((s) => ({
    id: s.clubId,
    nombre: s.label.replace(/ \d{4}$/, ''),
    fuerza: fuerzaDeClub(s, players),
  }))
}

/** La Liga Profesional de la última temporada que haya en la base. */
export function ligaDeSquads(squads: Squad[]): Squad[] {
  const temporadas = squads.map((s) => s.season).filter(Boolean).sort()
  const ultima = temporadas[temporadas.length - 1]
  return squads.filter((s) => s.season === ultima && s.playerIds.length >= 11)
}

const semillaNueva = () => Math.floor(Math.random() * 1_000_000_000)

export const useDTStore = create<DTStore>()(
  persist(
    (set, get) => ({
      estado: null,
      mercado: [],
      aceptados: [],
      caja: 0,
      revelacion: null,
      simulando: false,

      empezar: ({ nombre, clubId, squads, players }) => {
        const liga = ligaDeSquads(squads)
        const clubes = clubesDeLaLiga(squads, players)
        const club = clubes.find((c) => c.id === clubId)
        const squad = liga.find((s) => s.clubId === clubId)
        if (!club || !squad) return
        set({
          estado: iniciarDT({
            nombre,
            club,
            rivales: clubes.filter((c) => c.id !== clubId),
            plantel: [...squad.playerIds],
            anio: new Date().getFullYear(),
            semilla: semillaNueva(),
          }),
          mercado: [],
          aceptados: [],
          caja: 0,
          revelacion: null,
        })
        get().prepararMercado(players)
      },

      prepararMercado: (players) => {
        const e = get().estado
        if (!e) return
        const porId = new Map(players.map((p) => [p.id, p]))
        const plantel = e.plantel.map((id) => porId.get(id)).filter(Boolean) as Player[]
        // La semilla mezcla la temporada: si no, el mercado sería el mismo todos los años.
        const rng = makeRngLocal(e.semilla + e.temporada * 7919)
        set({
          mercado: mercadoDePases(plantel, players, e.presupuesto, rng),
          aceptados: [],
          caja: e.presupuesto,
        })
      },

      alternarMovimiento: (jugadorId) => {
        const { mercado, aceptados, caja, estado } = get()
        if (!estado) return
        const m = mercado.find((x) => x.jugadorId === jugadorId)
        if (!m) return
        const yaEsta = aceptados.includes(jugadorId)

        if (yaEsta) {
          set({
            aceptados: aceptados.filter((x) => x !== jugadorId),
            caja: Math.round((caja + (m.tipo === 'compra' ? m.precio : -m.precio)) * 10) / 10,
          })
          return
        }
        // Una compra que no se puede pagar no entra: el presupuesto es el límite del turno.
        if (m.tipo === 'compra' && m.precio > caja) return
        set({
          aceptados: [...aceptados, jugadorId],
          caja: Math.round((caja + (m.tipo === 'compra' ? -m.precio : m.precio)) * 10) / 10,
        })
      },

      jugarTemporada: ({ squads, players }) => {
        const { estado: e, mercado, aceptados } = get()
        if (!e || get().simulando) return
        set({ simulando: true })

        const liga = ligaParaSimular(ligaDeSquads(squads), players)
        const pSim = jugadoresParaSimular(liga, players)
        const clubes = clubesDeLaLiga(squads, players)
        const club = clubes.find((c) => c.id === e.clubId)
        const squadBase = ligaDeSquads(squads).find((s) => s.clubId === e.clubId)
        if (!club || !squadBase) {
          set({ simulando: false })
          return
        }

        // ── Se aplican los movimientos elegidos ──
        let plantel = [...e.plantel]
        const fichajes: string[] = []
        const ventas: string[] = []
        for (const id of aceptados) {
          const m = mercado.find((x) => x.jugadorId === id)
          if (!m) continue
          if (m.tipo === 'venta') {
            plantel = plantel.filter((x) => x !== m.jugadorId)
            ventas.push(m.nombre)
          } else if (!plantel.includes(m.jugadorId)) {
            plantel.push(m.jugadorId)
            fichajes.push(m.nombre)
          }
        }

        const porId = new Map(players.map((p) => [p.id, p]))
        const titulares = onceIdeal(plantel.map((id) => porId.get(id)).filter(Boolean) as Player[])
        const resultado = simulateSeasonWithStats(
          titulares,
          { ...squadBase, id: `dt-${e.clubId}`, playerIds: plantel as [string, ...string[]] },
          rivalesParaSimular(liga, e.clubId),
          pSim,
          formations['4-3-3'],
          calculateFullTeamScore(titulares, formations['4-3-3']),
        )
        const r = resumenDeTemporada(resultado)

        // La Copa Argentina, con el mismo once. En Football Manager media carrera se define en
        // las copas: un año malo en la liga se salva con una copa, y eso hace que el mismo
        // resultado en la tabla se sienta distinto.
        const copa = resumenDeCopa(
          simulateCopaWithStats(
            titulares,
            { ...squadBase, id: `dt-copa-${e.clubId}`, playerIds: plantel as [string, ...string[]] },
            rivalesParaSimular(liga, e.clubId),
            pSim,
            formations['4-3-3'],
            calculateFullTeamScore(titulares, formations['4-3-3']),
          ),
        )

        const ev = evaluar(e.objetivo, r.puesto, r.total, r.campeon, e.prestigio, e.paciencia)

        const temporada: TemporadaDT = {
          temporada: e.temporada,
          anio: e.anio,
          clubId: e.clubId,
          clubNombre: club.nombre,
          puesto: r.puesto,
          total: r.total,
          campeon: r.campeon,
          copa,
          objetivo: e.objetivo,
          cumplio: ev.cumplio,
          despedido: ev.despedido,
          goleador: r.goleador,
          ganados: r.ganados,
          empatados: r.empatados,
          perdidos: r.perdidos,
          golesFavor: r.golesFavor,
          golesContra: r.golesContra,
          fichajes,
          ventas,
        }

        // La copa cuenta: no salva un objetivo incumplido, pero compra tiempo y nombre.
        const bonoCopa = copa.campeon ? { prestigio: 8, paciencia: 20 } : { prestigio: 0, paciencia: 0 }
        const prestigio = Math.max(0, Math.min(100, e.prestigio + ev.prestigio + bonoCopa.prestigio))
        const paciencia = Math.max(0, Math.min(100, e.paciencia + ev.paciencia + bonoCopa.paciencia))
        const rng = makeRngLocal(e.semilla + e.temporada * 104729)
        const echaronDe = ev.despedido && !e.echaronDe.includes(e.clubId) ? [...e.echaronDe, e.clubId] : e.echaronDe
        // Los que ya te echaron no te vuelven a llamar: cada despido cierra una puerta, y por eso
        // la carrera puede terminarse de verdad en vez de durar siempre veinte temporadas.
        const ofertas = ev.despedido ? clubesQueTeLlaman(prestigio, clubes, echaronDe, rng) : []

        const historia = [...e.historia, temporada]
        const seAcabo = historia.length >= MAX_TEMPORADAS_DT

        set({
          estado: {
            ...e,
            historia,
            prestigio,
            paciencia,
            plantel,
            echaronDe,
            despedido: ev.despedido,
            ofertas,
            terminada: seAcabo || (ev.despedido && ofertas.length === 0),
            // Si sigue en el club, el año que viene se juega con el objetivo nuevo.
            ...(ev.despedido
              ? {}
              : {
                  temporada: e.temporada + 1,
                  anio: e.anio + 1,
                  presupuesto: presupuestoDe(club, r.puesto, r.total),
                  objetivo: objetivoDeTemporada(club, clubes.filter((c) => c.id !== e.clubId), prestigio),
                }),
          },
          revelacion: {
            temporada,
            evaluacion: ev,
            tabla: (resultado.table ?? []).map((t) => ({ name: t.name, pts: t.pts, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga })),
            ofertas,
          },
          simulando: false,
        })
      },

      cerrarRevelacion: () => set({ revelacion: null }),

      aceptarOferta: (clubId, { squads, players }) => {
        const e = get().estado
        if (!e) return
        const clubes = clubesDeLaLiga(squads, players)
        const club = clubes.find((c) => c.id === clubId)
        const squad = ligaDeSquads(squads).find((s) => s.clubId === clubId)
        if (!club || !squad) return
        set({
          estado: {
            ...e,
            clubId,
            trayectoria: e.trayectoria.includes(clubId) ? e.trayectoria : [...e.trayectoria, clubId],
            plantel: [...squad.playerIds],
            // Se arranca con crédito, pero menos que en el primer club: ya te echaron una vez.
            paciencia: 65,
            presupuesto: presupuestoDe(club, null, clubes.length),
            objetivo: objetivoDeTemporada(club, clubes.filter((c) => c.id !== clubId), e.prestigio),
            temporada: e.temporada + 1,
            anio: e.anio + 1,
            despedido: false,
            ofertas: [],
          },
          revelacion: null,
        })
        get().prepararMercado(players)
      },

      retirarse: () => {
        const e = get().estado
        if (!e) return
        set({ estado: { ...e, terminada: true }, revelacion: null })
      },

      reiniciar: () => set({ estado: null, mercado: [], aceptados: [], caja: 0, revelacion: null }),
    }),
    {
      name: 'gambeta_dt_v1',
      version: 1,
      // El mercado y la revelación son del turno: no tiene sentido revivirlos al recargar, y
      // guardarlos haría que una compra quedara "aceptada" sin haberse jugado la temporada.
      partialize: (s) => ({ estado: s.estado }) as unknown as DTStore,
    },
  ),
)

/** Copia local del RNG del motor: el store no debería importar `career-engine` por una función. */
function makeRngLocal(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
