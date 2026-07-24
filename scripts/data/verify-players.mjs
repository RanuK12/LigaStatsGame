// Verifica consistencia jugador ↔ club ↔ año (automático, sin ir uno por uno).
// Detecta anomalías que casi siempre indican datos mal cargados:
//   - años de club fuera del rango de vida/carrera del jugador
//   - solapamientos fuertes entre clubes (mismo período en dos clubes distintos)
//   - activeYears que no coincide con el rango real de clubes
//   - clubs vacíos / years faltantes
//   node scripts/data/verify-players.mjs [--limit N]
import fs from 'node:fs'
import path from 'node:path'

const players = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'players.json'), 'utf8'))
const NOW = new Date().getFullYear()
const argi = process.argv.indexOf('--limit')
const LIMIT = argi >= 0 ? parseInt(process.argv[argi + 1], 10) : Infinity

const years = (s) => {
  const m = String(s || '').match(/\d{4}/g)
  if (!m) return null
  const n = m.map(Number)
  return { start: Math.min(...n), end: Math.max(...n) }
}

const issues = { noClubs: [], noYears: [], beforeBirth: [], future: [], overlap: [], activeMismatch: [] }

for (const p of players) {
  const clubYears = (p.clubs || [])
    .filter((c) => c.name !== 'Argentina' && !/selecci/i.test(c.name || ''))
    .map((c) => ({ name: c.name, ...(years(c.years) || {}) }))
    .filter((c) => c.start)

  if (!p.clubs || p.clubs.length === 0) { issues.noClubs.push(p.name); continue }
  if (clubYears.length === 0) { issues.noYears.push(p.name); continue }

  const birthYear = p.birthDate ? parseInt(String(p.birthDate).slice(0, 4), 10) : null

  for (const c of clubYears) {
    if (birthYear && c.start < birthYear + 14) issues.beforeBirth.push(`${p.name} · ${c.name} (${c.start}, nació ${birthYear})`)
    if (c.end > NOW + 1) issues.future.push(`${p.name} · ${c.name} (${c.end})`)
  }

  // Solapamientos fuertes (>1 año compartido entre dos clubes)
  const sorted = [...clubYears].sort((a, b) => a.start - b.start)
  for (let i = 1; i < sorted.length; i++) {
    const overlap = sorted[i - 1].end - sorted[i].start
    if (overlap > 1) issues.overlap.push(`${p.name}: ${sorted[i - 1].name}(${sorted[i - 1].start}-${sorted[i - 1].end}) ∩ ${sorted[i].name}(${sorted[i].start}-${sorted[i].end})`)
  }

  // activeYears vs rango real de clubes
  const av = years(p.activeYears)
  const realStart = Math.min(...clubYears.map((c) => c.start))
  const realEnd = Math.max(...clubYears.map((c) => c.end))
  if (av && (Math.abs(av.start - realStart) > 3 || Math.abs(av.end - realEnd) > 3)) {
    issues.activeMismatch.push(`${p.name}: activeYears ${p.activeYears} vs clubes ${realStart}-${realEnd}`)
  }
}

const pct = (n) => ((n / players.length) * 100).toFixed(1)
console.log(`\n=== Verificación de ${players.length} jugadores ===`)
for (const [k, arr] of Object.entries(issues)) {
  console.log(`\n## ${k}: ${arr.length} (${pct(arr.length)}%)`)
  arr.slice(0, Math.min(LIMIT, 8)).forEach((x) => console.log(`   - ${x}`))
}

const total = Object.values(issues).reduce((s, a) => s + a.length, 0)
console.log(`\n=== Total anomalías: ${total} en ${players.length} jugadores ===`)
const out = path.join(process.cwd(), 'data', 'reports', 'players-verify.json')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(issues, null, 2))
console.log(`Reporte completo -> ${out}`)
