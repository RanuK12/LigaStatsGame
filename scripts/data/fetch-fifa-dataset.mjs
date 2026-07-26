// Baja el dataset FIFA 15-23 (el de Kaggle "FIFA complete player dataset", mirror público en
// HuggingFace sin auth) y lo destila a un índice chico para el matching de OVR.
//   node scripts/data/fetch-fifa-dataset.mjs
// Idempotente: si el CSV ya está bajado no lo vuelve a bajar; --force rehace el índice.
import fs from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline'

const ROOT = process.cwd()
const CSV = path.join(ROOT, 'data', 'raw', 'fifa-legacy.csv')
const INDEX = path.join(ROOT, 'data', 'fifa-index.json')
const URL = 'https://huggingface.co/datasets/jsulz/FIFA23/resolve/main/male_players%20(legacy).csv'
const FORCE = process.argv.includes('--force')

async function download() {
  console.log('Bajando dataset FIFA (~87 MB)...')
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`descarga falló: ${res.status}`)
  fs.mkdirSync(path.dirname(CSV), { recursive: true })
  const out = fs.createWriteStream(CSV)
  const reader = res.body.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    out.write(value)
  }
  await new Promise((r) => out.end(r))
  console.log(`OK: ${CSV} (${(fs.statSync(CSV).size / 1e6).toFixed(0)} MB)`)
}

// Parser CSV mínimo (el dataset trae comillas y comas dentro de campos)
function parseLine(line) {
  const out = []
  let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false }
      else cur += c
    } else if (c === '"') q = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

async function buildIndex() {
  const rl = createInterface({ input: fs.createReadStream(CSV), crlfDelay: Infinity })
  let cols = null
  const idx = {} // player_id -> registro destilado
  let rows = 0
  for await (const line of rl) {
    if (!line) continue
    const f = parseLine(line)
    if (!cols) {
      cols = {}
      f.forEach((name, i) => (cols[name] = i))
      continue
    }
    rows++
    const id = f[cols.player_id]
    const version = Number(f[cols.fifa_version])
    const update = Number(f[cols.fifa_update] || 0)
    const overall = Number(f[cols.overall])
    if (!id || !version || !overall) continue
    const e = (idx[id] ||= { n: '', s: '', d: '', nat: '', pos: '', lv: 0, lu: 0, ov: 0, pot: 0, age: 0, val: 0, club: '', league: '', peak: 0, peakV: 0 })
    if (overall > e.peak) { e.peak = overall; e.peakV = version }
    // nos quedamos con la foto más reciente (última versión, último update)
    if (version > e.lv || (version === e.lv && update >= e.lu)) {
      e.lv = version
      e.lu = update
      e.n = f[cols.long_name]
      e.s = f[cols.short_name]
      e.d = f[cols.dob]
      e.nat = f[cols.nationality_name]
      e.pos = f[cols.player_positions]
      e.ov = overall
      e.pot = Number(f[cols.potential]) || overall
      e.age = Number(f[cols.age]) || 0
      e.val = Number(f[cols.value_eur]) || 0
      e.club = f[cols.club_name] || ''
      e.league = f[cols.league_name] || ''
    }
  }
  for (const e of Object.values(idx)) delete e.lu
  fs.writeFileSync(INDEX, JSON.stringify(idx))
  console.log(`Índice: ${Object.keys(idx).length} jugadores de ${rows} filas → ${INDEX} (${(fs.statSync(INDEX).size / 1e6).toFixed(1)} MB)`)
}

if (!fs.existsSync(CSV)) await download()
else console.log(`CSV ya presente (${(fs.statSync(CSV).size / 1e6).toFixed(0)} MB), no se re-baja.`)
if (FORCE || !fs.existsSync(INDEX)) await buildIndex()
else console.log('Índice ya presente (--force para rehacerlo).')
