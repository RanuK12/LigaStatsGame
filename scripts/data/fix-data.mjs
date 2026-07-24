// Fix minucioso de datos:
//  1) Stats reales de las leyendas (caps/goles selección + club + asistencias).
//  2) Completar datos incompletos conocidos (2da etapa de Tevez en Boca).
//  3) Podar asignaciones anacrónicas en squads (jugador en una temporada donde no estuvo).
//   node scripts/data/fix-data.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const SQUADS = path.join(ROOT, 'data', 'squads.json')
const NOW = 2026

const players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
const byName = {}
players.forEach((p) => (byName[p.name] = p))

// 1) Stats reales (aprox pero fieles) por leyenda:
//    [capsSeleccion, golesSeleccion, capsClub, golesClub, asistenciasClub]
const STATS = {
  'Lionel Messi': [191, 112, 890, 745, 380],
  'Diego Maradona': [91, 34, 491, 259, 130],
  'Alfredo Di Stéfano': [37, 29, 521, 377, 100],
  'Juan Román Riquelme': [51, 17, 655, 160, 170],
  'Gabriel Batistuta': [78, 56, 556, 332, 50],
  'Sergio Agüero': [101, 42, 700, 379, 110],
  'Ángel Di María': [145, 31, 770, 173, 215],
  'Gonzalo Higuaín': [75, 31, 620, 311, 85],
  'Pablo Aimar': [52, 8, 520, 88, 150],
  'Esteban Cambiasso': [52, 5, 690, 52, 60],
  'Paulo Dybala': [41, 5, 510, 180, 90],
  'Mauro Icardi': [10, 0, 440, 234, 40],
}
let statFixes = 0
for (const [name, s] of Object.entries(STATS)) {
  const p = byName[name]
  if (!p) continue
  p.capsNationalTeam = s[0]
  p.goalsNationalTeam = s[1]
  p.capsClub = s[2]
  p.goalsClub = s[3]
  p.assistsClub = s[4]
  statFixes++
}

// 2) Datos incompletos conocidos: 2da etapa de Tevez en Boca (2015-2021)
const tevez = byName['Carlos Tevez']
if (tevez) {
  const boca = (tevez.clubs || []).filter((c) => c.id === 'boca-juniors')
  const hasSecond = boca.some((c) => /201[5-9]|202[01]/.test(c.years || ''))
  if (!hasSecond) {
    tevez.clubs.push({ id: 'boca-juniors', name: 'Boca Juniors', years: '2015-2021' })
  }
}

fs.writeFileSync(PLAYERS, JSON.stringify(players))

// 3) Podar anacronismos en squads (después de completar Tevez)
const byId = {}
players.forEach((p) => (byId[p.id] = p))
let sq = JSON.parse(fs.readFileSync(SQUADS, 'utf8'))
const wrapped = !Array.isArray(sq)
const arr = wrapped ? sq.squads || Object.values(sq).find(Array.isArray) : sq

function stint(p, clubId) {
  const stints = (p.clubs || []).filter((c) => c.id === clubId && c.years)
  if (!stints.length) return null
  let min = Infinity,
    max = -Infinity
  for (const c of stints) {
    const ys = String(c.years).match(/\d{4}/g)
    if (!ys) continue
    const nums = ys.map(Number)
    min = Math.min(min, ...nums)
    max = Math.max(max, /actualidad|present|hoy/i.test(c.years) ? NOW : Math.max(...nums))
  }
  return min === Infinity ? null : { min, max }
}

let pruned = 0
const prunedList = []
for (const s of arr) {
  const y = Number(s.season)
  if (!y) continue
  s.playerIds = (s.playerIds || []).filter((pid) => {
    const p = byId[pid]
    if (!p) return true // ref suelta: no tocar acá
    const st = stint(p, s.clubId)
    if (st && (y < st.min - 1 || y > st.max + 1)) {
      pruned++
      if (prunedList.length < 30) prunedList.push(`${s.id}: ${p.name} (${st.min}-${st.max})`)
      return false
    }
    return true
  })
}

fs.writeFileSync(SQUADS, JSON.stringify(arr, null, 2))

console.log(`Stats de leyendas corregidas: ${statFixes}`)
console.log(`Anacronismos podados de squads: ${pruned}`)
prunedList.forEach((x) => console.log('  - ' + x))
