// Lo poco que necesita el banner de ligas de la portada, calculado en el build.
//
//   node scripts/data/build-ligas-banner.mjs   → data/derived/ligas-banner.json
//
// Por qué existe: el banner importaba `career-engine` para mostrar cuatro números por país, y
// con eso se llevaba `ligas.json` (189 kB) y el motor entero al bundle de la PORTADA. Medido:
// 321 kB de JavaScript en la primera carga del home. El móvil es la mayoría del tráfico y
// convierte cuatro veces peor; ese peso se paga ahí.
//
// El banner solo muestra datos fijos —país, bandera, copa, sus categorías con cuántos clubes y
// qué nivel— así que no hace falta nada de eso en el navegador: se calcula una vez acá.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const ENTRADA = path.join(ROOT, 'data', 'derived', 'ligas.json')
const SALIDA = path.join(ROOT, 'data', 'derived', 'ligas-banner.json')

const datos = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'))

// La misma tabla que `nivelDeLiga` en lib/career-engine.ts. Está duplicada a propósito y no
// importada: este script corre en Node sin el alias `@/`, y son catorce números que cambian
// cuando alguien decide cambiarlos, no solos. Si se tocan allá, se tocan acá.
const NIVELES = {
  'br-1': 95, 'sa-1': 82, 'mx-1': 81, 'ar-1': 79, 'co-1': 74, 'uy-1': 72, 'cl-1': 71,
  'py-1': 70, 'pe-1': 68, 'br-2': 55, 'ar-2': 45, 'mx-2': 42, 'ar-3': 18, 'ar-3f': 12,
}

function mediaDeLiga(ligaId) {
  const clubes = datos.clubes.filter((c) => c.ligaId === ligaId)
  if (clubes.length === 0) return 0
  const fuerzas = clubes.map((c) => c.strength ?? c.fuerza ?? 0).sort((a, b) => b - a)
  const top = fuerzas.slice(0, Math.max(1, Math.round(fuerzas.length * 0.4)))
  const media = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length
  return media(top) * 0.66 + media(fuerzas) * 0.34
}

const medias = datos.ligas.map((l) => mediaDeLiga(l.id)).filter((m) => m > 0)
const piso = Math.min(...medias)
const techo = Math.max(...medias)

function nivelDeLiga(ligaId) {
  if (NIVELES[ligaId] !== undefined) return NIVELES[ligaId]
  const mia = mediaDeLiga(ligaId)
  if (mia <= 0) return 0
  const rango = Math.max(techo - piso, 1)
  return Math.round(Math.min(100, Math.max(5, 8 + ((mia - piso) / rango) * 92)))
}

function etiquetaDeNivel(n) {
  if (n >= 85) return 'Elite'
  if (n >= 65) return 'Alta'
  if (n >= 45) return 'Media'
  if (n >= 25) return 'Baja'
  return 'Amateur'
}

const clubesDe = (ligaId) => datos.clubes.filter((c) => c.ligaId === ligaId).length

const paises = datos.paises
  .map((p) => {
    const suyas = datos.ligas
      .filter((l) => l.pais === p.nombre)
      .sort((a, b) => a.division - b.division)
      .map((l) => ({ id: l.id, nombre: l.nombre, clubes: clubesDe(l.id), nivel: nivelDeLiga(l.id) }))
    const tope = Math.max(...suyas.map((l) => l.nivel))
    return { nombre: p.nombre, bandera: p.bandera, copa: p.copa, ligas: suyas, tope, etiqueta: etiquetaDeNivel(tope) }
  })
  .sort((a, b) => b.tope - a.tope)

const salida = {
  paises,
  totalPaises: paises.length,
  totalLigas: datos.ligas.length,
  totalClubes: datos.ligas.reduce((a, l) => a + clubesDe(l.id), 0),
}

fs.writeFileSync(SALIDA, JSON.stringify(salida))
const kb = (fs.statSync(SALIDA).size / 1024).toFixed(1)
console.log(`  ✓ ligas-banner.json  ${kb} kB · ${salida.totalPaises} países · ${salida.totalLigas} ligas · ${salida.totalClubes} clubes`)
