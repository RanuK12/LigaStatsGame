// Los dos videos de vista previa que pide CrazyGames para publicar.
//
//   node scripts/data/build-video-portales.mjs
//
// Sus requisitos, verificados en docs.crazygames.com/requirements/game-covers:
//   · apaisado 1080p 16:9 y vertical 1080p 2:3, los dos obligatorios
//   · 15-20 segundos (más largo lo cortan a 20)
//   · el primer cuadro tiene que ser la portada estática
//   · sin audio, sin pantallas negras, sin logos, sin el cursor por defecto
//   · gameplay de verdad, sin acelerar
//
// Se graba una partida REAL contra el sitio en producción: se entra al draft, se completa el
// once y se simula. Nada de maquetas.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'reports', 'portales')
const CRUDO = path.join(SALIDA, 'video-crudo')
const SITIO = process.env.SITIO || 'https://gambetafutbol.games'
const SEGUNDOS = 18

const FORMATOS = [
  { id: 'apaisado', w: 1920, h: 1080, portada: 'portada-apaisada-1920x1080.png' },
  // 2:3 a 1080p de alto de imagen: 1080x1620 es la relación que piden.
  { id: 'vertical', w: 1080, h: 1620, portada: 'portada-vertical-800x1200.png' },
]

/**
 * Una partida de draft, con las pausas de un humano mirando lo que pasa.
 *
 * Se juega DENTRO del envoltorio de iframe, no contra el sitio pelado: es exactamente lo que
 * va a servir el portal, y además así el juego se detecta embebido y no muestra el botón de
 * ingresar —que es lo que CrazyGames no permite y no puede aparecer en el video.
 */
async function jugar(p) {
  const envoltorio = path.join(SALIDA, 'itchio', 'index.html')
  await p.goto('file://' + envoltorio, { waitUntil: 'domcontentloaded', timeout: 60000 })
  const juego = p.frameLocator('iframe')
  await p.waitForTimeout(6000)

  // Ir al draft desde el menú del juego.
  await juego.locator('a[href*="draft"]').first().click({ timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(4000)

  // Primero la formación: sin elegirla no aparece el bombo, y el video se quedaba en esta
  // pantalla mostrando una cancha vacía.
  await juego.locator('button', { hasText: /^4-3-3$/ }).first().click({ timeout: 8000 }).catch(() => {})
  await p.waitForTimeout(2500)

  // "Comenzar Draft" es el que abre el bombo, y está debajo del pliegue: sin esto el video se
  // quedaba mirando la pantalla de formación con la cancha vacía.
  const comenzar = juego.locator('button', { hasText: /Comenzar Draft/i }).first()
  await comenzar.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {})
  await comenzar.click({ timeout: 15000 }).catch(() => {})
  await p.waitForTimeout(4000)

  // El botón que llena el once de una: muestra el juego funcionando en pocos segundos.
  const completar = juego.locator('button').filter({ hasText: /completar/i }).first()
  if (await completar.count().catch(() => 0)) {
    await completar.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {})
    await completar.click({ timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(4000)
  }

  // Simular el torneo: es el momento con más movimiento en pantalla.
  const simular = juego.locator('button').filter({ hasText: /simular|liga|torneo/i }).first()
  if (await simular.count().catch(() => 0)) {
    await simular.click({ timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(5000)
  }
  await p.waitForTimeout(2000)
}

fs.rmSync(CRUDO, { recursive: true, force: true })
fs.mkdirSync(CRUDO, { recursive: true })

for (const f of FORMATOS) {
  const navegador = await chromium.launch()
  const ctx = await navegador.newContext({
    viewport: { width: f.w, height: f.h },
    recordVideo: { dir: CRUDO, size: { width: f.w, height: f.h } },
    // Sin cursor: lo piden expresamente.
    hasTouch: true,
    isMobile: f.id === 'vertical',
  })
  const p = await ctx.newPage()
  const arranque = Date.now()
  try {
    await jugar(p)
  } catch (e) {
    console.log(`  ⚠ ${f.id}: ${String(e).split('\n')[0].slice(0, 90)}`)
  }
  // Que el video llegue a los segundos pedidos aunque la partida haya sido rápida.
  const faltan = SEGUNDOS * 1000 - (Date.now() - arranque)
  if (faltan > 0) await p.waitForTimeout(faltan)

  const ruta = await p.video().path()
  await ctx.close()
  await navegador.close()

  const portada = path.join(SALIDA, f.portada)
  const salida = path.join(SALIDA, `video-${f.id}-${f.w}x${f.h}.mp4`)
  fs.rmSync(salida, { force: true })

  // El primer cuadro tiene que ser la portada: se le pega 1 segundo adelante y se escala todo
  // a la medida exacta. `-an` saca el audio, que tampoco lo quieren.
  execFileSync('ffmpeg', [
    '-loglevel', 'error',
    '-loop', '1', '-t', '1', '-i', portada,
    '-i', ruta,
    '-filter_complex',
    `[0:v]scale=${f.w}:${f.h}:force_original_aspect_ratio=increase,crop=${f.w}:${f.h},setsar=1,fps=30[a];` +
      `[1:v]scale=${f.w}:${f.h}:force_original_aspect_ratio=increase,crop=${f.w}:${f.h},setsar=1,fps=30[b];` +
      `[a][b]concat=n=2:v=1:a=0[v]`,
    '-map', '[v]', '-an',
    '-t', String(SEGUNDOS),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23',
    salida,
  ])

  const mb = (fs.statSync(salida).size / 1024 / 1024).toFixed(1)
  console.log(`  ✓ ${f.id.padEnd(9)} ${f.w}x${f.h}  ${mb} MB`)
}

fs.rmSync(CRUDO, { recursive: true, force: true })
console.log(`\n2 videos → data/reports/portales/`)
