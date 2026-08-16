// Fusiona al mismo jugador cargado dos veces.
//
// De dónde salen: el cruce de planteles históricos reconoce a los nuestros por nombre + edad, y
// cuando el nombre viene con acento en una fuente y sin acento en la otra —"Abel Hernandez" y
// "Abel Hernández"— o cuando no tenemos la fecha de nacimiento, entra como jugador nuevo. Medido
// el 15/8: 54 nombres repetidos, 108 fichas. Di María aparecía dos veces en el mismo puesto, con
// 88 y con 90.
//
// La regla para fusionar es conservadora, porque dos futbolistas argentinos pueden llamarse
// igual de verdad (hay tres "Juan Ramírez"):
//   · mismo nombre normalizado, sin acentos ni signos;
//   · misma línea de la cancha (arco, fondo, medio, ataque);
//   · o los dos sin fecha de nacimiento, o con el mismo año.
//
// Al fusionar gana la ficha con más respaldo: la que está en más planteles, y a igualdad, la que
// tiene más datos cargados. Las referencias de los planteles se reapuntan a esa.
//
//   node scripts/data/fusionar-duplicados.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const dry = process.argv.includes('--dry')

const players = JSON.parse(fs.readFileSync(path.join(DATA, 'players.json'), 'utf8'))
const squads = JSON.parse(fs.readFileSync(path.join(DATA, 'squads.json'), 'utf8'))

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()

const linea = (pos) =>
  pos === 'GK' ? 'GK'
  : ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos) ? 'DEF'
  : ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos) ? 'MID'
  : 'ATT'

const año = (p) => Number(String(p.birthDate || '').slice(0, 4)) || null

const usos = new Map()
for (const s of squads) for (const id of s.playerIds) usos.set(id, (usos.get(id) || 0) + 1)

/** Cuántos datos tiene cargados: desempata cuál de las dos fichas se queda. */
const riqueza = (p) =>
  ['birthDate', 'height', 'weight', 'goalsClub', 'capsClub', 'capsNationalTeam', 'goalsNationalTeam', 'marketValue', 'image']
    .filter((c) => p[c]).length

const grupos = new Map()
for (const p of players) {
  const k = norm(p.name)
  if (!grupos.has(k)) grupos.set(k, [])
  grupos.get(k).push(p)
}

const fusiones = []
const eliminar = new Set()
const remapear = new Map()

for (const [, fichas] of grupos) {
  if (fichas.length < 2) continue
  // Se compara de a pares: si tres fichas comparten nombre pero solo dos son la misma persona,
  // se fusionan esas dos y la tercera queda.
  const usados = new Set()
  for (let i = 0; i < fichas.length; i++) {
    if (usados.has(i)) continue
    for (let j = i + 1; j < fichas.length; j++) {
      if (usados.has(j)) continue
      const a = fichas[i], b = fichas[j]
      if (linea(a.position) !== linea(b.position)) continue
      const aa = año(a), ab = año(b)
      if (aa && ab && aa !== ab) continue

      // El que se queda: más planteles, después más datos, después mejor valoración.
      const [gana, pierde] = [a, b].sort((x, y) =>
        (usos.get(y.id) || 0) - (usos.get(x.id) || 0) ||
        riqueza(y) - riqueza(x) ||
        (y.rating || 0) - (x.rating || 0),
      )
      // Los datos que el ganador no tiene se los queda del otro: la fusión no pierde información.
      for (const campo of ['birthDate', 'height', 'weight', 'goalsClub', 'capsClub',
                           'capsNationalTeam', 'goalsNationalTeam', 'marketValue', 'image', 'fuenteFicha']) {
        if (!gana[campo] && pierde[campo]) gana[campo] = pierde[campo]
      }
      // Los clubes se suman sin repetir: es parte de la carrera de la misma persona.
      const clubesGana = new Set((gana.clubs || []).map((c) => c.id))
      for (const c of pierde.clubs || []) if (!clubesGana.has(c.id)) (gana.clubs ||= []).push(c)
      // La valoración: gana la más alta de las dos, que es la que se calculó con más evidencia.
      if ((pierde.rating || 0) > (gana.rating || 0)) gana.rating = pierde.rating
      if (pierde.legendary) gana.legendary = true

      fusiones.push(`${gana.name} (${gana.id}) ← ${pierde.name} (${pierde.id})`)
      eliminar.add(pierde.id)
      remapear.set(pierde.id, gana.id)
      usados.add(j)
    }
  }
}

// Reapuntar los planteles y sacar los repetidos que queden dentro del mismo plantel.
let refs = 0
for (const s of squads) {
  const nuevos = []
  for (const id of s.playerIds) {
    const destino = remapear.get(id) || id
    if (destino !== id) refs++
    if (!nuevos.includes(destino)) nuevos.push(destino)
  }
  s.playerIds = nuevos
}

const quedan = players.filter((p) => !eliminar.has(p.id))

console.log(`${fusiones.length} fusiones · ${refs} referencias reapuntadas · ${players.length} → ${quedan.length} jugadores`)
for (const f of fusiones.slice(0, 15)) console.log(`  ${f}`)
if (fusiones.length > 15) console.log(`  … y ${fusiones.length - 15} más`)

if (dry) {
  console.log('\n--dry: no se escribió nada')
} else if (fusiones.length) {
  fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify(quedan, null, 2))
  fs.writeFileSync(path.join(DATA, 'squads.json'), JSON.stringify(squads, null, 2))
  console.log('\nplayers.json y squads.json actualizados')
}
