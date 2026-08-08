// Los íconos de la app, desde el logo de Gambeta.
//
//   node scripts/data/build-app-icons.mjs
//
// Por qué existe: el manifest declaraba `/logos/afa.png` como ícono de 192x192 y de 512x512.
// Ese archivo es el escudo de la AFA —marca ajena, y nada que ver con Gambeta— y encima mide
// 500x698, así que ni siquiera es cuadrado: al instalar la app el ícono salía deformado y con
// el escudo de otro. También es lo primero que pide un portal de juegos al dar de alta.
//
// Se renderiza el SVG real con el navegador que ya usamos para las capturas, así el ícono sale
// exactamente igual al logo del sitio y se regenera solo si el logo cambia.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const LOGO = path.join(ROOT, 'public', 'logos', 'gambeta.svg')
const SALIDA = path.join(ROOT, 'public', 'logos')
const MEDIDAS = [192, 512]
// El fondo del sitio. Un PNG transparente se ve mal sobre el escritorio claro de Android.
const FONDO = '#020813'

const svg = fs.readFileSync(LOGO, 'utf8')
const navegador = await chromium.launch()

for (const lado of MEDIDAS) {
  const p = await navegador.newPage({ viewport: { width: lado, height: lado } })
  await p.setContent(
    `<html><body style="margin:0;width:${lado}px;height:${lado}px;background:${FONDO};display:flex;align-items:center;justify-content:center">
       <div style="width:${Math.round(lado * 0.82)}px;height:${Math.round(lado * 0.82)}px">${svg.replace(/width="\d+"|height="\d+"/g, '')}</div>
     </body></html>`,
    { waitUntil: 'load' },
  )
  await p.waitForTimeout(300)
  const archivo = path.join(SALIDA, `gambeta-${lado}.png`)
  await p.screenshot({ path: archivo })
  console.log(`  ✓ gambeta-${lado}.png  ${Math.round(fs.statSync(archivo).size / 1024)} kB`)
  await p.close()
}

await navegador.close()
