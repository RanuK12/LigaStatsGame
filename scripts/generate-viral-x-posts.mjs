import fs from 'fs'
import path from 'path'
import { challengeForDate, challengeNumber, localYmd } from '../lib/daily-challenge.ts'

const BASE_URL = 'https://gambetafutbol.games'

export function generateViralPack() {
  const ymd = localYmd()
  const challenge = challengeForDate(ymd)
  const num = challengeNumber()

  const pack = {
    generatedAt: new Date().toISOString(),
    dailyChallengeTweet: {
      text: `⚽ Reto del Día #${num} en Gambeta: ${challenge.title}\n\n${challenge.rule}\n\n🔥 Mismo bombo para todos hoy. ¿Podés armar el mejor 11 de la jornada?\n\n👉 ${BASE_URL}/daily?utm_source=twitter&utm_medium=social&utm_campaign=reto_${challenge.id}`,
    },
    equiposTweets: [
      {
        team: "Vélez 1994",
        text: `⚽ El Vélez de Bianchi '94: Chilavert, Trotta, Pellegrino, Basualdo, el Turco Asad y el Pepe Basualdo le ganaron la Intercontinental al AC Milan de Fabio Capello. 🔥\n\n¿Podés armar un 11 mejor?\n👉 ${BASE_URL}/equipos/velez-1994/?utm_source=twitter&utm_medium=social&utm_campaign=velez_1994`
      },
      {
        team: "Boca 2000",
        text: `⚽ Boca 2000 vs Real Madrid en Tokio: Los 2 goles de Palermo a Casillas en 6 minutos y el recital de fútbol de Riquelme contra Makelele. 🏆\n\nArmá tu 11 histórico:\n👉 ${BASE_URL}/equipos/boca-juniors-2000/?utm_source=twitter&utm_medium=social&utm_campaign=boca_2000`
      },
      {
        team: "River 1996",
        text: `⚽ River '96 Campeón de América: Enzo Francescoli, Ortega, Crespo, Gallardo, Sorín y Germán Burgos dirigidos por el Tolo Gallego y Ramón Díaz. 🔥\n\nDrafteá este plantel histórico:\n👉 ${BASE_URL}/equipos/river-plate-1996/?utm_source=twitter&utm_medium=social&utm_campaign=river_1996`
      }
    ],
    whatsappShareTemplates: {
      retoDiario: `⚽ Gambeta Reto del Día #${num}: ${challenge.title}\n🔥 Mismo bombo para todos hoy. ¿Podés superar mi score?\n👉 ${BASE_URL}/daily?utm_source=whatsapp&utm_medium=social&utm_campaign=reto_${challenge.id}`,
      draftClasico: `Armé mi 11 histórico en Gambeta ⚽🔥 ¡Score: 84 pts! ¿Podés armar uno mejor?\n👉 ${BASE_URL}/draft?mode=clasico&utm_source=whatsapp&utm_medium=social&utm_campaign=share_11`
    }
  }

  return pack
}

if (process.argv[1] && process.argv[1].endsWith('generate-viral-x-posts.mjs')) {
  const pack = generateViralPack()
  console.log(JSON.stringify(pack, null, 2))
}
