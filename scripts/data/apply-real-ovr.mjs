// Aplica el OVR real a data/players.json usando el índice FIFA + el matching de confianza.
//   node scripts/data/apply-real-ovr.mjs [--dry]
//
//   - Leyendas: rating anclado (curado a mano), no se tocan.
//   - Con match FIFA: overall de la última versión donde aparece. Si era joven, se proyecta
//     hacia su potential por los años transcurridos (el dataset llega a FIFA 23 = rosters 2022);
//     si ya no juega, se usa su pico histórico; si hoy pasa los 32, decae suave.
//   - Sin match: se deflacta con el mapeo calibrado contra los pares matcheados (nuestro
//     rating estaba +10 de media sobre el real).
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const REPORT = path.join(ROOT, 'data', 'reports', 'ovr-apply.json')
const DRY = process.argv.includes('--dry')
const NOW = 2026

const players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
const fifa = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fifa-index.json'), 'utf8'))
const cache = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ovr-source-cache.json'), 'utf8'))
const squadsRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'squads.json'), 'utf8'))
const squads = Array.isArray(squadsRaw) ? squadsRaw : squadsRaw.squads || Object.values(squadsRaw).find(Array.isArray)

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const yearOf = (version) => 1999 + version // FIFA 23 = rosters 2022
const activos = new Set()
for (const s of squads) if (Number(s.season) >= 2023) for (const id of s.playerIds || []) activos.add(id)

// ---------- OVR desde FIFA ----------
const REALIZACION = 0.7 // el potential de FIFA es un techo: casi nadie lo alcanza entero

function fromFifa(p) {
  const e = fifa[cache[p.id].fifaId]
  const activo = activos.has(p.id)
  const years = NOW - yearOf(e.lv)
  // Proyección hacia el potential: el techo se acerca alrededor de los 27
  let proyectado = e.ov
  const joven = e.pot > e.ov && e.age && e.age < 27 && years > 0
  if (joven) {
    const progreso = clamp(years / Math.max(1, 27 - e.age), 0, 1)
    proyectado = e.ov + (e.pot - e.ov) * progreso * REALIZACION
  }
  // Sin rastro en planteles recientes: es su carta histórica, el mejor de sus registros
  if (!activo && e.lv < 23) return { ovr: Math.round(clamp(Math.max(e.peak, proyectado), 45, 95)), via: 'pico' }
  // Declive de los veteranos (el dataset los congeló hasta 4 años atrás)
  const edadHoy = e.age ? e.age + years : 0
  const umbral = p.position === 'GK' ? 35 : 33 // los arqueros aguantan más
  if (edadHoy > umbral) proyectado -= Math.min(6, (edadHoy - umbral) * 0.7)
  return { ovr: Math.round(clamp(proyectado, 45, 95)), via: joven ? 'proyectado' : 'directo' }
}

// ---------- Calibración para los que no tienen match ----------
// Con los pares matcheados sacamos, por tramo de 5 de NUESTRO rating, la mediana del OVR real.
const band = (r) => Math.floor(r / 5) * 5
const muestras = {}
const fifaOvr = {}
for (const p of players) {
  if (!cache[p.id] || p.legendary) continue
  const { ovr } = fromFifa(p)
  fifaOvr[p.id] = ovr
  ;(muestras[band(p.rating || 0)] ||= []).push(ovr)
}
const mediana = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)]
const mapa = {}
for (const [b, vals] of Object.entries(muestras)) if (vals.length >= 8) mapa[b] = mediana(vals)
// monótono: un tramo más alto nunca puede mapear más bajo que uno menor
const bandas = Object.keys(mapa).map(Number).sort((a, b) => a - b)
for (let i = 1; i < bandas.length; i++) mapa[bandas[i]] = Math.max(mapa[bandas[i]], mapa[bandas[i - 1]])

function calibrado(r) {
  const b = band(r || 0)
  if (mapa[b] != null) return mapa[b] + (r - b) * 0.4 // dentro del tramo mantiene el orden relativo
  const cercana = bandas.reduce((best, x) => (Math.abs(x - b) < Math.abs(best - b) ? x : best), bandas[0])
  return mapa[cercana] + (b - cercana) * 0.5
}

// ---------- Piso competitivo ----------
// Tras la deflación, el grueso del plantel quedó en 65-74 y un draft de jugadores comunes
// casi no podía sumar. Los que quedan por debajo de 78 suben 2-3 puntos (pedido de Emilio).
const pisoCompetitivo = (r) => (r <= 70 ? r + 3 : r <= 77 ? r + 2 : r)

// ---------- Aplicar ----------
const via = { leyenda: 0, directo: 0, proyectado: 0, pico: 0, calibrado: 0 }
const cambios = []
const nuevo = {}
const antes = {}
const despues = {}
for (const p of players) {
  antes[band(p.rating || 0)] = (antes[band(p.rating || 0)] || 0) + 1
  const from = p.rating
  let to = from
  if (p.legendary) via.leyenda++
  else if (cache[p.id]) {
    const r = fromFifa(p)
    to = r.ovr
    via[r.via]++
    const e = fifa[cache[p.id].fifaId]
    const sc = cache[p.id].score
    const placeholder = !p.birthDate || p.birthDate.endsWith('-06-15')
    if (!DRY && e.d && (sc >= 7 || (sc >= 5 && placeholder))) p.birthDate = e.d
    if (!DRY && e.val > 0 && activos.has(p.id)) {
      p.marketValue = e.val >= 1e6 ? `€${(e.val / 1e6).toFixed(1)}M` : `€${Math.round(e.val / 1e3)}K`
    }
  } else {
    to = Math.round(clamp(calibrado(from || 0), 50, 84)) // un desconocido sin fuente no es top mundial
    via.calibrado++
  }
  if (!p.legendary) to = pisoCompetitivo(to)
  nuevo[p.id] = to
  if (!DRY) p.rating = to
  despues[band(to)] = (despues[band(to)] || 0) + 1
  if (to !== from) cambios.push({ id: p.id, name: p.name, from, to, d: to - from })
}

console.log('Vía:', via)
console.log('Mapa calibrado (nuestro tramo -> OVR real mediano):', Object.entries(mapa).map(([b, v]) => `${b}:${v}`).join(' '))
const fmt = (d) => Object.entries(d).sort((a, b) => a[0] - b[0]).map(([b, n]) => `${b}-${+b + 4}:${n}`).join('  ')
console.log('\nDistribución ANTES:  ', fmt(antes))
console.log('Distribución DESPUÉS:', fmt(despues))
console.log(`\nCambian ${cambios.length}. Mayores caídas:`)
cambios.slice().sort((a, b) => a.d - b.d).slice(0, 10).forEach((c) => console.log(`  ${c.name}: ${c.from} -> ${c.to}`))
console.log('Mayores subidas:')
cambios.slice().sort((a, b) => b.d - a.d).slice(0, 10).forEach((c) => console.log(`  ${c.name}: ${c.from} -> ${c.to}`))
console.log('\nSpot-check:')
;['Lionel Messi', 'Julián Alvarez', 'Mauro Boselli', 'Fernando Tobio', 'Paulo Dybala', 'Lautaro Martinez'].forEach((n) => {
  const p = players.find((x) => x.name === n)
  if (p) console.log(`  ${n}: ${p.rating} -> ${nuevo[p.id]}${p.legendary ? ' [leyenda]' : ''}${cache[p.id] ? ` (FIFA ${fifa[cache[p.id].fifaId].ov}/pot ${fifa[cache[p.id].fifaId].pot})` : ' (calibrado)'}`)
})

fs.mkdirSync(path.dirname(REPORT), { recursive: true })
fs.writeFileSync(REPORT, JSON.stringify({ dry: DRY, via, mapa, antes, despues, nuevo, cambios }, null, 2))
if (DRY) { console.log(`\n[dry-run] players.json intacto | reporte: ${REPORT}`); process.exit(0) }
fs.copyFileSync(PLAYERS, `${PLAYERS}.bak`)
fs.writeFileSync(PLAYERS, JSON.stringify(players))
console.log(`\nplayers.json actualizado (backup en players.json.bak) | reporte: ${REPORT}`)
