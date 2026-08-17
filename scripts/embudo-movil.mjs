// Por qué el teléfono convierte cuatro veces peor que la computadora.
//
// Analytics, 28 días: escritorio 459 usuarios y 94 eventos clave (0,205 por usuario); móvil 471
// usuarios y 23 eventos clave (0,049). Mitad del público, un quinto del resultado. La auditoría
// visual mira si algo se desborda; esto mira otra cosa: si el camino hasta terminar un draft se
// puede recorrer con un pulgar.
//
// Recorre el mismo embudo en teléfono y en escritorio y compara paso por paso: cuánto tarda cada
// pantalla en dejarte tocar algo, si el botón que sigue queda a la vista o hay que buscarlo
// scrolleando, y cuántos toques hacen falta para llegar al final.
//
//   node scripts/embudo-movil.mjs [url]
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'https://gambetafutbol.games'
const SALIDA = path.join(process.cwd(), 'data', 'reports')

const filas = []
const anotar = (perfil, paso, dato) => {
  filas.push({ perfil, paso, ...dato })
  const mal = dato.problema ? `  ✗ ${dato.problema}` : ''
  console.log(`[${perfil}] ${paso}: ${dato.ms} ms${mal}`)
}

/**
 * ¿El elemento se ve sin scrollear?
 *
 * En un teléfono el alto útil es 844 px menos la barra del navegador. Un botón a 900 px del tope
 * existe, pero para el que entra no existe hasta que decide seguir bajando, y la mayoría no baja.
 */
async function visibleSinScroll(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top + window.scrollY), alto: window.innerHeight, visible: r.top >= 0 && r.bottom <= window.innerHeight }
  }, sel)
}

/** Los toques que quedan por debajo del mínimo que puede acertar un pulgar. */
async function objetivosChicos(page) {
  return page.evaluate(() => {
    const chicos = []
    for (const el of document.querySelectorAll('button, a[href], [role="button"]')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.bottom < 0 || r.top > window.innerHeight) continue // fuera de la pantalla, no cuenta
      // 44 px es el mínimo que recomienda Apple y el que usa Android como referencia.
      if (r.width < 44 || r.height < 44) {
        chicos.push({ texto: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height) })
      }
    }
    return chicos
  })
}

async function recorrer(ctx, perfil) {
  const page = await ctx.newPage()
  const errores = []
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text().slice(0, 120)))

  // --- Paso 1: el home carga y se ve el botón principal
  let t = Date.now()
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  const msHome = Date.now() - t

  const alto = await page.evaluate(() => window.innerHeight)
  const primerCta = await page.evaluate(() => {
    // El primer link que lleva a jugar: es el que decide si la visita se convierte en partida.
    const a = [...document.querySelectorAll('a[href*="/draft"], a[href*="/daily"], a[href*="/carrera"]')]
      .find((x) => x.getBoundingClientRect().height > 0)
    if (!a) return null
    const r = a.getBoundingClientRect()
    return { texto: a.innerText.trim().slice(0, 40), y: Math.round(r.top + window.scrollY), destino: a.getAttribute('href') }
  })
  anotar(perfil, 'home', {
    ms: msHome,
    alto,
    primerCta: primerCta?.texto,
    ctaY: primerCta?.y,
    problema: !primerCta ? 'ningún link a jugar' : primerCta.y > alto ? `hay que scrollear ${primerCta.y - alto} px para ver "${primerCta.texto}"` : null,
  })

  const chicosHome = await objetivosChicos(page)
  if (chicosHome.length) anotar(perfil, 'home · toques chicos', { ms: 0, cuantos: chicosHome.length, ejemplos: chicosHome.slice(0, 5), problema: `${chicosHome.length} toques de menos de 44 px` })

  // --- Paso 2: entrar al draft y girar
  t = Date.now()
  await page.goto(`${BASE}/draft/`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  const msDraft = Date.now() - t

  // La pantalla del draft arranca en la portada del modo, con la formación y las reglas: hay que
  // tocar "Comenzar Draft" para llegar al bombo. El script no lo hacía y venía diciendo "no
  // encontré el botón de girar" en cada corrida, que era un problema del medidor y no del juego.
  // De paso mide lo único que importa de esa primera pantalla: si se puede empezar sin scrollear.
  const comenzar = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /comenzar/i.test(x.innerText) && x.getBoundingClientRect().height > 0)
    if (!b) return null
    const r = b.getBoundingClientRect()
    return { texto: b.innerText.trim().slice(0, 30), y: Math.round(r.top + window.scrollY), fijo: getComputedStyle(b.closest('div') || b).position === 'fixed' }
  })
  anotar(perfil, 'draft · empezar', {
    ms: 0,
    boton: comenzar?.texto ?? null,
    botonY: comenzar?.y ?? null,
    problema: !comenzar ? 'no está el botón de comenzar'
      : comenzar.fijo || comenzar.y <= alto ? null
      : `hay que scrollear ${comenzar.y - alto} px para empezar`,
  })
  if (comenzar) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /comenzar/i.test(x.innerText))?.click())
    await page.waitForTimeout(1200)
  }

  // El botón de girar es lo único que importa en esta pantalla.
  const girar = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /girar|tirar|ruleta|jugar/i.test(x.innerText) && x.getBoundingClientRect().height > 0)
    if (!b) return null
    const r = b.getBoundingClientRect()
    // Un botón pegado abajo (sticky o fixed) se ve siempre, aunque su lugar en el documento esté
    // más abajo del pliegue: para el que juega está a la vista, que es lo que se está midiendo.
    const pegado = ['sticky', 'fixed'].some((p) => [b, b.parentElement, b.parentElement?.parentElement]
      .some((el) => el && getComputedStyle(el).position === p))
    return { texto: b.innerText.trim().slice(0, 30), y: Math.round(r.top + window.scrollY), h: Math.round(r.height), pegado }
  })
  anotar(perfil, 'draft', {
    ms: msDraft,
    girar: girar?.texto,
    girarY: girar?.y,
    problema: !girar ? 'no encontré el botón de girar'
      : girar.pegado || girar.y <= alto ? null
      : `el botón de girar arranca ${girar.y - alto} px por debajo del pliegue`,
  })

  const chicosDraft = await objetivosChicos(page)
  if (chicosDraft.length) anotar(perfil, 'draft · toques chicos', { ms: 0, cuantos: chicosDraft.length, ejemplos: chicosDraft.slice(0, 5), problema: `${chicosDraft.length} toques de menos de 44 px` })

  // --- Paso 3: ¿existe el atajo que completa el equipo?
  // Aparece recién con un jugador fichado: es la salida rápida del que no quiere dar 22 toques.
  // Así que hay que girar y fichar uno antes de buscarlo, si no siempre iba a decir que no está.
  if (girar) {
    await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /girar/i.test(x.innerText))?.click())
    await page.waitForTimeout(9000)
    await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /elegir jugador/i.test(x.innerText))?.click())
    await page.waitForTimeout(2500)
    // Las cartas del bombo arrancan con la valoración: "70POR..." o "88ARQ...".
    await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => /^\d\d\s*[A-Z]/.test(x.innerText.trim()))?.click())
    await page.waitForTimeout(2500)
  }
  const express = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /completar|autom|express/i.test(x.innerText) && x.getBoundingClientRect().height > 0)
    if (!b) return null
    const r = b.getBoundingClientRect()
    return { texto: b.innerText.trim().slice(0, 30), y: Math.round(r.top + window.scrollY) }
  })
  anotar(perfil, 'draft · atajo', { ms: 0, express: express?.texto ?? null, expressY: express?.y ?? null, problema: express ? null : 'no está el botón de completar equipo' })

  // --- Paso 4: cuánto pesa lo que baja
  const peso = await page.evaluate(() =>
    performance.getEntriesByType('resource').reduce((a, r) => a + (r.transferSize || 0), 0),
  )
  anotar(perfil, 'peso', { ms: 0, kb: Math.round(peso / 1024), problema: peso / 1024 > 2500 ? `${Math.round(peso / 1024)} kB en una pantalla` : null })

  if (errores.length) anotar(perfil, 'consola', { ms: 0, errores: [...new Set(errores)].slice(0, 6), problema: `${errores.length} errores` })

  await page.close()
}

const browser = await chromium.launch()

const movil = await browser.newContext({ ...devices['iPhone 13'] })
await recorrer(movil, 'teléfono')
await movil.close()

const escritorio = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await recorrer(escritorio, 'escritorio')
await escritorio.close()

await browser.close()

fs.mkdirSync(SALIDA, { recursive: true })
fs.writeFileSync(path.join(SALIDA, 'embudo-movil.json'), JSON.stringify(filas, null, 2))
console.log(`\n→ data/reports/embudo-movil.json`)
