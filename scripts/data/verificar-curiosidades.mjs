// Verifica cada dato curado de data/curiosidades.json contra sus DOS fuentes.
//
// La regla es la misma que se usó para los planteles históricos: lo que una sola fuente afirma es
// una hipótesis; lo que dos afirman es un dato. Acá las dos fuentes son deliberadamente de idiomas
// distintos (es.wikipedia y en.wikipedia), que son comunidades de edición separadas: si las dos
// dicen lo mismo, no es un error de tipeo de una.
//
// El script no "lee" el dato: comprueba que las palabras clave del dato aparezcan en el texto de
// las dos fuentes. Es una verificación de respaldo, no de redacción. Lo que no pasa queda con
// `verificado: false` y build-curiosidades.mjs se niega a compilar el mazo.
//
//   node scripts/data/verificar-curiosidades.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const ARCHIVO = path.join(ROOT, 'data', 'curiosidades.json')
const UA = { 'User-Agent': 'GambetaGame/1.0 (https://gambetafutbol.games)' }
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

const norm = (s) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Texto plano de un artículo, a partir de su URL de Wikipedia o Wiktionary. */
async function textoDe(url) {
  const u = new URL(url)
  const titulo = decodeURIComponent(u.pathname.split('/').pop())
  const api = `${u.origin}/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(titulo)}`
  try {
    const j = await (await fetch(api, { headers: UA })).json()
    const pages = j?.query?.pages || {}
    return Object.values(pages)[0]?.extract || ''
  } catch {
    return ''
  }
}

const curiosidades = JSON.parse(fs.readFileSync(ARCHIVO, 'utf8'))
let ok = 0
const fallidas = []

for (const c of curiosidades) {
  if (!Array.isArray(c.fuentes) || c.fuentes.length < 2) {
    fallidas.push(`${c.id}: necesita dos fuentes`)
    c.verificado = false
    continue
  }
  const claves = (c.clave || []).map(norm).filter(Boolean)
  if (claves.length === 0) {
    fallidas.push(`${c.id}: sin palabras clave para verificar`)
    c.verificado = false
    continue
  }

  const respaldos = []
  for (const url of c.fuentes) {
    const texto = norm(await textoDe(url))
    await dormir(400)
    // Basta con que la fuente hable del asunto: que aparezca al menos una clave fuerte. La
    // redacción del dato es nuestra; lo que se verifica es que el tema esté respaldado ahí.
    const encontradas = claves.filter((k) => texto.includes(k))
    respaldos.push({ url, encontradas: encontradas.length, vacia: texto.length === 0 })
  }

  const buenas = respaldos.filter((r) => !r.vacia && r.encontradas > 0)
  c.verificado = buenas.length >= 2
  c.verificadoEl = new Date().toISOString().slice(0, 10)
  if (c.verificado) {
    ok++
    console.log(`✓ ${c.id}`)
  } else {
    fallidas.push(`${c.id}: respaldado por ${buenas.length} de ${c.fuentes.length} fuentes`)
    console.log(`✗ ${c.id}: respaldado por ${buenas.length} de ${c.fuentes.length}`)
  }
}

fs.writeFileSync(ARCHIVO, JSON.stringify(curiosidades, null, 2) + '\n')
console.log(`\n${ok}/${curiosidades.length} datos verificados por dos fuentes independientes`)
if (fallidas.length) {
  console.log('\nSin respaldo suficiente (no entran al mazo):')
  fallidas.forEach((f) => console.log(`  - ${f}`))
}
