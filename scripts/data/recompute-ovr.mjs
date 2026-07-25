// OVR data-driven al estilo FIFA a partir de las stats de carrera enriquecidas de Wikidata
// (data/wikidata-stats-cache.json). Objetivo: cracks arriba, relleno abajo, cada uno en su
// lugar, con un spread competitivo y divertido.
//
//   - Leyendas: rating anclado (no se tocan).
//   - Con stats reales: rating = longevidad(apps) + selección(caps) + goles(pos-ponderado).
//   - Sin stats (Wikidata no cubre / carrera obscura): se acota <= NO_STATS_CAP para que un
//     desconocido no sobrepase a jugadores con carrera real (no son estrellas por definición).
//
//   node scripts/data/recompute-ovr.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const FILE = path.join(ROOT, 'data', 'players.json')
const players = JSON.parse(fs.readFileSync(FILE, 'utf8'))
const cache = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'wikidata-stats-cache.json'), 'utf8'))
const DRY = process.argv.includes('--dry')

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const NO_STATS_CAP = 82 // un desconocido SIN NINGUNA huella en Wikidata no es una estrella top
const cat = (pos) => {
  if (pos === 'GK') return 'GK'
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'DEF'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID'
  return 'ATT'
}

function computed(p) {
  const s = cache[p.id]
  const hasStats = s && s.found && (s.apps > 0 || s.goals > 0)
  if (!hasStats) return null
  const { apps = 0, goals = 0, ntCaps = 0 } = s
  const c = cat(p.position)
  // Piso de un jugador profesional real (66). Un titular de Primera con recorrido debe
  // rondar 70-76; los cracks se despegan por selección + goles.
  let r = 66 + (clamp(apps, 0, 400) / 400) * 10 // 400+ partidos -> +10 (longevidad)
  // Selección argentina: señal fuerte de estrella (solo cracks juegan de mayores)
  r += (clamp(ntCaps, 0, 60) / 60) * 10 // carrera plena en selección -> +10
  // Goles ponderados por posición
  const gpg = goals / Math.max(apps, 1)
  if (c === 'ATT') r += (clamp(gpg, 0, 0.5) / 0.5) * 8
  else if (c === 'MID') r += (clamp(gpg, 0, 0.3) / 0.3) * 5
  else if (c === 'DEF') r += (clamp(gpg, 0, 0.1) / 0.1) * 2
  return Math.round(clamp(r, 66, 90))
}

let dataDriven = 0, capped = 0, kept = 0
const deltas = []
for (const p of players) {
  const from = p.rating
  let to = from
  if (p.legendary) { kept++ }
  else {
    const nr = computed(p)
    if (nr != null && nr > (from || 0)) {
      // SOLO SUBIR: la data de carrera confirma a un crack -> se despega. Nunca bajamos con
      // Wikidata (subcuenta partidos de liga local y rompería ratings correctos como Armani).
      to = nr
      dataDriven++
    }
    else if (nr == null && (from || 0) > NO_STATS_CAP) { to = NO_STATS_CAP; capped++ }
    else kept++
  }
  deltas.push({ name: p.name, pos: p.position, from, to, legendary: p.legendary })
  if (!DRY) p.rating = to
}

// Distribución PROYECTADA (usa los nuevos valores aunque sea dry-run)
const dist = {}
deltas.forEach((d) => { const b = Math.floor((d.to || 0) / 5) * 5; dist[b] = (dist[b] || 0) + 1 })
console.log(`Data-driven: ${dataDriven} | Acotados (sin stats, >${NO_STATS_CAP}): ${capped} | Sin cambio: ${kept}`)
console.log('\nDistribución PROYECTADA (tramos de 5):')
Object.entries(dist).sort((a, b) => a[0] - b[0]).forEach(([b, n]) => console.log(`  ${b}-${+b + 4}: ${n}`))
const chg = deltas.filter((d) => d.to !== d.from)
console.log(`\nCambian: ${chg.length}. Mayores caídas:`)
;[...chg].sort((a, b) => (a.to - a.from) - (b.to - b.from)).slice(0, 12).forEach((d) => console.log(`  ${d.name} (${d.pos}): ${d.from} -> ${d.to}`))
console.log('Mayores subidas:')
;[...chg].sort((a, b) => (b.to - b.from) - (a.to - a.from)).slice(0, 10).forEach((d) => console.log(`  ${d.name} (${d.pos}): ${d.from} -> ${d.to}`))
console.log('\nJugadores clave:')
;['Sergio Romero', 'Ignacio Scocco', 'Lucas Torreira', 'Paulo Dybala', 'Lautaro Martinez', 'Julian Alvarez', 'Enzo Fernandez', 'Alexis Mac Allister', 'Nicolas Otamendi', 'Rodrigo De Paul'].forEach((n) => {
  const d = deltas.find((x) => x.name === n)
  if (d) console.log(`  ${n} (${d.pos}): ${d.from} -> ${d.to}${d.legendary ? ' [leyenda]' : ''}`)
})
if (!DRY) { fs.writeFileSync(FILE, JSON.stringify(players)); console.log('\nplayers.json actualizado.') }
else console.log('\n[dry-run] no se escribió nada.')
