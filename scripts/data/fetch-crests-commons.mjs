// Los escudos reales de los clubes del modo carrera, desde Wikimedia Commons.
//
//   node scripts/data/fetch-crests-commons.mjs [--limit N] [--forzar]
//
// DE DÓNDE SE BAJAN Y POR QUÉ IMPORTA
//
// Solo de Wikimedia Commons, y solo los que la propia API declara con licencia libre. No se
// scrapea el CDN de otra app: eso es tomar el trabajo de otro y además no dice nada sobre los
// derechos del escudo.
//
// Casi todos los escudos de clubes sudamericanos están en Commons como DOMINIO PÚBLICO por
// copyright —son formas geométricas sin originalidad suficiente para registrarse— con la
// restricción "trademarked". Esa marca limita el uso que implique afiliación o respaldo del
// club, no el uso identificativo: mostrar el escudo de Peñarol al lado del nombre "Peñarol"
// para que se sepa de qué club se habla es exactamente para lo que sirve una marca.
//
// Lo que NO se baja: cualquier archivo cuya licencia no sea libre. Se saltea y queda el escudo
// generado, que para eso está.
//
// Cada archivo queda registrado en public/logos/carrera/CREDITOS.json con su licencia, su autor
// y el link a Commons, que es lo que corresponde y lo que permite revisarlo después.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'public', 'logos', 'carrera')
const CREDITOS = path.join(SALIDA, 'CREDITOS.json')
const { clubes } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'ligas.json'), 'utf8'))

const UA = { 'User-Agent': 'GambetaGame/1.0 (https://gambetafutbol.games; escudos para un juego gratuito)' }
const args = process.argv.slice(2)
const forzar = args.includes('--forzar')
const limite = Number(args[args.indexOf('--limit') + 1]) || Infinity

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/** Las licencias que permiten redistribuir. Lo que no esté acá, no se baja. */
const LIBRES = [
  /^public domain$/i,
  /^pd/i,
  /^cc0/i,
  /^cc[- ]by(-sa)?([- ]\d(\.\d)?)?$/i,
  /^cc by(-sa)?[- ]\d/i,
]

const esLibre = (lic) => Boolean(lic) && LIBRES.some((re) => re.test(lic.trim()))

async function json(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA })
      if (r.ok) return await r.json()
    } catch {
      /* red: se reintenta */
    }
    await dormir(1500 * (i + 1))
  }
  return null
}

/** Los logos declarados en Wikidata (P154) para estos clubes. */
async function logosDeWikidata(qids) {
  const out = new Map()
  for (let i = 0; i < qids.length; i += 140) {
    const vals = qids.slice(i, i + 140).map((q) => `wd:${q}`).join(' ')
    const q = `SELECT ?c ?logo WHERE { VALUES ?c { ${vals} } ?c wdt:P154 ?logo }`
    const d = await json(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`)
    for (const b of d?.results?.bindings ?? []) {
      const qid = b.c.value.split('/').pop()
      // La URL de Wikidata viene percent-encoded y con guiones bajos.
      if (!out.has(qid)) out.set(qid, decodeURIComponent(b.logo.value.split('/').pop()).replace(/_/g, ' '))
    }
    await dormir(1200)
  }
  return out
}

/** La licencia y la URL de descarga de un archivo de Commons. */
async function archivoDeCommons(titulo) {
  const u =
    'https://commons.wikimedia.org/w/api.php?' +
    new URLSearchParams({
      action: 'query',
      titles: `File:${titulo}`,
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '256',
      format: 'json',
    })
  const d = await json(u)
  const pg = Object.values(d?.query?.pages ?? {})[0]
  const info = pg?.imageinfo?.[0]
  if (!info) return null
  const md = info.extmetadata ?? {}
  const limpiar = (s) => (s ?? '').replace(/<[^>]*>/g, '').trim()
  return {
    // thumburl da un PNG del tamaño pedido incluso para los SVG, que es lo que necesitamos.
    url: info.thumburl || info.url,
    licencia: limpiar(md.LicenseShortName?.value),
    autor: limpiar(md.Artist?.value).slice(0, 120),
    pagina: info.descriptionurl,
    restricciones: limpiar(md.Restrictions?.value),
  }
}

async function bajar(url, destino) {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) return false
  const buf = Buffer.from(await r.arrayBuffer())
  // Un archivo de 300 bytes es una página de error, no un escudo.
  if (buf.length < 800) return false
  fs.writeFileSync(destino, buf)
  return true
}

/**
 * Buscar el escudo en Commons por NOMBRE, para los clubes que no lo tienen declarado en
 * Wikidata (P154). Son la mayoría: 140 de 378 lo declaran, pero muchos más tienen su escudo
 * subido a Commons sin que nadie los haya enlazado.
 *
 * Se pide el nombre completo y se aceptan solo los archivos que se ven como un escudo: el
 * título tiene que decir escudo/logo/crest Y contener parte del nombre del club. Sin eso la
 * búsqueda devuelve fotos de la cancha y banderas de la hinchada.
 */
async function buscarEnCommons(club) {
  const nombre = club.nombre.replace(/["']/g, '')
  for (const consulta of [`${nombre} escudo`, `${nombre} logo`, `escudo ${club.corto}`]) {
    const u =
      'https://commons.wikimedia.org/w/api.php?' +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: `${consulta} filetype:bitmap|drawing`,
        srnamespace: '6',
        srlimit: '6',
        format: 'json',
      })
    const d = await json(u)
    await dormir(320)
    for (const r of d?.query?.search ?? []) {
      const titulo = r.title.replace(/^File:/, '')
      const t = titulo.toLowerCase()
      if (!/escudo|logo|crest|badge|shield/.test(t)) continue
      // Y que nombre al club: "Escudo del Club Atlético X", no "Escudo de la ciudad de X".
      const palabras = nombre
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4 && !/^(club|futbol|fútbol|atlético|atletico|deportivo|social)$/.test(w))
      if (palabras.length && !palabras.some((w) => t.includes(w))) continue
      if (/ciudad|estadio|stadium|bandera|flag|hinchada|mapa|map/.test(t)) continue
      return titulo
    }
  }
  return null
}

async function main() {
  fs.mkdirSync(SALIDA, { recursive: true })
  let creditos = {}
  try {
    creditos = JSON.parse(fs.readFileSync(CREDITOS, 'utf8'))
  } catch {
    /* primera corrida */
  }

  const conQid = clubes.filter((c) => c.qid)
  console.log(`${conQid.length} clubes con QID; pidiendo los logos a Wikidata…`)
  const logos = await logosDeWikidata(conQid.map((c) => c.qid))
  console.log(`${logos.size} tienen logo declarado\n`)

  let bajados = 0
  let sinLicencia = 0
  let procesados = 0

  for (const club of conQid) {
    if (procesados >= limite) break
    let titulo = logos.get(club.qid)
    if (!titulo) {
      titulo = await buscarEnCommons(club)
      if (!titulo) continue
    }
    const destino = path.join(SALIDA, `${club.id}.png`)
    if (fs.existsSync(destino) && !forzar) continue
    procesados += 1

    const info = await archivoDeCommons(titulo)
    await dormir(350)
    if (!info) continue

    if (!esLibre(info.licencia)) {
      // Sin licencia libre no se baja: queda el escudo generado.
      sinLicencia += 1
      console.log(`  ✗ ${club.corto}: licencia "${info.licencia || 'desconocida'}", se saltea`)
      continue
    }

    if (await bajar(info.url, destino)) {
      creditos[club.id] = {
        club: club.nombre,
        archivo: titulo,
        licencia: info.licencia,
        autor: info.autor || 'sin autor declarado',
        fuente: info.pagina,
        ...(info.restricciones ? { restricciones: info.restricciones } : {}),
      }
      bajados += 1
      console.log(`  ✓ ${club.corto} — ${info.licencia}`)
    }
  }

  fs.writeFileSync(CREDITOS, JSON.stringify(creditos, null, 1))
  const total = Object.keys(creditos).length
  console.log(`\n${bajados} escudos nuevos · ${total} en total → public/logos/carrera/`)
  if (sinLicencia) console.log(`${sinLicencia} salteados por licencia no libre (les queda el generado)`)
  console.log(`Créditos en ${path.relative(ROOT, CREDITOS)}`)
}

main()
