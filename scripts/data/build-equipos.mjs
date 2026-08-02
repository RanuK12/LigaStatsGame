// Una página por equipo histórico, para que Google tenga qué indexar.
//
// La búsqueda de Google es el 85 % del tráfico (324 de 381 sesiones el 31 de julio y el 1 de
// agosto) y el sitio tenía once páginas, todas sobre el juego. Nadie busca "juego de fútbol
// argentino"; la gente busca "Vélez 1994 plantel" o "Boca 2001 campeón de América". Los 36
// equipos históricos que ya están en la base son 36 páginas de contenido real, cada una con el
// plantel completo, y cada una con un botón para jugar ese plantel.
//
// Se escribe un JSON derivado y no se leen los datos crudos en la página: players.json pesa
// varios MB y meterlo en el bundle del cliente para mostrar dieciocho nombres es absurdo.
//
//   node scripts/data/build-equipos.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DERIVED = path.join(ROOT, 'data', 'derived')

const leer = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))
const lista = (x) => (Array.isArray(x) ? x : x.players || x.squads || x.clubs || [])

const players = lista(leer('players.json'))
const squads = lista(leer('squads.json'))
const clubs = lista(leer('clubs.json'))

const porId = Object.fromEntries(players.map((p) => [p.id, p]))
const clubPorId = Object.fromEntries(clubs.map((c) => [c.id, c]))

// El orden del once en la ficha: primero el arquero, después hacia adelante. Un plantel listado
// por rating pone al nueve arriba de todo y no se parece a cómo un hincha lee una formación.
const ORDEN = { GK: 0, CB: 1, LB: 2, RB: 2, CDM: 3, CM: 4, CAM: 5, LM: 5, RM: 5, LW: 6, RW: 6, CF: 7, ST: 7 }
const ordenDe = (pos) => ORDEN[pos] ?? 4

/** Solo lo que la página muestra: nombre, puesto, rating, nacionalidad y si es leyenda. */
function jugadorPublico(id) {
  const p = porId[id]
  if (!p) return null
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    rating: p.rating,
    nationality: p.nationality,
    legendary: p.legendary === true,
  }
}

const equipos = squads
  .filter((s) => s.historico)
  .map((s) => {
    const club = clubPorId[s.clubId]
    const plantel = s.playerIds
      .map(jugadorPublico)
      .filter(Boolean)
      .sort((a, b) => ordenDe(a.position) - ordenDe(b.position) || (b.rating ?? 0) - (a.rating ?? 0))

    const ratings = plantel.map((p) => p.rating ?? 0).filter(Boolean)
    return {
      slug: s.id,
      squadId: s.id,
      clubId: s.clubId,
      club: club?.name ?? s.clubId,
      apodo: club?.nickname ?? null,
      estadio: club?.stadium ?? null,
      ciudad: club?.city ?? null,
      colores: club?.colors ?? ['#243b53', '#0f2033'],
      season: s.season,
      label: s.label,
      hito: s.hito ?? null,
      plantel,
      // Los dos números que resumen el plantel de un vistazo.
      ovrPromedio: ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0,
      figura: plantel.reduce((mejor, p) => ((p.rating ?? 0) > (mejor?.rating ?? 0) ? p : mejor), null),
    }
  })
  // Del más viejo al más nuevo: la lista se lee como una línea de tiempo.
  .sort((a, b) => Number(a.season) - Number(b.season))

fs.mkdirSync(DERIVED, { recursive: true })
fs.writeFileSync(path.join(DERIVED, 'equipos.json'), JSON.stringify(equipos, null, 0))

const sinPlantel = equipos.filter((e) => e.plantel.length < 11)
console.log(`${equipos.length} equipos en data/derived/equipos.json`)
if (sinPlantel.length) {
  // No se cae el build: la página igual sirve, pero conviene saberlo.
  console.warn(`  ! ${sinPlantel.length} con menos de 11 jugadores: ${sinPlantel.map((e) => e.slug).join(', ')}`)
}
