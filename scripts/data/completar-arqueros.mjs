// Le pone arquero a los planteles que no tienen.
//
// Medido el 15/8 con validate-dataset: cinco planteles de la Liga Profesional —Estudiantes 2017,
// Huracán 2020, Newell's 2022, Rosario Central 2018 y San Lorenzo 2016— no tienen un solo
// arquero. En el draft eso es un puesto que no se puede llenar: el jugador gira, le sale ese
// plantel y no hay a quién poner en el arco.
//
// De dónde sale el arquero: `data/fifa-index.json`, que es la misma fuente de OVR que usa el
// resto del juego. Se busca un arquero DE ESE CLUB en la versión de FIFA más cercana a la
// temporada (FIFA 17 ≈ temporada 2016/17), y entre los empatados gana el de mejor valoración.
// Si el club no tiene ningún arquero en el dataset, el plantel queda como está: es preferible un
// plantel incompleto a un arquero inventado.
//
//   node scripts/data/completar-arqueros.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const dry = process.argv.includes('--dry')

// Cuántos años de distancia se acepta entre la temporada y la versión de FIFA.
const VENTANA = 4

const leer = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const players = leer('players.json')
const squads = leer('squads.json')
const clubs = leer('clubs.json')
const fifa = Object.values(leer('fifa-index.json'))

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

const porId = new Map(players.map((p) => [p.id, p]))
const clubPorId = new Map(clubs.map((c) => [c.id, c]))

/** El nombre del club en FIFA no es el nuestro: se compara por las palabras que identifican. */
function esElMismoClub(nombreFifa, club) {
  const a = norm(nombreFifa)
  const b = norm(club?.name || '')
  if (!a || !b) return false
  if (a === b || a.includes(b) || b.includes(a)) return true
  // "Newell's Old Boys" vs "Newell's", "Estudiantes de La Plata" vs "Estudiantes (LP)".
  const fuertes = b.split(' ').filter((w) => w.length > 4 && !['club', 'atletico', 'deportivo', 'social'].includes(w))
  return fuertes.length > 0 && fuertes.every((w) => a.includes(w))
}

/** La versión N de FIFA sale a mitad del año N+1999: FIFA 17 es la temporada 2016/17. */
const anioDeVersion = (lv) => lv + 1999

const idDesdeNombre = (n) => norm(n).replace(/\s+/g, '-')

let agregados = 0
const cambios = []

for (const sq of squads) {
  const pos = sq.playerIds.map((id) => porId.get(id)?.position).filter(Boolean)
  if (pos.includes('GK')) continue

  const club = clubPorId.get(sq.clubId)
  const año = Number(sq.season)
  const candidatos = fifa
    .filter((v) => v.pos === 'GK' && esElMismoClub(v.club, club))
    .map((v) => ({ ...v, distancia: Math.abs(anioDeVersion(v.lv) - año) }))
    .filter((v) => v.distancia <= VENTANA)
    .sort((a, b) => a.distancia - b.distancia || (b.ov || 0) - (a.ov || 0))

  const elegido = candidatos[0]
  if (!elegido) {
    cambios.push(`  ✗ ${sq.clubId} ${sq.season}: no hay arquero de ese club en el dataset`)
    continue
  }

  // ¿Ya está en la base? Se lo suma al plantel y listo; no se duplica ni se le toca el rating.
  let jugador = players.find((p) => norm(p.name) === norm(elegido.n) && p.position === 'GK')
  if (!jugador) {
    const id = idDesdeNombre(elegido.n)
    jugador = {
      id: players.some((p) => p.id === id) ? `${id}-gk` : id,
      name: elegido.n,
      fullName: elegido.n,
      position: 'GK',
      positions: ['GK'],
      nationality: elegido.nat || 'Argentina',
      rating: elegido.ov,
      birthDate: elegido.d || null,
      clubs: [{ id: sq.clubId, name: club?.name || sq.clubId, years: String(sq.season) }],
      decade: `${String(Math.floor(año / 10) * 10)}s`,
      preferredFoot: 'Derecho',
      // De dónde salió, para que la próxima auditoría no tenga que adivinarlo.
      fuente: 'fifa-index',
    }
    players.push(jugador)
  }
  if (!sq.playerIds.includes(jugador.id)) {
    sq.playerIds.push(jugador.id)
    agregados++
    cambios.push(`  ✓ ${sq.clubId} ${sq.season}: ${elegido.n} (FIFA ${elegido.lv}, OVR ${elegido.ov})`)
  }
}

console.log(cambios.join('\n') || 'Todos los planteles ya tienen arquero.')
console.log(`\n${agregados} arqueros agregados`)

if (dry) {
  console.log('\n--dry: no se escribió nada')
} else if (agregados > 0) {
  fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify(players, null, 2))
  fs.writeFileSync(path.join(DATA, 'squads.json'), JSON.stringify(squads, null, 2))
  console.log('players.json y squads.json actualizados')
}
