// El zip que se sube a itch.io.
//
//   node scripts/data/build-bundle-itchio.mjs
//
// EL PROBLEMA: itch.io exige un zip con `index.html` en la raíz y **prohíbe las rutas
// absolutas** ("if you use an absolute path ... the request will fail"). CrazyGames dice lo
// mismo: "Use only relative paths ... Never use absolute paths, as they will fail to load".
// El export de Next escribe todo como `/_next/...`, así que subir la carpeta `out/` tal cual
// da una pantalla en blanco. Está comprobado leyendo el HTML generado.
//
// LA SALIDA: las dos plataformas contemplan archivos servidos desde afuera —itch.io permite
// cargar recursos externos por HTTPS y CrazyGames evalúa los "externally hosted/loaded files"
// por el tiempo hasta empezar a jugar (≤ 20 s)—. Entonces el bundle es un `index.html` con el
// juego real embebido desde gambetafutbol.games. Ventaja de paso: la versión del portal nunca
// queda vieja, se actualiza sola con cada despliegue.
//
// Lo que esto necesita del juego ya está comprobado: el sitio no manda X-Frame-Options ni
// frame-ancestors, y los archivos que usan localStorage están protegidos contra el bloqueo de
// almacenamiento de terceros que aplica Safari dentro de un iframe de otro dominio.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'reports', 'portales')
const CARPETA = path.join(SALIDA, 'itchio')
const SITIO = 'https://gambetafutbol.games/?utm_source=itchio&utm_medium=portal&utm_campaign=alta'

const INDEX = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Gambeta — Fútbol argentino</title>
  <style>
    html,body{margin:0;padding:0;height:100%;background:#020813;overflow:hidden}
    iframe{border:0;display:block;width:100%;height:100%}
    /* Si el iframe no llega a cargar, que quede un camino y no una pantalla negra. */
    .respaldo{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;
      justify-content:center;gap:16px;color:#fff;font:600 15px/1.5 system-ui,sans-serif;text-align:center;padding:24px}
    .respaldo a{color:#74ACDF}
    iframe:not([hidden]) + .respaldo{display:none}
  </style>
</head>
<body>
  <iframe
    src="${SITIO}"
    title="Gambeta"
    allow="fullscreen; clipboard-write"
    allowfullscreen></iframe>
  <noscript class="respaldo">
    Gambeta necesita JavaScript. Podés jugarlo en <a href="https://gambetafutbol.games/">gambetafutbol.games</a>.
  </noscript>
</body>
</html>
`

fs.rmSync(CARPETA, { recursive: true, force: true })
fs.mkdirSync(CARPETA, { recursive: true })
fs.writeFileSync(path.join(CARPETA, 'index.html'), INDEX)

const zip = path.join(SALIDA, 'gambeta-itchio.zip')
fs.rmSync(zip, { force: true })
// `-j` aplana: itch.io quiere el index.html en la raíz del zip, no dentro de una carpeta.
execFileSync('zip', ['-q', '-j', zip, path.join(CARPETA, 'index.html')])

const kb = (fs.statSync(zip).size / 1024).toFixed(1)
console.log(`  ✓ ${path.relative(ROOT, zip)}  ${kb} kB`)
console.log(`    index.html en la raíz, sin rutas absolutas, apunta a ${SITIO.split('?')[0]}`)
