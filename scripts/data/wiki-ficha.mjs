// Lee la FICHA de un futbolista en la Wikipedia en español y la devuelve como datos.
//
// Por qué existe. El cruce de planteles históricos (cruzar-historicos.mjs) confirmaba a cada
// jugador con la INTRODUCCIÓN de su artículo. Medido el 15/8: de los 14 planteles verificados que
// no entraban al juego, 9 estaban completos en Wikidata —con arquero incluido— y se caían en ese
// filtro, porque la introducción de un futbolista muchas veces no nombra los clubes ("es un
// exfutbolista argentino que se desempeñaba como guardameta"). La ficha SÍ los nombra siempre, y
// además trae los años, así que confirma la temporada y no solo el club.
//
// Lo que devuelve, todo de la plantilla {{Ficha de deportista}}:
//   · posicion       el puesto tal como lo escribe Wikipedia ("Arquero", "Defensor lateral")
//   · clubes         [{ nombre, desde, hasta }] de la lista `equipos`
//   · caps, golesSeleccion, nacimiento, altura, peso
//
// No inventa: lo que no está en la ficha vuelve vacío.
//
//   node scripts/data/wiki-ficha.mjs "Franco Costanzo" "Ubaldo Fillol"

const UA = { 'User-Agent': 'GambetaBot/1.0 (https://gambetafutbol.games; datos del juego)' }
const API = 'https://es.wikipedia.org/w/api.php'

/** El bloque {{Ficha ...}} completo, contando llaves: adentro hay plantillas anidadas. */
export function bloqueDeFicha(wikitexto) {
  const i = wikitexto.search(/\{\{\s*Ficha de (deportista|futbolista)/i)
  if (i < 0) return ''
  let nivel = 0
  for (let j = i; j < wikitexto.length - 1; j++) {
    if (wikitexto[j] === '{' && wikitexto[j + 1] === '{') { nivel++; j++ }
    else if (wikitexto[j] === '}' && wikitexto[j + 1] === '}') {
      nivel--; j++
      if (nivel === 0) return wikitexto.slice(i, j + 1)
    }
  }
  return wikitexto.slice(i)
}

/**
 * Los campos de la plantilla, partidos por `|` de primer nivel.
 *
 * Partir por `|` a secas rompe con `{{altura|m=1.88}}` y con `[[Río Cuarto (Córdoba)|Río Cuarto]]`:
 * el corte tiene que ignorar lo que está dentro de llaves o de corchetes.
 */
export function camposDeFicha(bloque) {
  const cuerpo = bloque.replace(/^\{\{[^\n|]*/, '')
  const campos = {}
  let nivelLlave = 0, nivelCorchete = 0, actual = ''
  const cerrar = () => {
    const eq = actual.indexOf('=')
    if (eq > 0) {
      const k = actual.slice(0, eq).trim().toLowerCase()
      const v = actual.slice(eq + 1).trim()
      if (k && !(k in campos)) campos[k] = v
    }
    actual = ''
  }
  for (let i = 0; i < cuerpo.length; i++) {
    const c = cuerpo[i], sig = cuerpo[i + 1]
    if (c === '{' && sig === '{') { nivelLlave++; actual += '{{'; i++; continue }
    if (c === '}' && sig === '}') { nivelLlave--; if (nivelLlave < 0) break; actual += '}}'; i++; continue }
    if (c === '[' && sig === '[') { nivelCorchete++; actual += '[['; i++; continue }
    if (c === ']' && sig === ']') { nivelCorchete--; actual += ']]'; i++; continue }
    if (c === '|' && nivelLlave === 0 && nivelCorchete === 0) { cerrar(); continue }
    actual += c
  }
  cerrar()
  return campos
}

/** El texto que se lee, sin marcas: [[Club Atlético River Plate|River Plate]] → River Plate. */
export function limpio(v) {
  return (v || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<ref[^>]*\/>/g, ' ')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, ' ')
    .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/'{2,}/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * La trayectoria: una línea por club, con los años entre paréntesis.
 *
 * Los formatos que aparecen de verdad en los artículos: `(2000-2005)`, `(2000-)`, `(2000)`,
 * `(2000-2005, 2008)` y el guion largo `–` en vez del corto.
 */
export function clubesDeFicha(campos) {
  const bruto = campos['equipos'] || campos['clubes'] || ''
  if (!bruto) return []
  const salida = []
  for (const linea of bruto.split(/\n|(?=\*)/)) {
    const t = limpio(linea.replace(/^\*+/, ''))
    if (!t) continue
    const m = t.match(/^(.*?)\s*\((\d{4})\s*[-–—]?\s*(\d{4})?/)
    if (!m) continue
    // La flecha marca una cesión: el club es el mismo dato, con o sin ella.
    const nombre = m[1].replace(/\{\{[^}]*\}\}/g, '').replace(/^[→↑↓]\s*/, '').trim()
    if (!nombre || nombre.length < 2) continue
    salida.push({ nombre, desde: Number(m[2]), hasta: m[3] ? Number(m[3]) : null })
  }
  return salida
}

const numero = (v) => {
  const m = limpio(v).match(/-?\d+/)
  return m ? Number(m[0]) : null
}

export function fichaDeWikitexto(wikitexto) {
  const bloque = bloqueDeFicha(wikitexto || '')
  if (!bloque) return null
  const c = camposDeFicha(bloque)
  const altura = (c['altura'] || '').match(/m\s*=\s*([\d.]+)/)
  const peso = (c['peso'] || '').match(/kg\s*=\s*([\d.]+)/)
  const nac = (c['fecha nacimiento'] || '').match(/(\d{1,2})\|(\d{1,2})\|(\d{4})|(\d{4})\|(\d{1,2})\|(\d{1,2})/)
  // `goles_clubes` viene como "'''195''' (533 PJ)": los goles y, entre paréntesis, los partidos.
  const golesClubes = limpio(c['goles_clubes'] || c['goles clubes'] || '')
  const gc = golesClubes.match(/(\d+)/)
  const pj = golesClubes.match(/\((\d+)\s*(?:PJ|partidos)/i)
  const caps = numero(c['veces internacional'])
  const golesSel = numero(c['goles internacional'])

  return {
    posicion: limpio(c['posición'] || c['posicion'] || ''),
    clubes: clubesDeFicha(c),
    caps,
    // Wikipedia a veces tiene el campo mal cargado —el artículo de Riquelme dice 70 goles en 51
    // partidos con la selección—, así que lo imposible no entra.
    golesSeleccion: golesSel != null && caps != null && golesSel > caps ? null : golesSel,
    golesClub: gc ? Number(gc[1]) : null,
    partidosClub: pj ? Number(pj[1]) : null,
    // {{fecha|5|9|1980}} es día|mes|año; {{fecha nacimiento|1980|9|5}} es año|mes|día.
    nacimiento: nac
      ? (nac[3] ? `${nac[3]}-${String(nac[2]).padStart(2, '0')}-${String(nac[1]).padStart(2, '0')}`
                : `${nac[4]}-${String(nac[5]).padStart(2, '0')}-${String(nac[6]).padStart(2, '0')}`)
      : null,
    altura: altura ? Math.round(Number(altura[1]) * 100) : null,
    peso: peso ? Math.round(Number(peso[1])) : null,
  }
}

/**
 * Las fichas de muchos títulos, en tandas.
 *
 * La API acepta 50 títulos por request para `revisions`, y devuelve el wikitexto entero. Es más
 * pesado que un extracto, pero es la única forma de tener la ficha, y con caché se pide una vez.
 */
export async function fichasDeWikipedia(titulos, { porTanda = 50, pausaMs = 400, log = () => {} } = {}) {
  const salida = {}
  const unicos = [...new Set(titulos.filter(Boolean))]
  for (let i = 0; i < unicos.length; i += porTanda) {
    const tanda = unicos.slice(i, i + porTanda)
    const u = `${API}?action=query&format=json&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=${encodeURIComponent(tanda.join('|'))}`
    try {
      const j = await (await fetch(u, { headers: UA })).json()
      // Los títulos vuelven normalizados o redirigidos: hay que poder mapearlos al pedido.
      const original = {}
      for (const n of j?.query?.normalized || []) original[n.to] = n.from
      for (const r of j?.query?.redirects || []) original[r.to] = original[r.from] || r.from
      for (const pg of Object.values(j?.query?.pages || {})) {
        const texto = pg?.revisions?.[0]?.slots?.main?.['*'] || ''
        const clave = original[pg.title] || pg.title
        salida[clave] = texto ? { titulo: pg.title, texto, ficha: fichaDeWikitexto(texto) } : null
      }
    } catch (e) {
      log(`tanda ${i / porTanda + 1} falló: ${e.message}`)
    }
    log(`fichas ${Math.min(i + porTanda, unicos.length)}/${unicos.length}`)
    await new Promise((r) => setTimeout(r, pausaMs))
  }
  return salida
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const titulos = process.argv.slice(2)
  if (titulos.length === 0) {
    console.log('uso: node scripts/data/wiki-ficha.mjs "Nombre del artículo" [...]')
    process.exit(1)
  }
  const fichas = await fichasDeWikipedia(titulos)
  for (const [t, d] of Object.entries(fichas)) {
    console.log(`\n== ${t}`)
    console.log(d?.ficha ? JSON.stringify(d.ficha, null, 1) : '   sin ficha')
  }
}
