// Verifica una muestra aleatoria de jugadores contra Wikidata (fuente estructurada):
// compara la CATEGORÍA de posición (Arquero/Defensor/Mediocampista/Delantero).
//   node scripts/data/verify-vs-wikidata.mjs [--n 150]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const players = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'players.json'), 'utf8'))
const args = process.argv.slice(2)
const N = (() => { const i = args.indexOf('--n'); return i >= 0 ? parseInt(args[i + 1], 10) || 150 : 150 })()

const UA = { 'User-Agent': 'Gambeta-verify/1.0 (+https://gambetafutbol.games)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Nuestra posición -> categoría
const ourCat = (pos) => {
  if (pos === 'GK') return 'GK'
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'DEF'
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID'
  return 'ATT'
}
// Label de posición de Wikidata (en/es) -> categoría
const wdCat = (label) => {
  const l = label.toLowerCase()
  if (/goalkeeper|arquero|portero|guardameta/.test(l)) return 'GK'
  // "midfield" primero: "central midfielder"/"defensive midfielder" son MID, no DEF.
  if (/midfield|mediocampista|volante|centrocampista|pivot|enganche/.test(l)) return 'MID'
  if (/defender|back|defensa|lateral|central|zaguero|libero|líbero/.test(l)) return 'DEF'
  if (/forward|striker|winger|delantero|extremo|puntero|atacante|ariete/.test(l)) return 'ATT'
  return null
}

async function wikidataPosition(name) {
  try {
    // 1) buscar entidad
    const s = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=es&type=item&limit=5&format=json&origin=*`,
      { headers: UA },
    )
    const sj = await s.json()
    const cands = sj.search || []
    for (const c of cands) {
      // 2) traer claims de la entidad
      const e = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${c.id}&props=claims&format=json&origin=*`,
        { headers: UA },
      )
      const ej = await e.json()
      const claims = ej.entities?.[c.id]?.claims || {}
      // P106 occupation debe incluir footballer (Q937857) y P413 posición
      const occ = (claims.P106 || []).map((x) => x.mainsnak?.datavalue?.value?.id)
      if (!occ.includes('Q937857')) continue
      const posIds = (claims.P413 || []).map((x) => x.mainsnak?.datavalue?.value?.id).filter(Boolean)
      if (posIds.length === 0) return { found: true, cat: null }
      // 3) resolver label de la primera posición
      const p = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${posIds[0]}&props=labels&languages=en|es&format=json&origin=*`,
        { headers: UA },
      )
      const pj = await p.json()
      const lab = pj.entities?.[posIds[0]]?.labels
      const label = lab?.en?.value || lab?.es?.value || ''
      return { found: true, cat: wdCat(label), label }
    }
    return { found: false }
  } catch {
    return { found: false, error: true }
  }
}

const LINE = { GK: 0, DEF: 1, MID: 2, ATT: 3 }
// muestra aleatoria
const sample = [...players].sort(() => Math.random() - 0.5).slice(0, N)
let found = 0,
  match = 0,
  soft = 0,
  gross = 0,
  noPos = 0
const grossList = []

for (const p of sample) {
  const res = await wikidataPosition(p.fullName || p.name)
  if (!res.found) { await sleep(120); continue }
  found++
  if (!res.cat) { noPos++; await sleep(120); continue }
  const oc = ourCat(p.position)
  const dist = Math.abs(LINE[oc] - LINE[res.cat])
  if (dist === 0) match++
  else if (dist === 1) soft++
  else {
    gross++
    if (grossList.length < 20) grossList.push(`${p.name}: nuestro ${p.position}(${oc}) vs wikidata ${res.label}(${res.cat})`)
  }
  await sleep(120)
}

const comparable = match + soft + gross
console.log(`\n=== Verificación contra Wikidata (muestra ${N}) ===`)
console.log(`Cobertura: ${found}/${N} encontrados (${((found / N) * 100).toFixed(0)}%)`)
console.log(`Comparables (con posición): ${comparable}`)
console.log(`✅ Categoría exacta: ${match} (${comparable ? ((match / comparable) * 100).toFixed(1) : 0}%)`)
console.log(`≈ Diferencia suave/ambigua (1 línea, ej extremo↔volante): ${soft} (${comparable ? ((soft / comparable) * 100).toFixed(1) : 0}%)`)
console.log(`❌ Error grave (2+ líneas, ej arquero↔delantero): ${gross} (${comparable ? ((gross / comparable) * 100).toFixed(1) : 0}%)`)
console.log(`→ Bien ubicados (exacta + suave): ${comparable ? (((match + soft) / comparable) * 100).toFixed(1) : 0}%`)
console.log(`\nErrores graves:`)
grossList.length ? grossList.forEach((m) => console.log('  - ' + m)) : console.log('  (ninguno)')
