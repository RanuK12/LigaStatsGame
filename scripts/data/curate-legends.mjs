// Cura la base: dedup + corrige/agrega leyendas argentinas con datos verificados
// (posición, clubes, década, rating). Deja un backup de players.json.
//   node scripts/data/curate-legends.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const FILE = path.join(ROOT, 'data', 'players.json')
const players = JSON.parse(fs.readFileSync(FILE, 'utf8'))

// IDs referenciados por squads: NUNCA deben perderse (rompen la Liga Argentina).
let sq = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'squads.json'), 'utf8'))
sq = Array.isArray(sq) ? sq : sq.squads || Object.values(sq).find(Array.isArray) || []
const REFERENCED = new Set()
for (const s of sq) for (const pid of s.playerIds || []) REFERENCED.add(pid)

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const clubs = (arr) => arr.map(([name, years]) => ({ id: slug(name), name, years }))

// ── 1) DEDUP por nombre + fecha, preservando el id referenciado por squads ──
const completeness = (p) => (p.clubs?.length || 0) * 100 + (p.rating || 0)
// mejor = referenciado por squad primero, luego más completo
const better = (a, b) => {
  const ra = REFERENCED.has(a.id) ? 1 : 0
  const rb = REFERENCED.has(b.id) ? 1 : 0
  if (ra !== rb) return ra > rb ? a : b
  return completeness(a) >= completeness(b) ? a : b
}
const byKey = new Map()
for (const p of players) {
  const k = `${p.name}|${p.birthDate || ''}`
  const prev = byKey.get(k)
  byKey.set(k, prev ? better(prev, p) : p)
}
let deduped = [...byKey.values()]
const removedExact = players.length - deduped.length

// ── 2) Leyendas canónicas: se REEMPLAZA cualquier fila con ese nombre ──
const LEGENDS = [
  { name: 'Lionel Messi', fullName: 'Lionel Andrés Messi', birthDate: '1987-06-24', position: 'RW', nationality: 'Argentina', rating: 98, decade: '2000s', activeYears: '2004-2025',
    clubs: clubs([['FC Barcelona', '2004-2021'], ['Paris Saint-Germain', '2021-2023'], ['Inter Miami', '2023-2025'], ['Argentina', '2005-2025']]) },
  { name: 'Diego Maradona', fullName: 'Diego Armando Maradona', birthDate: '1960-10-30', position: 'CAM', nationality: 'Argentina', rating: 97, decade: '1980s', activeYears: '1976-1997',
    clubs: clubs([['Argentinos Juniors', '1976-1981'], ['Boca Juniors', '1981-1982'], ['FC Barcelona', '1982-1984'], ['Napoli', '1984-1991'], ['Sevilla', '1992-1993'], ['Newell\'s Old Boys', '1993-1994'], ['Argentina', '1977-1994']]) },
  { name: 'Alfredo Di Stéfano', fullName: 'Alfredo Stéfano Di Stéfano', birthDate: '1926-07-04', position: 'CF', nationality: 'Argentina', rating: 95, decade: '1950s', activeYears: '1945-1966',
    clubs: clubs([['River Plate', '1945-1949'], ['Millonarios', '1949-1953'], ['Real Madrid', '1953-1964'], ['Espanyol', '1964-1966'], ['Argentina', '1947-1947']]) },
  { name: 'Juan Román Riquelme', fullName: 'Juan Román Riquelme', birthDate: '1978-06-24', position: 'CAM', nationality: 'Argentina', rating: 90, decade: '2000s', activeYears: '1996-2015',
    clubs: clubs([['Boca Juniors', '1996-2002'], ['FC Barcelona', '2002-2003'], ['Villarreal', '2003-2007'], ['Boca Juniors', '2007-2014'], ['Argentinos Juniors', '2014-2015'], ['Argentina', '1997-2008']]) },
  { name: 'Gabriel Batistuta', fullName: 'Gabriel Omar Batistuta', birthDate: '1969-02-01', position: 'ST', nationality: 'Argentina', rating: 93, decade: '1990s', activeYears: '1988-2005',
    clubs: clubs([['Newell\'s Old Boys', '1988-1989'], ['River Plate', '1989-1990'], ['Boca Juniors', '1990-1991'], ['Fiorentina', '1991-2000'], ['AS Roma', '2000-2003'], ['Inter Milan', '2003-2003'], ['Argentina', '1991-2002']]) },
  { name: 'Sergio Agüero', fullName: 'Sergio Leonel Agüero', birthDate: '1988-06-02', position: 'ST', nationality: 'Argentina', rating: 90, decade: '2010s', activeYears: '2003-2021',
    clubs: clubs([['Independiente', '2003-2006'], ['Atlético Madrid', '2006-2011'], ['Manchester City', '2011-2021'], ['FC Barcelona', '2021-2021'], ['Argentina', '2006-2021']]) },
  { name: 'Ángel Di María', fullName: 'Ángel Fabián Di María', birthDate: '1988-02-14', position: 'RW', nationality: 'Argentina', rating: 88, decade: '2010s', activeYears: '2005-2025',
    clubs: clubs([['Rosario Central', '2005-2007'], ['Benfica', '2007-2010'], ['Real Madrid', '2010-2014'], ['Manchester United', '2014-2015'], ['Paris Saint-Germain', '2015-2022'], ['Juventus', '2022-2023'], ['Benfica', '2023-2024'], ['Rosario Central', '2025-2025'], ['Argentina', '2008-2025']]) },
  { name: 'Gonzalo Higuaín', fullName: 'Gonzalo Gerardo Higuaín', birthDate: '1987-12-10', position: 'ST', nationality: 'Argentina', rating: 87, decade: '2010s', activeYears: '2005-2023',
    clubs: clubs([['River Plate', '2005-2007'], ['Real Madrid', '2007-2013'], ['Napoli', '2013-2016'], ['Juventus', '2016-2019'], ['AC Milan', '2019-2019'], ['Chelsea', '2019-2019'], ['Inter Miami', '2020-2023'], ['Argentina', '2009-2018']]) },
  { name: 'Pablo Aimar', fullName: 'Pablo César Aimar', birthDate: '1979-11-03', position: 'CAM', nationality: 'Argentina', rating: 86, decade: '2000s', activeYears: '1996-2015',
    clubs: clubs([['River Plate', '1996-2001'], ['Valencia', '2001-2006'], ['Zaragoza', '2006-2008'], ['Benfica', '2008-2013'], ['Argentina', '1999-2009']]) },
  { name: 'Esteban Cambiasso', fullName: 'Esteban Matías Cambiasso', birthDate: '1980-04-18', position: 'CDM', nationality: 'Argentina', rating: 86, decade: '2000s', activeYears: '1996-2017',
    clubs: clubs([['Independiente', '1996-1998'], ['Real Madrid', '2002-2004'], ['Inter Milan', '2004-2014'], ['Leicester City', '2014-2015'], ['Argentina', '2000-2011']]) },
  { name: 'Paulo Dybala', fullName: 'Paulo Bruno Dybala', birthDate: '1993-11-15', position: 'CF', nationality: 'Argentina', rating: 87, decade: '2010s', activeYears: '2011-2025',
    clubs: clubs([['Instituto', '2011-2012'], ['Palermo', '2012-2015'], ['Juventus', '2015-2022'], ['AS Roma', '2022-2025'], ['Argentina', '2015-2025']]) },
  { name: 'Mauro Icardi', fullName: 'Mauro Emanuel Icardi', birthDate: '1993-02-19', position: 'ST', nationality: 'Argentina', rating: 84, decade: '2010s', activeYears: '2011-2025',
    clubs: clubs([['Sampdoria', '2012-2013'], ['Inter Milan', '2013-2019'], ['Paris Saint-Germain', '2019-2022'], ['Galatasaray', '2022-2025'], ['Argentina', '2013-2018']]) },
]

// Matchea aunque el registro original use el nombre completo (ej. "Diego Armando
// Maradona" vs "Diego Maradona") para no dejar duplicados.
const matchesLegend = (p, l) =>
  p.name === l.name || p.fullName === l.fullName || p.name === l.fullName || p.fullName === l.name
const reuseId = {}
for (const l of LEGENDS) {
  const rows = deduped.filter((p) => matchesLegend(p, l))
  const ref = rows.find((p) => REFERENCED.has(p.id))
  reuseId[l.name] = ref?.id || rows[0]?.id || `${slug(l.name)}-${(l.birthDate || '').slice(0, 4)}`
}
deduped = deduped.filter((p) => !LEGENDS.some((l) => matchesLegend(p, l)))

for (const l of LEGENDS) {
  deduped.push({
    id: reuseId[l.name],
    name: l.name,
    fullName: l.fullName,
    birthDate: l.birthDate,
    position: l.position,
    positions: [l.position],
    nationality: l.nationality,
    height: 1.75,
    weight: 74,
    preferredFoot: 'Derecho',
    clubs: l.clubs,
    capsNationalTeam: 50,
    goalsNationalTeam: 15,
    capsClub: 400,
    goalsClub: l.position === 'ST' || l.position === 'CF' ? 200 : 60,
    assistsClub: 80,
    trophies: [],
    image: '',
    marketValue: '0',
    activeYears: l.activeYears,
    decade: l.decade,
    rating: l.rating,
    legendary: true,
  })
}

// ── Red de seguridad: ningún id referenciado por squads puede faltar ──
const finalIds = new Set(deduped.map((p) => p.id))
let readded = 0
for (const id of REFERENCED) {
  if (!finalIds.has(id)) {
    const orig = players.find((p) => p.id === id)
    if (orig) {
      deduped.push(orig)
      finalIds.add(id)
      readded++
    }
  }
}

// ── 3) Marcar legendary a otros grandes ya presentes ──
const ALSO_LEGENDARY = ['Juan Sebastián Verón', 'Hernán Crespo', 'Javier Mascherano', 'Fernando Redondo', 'Javier Zanetti', 'Daniel Passarella', 'Mario Kempes', 'Carlos Tevez', 'Ariel Ortega', 'Oscar Ruggeri']
for (const p of deduped) if (ALSO_LEGENDARY.includes(p.name)) p.legendary = true

// ── Guardar (no pisar un backup original existente) ──
if (!fs.existsSync(`${FILE}.bak`)) fs.copyFileSync(FILE, `${FILE}.bak`)
fs.writeFileSync(FILE, JSON.stringify(deduped))
console.log(`Dedup exacto: -${removedExact} filas | re-agregados por refs: ${readded}`)
console.log(`Leyendas curadas/agregadas: ${LEGENDS.length}`)
console.log(`Total final: ${deduped.length} (antes ${players.length})`)
console.log(`legendary marcados: ${deduped.filter((p) => p.legendary).length}`)
