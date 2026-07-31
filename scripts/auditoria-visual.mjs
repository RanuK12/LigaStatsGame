// Auditoría de la página en producción, con un navegador de verdad.
//
// Recorre el juego como lo recorre una persona: entra al home, arranca un draft, gira, ficha,
// simula, mira el ranking, tira el dado de datos. En escritorio y en teléfono. Saca capturas y
// anota todo lo que se rompe en el camino: errores de consola, pedidos fallidos, texto que se
// desborda, botones a los que no se llega.
//
//   node scripts/auditoria-visual.mjs [url]        (por defecto, producción)
import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const BASE = process.argv[2] || 'https://gambetafutbol.games'
const SALIDA = path.join(process.cwd(), 'data', 'reports', 'auditoria-visual')
fs.mkdirSync(SALIDA, { recursive: true })

const hallazgos = []
const anotar = (nivel, donde, texto) => {
  hallazgos.push({ nivel, donde, texto })
  console.log(`${nivel === 'error' ? '✗' : nivel === 'aviso' ? '!' : '·'} [${donde}] ${texto}`)
}

/** Cosas que se rompen y no se ven: consola, pedidos caídos y desbordes horizontales. */
function vigilar(page, donde) {
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text()
      // El favicon y las extensiones no son nuestro problema
      if (/favicon|extension|chrome-extension/i.test(t)) return
      anotar('error', donde, `consola: ${t.slice(0, 160)}`)
    }
  })
  page.on('pageerror', (e) => anotar('error', donde, `excepción: ${String(e).slice(0, 160)}`))
  page.on('requestfailed', (r) => {
    const u = r.url()
    if (/google|gtag|analytics|doubleclick/.test(u)) return
    anotar('error', donde, `pedido caído: ${u.slice(0, 120)} (${r.failure()?.errorText})`)
  })
}

async function revisarDesborde(page, donde) {
  // Se prueba a desplazar de verdad. Medir `scrollWidth` da falso positivo: con
  // `body { overflow-x: hidden }` el número queda grande aunque la página no se mueva un pixel,
  // y así el informe marcaba como error algo que el usuario nunca ve.
  const movido = await page.evaluate(() => {
    const antes = window.scrollX
    window.scrollTo(9999, window.scrollY)
    const despues = window.scrollX
    window.scrollTo(antes, window.scrollY)
    return despues
  })
  if (movido > 2) anotar('error', donde, `la página se desplaza a lo ancho ${movido}px: en el teléfono se ve "corrida"`)
}

/** Botones y links a los que no se puede apuntar con el dedo (mínimo recomendado: 44px). */
async function revisarObjetivosChicos(page, donde) {
  const chicos = await page.evaluate(() =>
    [...document.querySelectorAll('button, a[href]')]
      .map((el) => ({ r: el.getBoundingClientRect(), t: (el.textContent || '').trim().slice(0, 30) }))
      .filter((x) => x.r.width > 0 && x.r.height > 0 && x.r.height < 32 && x.r.top < 3000)
      .map((x) => `${x.t || '(sin texto)'} ${Math.round(x.r.width)}x${Math.round(x.r.height)}`)
      .slice(0, 6),
  )
  if (chicos.length > 0) anotar('aviso', donde, `objetivos táctiles chicos: ${chicos.join(' · ')}`)
}

async function capturar(page, nombre) {
  const f = path.join(SALIDA, `${nombre}.png`)
  await page.screenshot({ path: f, fullPage: false })
  return f
}

async function recorrer(ctx, etiqueta, movil) {
  const page = await ctx.newPage()
  vigilar(page, etiqueta)

  // ── HOME ──
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await capturar(page, `${etiqueta}-1-home`)
  await revisarDesborde(page, `${etiqueta}/home`)
  if (movil) await revisarObjetivosChicos(page, `${etiqueta}/home`)

  // ¿Se ve lo que tiene que verse sin scrollear hasta el fondo?
  for (const [nombre, texto] of [['novedades', 'Novedades'], ['copas', 'Las copas'], ['donaciones', 'Bancá el proyecto']]) {
    const visible = await page.getByText(texto, { exact: false }).first().isVisible().catch(() => false)
    const y = await page
      .getByText(texto, { exact: false })
      .first()
      .evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY))
      .catch(() => -1)
    if (!visible && y < 0) anotar('error', `${etiqueta}/home`, `no aparece la sección "${nombre}"`)
    else anotar('info', `${etiqueta}/home`, `"${nombre}" a ${y}px del tope`)
  }

  // Home hasta el fondo, para ver el pie y las redes
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(900)
  await capturar(page, `${etiqueta}-2-home-pie`)

  // ── DRAFT: la partida entera ──
  await page.goto(`${BASE}/draft?mode=clasico`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await capturar(page, `${etiqueta}-3-draft-inicio`)
  await revisarDesborde(page, `${etiqueta}/draft-inicio`)

  const comenzar = page.getByRole('button', { name: /Comenzar Draft/i })
  if (await comenzar.isVisible().catch(() => false)) {
    await comenzar.click()
    await page.waitForTimeout(1500)
    await capturar(page, `${etiqueta}-4-draft-listo`)
    await revisarDesborde(page, `${etiqueta}/draft`)

    // Girar y fichar tantas veces como se pueda, hasta armar el once
    let giros = 0
    let historicosVistos = 0
    for (let i = 0; i < 14; i++) {
      const girar = page.getByRole('button', { name: /girar|ruleta|sortear/i }).first()
      if (!(await girar.isVisible().catch(() => false))) break
      await girar.click()
      await page.waitForTimeout(2600)
      giros++
      // ¿Salió un plantel histórico? Se reconoce por el cartel del reveal.
      if (await page.getByText(/PLANTEL HISTÓRICO/i).first().isVisible().catch(() => false)) {
        historicosVistos++
        if (historicosVistos === 1) await capturar(page, `${etiqueta}-5-reveal-historico`)
      }
      const seguir = page.getByRole('button', { name: /elegir jugador/i }).first()
      if (await seguir.isVisible().catch(() => false)) {
        await seguir.click()
        await page.waitForTimeout(700)
      }
      // Fichar al primero de la lista
      const ficha = page.locator('[data-testid="jugador-opcion"], button:has-text("Fichar")').first()
      if (await ficha.isVisible().catch(() => false)) {
        await ficha.click()
        await page.waitForTimeout(700)
      } else {
        const opciones = page.locator('main button').filter({ hasNotText: /volver|inicio|reto/i })
        const n = await opciones.count()
        if (n > 2) { await opciones.nth(2).click().catch(() => {}); await page.waitForTimeout(700) }
      }
    }
    anotar('info', `${etiqueta}/draft`, `${giros} giros · ${historicosVistos} planteles históricos vistos`)
    await capturar(page, `${etiqueta}-6-draft-armado`)
    await revisarDesborde(page, `${etiqueta}/draft-armado`)

    // Simular la Liga si se llegó a armar el once
    const simular = page.getByRole('button', { name: /Simular Liga/i }).first()
    if (await simular.isVisible().catch(() => false)) {
      await simular.click()
      await page.waitForTimeout(6000)
      await capturar(page, `${etiqueta}-7-torneo`)
      await revisarDesborde(page, `${etiqueta}/torneo`)
    } else {
      anotar('aviso', `${etiqueta}/draft`, 'no se llegó al botón de simular: el once no se completó automáticamente')
    }
  } else {
    anotar('error', `${etiqueta}/draft`, 'no aparece el botón de comenzar el draft')
  }

  // ── DATOS CURIOSOS ──
  await page.goto(`${BASE}/datos`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1200)
  await revisarDesborde(page, `${etiqueta}/datos`)
  const dado = page.getByRole('button', { name: /tirar el dado/i }).first()
  if (await dado.isVisible().catch(() => false)) {
    await dado.click()
    await page.waitForTimeout(1800)
    const salio = await page.getByText(/Dato|Insólito|Leyenda/).first().isVisible().catch(() => false)
    anotar(salio ? 'info' : 'error', `${etiqueta}/datos`, salio ? 'el dado devuelve una carta' : 'el dado no devolvió nada')
    await capturar(page, `${etiqueta}-8-datos`)
  } else {
    anotar('error', `${etiqueta}/datos`, 'no aparece el dado')
  }

  // ── RANKING ──
  await page.goto(`${BASE}/leaderboard`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1800)
  await capturar(page, `${etiqueta}-9-ranking`)
  await revisarDesborde(page, `${etiqueta}/ranking`)

  // ── LEGAL ──
  await page.goto(`${BASE}/legal`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(800)
  await capturar(page, `${etiqueta}-10-legal`)
  await revisarDesborde(page, `${etiqueta}/legal`)

  await page.close()
}

const navegador = await chromium.launch()

const escritorio = await navegador.newContext({ viewport: { width: 1440, height: 900 } })
await recorrer(escritorio, 'escritorio', false)
await escritorio.close()

const telefono = await navegador.newContext({ ...devices['iPhone 13'] })
await recorrer(telefono, 'movil', true)
await telefono.close()

await navegador.close()

const errores = hallazgos.filter((h) => h.nivel === 'error')
const avisos = hallazgos.filter((h) => h.nivel === 'aviso')
const md = [
  '# Auditoría visual de Gambeta',
  '',
  `Recorrido con un navegador real sobre ${BASE}, en escritorio (1440x900) y teléfono (iPhone 13).`,
  `Generado por \`scripts/auditoria-visual.mjs\`. Capturas en \`data/reports/auditoria-visual/\`.`,
  '',
  `**${errores.length} errores · ${avisos.length} avisos**`,
  '',
  ...['error', 'aviso', 'info'].flatMap((nivel) => {
    const items = hallazgos.filter((h) => h.nivel === nivel)
    if (items.length === 0) return []
    return [`## ${nivel === 'error' ? 'Errores' : nivel === 'aviso' ? 'Avisos' : 'Observado'}`, '', ...items.map((h) => `- **${h.donde}** — ${h.texto}`), '']
  }),
]
fs.writeFileSync(path.join(process.cwd(), 'data', 'reports', 'auditoria-visual.md'), md.join('\n'))
console.log(`\n${errores.length} errores · ${avisos.length} avisos → data/reports/auditoria-visual.md`)
