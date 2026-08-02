// Fichas de promoción para X: carreras simuladas de verdad, renderizadas con el mismo canvas
// que usa el juego.
//
// El plan de redes (docs/PLAN_REDES_0802.md) dice que la ficha final es el anuncio: es lo que
// hace circular a El Ídolo y lo que le pediste al juego. Esto genera un lote para tener siempre
// material listo, sin tener que jugar 15 temporadas a mano cada vez.
//
// Cada carrera sale del motor real (scripts/promo/simular-carreras.ts corre el mismo lazo que
// lib/career-store.ts), así que los números de la placa son números que el juego produce.
//
//   node scripts/fichas-promo.mjs            # 6 fichas en data/reports/fichas-promo/
//   node scripts/fichas-promo.mjs --semilla 99
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { build } from 'vite'
import ts from 'typescript'

const ROOT = process.cwd()
const TMP = path.join(ROOT, 'node_modules', '.cache', 'fichas-promo')
const SALIDA = path.join(ROOT, 'data', 'reports', 'fichas-promo')

const semillaBase = Number(process.argv[process.argv.indexOf('--semilla') + 1]) || 20260802

// Los seis arranques. Distintos puestos y distintos puntos de partida, para que el lote no sea
// seis veces el mismo delantero: la gracia de mostrar varias es que se vean carreras distintas.
const ARRANQUES = [
  { name: 'Nicolás Ferrari', position: 'ST', clubId: 'banfield', ovr: 68 },
  { name: 'Tomás Aguirre', position: 'CAM', clubId: 'argentinos-jrs', ovr: 66 },
  { name: 'Bruno Sosa', position: 'CB', clubId: 'lanus', ovr: 65 },
  { name: 'Iván Quiroga', position: 'GK', clubId: 'huracan', ovr: 67 },
  { name: 'Lautaro Benítez', position: 'LW', clubId: 'rosario-central', ovr: 70 },
  { name: 'Matías Ledesma', position: 'CM', clubId: 'talleres-cba', ovr: 64 },
]

// ── 1. Compilar el simulador ────────────────────────────────────────────────────────────────
// career-engine importa el dataset con el alias @/ y con JSON, así que node solo no lo resuelve.
console.log('compilando el simulador…')
await build({
  configFile: false,
  logLevel: 'error',
  resolve: { alias: { '@': ROOT } },
  build: {
    ssr: true,
    outDir: TMP,
    emptyOutDir: true,
    lib: { entry: path.join(ROOT, 'scripts', 'promo', 'simular-carreras.ts'), formats: ['es'], fileName: 'sim' },
    rollupOptions: { output: { entryFileNames: 'sim.mjs' } },
  },
})
const { carreraCompleta } = await import(path.join(TMP, 'sim.mjs'))

// ── 2. Simular ──────────────────────────────────────────────────────────────────────────────
//
// El motor tiene finales de retiro que van del festejo al bajón: la evasión de impuestos, las
// apuestas, el divorcio. Adentro del juego están bien —le dan verdad a la carrera— pero como pie
// de una placa que sale a buscar jugadores no sirven: nadie entra a un juego por un titular que
// dice que el protagonista terminó en un quilombo judicial.
//
// Así que se prueban varias semillas por arranque y se queda la primera carrera cuyo retiro no
// sea un bajón. Es lo único que se filtra: los números de la placa son los que salieron.
const RETIRO_BAJON =
  /evasi[óo]n|judicial|apuesta|adicci[óo]n|preso|c[áa]rcel|quebr[óo]|fundi[óo]|estaf|divorci|depresi[óo]n|la pas[óo] mal|perder todo|desapareci[óo]/i

function carreraLinda(arranque, semilla) {
  for (let intento = 0; intento < 40; intento++) {
    const c = carreraCompleta(arranque, semilla + intento * 104729)
    if (!RETIRO_BAJON.test(c.retiro)) return c
  }
  // Cuarenta intentos sin una linda: se devuelve la última igual, pero se avisa.
  console.warn(`  ! ${arranque.name}: no encontré un retiro luminoso en 40 intentos`)
  return carreraCompleta(arranque, semilla)
}

const carreras = ARRANQUES.map((a, i) => carreraLinda(a, semillaBase + i * 7919))

// ── 3. La placa de cada una ─────────────────────────────────────────────────────────────────
const esArquero = (pos) => pos === 'GK'

/** El dato del medio cambia según el puesto: los goles de un arquero no son noticia. */
const tercerDato = (c) =>
  esArquero(c.posicion)
    ? { valor: `${c.caps}`, label: 'Selección' }
    : { valor: `${c.goles}`, label: 'Goles' }

/**
 * La volanta dice de qué se trata esta carrera. Es lo que separa una placa de otra cuando salen
 * seis seguidas en la línea de tiempo.
 */
function volanta(c) {
  if (c.mundial) return 'Campeón del mundo'
  if (c.balonDeOro) return 'Balón de Oro'
  if (c.clubes === 1) return 'Un solo club, toda la vida'
  if (c.titulos >= 6) return 'Vitrina llena'
  if (c.titulos === 0) return 'Carrera sin vueltas'
  return 'Modo Carrera'
}

/**
 * El texto que acompaña la placa.
 *
 * Lo que se postea no es "probá mi juego": es el resultado de una partida, que es lo que la
 * gente mira. La pregunta al final es lo que hace que alguien conteste, y una respuesta vale más
 * que un like para que el tweet lo vea alguien más.
 */
// Con la barra final: sin ella el sitio contesta un 301 a la versión con barra, y es un salto de
// más entre el clic y el juego (comprobado contra producción).
const LINK = 'gambetafutbol.games/carrera/?utm_source=x&utm_medium=social&utm_campaign=ficha_carrera'

function tweetDe(c) {
  const abre = c.mundial
    ? `Campeón del mundo con ${c.jugador}.`
    : c.balonDeOro
      ? `Balón de Oro con ${c.jugador}.`
      : c.titulos === 0
        ? `Quince temporadas con ${c.jugador} y ni una vuelta olímpica.`
        : `${c.titulos} títulos con ${c.jugador} en quince temporadas.`

  const camino = c.recorrido.length > 3
    ? `${c.recorrido[0]} → ${c.recorrido[1]} → ... → ${c.recorrido[c.recorrido.length - 1]}.`
    : `${c.recorrido.join(' → ')}.`

  return [
    abre,
    '',
    camino,
    `Terminó pareciéndose a ${c.parecido.nombre}.`,
    '',
    '¿A quién te parecés vos?',
    '',
    LINK,
  ].join('\n')
}

const placas = carreras.map((c) => ({
  // Se sacan los acentos antes de limpiar, si no "Iván" queda como "iv-n".
  archivo: c.jugador
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, ''),
  carrera: c,
  data: {
    volanta: volanta(c),
    titulo: `${c.jugador} se pareció a ${c.parecido.nombre}`,
    subtitulo: `${c.temporadas} temporadas · OVR pico ${c.pico} · ${c.parecido.pct}% de parecido`,
    stats: [
      { valor: `${c.titulos}`, label: 'Títulos' },
      { valor: `${c.partidos}`, label: 'Partidos' },
      tercerDato(c),
      { valor: `${c.clubes}`, label: 'Clubes' },
    ],
    pie: c.retiro,
    acento: c.titulos > 0 ? '#F6C750' : '#74ACDF',
  },
}))

// ── 4. Renderizar con el mismo canvas del juego ─────────────────────────────────────────────
// Se transpila story-card.ts y se corre en una página: el canvas necesita un navegador, y usar
// el módulo de verdad es lo único que garantiza que la placa de promoción sea idéntica a la que
// se baja un jugador.
const js = ts
  .transpileModule(fs.readFileSync(path.join(ROOT, 'lib', 'story-card.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2020 },
  })
  .outputText.replace(/^.*Object\.defineProperty\(exports.*$/m, '')
  .replace(/^exports\..*$/gm, '')
fs.mkdirSync(TMP, { recursive: true })
fs.writeFileSync(path.join(TMP, 'story.js'), js)

fs.mkdirSync(SALIDA, { recursive: true })
const navegador = await chromium.launch()
const pagina = await (await navegador.newContext()).newPage()
await pagina.goto('about:blank')
await pagina.addScriptTag({ path: path.join(TMP, 'story.js') })

for (const p of placas) {
  for (const formato of ['ancha', 'historia']) {
    const url = await pagina.evaluate(
      ([d, f]) => renderStoryCard(d, f).toDataURL('image/png'),
      [p.data, formato],
    )
    const destino = path.join(SALIDA, `${p.archivo}-${formato}.png`)
    fs.writeFileSync(destino, Buffer.from(url.split(',')[1], 'base64'))
  }
}
await navegador.close()

// ── 5. El resumen, para elegir cuál se postea ───────────────────────────────────────────────
const md = [
  '# Fichas de promoción',
  '',
  `Generadas con \`node scripts/fichas-promo.mjs\` (semilla ${semillaBase}). Cada una es una`,
  'carrera simulada con el motor del juego, no una maqueta.',
  '',
  '| Jugador | Puesto | Se pareció a | Temporadas | OVR pico | Títulos | Goles | Clubes |',
  '|---|---|---|---|---|---|---|---|',
  ...carreras.map(
    (c) =>
      `| ${c.jugador} | ${c.posicion} | ${c.parecido.nombre} (${c.parecido.pct} %) | ${c.temporadas} | ${c.pico} | ${c.titulos} | ${c.goles} | ${c.clubes} |`,
  ),
  '',
  '## El recorrido de cada uno',
  '',
  ...carreras.flatMap((c) => [
    `**${c.jugador}** — ${c.recorrido.join(' → ')}`,
    '',
    `> ${c.retiro}`,
    '',
  ]),
  '## Para postear',
  '',
  'El texto va con la placa `-ancha`, que es la que X muestra entera. La `-historia` es para',
  'estados de WhatsApp e Instagram. El link lleva etiqueta para que se vea en Analytics de dónde',
  'vino la gente.',
  '',
  ...carreras.flatMap((c) => [
    `### ${c.jugador} → \`${c.jugador.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ancha.png\``,
    '',
    '```',
    tweetDe(c),
    '```',
    '',
  ]),
]
fs.writeFileSync(path.join(SALIDA, 'README.md'), md.join('\n'))

console.log(`\n${placas.length} carreras · ${placas.length * 2} placas en data/reports/fichas-promo/`)
for (const c of carreras) {
  console.log(
    `  ${c.jugador.padEnd(18)} ${c.posicion.padEnd(4)} pico ${c.pico}  ${String(c.titulos).padStart(2)} títulos  →  ${c.parecido.nombre}`,
  )
}
