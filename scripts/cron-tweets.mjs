/**
 * Script de Automatización de Publicaciones para X / Twitter / Redes Sociales (Gambeta)
 * 
 * Uso:
 *   node scripts/cron-tweets.mjs
 * 
 * Genera imágenes estéticas en data/reports/placas-x/ y compila data/reports/tweet-payloads.json
 * con copy listo para ser publicado por un cron/bot automático.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SALIDA_DIR = path.join(ROOT, 'data', 'reports', 'placas-x')
const PAYLOAD_FILE = path.join(ROOT, 'data', 'reports', 'tweet-payloads.json')

fs.mkdirSync(SALIDA_DIR, { recursive: true })

const records = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'records.json'), 'utf8'))
const ligas = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'ligas.json'), 'utf8'))

async function generarPlacasYPayloads() {
  console.log('🚀 Generando contenido y placas para automatización de redes sociales...')

  const tweetsPayload = []
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 } })

  // 1. Placa del Máximo Goleador Histórico (Messi)
  const topGoleador = records.topScorers[0]
  if (topGoleador) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { margin: 0; background: #03060f; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 675px; width: 1200px; }
          .card { width: 1100px; height: 575px; background: linear-gradient(135deg, #0c1728 0%, #03060f 100%); border: 2px solid #74ACDF; border-radius: 32px; padding: 48px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 0 80px rgba(116, 172, 223, 0.25); }
          .badge { font-size: 14px; font-weight: 900; letter-spacing: 4px; color: #74ACDF; text-transform: uppercase; background: rgba(116, 172, 223, 0.1); border: 1px solid rgba(116, 172, 223, 0.4); padding: 8px 18px; border-radius: 20px; width: fit-content; }
          .title { font-size: 56px; font-weight: 900; text-transform: uppercase; margin: 12px 0 0 0; background: linear-gradient(to right, #ffffff, #74ACDF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .stat { font-size: 84px; font-weight: 900; color: #F59E0B; font-family: monospace; line-height: 1; }
          .subtext { font-size: 22px; color: #94A3B8; margin-top: 8px; }
          .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); pt: 20px; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: 2px; color: #74ACDF; }
        </style>
      </head>
      <body>
        <div class="card">
          <div>
            <div class="badge">🇦🇷 GAMBETA · ARCHIVO HISTÓRICO</div>
            <div class="title">${topGoleador.name}</div>
            <div class="subtext">${topGoleador.position} · ${topGoleador.decade}</div>
          </div>
          <div>
            <div class="stat">${topGoleador.goalsTotal} GOLES</div>
            <div class="subtext">Desglose oficial: ${topGoleador.breakdown}</div>
          </div>
          <div class="footer">
            <span class="logo">GAMBETA FÚTBOL GAME</span>
            <span style="font-size: 16px; color: #64748B;">gambetafutbol.games/records</span>
          </div>
        </div>
      </body>
      </html>
    `
    await page.setContent(html)
    const imgPath = path.join(SALIDA_DIR, 'placa-goleador-top1.png')
    await page.screenshot({ path: imgPath })

    tweetsPayload.push({
      id: 'goleador-top-1',
      text: `⚽ LEYENDA DEL ARCHIVO HISTÓRICO\n\n${topGoleador.name} lidera el ranking histórico con ${topGoleador.goalsTotal} goles oficiales (${topGoleador.breakdown}).\n\n¿Te acordás de sus mejores definiciones?\n\n🎮 Armá tu 11 histórico en: https://gambetafutbol.games/records\n\n#Gambeta #FutbolArgentino #Messi`,
      imagePath: imgPath,
    })
  }

  // 2. Placa de Ligas Disponibles en Modo Carrera
  const totalClubes = ligas.paises ? Object.values(ligas.paises).reduce((acc, p) => acc + (p.clubes?.length || 0), 0) : 120
  const htmlLigas = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; background: #03060f; color: #fff; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 675px; width: 1200px; }
        .card { width: 1100px; height: 575px; background: linear-gradient(135deg, #101c30 0%, #03060f 100%); border: 2px solid #F59E0B; border-radius: 32px; padding: 48px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; box-shadow: 0 0 80px rgba(245, 158, 11, 0.25); }
        .badge { font-size: 14px; font-weight: 900; letter-spacing: 4px; color: #F59E0B; text-transform: uppercase; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); padding: 8px 18px; border-radius: 20px; width: fit-content; }
        .title { font-size: 52px; font-weight: 900; text-transform: uppercase; margin: 12px 0 0 0; color: #FFF; }
        .stat { font-size: 72px; font-weight: 900; color: #10B981; font-family: monospace; }
        .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); pt: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div>
          <div class="badge">🌎 MODO CARRERA GLOBAL</div>
          <div class="title">Evolución de Tu Jugador</div>
          <div style="font-size: 20px; color: #CBD5E1; margin-top: 8px;">Competí en Latinoamérica, Europa y Arabia Saudita</div>
        </div>
        <div>
          <div class="stat">${totalClubes}+ CLUBES DISPONIBLES</div>
          <div style="font-size: 22px; color: #94A3B8;">8 Ligas Latinoamericanas + Grandes de Europa + Arabia Saudita</div>
        </div>
        <div class="footer">
          <span style="font-size: 24px; font-weight: 900; color: #F59E0B;">GAMBETA FÚTBOL GAME</span>
          <span style="font-size: 16px; color: #64748B;">gambetafutbol.games/carrera</span>
        </div>
      </div>
    </body>
    </html>
  `
  await page.setContent(htmlLigas)
  const imgLigasPath = path.join(SALIDA_DIR, 'placa-modo-carrera.png')
  await page.screenshot({ path: imgLigasPath })

  tweetsPayload.push({
    id: 'modo-carrera-global',
    text: `🚀 MODO CARRERA EN GAMBETA\n\nEvolucioná tu jugador desde las divisiones inferiores de Latinoamérica hasta triunfar en los gigantes de Europa o recibir ofertas millonarias de Arabia Saudita.\n\n🏆 ¿Hasta qué rating podés llegar?\n\n🎮 Jugá gratis en: https://gambetafutbol.games/carrera\n\n#Gambeta #ModoCarrera #Futbol`,
    imagePath: imgLigasPath,
  })

  await browser.close()

  fs.writeFileSync(PAYLOAD_FILE, JSON.stringify(tweetsPayload, null, 2))
  console.log(`✅ Placas e impresiones generadas exitosamente (${tweetsPayload.length} publicaciones listas en ${PAYLOAD_FILE}).`)
}

generarPlacasYPayloads().catch(console.error)
