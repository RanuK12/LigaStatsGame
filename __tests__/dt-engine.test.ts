import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import squadsData from '@/data/squads.json'
import playersData from '@/data/players.json'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import { formations, simulateSeasonWithStats, simulateCopaWithStats, getSquadPlayers, calculateFullTeamScore } from '@/lib/game-engine'
import type { Player, Squad } from '@/lib/types'
import {
  fuerzaDeClub,
  objetivoDeTemporada,
  presupuestoDe,
  mercadoDePases,
  puestoMasFlojo,
  valorDe,
  evaluar,
  clubesQueTeLlaman,
  PRESTIGIO_MINIMO_PARA_QUE_TE_LLAMEN,
  DESPIDOS_ANTES_DE_QUEDARTE_SIN_PUERTAS,
  TECHO_SOBRE_EL_NIVEL,
  resumenDeTemporada,
  resumenDeCopa,
  onceDeFormacion,
  evolucionarPlantel,
  aplicarAjustes,
  sortearLesion,
  FORMACIONES_DT,
  ligaParaSimular,
  jugadoresParaSimular,
  rivalesParaSimular,
  iniciarDT,
  fichaDT,
  apodoDe,
  makeRng,
  MAX_TEMPORADAS_DT,
  type ClubDT,
  type DTState,
  type TemporadaDT,
} from '@/lib/dt-engine'

/* ── El tablero: los clubes reales de la Liga Profesional 2026 ─────────────── */

const TODOS_P: Player[] = normalizePlayers(playersData)
const TODOS_S: Squad[] = normalizeSquads(squadsData)
const LPF = TODOS_S.filter((s) => s.season === '2026' && s.playerIds.length >= 11)
// Los rivales salen con su mejor once, igual que el club que dirigís. Ver `ligaParaSimular`.
const LIGA = ligaParaSimular(LPF, TODOS_P)
// Y la lista global ordenada para que cada rival salga con su once bien parado. Ver el motor.
const P_SIM = jugadoresParaSimular(LIGA, TODOS_P)

const CLUBES: ClubDT[] = LPF.map((s) => ({
  id: s.clubId,
  nombre: s.label.replace(/ 2026$/, ''),
  fuerza: fuerzaDeClub(s, TODOS_P),
}))

const squadDe = (clubId: string) => LPF.find((s) => s.clubId === clubId)!
const nombreDe = (clubId: string) => CLUBES.find((c) => c.id === clubId)?.nombre ?? clubId
const rivalesDe = (clubId: string) => CLUBES.filter((c) => c.id !== clubId)

/** Los once titulares de un plantel, que es lo que juega la temporada. */
function once(plantelIds: string[]): Player[] {
  const porId = new Map(TODOS_P.map((p) => [p.id, p]))
  const f = formations['4-3-3']
  const disponibles = plantelIds.map((id) => porId.get(id)).filter(Boolean) as Player[]
  const usados = new Set<string>()
  const equipo: Player[] = []
  for (const slot of f.positions) {
    const cal = disponibles
      .filter((p) => !usados.has(p.id))
      .sort((a, b) => {
        const encaja = (x: Player) => (x.position === slot.pos ? 2 : 0)
        return encaja(b) - encaja(a) || (b.rating ?? 0) - (a.rating ?? 0)
      })[0]
    if (cal) {
      equipo.push(cal)
      usados.add(cal.id)
    }
  }
  return equipo
}

/**
 * Una carrera de DT completa, de punta a punta, como la juega una persona:
 * objetivo → mercado → se juega la temporada → te evalúan → seguís o te echan y te llaman otros.
 */
function correrCarreraDT(clubInicial: string, semilla: number, temporadas = MAX_TEMPORADAS_DT): DTState {
  const rng = makeRng(semilla || 1)
  const club = CLUBES.find((c) => c.id === clubInicial)!
  let s = iniciarDT({
    nombre: 'DT de prueba',
    club,
    rivales: rivalesDe(club.id),
    plantel: [...squadDe(club.id).playerIds],
    anio: 2026,
    semilla,
  })

  for (let i = 0; i < temporadas && !s.terminada; i++) {
    const actual = CLUBES.find((c) => c.id === s.clubId)!
    const rivales = rivalesDe(s.clubId)
    const porId = new Map(TODOS_P.map((p) => [p.id, p]))
    const plantel = s.plantel.map((id) => porId.get(id)).filter(Boolean) as Player[]

    // ── Mercado: se acepta lo que entra en el presupuesto, como haría alguien apurado ──
    const movimientos = mercadoDePases(plantel, TODOS_P, s.presupuesto, rng)
    let caja = s.presupuesto
    const fichajes: string[] = []
    const ventas: string[] = []
    let plantelNuevo = [...s.plantel]
    for (const m of movimientos) {
      if (m.tipo === 'venta' && rng() < 0.5 && plantelNuevo.length > 14) {
        caja += m.precio
        plantelNuevo = plantelNuevo.filter((id) => id !== m.jugadorId)
        ventas.push(m.nombre)
      } else if (m.tipo === 'compra' && m.precio <= caja) {
        caja -= m.precio
        if (!plantelNuevo.includes(m.jugadorId)) plantelNuevo.push(m.jugadorId)
        fichajes.push(m.nombre)
      }
    }

    // ── Se juega ──
    const titulares = once(plantelNuevo)
    const squadVirtual: Squad = {
      ...squadDe(s.clubId),
      id: `dt-${s.clubId}`,
      playerIds: plantelNuevo as [string, ...string[]],
    }
    const puntaje = calculateFullTeamScore(titulares, formations['4-3-3'])
    // La liga MENOS mi club: si no, el plantel original juega también y la tabla suma dos veces.
    const rivalesSquads = rivalesParaSimular(LIGA, s.clubId)
    const resultado = simulateSeasonWithStats(titulares, squadVirtual, rivalesSquads, P_SIM, formations['4-3-3'], puntaje)
    const r = resumenDeTemporada(resultado)
    const copa = resumenDeCopa(
      simulateCopaWithStats(titulares, { ...squadVirtual, id: `dt-copa-${s.clubId}` }, rivalesSquads, P_SIM, formations['4-3-3'], puntaje),
    )

    // ── Te evalúan ──
    const ev = evaluar(s.objetivo, r.puesto, r.total, r.campeon, s.prestigio, s.paciencia)
    const temporada: TemporadaDT = {
      temporada: s.temporada,
      anio: s.anio,
      clubId: s.clubId,
      clubNombre: nombreDe(s.clubId),
      puesto: r.puesto,
      total: r.total,
      campeon: r.campeon,
      copa,
      objetivo: s.objetivo,
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

    const bono = copa.campeon ? { p: 8, pa: 20 } : { p: 0, pa: 0 }
    const prestigio = Math.max(0, Math.min(100, s.prestigio + ev.prestigio + bono.p))
    const paciencia = Math.max(0, Math.min(100, s.paciencia + ev.paciencia + bono.pa))

    if (ev.despedido) {
      const echaronDe = s.echaronDe.includes(s.clubId) ? s.echaronDe : [...s.echaronDe, s.clubId]
      const ofertas = clubesQueTeLlaman(prestigio, CLUBES, echaronDe, rng, echaronDe.length)
      if (ofertas.length === 0) {
        s = { ...s, historia: [...s.historia, temporada], prestigio, paciencia, echaronDe, despedido: true, terminada: true }
        break
      }
      // La oferta ya trae id, nombre y fuerza: no hace falta volver a buscar el club, y así no
      // hay forma de que un `find` fallido deje la carrera a medias.
      const elegida = ofertas[Math.min(ofertas.length - 1, Math.floor(rng() * ofertas.length))]
      const nuevo: ClubDT = { id: elegida.clubId, nombre: elegida.nombre, fuerza: elegida.fuerza }
      s = {
        ...s,
        historia: [...s.historia, temporada],
        prestigio,
        paciencia: 65,
        echaronDe,
        despedido: true,
        clubId: nuevo.id,
        trayectoria: s.trayectoria.includes(nuevo.id) ? s.trayectoria : [...s.trayectoria, nuevo.id],
        plantel: [...squadDe(nuevo.id).playerIds],
        presupuesto: presupuestoDe(nuevo, null, CLUBES.length),
        objetivo: objetivoDeTemporada(nuevo, rivalesDe(nuevo.id), prestigio),
        temporada: s.temporada + 1,
        anio: s.anio + 1,
        ofertas: [],
      }
    } else {
      s = {
        ...s,
        historia: [...s.historia, temporada],
        prestigio,
        paciencia,
        despedido: false,
        plantel: plantelNuevo,
        presupuesto: presupuestoDe(actual, r.puesto, r.total),
        objetivo: objetivoDeTemporada(actual, rivales, prestigio),
        temporada: s.temporada + 1,
        anio: s.anio + 1,
      }
    }
  }
  return { ...s, terminada: true }
}

/* ── Los datos con los que se juega ───────────────────────────────────────── */

describe('el tablero del modo DT', () => {
  it('están los clubes de la Liga Profesional con plantel real', () => {
    expect(CLUBES.length).toBeGreaterThanOrEqual(20)
    for (const c of CLUBES) {
      expect(c.id, 'club sin id').toBeTruthy()
      expect(c.nombre).toBeTruthy()
      expect(c.fuerza).toBeGreaterThan(40)
      expect(c.fuerza).toBeLessThanOrEqual(99)
      expect(squadDe(c.id).playerIds.length).toBeGreaterThanOrEqual(11)
    }
  })

  it('la fuerza distingue a los grandes de los chicos', () => {
    const river = CLUBES.find((c) => c.id === 'river-plate')!
    const aldosivi = CLUBES.find((c) => c.id === 'aldosivi')!
    expect(river.fuerza).toBeGreaterThan(aldosivi.fuerza)
  })
})

/* ── Lo que te pide la dirigencia ─────────────────────────────────────────── */

describe('el objetivo de la dirigencia', () => {
  it('a un grande le piden campeón y a un chico permanencia', () => {
    const river = CLUBES.find((c) => c.id === 'river-plate')!
    const aldosivi = CLUBES.find((c) => c.id === 'aldosivi')!
    expect(objetivoDeTemporada(river, rivalesDe(river.id), 0).id).toBe('campeon')
    expect(['permanencia', 'mitad']).toContain(objetivoDeTemporada(aldosivi, rivalesDe(aldosivi.id), 0).id)
  })

  /** El que ganó todo no puede seguir cobrando por salir décimo. */
  it('el prestigio sube la vara en el mismo club', () => {
    const club = [...CLUBES].sort((a, b) => a.fuerza - b.fuerza)[Math.floor(CLUBES.length / 2)]
    const sinNombre = objetivoDeTemporada(club, rivalesDe(club.id), 0)
    const consagrado = objetivoDeTemporada(club, rivalesDe(club.id), 100)
    expect(consagrado.puesto).toBeLessThanOrEqual(sinNombre.puesto)
  })

  it('el objetivo siempre es alcanzable: nunca pide un puesto que no existe', () => {
    for (const c of CLUBES) {
      for (const prestigio of [0, 25, 50, 75, 100]) {
        const o = objetivoDeTemporada(c, rivalesDe(c.id), prestigio)
        expect(o.puesto).toBeGreaterThanOrEqual(1)
        expect(o.puesto).toBeLessThanOrEqual(CLUBES.length)
        expect(o.texto).toBeTruthy()
      }
    }
  })
})

/* ── La plata y el mercado ────────────────────────────────────────────────── */

describe('el presupuesto y el mercado', () => {
  it('un grande maneja más plata que un chico', () => {
    const river = CLUBES.find((c) => c.id === 'river-plate')!
    const aldosivi = CLUBES.find((c) => c.id === 'aldosivi')!
    expect(presupuestoDe(river, null, 24)).toBeGreaterThan(presupuestoDe(aldosivi, null, 24))
  })

  it('salir campeón deja más plata que salir último', () => {
    const c = CLUBES[0]
    expect(presupuestoDe(c, 1, 24)).toBeGreaterThan(presupuestoDe(c, 24, 24))
  })

  it('el valor de un jugador sube con el OVR y baja con la edad', () => {
    expect(valorDe(85, 24)).toBeGreaterThan(valorDe(70, 24))
    expect(valorDe(80, 22)).toBeGreaterThan(valorDe(80, 34))
    for (let r = 45; r <= 99; r += 3) {
      for (const e of [17, 24, 31, 38]) {
        const v = valorDe(r, e)
        expect(Number.isFinite(v)).toBe(true)
        expect(v).toBeGreaterThan(0)
      }
    }
  })

  it('el mercado ofrece pocas cosas y siempre una venta', () => {
    const rng = makeRng(7)
    for (const c of CLUBES.slice(0, 8)) {
      const plantel = getSquadPlayers(squadDe(c.id), TODOS_P)
      const m = mercadoDePases(plantel, TODOS_P, presupuestoDe(c, null, 24), rng)
      expect(m.length).toBeGreaterThanOrEqual(1)
      expect(m.length, 'un mercado largo es donde se cierra la pestaña').toBeLessThanOrEqual(4)
      expect(m.some((x) => x.tipo === 'venta')).toBe(true)
      for (const mv of m) {
        expect(mv.nombre).toBeTruthy()
        expect(mv.precio).toBeGreaterThan(0)
        expect(mv.nota).toBeTruthy()
        expect(Number.isFinite(mv.precio)).toBe(true)
      }
    }
  })

  it('lo que se ofrece comprar no está ya en el plantel', () => {
    const rng = makeRng(31)
    for (const c of CLUBES.slice(0, 10)) {
      const plantel = getSquadPlayers(squadDe(c.id), TODOS_P)
      const ids = new Set(plantel.map((p) => p.id))
      for (const m of mercadoDePases(plantel, TODOS_P, 20, rng)) {
        if (m.tipo === 'compra') expect(ids.has(m.jugadorId)).toBe(false)
      }
    }
  })

  /**
   * Los dos defectos que se vieron jugando en el teléfono, no acá. Dirigiendo a Boca, ocho
   * temporadas seguidas ofrecían lo mismo: "comprar a Lionel Messi (98) por 4M" y el mismo juvenil.
   */
  it('no te ofrecen un jugador muy por encima del nivel de tu plantel', () => {
    for (const c of CLUBES) {
      const plantel = getSquadPlayers(squadDe(c.id), TODOS_P)
      const nivel = Math.round(
        plantel
          .map((p) => p.rating ?? 0)
          .sort((a, b) => b - a)
          .slice(0, 11)
          .reduce((a, b) => a + b, 0) / 11,
      )
      for (let t = 1; t <= 6; t++) {
        for (const m of mercadoDePases(plantel, TODOS_P, 40, makeRng(99 + t * 7919))) {
          if (m.tipo === 'compra') {
            expect(m.rating, `${c.nombre} (nivel ${nivel}) no puede fichar a ${m.nombre}`)
              .toBeLessThanOrEqual(nivel + TECHO_SOBRE_EL_NIVEL)
          }
        }
      }
    }
  })

  it('el mercado cambia de una temporada a la otra', () => {
    const plantel = getSquadPlayers(squadDe('boca-juniors'), TODOS_P)
    const compras = new Set<string>()
    for (let t = 1; t <= 8; t++) {
      // La misma mezcla de semilla que usa `prepararMercado` en el store.
      for (const m of mercadoDePases(plantel, TODOS_P, 12, makeRng(12345 + t * 7919))) {
        if (m.tipo === 'compra') compras.add(m.nombre)
      }
    }
    expect(compras.size, 'ocho temporadas ofreciendo los mismos dos nombres').toBeGreaterThan(4)
  })

  it('el puesto más flojo es el que de verdad falta', () => {
    const sinArquero = TODOS_P.filter((p) => p.position !== 'GK').slice(0, 14)
    expect(puestoMasFlojo(sinArquero)).toBe('Arquero')
  })
})

/* ── Cómo te evalúan ──────────────────────────────────────────────────────── */

describe('la evaluación de la dirigencia', () => {
  const obj = { id: 'copas' as const, puesto: 4, texto: 'top 4' }

  it('cumplir suma prestigio y paciencia; fallar resta', () => {
    const bien = evaluar(obj, 2, 24, false, 30, 60)
    const mal = evaluar(obj, 18, 24, false, 30, 60)
    expect(bien.cumplio).toBe(true)
    expect(bien.prestigio).toBeGreaterThan(0)
    expect(bien.paciencia).toBeGreaterThan(0)
    expect(mal.cumplio).toBe(false)
    expect(mal.prestigio).toBeLessThan(0)
    expect(mal.paciencia).toBeLessThan(0)
  })

  it('salir campeón cumple aunque el objetivo pidiera otra cosa', () => {
    const ev = evaluar({ id: 'permanencia', puesto: 20, texto: '' }, 1, 24, true, 10, 50)
    expect(ev.cumplio).toBe(true)
    expect(ev.titulo).toBe('¡CAMPEÓN!')
  })

  /** No te echan por una mala temporada: te echan por la tercera. Es la tensión del modo. */
  it('una sola mala no te echa, tres seguidas sí', () => {
    let paciencia = 70
    let echado = false
    for (let i = 0; i < 3; i++) {
      const ev = evaluar(obj, 20, 24, false, 30, paciencia)
      paciencia += ev.paciencia
      echado = ev.despedido
      if (i === 0) expect(ev.despedido, 'la primera no puede echarte').toBe(false)
    }
    expect(echado).toBe(true)
  })

  it('el prestigio y la paciencia nunca se salen de la escala', () => {
    for (const puesto of [1, 5, 12, 24]) {
      for (const prestigio of [0, 50, 100]) {
        for (const paciencia of [0, 40, 100]) {
          const ev = evaluar(obj, puesto, 24, puesto === 1, prestigio, paciencia)
          expect(prestigio + ev.prestigio).toBeGreaterThanOrEqual(0)
          expect(prestigio + ev.prestigio).toBeLessThanOrEqual(100)
          expect(paciencia + ev.paciencia).toBeGreaterThanOrEqual(0)
          expect(paciencia + ev.paciencia).toBeLessThanOrEqual(100)
          expect(ev.titulo).toBeTruthy()
          expect(ev.detalle).toBeTruthy()
        }
      }
    }
  })
})

/* ── La escalera ──────────────────────────────────────────────────────────── */

describe('los clubes que te llaman', () => {
  it('con prestigio bajo llaman los chicos y con prestigio alto los grandes', () => {
    const rng = makeRng(11)
    const medioDe = (o: { fuerza: number }[]) => o.reduce((a, b) => a + b.fuerza, 0) / o.length
    // Justo en el piso: por debajo ya no te llama nadie, y eso se prueba aparte.
    const abajo = clubesQueTeLlaman(PRESTIGIO_MINIMO_PARA_QUE_TE_LLAMEN, CLUBES, [], rng)
    const arriba = clubesQueTeLlaman(95, CLUBES, [], rng)
    expect(abajo.length).toBeGreaterThan(0)
    expect(arriba.length).toBeGreaterThan(0)
    expect(medioDe(arriba)).toBeGreaterThan(medioDe(abajo))
  })

  it('nunca te ofrece el club del que te acaban de echar', () => {
    const rng = makeRng(3)
    for (const c of CLUBES.slice(0, 10)) {
      const ofertas = clubesQueTeLlaman(50, CLUBES, [c.id], rng)
      expect(ofertas.some((o) => o.clubId === c.id)).toBe(false)
    }
  })

  it('ofrece algo mientras el prestigio alcance', () => {
    const rng = makeRng(99)
    for (const prestigio of [PRESTIGIO_MINIMO_PARA_QUE_TE_LLAMEN, 20, 50, 80, 100]) {
      expect(clubesQueTeLlaman(prestigio, CLUBES, [], rng).length).toBeGreaterThan(0)
    }
  })

  /**
   * El final malo. Sin esto la carrera dura siempre veinte temporadas: en 144 carreras medidas
   * antes de existir este piso, CERO terminaron sin trabajo.
   */
  it('con el prestigio por el piso y tres despidos encima no te llama nadie', () => {
    const rng = makeRng(5)
    const bajo = PRESTIGIO_MINIMO_PARA_QUE_TE_LLAMEN - 1
    expect(clubesQueTeLlaman(bajo, CLUBES, [], rng, DESPIDOS_ANTES_DE_QUEDARTE_SIN_PUERTAS)).toHaveLength(0)
    expect(clubesQueTeLlaman(0, CLUBES, [], rng, 9)).toHaveLength(0)
  })

  /**
   * La otra mitad de la misma regla, y la que faltaba: el primer fracaso no puede ser el último.
   * El prestigio arranca en 10 y una mala temporada resta hasta 12, así que mirando solo el piso
   * la carrera se terminaba en el primer despido. Medido jugando de punta a punta: se acabó en la
   * temporada 6, con un despido y ninguna oferta.
   */
  it('el primer despido no te deja sin trabajo para siempre', () => {
    const rng = makeRng(5)
    for (let despidos = 0; despidos < DESPIDOS_ANTES_DE_QUEDARTE_SIN_PUERTAS; despidos++) {
      expect(clubesQueTeLlaman(0, CLUBES, [], rng, despidos).length).toBeGreaterThan(0)
    }
  })

  it('los clubes que ya te echaron no te vuelven a llamar', () => {
    const rng = makeRng(17)
    const echaronDe = CLUBES.slice(0, CLUBES.length - 2).map((c) => c.id)
    const ofertas = clubesQueTeLlaman(90, CLUBES, echaronDe, rng, echaronDe.length)
    expect(ofertas.length).toBeGreaterThan(0)
    expect(ofertas.every((o) => !echaronDe.includes(o.clubId))).toBe(true)
    // Y si te echaron de todos, se acabó.
    expect(clubesQueTeLlaman(90, CLUBES, CLUBES.map((c) => c.id), rng, CLUBES.length)).toHaveLength(0)
  })
})

/* ── La ficha final ───────────────────────────────────────────────────────── */

describe('la ficha final del DT', () => {
  it('el apodo sale de lo que pasó, no de un puntaje', () => {
    expect(apodoDe({ titulos: 7, despidos: 0, temporadas: 12, clubes: 2, prestigio: 90 })).toBe('Leyenda del banco')
    expect(apodoDe({ titulos: 4, despidos: 0, temporadas: 8, clubes: 1, prestigio: 80 })).toBe('El intocable')
    expect(apodoDe({ titulos: 1, despidos: 1, temporadas: 6, clubes: 1, prestigio: 40 })).toBe('Ídolo de una sola camiseta')
    expect(apodoDe({ titulos: 0, despidos: 4, temporadas: 7, clubes: 5, prestigio: 12 })).toBe('El eterno interino')
    expect(apodoDe({ titulos: 0, despidos: 0, temporadas: 0, clubes: 1, prestigio: 10 })).toBe('Recién llegado')
  })

  it('los totales cierran con el historial', () => {
    const s = correrCarreraDT('velez', 42, 6)
    const f = fichaDT(s, nombreDe)
    expect(f.temporadas).toBe(s.historia.length)
    expect(f.ganados + f.empatados + f.perdidos).toBe(f.partidos)
    expect(f.titulos).toBe(s.historia.filter((t) => t.campeon).length)
    expect(f.efectividad).toBeGreaterThanOrEqual(0)
    expect(f.efectividad).toBeLessThanOrEqual(100)
    expect(f.apodo).toBeTruthy()
    expect(f.clubes.length).toBeGreaterThan(0)
  })
})

/* ── La corrida de estrés: 300 carreras completas ─────────────────────────── */

describe('300 carreras de DT completas', () => {
  it(
    'ninguna produce un estado imposible',
    () => {
      const semillas = Array.from({ length: 13 }, (_, i) => (i + 1) * 977)
      const clubes = CLUBES.map((c) => c.id)
      let corridas = 0
      let conTitulo = 0
      let conDespido = 0
      let terminadasSinTrabajo = 0
      let conCopa = 0
      let sumaTemporadas = 0
      const largos: number[] = []
      const apodos = new Set<string>()

      for (const clubId of clubes) {
        for (const semilla of semillas) {
          // El largo va hasta el tope real del modo. Con el corte en 8 el promedio daba 8,0
          // —o sea, el tope— y no medía nada: la pregunta es cuánto dura una carrera, no si
          // llega al corte que le puse yo.
          const s = correrCarreraDT(clubId, semilla, MAX_TEMPORADAS_DT)
          const f = fichaDT(s, nombreDe)
          corridas++
          if (f.titulos > 0) conTitulo++
          if (f.despidos > 0) conDespido++
          if (f.copas > 0) conCopa++
          sumaTemporadas += s.historia.length
          largos.push(s.historia.length)
          if (s.despedido && s.historia.length < 8) terminadasSinTrabajo++
          apodos.add(f.apodo)

          const contexto = `${clubId}/${semilla}`

          // La carrera existe y avanzó.
          expect(s.historia.length, contexto).toBeGreaterThan(0)
          expect(s.historia.length).toBeLessThanOrEqual(MAX_TEMPORADAS_DT)

          // Las escalas no se rompen nunca.
          expect(s.prestigio, contexto).toBeGreaterThanOrEqual(0)
          expect(s.prestigio).toBeLessThanOrEqual(100)
          expect(s.paciencia).toBeGreaterThanOrEqual(0)
          expect(s.paciencia).toBeLessThanOrEqual(100)
          expect(Number.isFinite(s.presupuesto)).toBe(true)
          expect(s.presupuesto).toBeGreaterThan(0)

          // El plantel sigue siendo jugable y sin repetidos.
          expect(new Set(s.plantel).size, `${contexto}: plantel con repetidos`).toBe(s.plantel.length)
          expect(s.plantel.length).toBeGreaterThanOrEqual(11)

          // La trayectoria no repite clubes y el club actual existe.
          expect(new Set(s.trayectoria).size).toBe(s.trayectoria.length)
          expect(CLUBES.some((c) => c.id === s.clubId), `${contexto}: club inexistente`).toBe(true)

          for (const t of s.historia) {
            // La copa no puede quedar a medias: o sos campeón o llegaste hasta alguna instancia.
            if (t.copa) {
              expect(t.copa.hasta, `${contexto}: copa sin instancia`).toBeTruthy()
              if (t.copa.campeon) expect(t.copa.hasta).toBe('Campeón')
            }
            expect(t.puesto, `${contexto} T${t.temporada}`).toBeGreaterThanOrEqual(1)
            expect(t.puesto).toBeLessThanOrEqual(t.total)
            expect(t.total).toBeGreaterThan(1)
            expect(t.ganados + t.empatados + t.perdidos).toBeGreaterThan(0)
            expect(t.golesFavor).toBeGreaterThanOrEqual(0)
            expect(t.golesContra).toBeGreaterThanOrEqual(0)
            expect(t.objetivo.texto).toBeTruthy()
            expect(t.clubNombre).toBeTruthy()
            // Campeón es salir primero: no puede haber campeón décimo.
            if (t.campeon) expect(t.puesto, `${contexto}: campeón pero ${t.puesto}º`).toBe(1)
            // Si cumplió, o salió campeón o llegó al puesto pedido.
            if (t.cumplio) expect(t.campeon || t.puesto <= t.objetivo.puesto).toBe(true)
          }

          // La ficha no puede tener números imposibles.
          expect(f.efectividad).toBeGreaterThanOrEqual(0)
          expect(f.efectividad).toBeLessThanOrEqual(100)
          expect(f.titulos).toBeLessThanOrEqual(f.temporadas)
          expect(f.objetivosCumplidos).toBeLessThanOrEqual(f.temporadas)
          expect(f.apodo).toBeTruthy()
          expect(f.apodo).not.toContain('undefined')
        }
      }

      const ordenLargos = [...largos].sort((a, b) => a - b)
      const mediana = ordenLargos[Math.floor(ordenLargos.length / 2)]
      const cortas = largos.filter((n) => n <= 5).length

      const resumen =
        `${corridas} carreras · ${conTitulo} con título (${Math.round((conTitulo / corridas) * 100)}%) · ` +
        `${conDespido} con despido (${Math.round((conDespido / corridas) * 100)}%) · ` +
        `${conCopa} con copa (${Math.round((conCopa / corridas) * 100)}%) · ` +
        `${terminadasSinTrabajo} sin trabajo (${Math.round((terminadasSinTrabajo / corridas) * 100)}%) · ` +
        `largo: medio ${(sumaTemporadas / corridas).toFixed(1)}, mediana ${mediana}, ` +
        `${cortas} de 5 o menos (${Math.round((cortas / corridas) * 100)}%) · apodos: ${[...apodos].join(', ')}`
      fs.writeFileSync('/tmp/dt-estres.txt', resumen)
      console.log('[DT] ' + resumen)

      // La corrida tiene que ser grande de verdad, no tres carreras de adorno.
      expect(corridas, 'la muestra tiene que superar las 300 carreras').toBeGreaterThanOrEqual(300)

      // Y el modo tiene que producir las dos cosas que lo hacen un juego: campeonatos y despidos.
      // Si nadie sale campeón nunca, o si nadie se come un despido, está roto aunque no reviente.
      expect(conTitulo, 'nadie salió campeón en 300 carreras').toBeGreaterThan(0)
      expect(conDespido, 'a nadie lo echaron en 300 carreras').toBeGreaterThan(0)
      expect(apodos.size, 'todas las fichas terminan con el mismo apodo').toBeGreaterThan(2)

      console.log(
        `[DT] ${corridas} carreras · ${conTitulo} con título · ${conDespido} con despido · ` +
          `${terminadasSinTrabajo} sin trabajo · apodos distintos: ${[...apodos].join(', ')}`,
      )
    },
    600_000,
  )
})

/* ── Lo que sumamos de Football Manager ───────────────────────────────────── */

describe('la táctica', () => {
  it('cada dibujo arma un once distinto, con once jugadores', () => {
    const plantel = getSquadPlayers(squadDe('river-plate'), TODOS_P)
    const onces = FORMACIONES_DT.map((f) => onceDeFormacion(plantel, f))
    for (const xi of onces) {
      expect(xi).toHaveLength(11)
      expect(new Set(xi.map((p) => p.id)).size, 'un jugador repetido en el once').toBe(11)
    }
    // Los puestos que se ocupan no son los mismos: si lo fueran, elegir dibujo sería cosmético.
    const firma = (xi: typeof onces[0]) => xi.map((p) => p.position).sort().join(',')
    expect(new Set(onces.map(firma)).size).toBeGreaterThan(1)
  })

  it('el lesionado no juega', () => {
    const plantel = getSquadPlayers(squadDe('boca-juniors'), TODOS_P)
    const xi = onceDeFormacion(plantel, '4-3-3')
    const afuera = xi[5]
    const sinEl = onceDeFormacion(plantel, '4-3-3', [afuera.id])
    expect(sinEl.some((p) => p.id === afuera.id)).toBe(false)
    expect(sinEl).toHaveLength(11)
  })
})

describe('que el plantel se mueva entre temporadas', () => {
  /**
   * No se modela por edad a propósito: la base no la tiene para los jugadores modernos y
   * `players-core.json` ni siquiera manda el campo al navegador. Lo que se prueba es lo que
   * importa para jugar: el plantel se mueve solo, para arriba y para abajo.
   */
  it('unos crecen y otros bajan', () => {
    const plantel = getSquadPlayers(squadDe('river-plate'), TODOS_P)
    const rng = makeRng(2026)
    let ajustes: Record<string, number> = {}
    // Diez temporadas de golpe: es lo que vive una carrera larga.
    for (let i = 0; i < 10; i++) {
      ajustes = evolucionarPlantel(aplicarAjustes(plantel, ajustes), ajustes, i + 1, rng).ajustes
    }
    const conAjuste = Object.values(ajustes)
    expect(conAjuste.length).toBeGreaterThan(0)
    expect(conAjuste.some((d) => d > 0), 'nadie creció en diez años').toBe(true)
    expect(conAjuste.some((d) => d < 0), 'nadie bajó en diez años').toBe(true)
  })

  it('nadie se sale de la escala ni crece para siempre', () => {
    const plantel = getSquadPlayers(squadDe('aldosivi'), TODOS_P)
    const rng = makeRng(77)
    let ajustes: Record<string, number> = {}
    for (let i = 0; i < 20; i++) {
      ajustes = evolucionarPlantel(aplicarAjustes(plantel, ajustes), ajustes, i + 1, rng).ajustes
    }
    for (const p of aplicarAjustes(plantel, ajustes)) {
      expect(p.rating, `${p.name} fuera de escala`).toBeGreaterThanOrEqual(35)
      expect(p.rating).toBeLessThanOrEqual(99)
      const base = plantel.find((x) => x.id === p.id)!.rating ?? 60
      expect(p.rating! - base, `${p.name} creció sin techo`).toBeLessThanOrEqual(8)
    }
  })
})

describe('las lesiones', () => {
  it('cae sobre alguien del once, no sobre el número veinte', () => {
    const plantel = getSquadPlayers(squadDe('velez'), TODOS_P)
    const xi = onceDeFormacion(plantel, '4-3-3')
    const rng = makeRng(4)
    let hubo = 0
    for (let i = 0; i < 200; i++) {
      const l = sortearLesion(xi, rng)
      if (!l) continue
      hubo++
      expect(xi.some((p) => p.id === l.jugadorId), 'se lesionó alguien que no jugaba').toBe(true)
      expect(l.tipo).toBeTruthy()
      expect(l.partidos).toBeGreaterThan(0)
    }
    // Ni siempre ni nunca: si fuera siempre, sería un impuesto; si nunca, no existiría.
    expect(hubo).toBeGreaterThan(20)
    expect(hubo).toBeLessThan(180)
  })

  it('sin once no hay lesión', () => {
    expect(sortearLesion([], makeRng(1))).toBeNull()
  })
})
