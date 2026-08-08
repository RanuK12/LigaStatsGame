// Las tres portadas que pide CrazyGames para publicar el juego.
//
//   node scripts/data/build-portada-portales.mjs
//
// Medidas obligatorias según su documentación (docs.crazygames.com/requirements/game-covers):
// apaisada 1920x1080, vertical 800x1200 y cuadrada 800x800. Las tres tienen que compartir la
// misma imagen para que se reconozca el juego venga de donde venga.
//
// Sus reglas, que la portada respeta: nada de bordes, no alcanza con una captura del juego, el
// nombre va escrito arriba y con una tipografía trabajada. Por eso esto NO es un screenshot:
// es el escudo, el nombre en la Sora del sitio y una línea de lo que nos diferencia.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'reports', 'portales')
const LOGO = fs.readFileSync(path.join(ROOT, 'public', 'logos', 'gambeta.svg'), 'utf8')

const MEDIDAS = [
  { id: 'apaisada', w: 1920, h: 1080 },
  { id: 'vertical', w: 800, h: 1200 },
  { id: 'cuadrada', w: 800, h: 800 },
]

/** Escala todo contra el lado más chico para que las tres se vean iguales de "llenas". */
function html({ w, h }) {
  const base = Math.min(w, h)
  const escudo = Math.round(base * (w > h ? 0.42 : 0.34))
  const titulo = Math.round(base * (w > h ? 0.17 : 0.15))
  const bajada = Math.round(base * 0.042)
  const vertical = h > w
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@800&family=Kanit:wght@700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;background:#020813;
       display:flex;flex-direction:${vertical ? 'column' : 'row'};
       align-items:center;justify-content:center;gap:${Math.round(base * 0.05)}px}
  /* El resplandor celeste del sitio, para que la portada sea reconocible como Gambeta. */
  .glow{position:absolute;width:${base}px;height:${base}px;border-radius:50%;
        background:radial-gradient(circle,rgba(116,172,223,.20),transparent 68%);filter:blur(${base * 0.06}px)}
  .escudo{width:${escudo}px;height:${escudo}px;flex-shrink:0;position:relative;
          filter:drop-shadow(0 ${base * 0.02}px ${base * 0.05}px rgba(0,0,0,.7))}
  .texto{position:relative;text-align:${vertical ? 'center' : 'left'}}
  h1{font-family:Sora,system-ui,sans-serif;font-weight:800;font-size:${titulo}px;color:#fff;
     letter-spacing:-.03em;line-height:.92;text-transform:uppercase}
  p{font-family:Kanit,system-ui,sans-serif;font-weight:700;font-size:${bajada}px;
    color:#74ACDF;letter-spacing:.14em;text-transform:uppercase;margin-top:${base * 0.028}px}
  /* La banda argentina, sin llegar al borde: no se permiten marcos. */
  .banda{position:absolute;bottom:0;left:0;right:0;height:${Math.round(base * 0.016)}px;
         background:linear-gradient(90deg,#74ACDF 0%,#fff 50%,#74ACDF 100%);opacity:.9}
</style></head><body>
  <div class="glow"></div>
  <div class="escudo">${LOGO.replace(/width="\d+"|height="\d+"/g, '')}</div>
  <div class="texto"><h1>Gambeta</h1><p>Fútbol argentino</p></div>
  <div class="banda"></div>
</body></html>`
}

fs.mkdirSync(SALIDA, { recursive: true })
const navegador = await chromium.launch()

for (const m of MEDIDAS) {
  const p = await navegador.newPage({ viewport: { width: m.w, height: m.h } })
  await p.setContent(html(m), { waitUntil: 'networkidle' })
  // Las tipografías vienen de la red: sin esta espera la portada sale en Times New Roman.
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(600)
  const archivo = path.join(SALIDA, `portada-${m.id}-${m.w}x${m.h}.png`)
  await p.screenshot({ path: archivo })
  console.log(`  ✓ ${m.id.padEnd(9)} ${m.w}x${m.h}  ${Math.round(fs.statSync(archivo).size / 1024)} kB`)
  await p.close()
}

await navegador.close()
console.log(`\n3 portadas → data/reports/portales/`)
