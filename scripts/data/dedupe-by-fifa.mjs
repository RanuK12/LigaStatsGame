// Fusiona los duplicados que la fuente FIFA confirma como la MISMA persona (mismo player_id),
// que es lo que el dedup por nombre no podía distinguir de un homónimo real.
//   node scripts/data/dedupe-by-fifa.mjs [--dry]
//
// Guarda: solo fusiona si el nombre de pila del registro coincide (o es una variante de una
// letra: "Esequiel"/"Ezequiel", "Jonatan"/"Jonathan") con el nombre real de FIFA. Los que no
// pasan ese filtro, y los grupos de mismo nombre sin evidencia, van al reporte de revisión.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const SQUADS = path.join(ROOT, 'data', 'squads.json')
const REVIEW = path.join(ROOT, 'data', 'reports', 'dupes-review.json')
const DRY = process.argv.includes('--dry')

let players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
const squadsRaw = JSON.parse(fs.readFileSync(SQUADS, 'utf8'))
const wrapped = !Array.isArray(squadsRaw)
const squads = wrapped ? squadsRaw.squads || Object.values(squadsRaw).find(Array.isArray) : squadsRaw
const fifa = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fifa-index.json'), 'utf8'))
const cache = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ovr-source-cache.json'), 'utf8'))

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const toks = (s) => norm(s).split(' ').filter(Boolean)

function cerca(a, b) { // igual o a una letra de distancia
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, diff = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++diff > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return diff + (a.length - i) + (b.length - j) <= 1
}

const byId = Object.fromEntries(players.map((p) => [p.id, p]))
const grupos = {}
for (const [id, m] of Object.entries(cache)) if (byId[id]) (grupos[m.fifaId] ||= []).push(id)

const review = []
const remap = {}
const removed = new Set()
let fusionados = 0
for (const [fifaId, ids] of Object.entries(grupos)) {
  if (ids.length < 2) continue
  const real = toks(fifa[fifaId].n)
  const ok = ids.filter((id) => toks(byId[id].name).every((t) => real.some((r) => cerca(t, r))))
  const fuera = ids.filter((id) => !ok.includes(id))
  if (fuera.length) review.push({ motivo: 'nombre-no-coincide-con-la-fuente', fifa: fifa[fifaId].n, fifaId, descartados: fuera.map((id) => ({ id, name: byId[id].name })), fusionados: ok.map((id) => byId[id].name) })
  if (ok.length < 2) continue
  // ancla: el registro más completo (más clubes, después más trofeos)
  ok.sort((a, b) => (byId[b].clubs || []).length - (byId[a].clubs || []).length || (byId[b].trophies || []).length - (byId[a].trophies || []).length)
  const anchor = byId[ok[0]]
  for (const id of ok.slice(1)) {
    const dup = byId[id]
    for (const c of dup.clubs || []) if (!(anchor.clubs || []).some((x) => x.id === c.id && x.years === c.years)) (anchor.clubs ||= []).push(c)
    for (const t of dup.trophies || []) if (!(anchor.trophies || []).some((x) => x.competition === t.competition && x.year === t.year)) (anchor.trophies ||= []).push(t)
    for (const k of ['capsClub', 'goalsClub', 'assistsClub', 'capsNationalTeam', 'goalsNationalTeam']) anchor[k] = Math.max(anchor[k] || 0, dup[k] || 0)
    if (!anchor.image && dup.image) anchor.image = dup.image
    anchor.legendary = anchor.legendary || dup.legendary
    anchor.rating = Math.max(anchor.rating || 0, dup.rating || 0)
    remap[id] = anchor.id
    removed.add(id)
    fusionados++
  }
}

// Grupos de mismo nombre que la fuente no resolvió (homónimos reales o sin match): a revisión
const porNombre = {}
for (const p of players) if (!removed.has(p.id)) (porNombre[norm(p.name)] ||= []).push(p)
for (const [nombre, grupo] of Object.entries(porNombre)) {
  if (grupo.length < 2) continue
  const fifaIds = grupo.map((p) => cache[p.id]?.fifaId || null)
  review.push({
    motivo: fifaIds.every(Boolean) && new Set(fifaIds).size === grupo.length ? 'homonimos-reales' : 'sin-evidencia',
    nombre,
    jugadores: grupo.map((p, i) => ({ id: p.id, rating: p.rating, birthDate: p.birthDate, clubs: (p.clubs || []).map((c) => c.id), fifa: fifaIds[i] ? fifa[fifaIds[i]].n : null })),
  })
}

players = players.filter((p) => !removed.has(p.id))
for (const s of squads) s.playerIds = [...new Set((s.playerIds || []).map((id) => remap[id] || id))]

console.log(`Fusionados por identidad FIFA: ${fusionados} (quedan ${players.length} jugadores)`)
console.log(`A revisión manual: ${review.length} (${review.filter((r) => r.motivo === 'homonimos-reales').length} homónimos reales confirmados)`)
Object.entries(remap).slice(0, 10).forEach(([from, to]) => console.log(`  ${from} -> ${to}`))

if (DRY) { console.log('\n[dry-run] no se escribió nada.'); process.exit(0) }
fs.writeFileSync(PLAYERS, JSON.stringify(players))
fs.writeFileSync(SQUADS, JSON.stringify(wrapped ? squadsRaw : squads, null, 2))
fs.mkdirSync(path.dirname(REVIEW), { recursive: true })
fs.writeFileSync(REVIEW, JSON.stringify(review, null, 2))
console.log(`\nplayers.json y squads.json actualizados | revisión: ${REVIEW}`)
