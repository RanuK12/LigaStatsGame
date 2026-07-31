// Arma el mazo de datos curiosos del juego.
//
// Dos orígenes, y ninguno admite que alguien escriba un dato de memoria:
//
//   DERIVADOS — se calculan acá mismo sobre data/players.json y data/squads.json. Si el dato
//   cambia, el texto cambia solo. No pueden estar mal salvo que la base esté mal, y la base ya
//   está cruzada contra tres fuentes.
//
//   CURADOS — se escriben a mano en data/curiosidades.json, pero cada uno necesita DOS fuentes
//   independientes (`fuentes: [url, url]`) y las verifica scripts/data/verificar-curiosidades.mjs
//   contra Wikipedia en español e inglés. El que no pasa, no entra al mazo.
//
//   node scripts/data/build-curiosidades.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const leer = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))

const players = leer('players.json')
const squads = leer('squads.json')
const clubs = leer('clubs.json')

const porId = new Map(players.map((p) => [p.id, p]))
const clubPorId = new Map(clubs.map((c) => [c.id, c]))
const historicos = squads.filter((s) => s.historico)
const nombreClub = (id) => clubPorId.get(id)?.name ?? id

const cuenta = (items, clave) => {
  const m = new Map()
  for (const x of items) {
    const k = clave(x)
    if (k == null) continue
    m.set(k, (m.get(k) || 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

/** Rareza del dato: lo que casi nadie sabe vale más que lo que se ve en la tabla. */
const RAREZAS = { comun: 'comun', insolito: 'insolito', leyenda: 'leyenda' }

const derivados = []
const agregar = (id, rareza, texto, extra = {}) => derivados.push({ id, origen: 'derivado', rareza, texto, ...extra })

// ── Quién aparece en más planteles históricos ──
{
  const apariciones = cuenta(
    historicos.flatMap((s) => [...new Set(s.playerIds)]),
    (id) => (porId.has(id) ? porId.get(id).name : null),
  )
  const max = apariciones[0]?.[1]
  const empatados = apariciones.filter(([, n]) => n === max).map(([nombre]) => nombre)
  if (max >= 2) {
    agregar(
      'mas-planteles-historicos',
      RAREZAS.insolito,
      empatados.length === 1
        ? `${empatados[0]} está en ${max} de los ${historicos.length} planteles históricos del juego. Nadie aparece en más.`
        : `${empatados.slice(0, 2).join(' y ')} comparten el récord: ${max} planteles históricos cada uno.`,
    )
  }
}

// ── El plantel más numeroso ──
{
  const mayor = [...historicos].sort((a, b) => b.playerIds.length - a.playerIds.length)[0]
  if (mayor) {
    agregar(
      'plantel-mas-numeroso',
      RAREZAS.comun,
      `El plantel histórico más numeroso del juego es ${mayor.label}, con ${mayor.playerIds.length} jugadores. ${mayor.hito}`,
      { clubId: mayor.clubId, squadId: mayor.id },
    )
  }
}

// ── El club con más planteles históricos ──
{
  const porClub = cuenta(historicos, (s) => s.clubId)
  const [clubId, n] = porClub[0] ?? []
  if (clubId) {
    agregar(
      'club-mas-historicos',
      RAREZAS.comun,
      `De los ${historicos.length} planteles históricos del juego, ${n} son de ${nombreClub(clubId)}. Es el club con más equipos recordados.`,
      { clubId },
    )
  }
}

// ── Arqueros entre las leyendas ──
{
  const leyendas = players.filter((p) => p.legendary)
  const arqueros = leyendas.filter((p) => p.position === 'GK')
  if (leyendas.length > 0) {
    agregar(
      'leyendas-arqueros',
      RAREZAS.comun,
      `El juego tiene ${leyendas.length} leyendas y ${arqueros.length} son arqueros: ${arqueros.slice(0, 3).map((p) => p.name).join(', ')}.`,
    )
  }
}

// ── El jugador con más partidos y el de más goles de la base ──
{
  const conApps = players.filter((p) => (p.capsClub || 0) > 0)
  const masPartidos = [...conApps].sort((a, b) => b.capsClub - a.capsClub)[0]
  if (masPartidos) {
    agregar(
      'mas-partidos',
      RAREZAS.insolito,
      `${masPartidos.name} es el jugador con más partidos de club de toda la base de Gambeta: ${masPartidos.capsClub}.`,
      { playerId: masPartidos.id },
    )
  }
  const masGoles = [...players].sort((a, b) => (b.goalsClub || 0) - (a.goalsClub || 0))[0]
  if (masGoles?.goalsClub > 0) {
    agregar(
      'mas-goles',
      RAREZAS.insolito,
      `${masGoles.name} es el máximo goleador de la base: ${masGoles.goalsClub} goles en clubes.`,
      { playerId: masGoles.id },
    )
  }
}

// ── Un dato por cada hito histórico confirmado: son leyenda, y cada uno es una carta ──
for (const s of historicos) {
  if (!s.hitoConfirmado) continue
  agregar(
    `hito-${s.id}`,
    RAREZAS.leyenda,
    `${s.label}: ${s.hito}`,
    { clubId: s.clubId, squadId: s.id, temporada: s.season },
  )
}

// ── Efemérides: el hito de un club, para el "un día como hoy" ──
// Sin fecha exacta no se puede prometer el día, así que se guarda por AÑO y el home lo usa como
// "hace tantos años". Prometer el día exacto con datos que no tenemos sería inventar.
const efemerides = historicos
  .filter((s) => s.hitoConfirmado)
  .map((s) => ({ anio: Number(s.season), clubId: s.clubId, squadId: s.id, texto: s.hito, label: s.label }))
  .sort((a, b) => a.anio - b.anio)

// ── Curados: entran solo los que pasaron la verificación de dos fuentes ──
const archivoCurados = path.join(DATA, 'curiosidades.json')
const curados = fs.existsSync(archivoCurados) ? JSON.parse(fs.readFileSync(archivoCurados, 'utf8')) : []
const sinFuentes = curados.filter((c) => !Array.isArray(c.fuentes) || c.fuentes.length < 2)
if (sinFuentes.length > 0) {
  console.error(`✗ ${sinFuentes.length} curiosidades curadas sin dos fuentes. No se compila:`)
  sinFuentes.forEach((c) => console.error(`  - ${c.id}: ${c.texto?.slice(0, 60)}`))
  process.exit(1)
}
const noVerificados = curados.filter((c) => c.verificado !== true)
if (noVerificados.length > 0) {
  console.error(`✗ ${noVerificados.length} curiosidades sin verificar. Corré verificar-curiosidades.mjs primero:`)
  noVerificados.forEach((c) => console.error(`  - ${c.id}`))
  process.exit(1)
}

const mazo = [...derivados, ...curados.map((c) => ({ ...c, origen: 'curado' }))]

const salida = path.join(DATA, 'derived', 'curiosidades.json')
fs.mkdirSync(path.dirname(salida), { recursive: true })
fs.writeFileSync(salida, JSON.stringify({ mazo, efemerides }, null, 2))

const porRareza = cuenta(mazo, (c) => c.rareza)
console.log(`${mazo.length} datos en el mazo (${derivados.length} derivados, ${curados.length} curados)`)
porRareza.forEach(([r, n]) => console.log(`  ${r}: ${n}`))
console.log(`${efemerides.length} efemérides · ${path.relative(ROOT, salida)}`)
