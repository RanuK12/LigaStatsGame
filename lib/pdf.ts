import type { Player, TournamentResult } from "./types"
import { POS_LABELS } from "./game-engine"
import { BASE_PATH } from "./data-loader"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image()
    img.src = src
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`))
  })
}

// Helper to determine division outcome text and colors
function getDivisionOutcome(result: TournamentResult) {
  if (result.type === "copa") {
    if (result.isChampion) {
      return {
        text: "CAMPEÃN DE LA COPA ARGENTINA",
        bg: [212, 175, 55], // Gold
        fg: [10, 14, 27]
      }
    }
    return {
      text: result.eliminated ? `COPA ARGENTINA: ELIMINADO EN ${(result.eliminatedRound ?? "fase de eliminatoria").toUpperCase()}` : "SUBCAMPEÃN DE LA COPA ARGENTINA",
      bg: [51, 65, 85], // Slate
      fg: [255, 255, 255]
    }
  }

  // Liga outcomes
  if (result.playerPos === 14) {
    return {
      text: "DESCENDIDO - RELEGADO A LA PRIMERA B NACIONAL",
      bg: [239, 68, 68], // Red
      fg: [255, 255, 255]
    }
  }
  if (result.isChampion) {
    return {
      text: "CAMPEÃN DE LA LIGA PROFESIONAL DE FÃTBOL",
      bg: [212, 175, 55], // Gold
      fg: [10, 14, 27]
    }
  }
  if (result.playerPos && result.playerPos <= 3) {
    return {
      text: "CLASIFICADO A LA COPA LIBERTADORES DE AMÃRICA",
      bg: [59, 130, 246], // Blue
      fg: [255, 255, 255]
    }
  }
  if (result.playerPos && result.playerPos >= 4 && result.playerPos <= 6) {
    return {
      text: "CLASIFICADO A LA COPA SUDAMERICANA",
      bg: [16, 185, 129], // Emerald
      fg: [255, 255, 255]
    }
  }
  return {
    text: "PERMANENCIA ASEGURADA EN PRIMERA DIVISIÃN",
    bg: [71, 85, 105], // Slate
    fg: [255, 255, 255]
  }
}

export async function generatePDF(result: TournamentResult, draftedPlayers: (Player | null)[], formation: any) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const W = 210, pad = 15

  // Load logos asynchronously
  let afaLogo: HTMLImageElement | null = null
  let lpfLogo: HTMLImageElement | null = null
  try {
    afaLogo = await loadImage(`${BASE_PATH}/logos/afa.png`)
  } catch (e) {
    console.warn("Could not load AFA logo in PDF", e)
  }
  try {
    lpfLogo = await loadImage(`${BASE_PATH}/logos/lpf.png`)
  } catch (e) {
    console.warn("Could not load LPF logo in PDF", e)
  }

  // 1. Dark background
  doc.setFillColor(10, 14, 27)
  doc.rect(0, 0, W, 297, "F")

  // Header accent line
  doc.setFillColor(116, 172, 223)
  doc.rect(0, 0, W, 3, "F")

  // 2. Header Box
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 3, W, 28, "F")

  // Add logos if successfully loaded
  if (afaLogo) {
    try {
      doc.addImage(afaLogo, "PNG", pad, 7, 11.5, 16)
    } catch (_) {}
  }
  if (lpfLogo) {
    try {
      doc.addImage(lpfLogo, "PNG", W - pad - 12, 7, 11, 16)
    } catch (_) {}
  }

  // Header Titles
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("GAMBETA ⭐⭐⭐", W / 2, 13, { align: "center" })

  doc.setTextColor(116, 172, 223)
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.text("EL JUEGO DEL FÃTBOL ARGENTINO", W / 2, 18, { align: "center" })

  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.text(`Generado el ${new Date().toLocaleDateString("es-AR")} Â· draft3estrellas.com`, W / 2, 25, { align: "center" })

  // 3. Division Outcome Banner
  const outcome = getDivisionOutcome(result)
  doc.setFillColor(outcome.bg[0], outcome.bg[1], outcome.bg[2])
  doc.roundedRect(pad, 36, W - pad * 2, 10, 2, 2, "F")
  doc.setTextColor(outcome.fg[0], outcome.fg[1], outcome.fg[2])
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.text(outcome.text, W / 2, 42.5, { align: "center" })

  // 4. Team Title Row
  doc.setFillColor(20, 30, 57)
  doc.roundedRect(pad, 51, W - pad * 2, 15, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.text(result.teamLabel.toUpperCase(), pad + 6, 60.5)

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "normal")
  doc.text(`TÃ¡ctica: ${result.formation}   Â·   Score: ${result.teamScore} pts`, W - pad - 6, 60.5, { align: "right" })

  // 5. Two-Column Layout (y = 73)
  const colY = 73
  const colW = 85
  const colGap = 10
  const col2X = pad + colW + colGap

  // ââ LEFT COLUMN: DRAFTED TEAM LINEUP ââ
  doc.setTextColor(116, 172, 223)
  doc.setFontSize(10.5)
  doc.setFont("helvetica", "bold")
  doc.text("MI ONCE TITULAR", pad, colY)
  
  // Underline
  doc.setFillColor(116, 172, 223, 0.25)
  doc.rect(pad, colY + 2, colW, 0.5, "F")

  let rowY = colY + 7
  draftedPlayers.forEach((p, idx) => {
    if (!p) return
    const slot = formation.positions[idx]
    
    // Position color mapping
    let posBg = [50, 50, 50]
    let posText = [200, 200, 200]
    const pType = slot?.pos || ""
    if (["GK", "POR"].includes(pType)) {
      posBg = [217, 119, 6] // Amber
    } else if (["CB", "LB", "RB", "DEF", "LI", "LD"].includes(pType)) {
      posBg = [8, 145, 178] // Cyan
    } else if (["CM", "CDM", "CAM", "MC", "MCD", "MCO"].includes(pType)) {
      posBg = [5, 150, 105] // Emerald
    } else {
      posBg = [220, 38, 38] // Red
    }

    // Row background
    doc.setFillColor(15, 23, 42, idx % 2 === 0 ? 0.45 : 0.8)
    doc.roundedRect(pad, rowY - 3, colW, 7.5, 1, 1, "F")

    // Position badge
    doc.setFillColor(posBg[0], posBg[1], posBg[2])
    doc.roundedRect(pad + 2, rowY - 2.2, 8, 5.8, 0.8, 0.8, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text((POS_LABELS[pType]?.slice(0, 3) || pType.slice(0, 3)).toUpperCase(), pad + 6, rowY + 1.6, { align: "center" })

    // Player Name
    doc.setTextColor(226, 232, 240)
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text(p.name, pad + 12, rowY + 1.8)

    // Player Rating
    doc.setTextColor(212, 175, 55) // Gold OVR
    doc.setFontSize(8.5)
    doc.text(`${p.rating}`, pad + colW - 3, rowY + 1.8, { align: "right" })

    rowY += 8.2
  })

  // ââ RIGHT COLUMN: TOURNAMENT RESULTS ââ
  doc.setTextColor(116, 172, 223)
  doc.setFontSize(10.5)
  doc.setFont("helvetica", "bold")
  doc.text(result.type === "liga" ? "TABLA DE POSICIONES" : "CRUCES DE COPA", col2X, colY)
  
  // Underline
  doc.setFillColor(116, 172, 223, 0.25)
  doc.rect(col2X, colY + 2, colW, 0.5, "F")

  if (result.type === "liga" && result.table) {
    let tblY = colY + 7
    
    // Table Headers
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "bold")
    doc.text("#", col2X + 2, tblY)
    doc.text("EQUIPO", col2X + 8, tblY)
    doc.text("PTS", col2X + 60, tblY, { align: "center" })
    doc.text("PJ", col2X + 69, tblY, { align: "center" })
    doc.text("DG", col2X + 78, tblY, { align: "center" })

    tblY += 4

    result.table.forEach((t: any, idx: number) => {
      const isMe = t.name === result.teamLabel
      
      // Determine rank dot colors
      let rankColor = [71, 85, 105] // Slate
      if (idx < 3) rankColor = [59, 130, 246] // Blue (Libertadores)
      else if (idx < 6) rankColor = [16, 185, 129] // Emerald (Sudamericana)
      else if (idx === 13) rankColor = [239, 68, 68] // Red (Relegation)

      // Row background
      doc.setFillColor(isMe ? 30 : 15, isMe ? 45 : 23, isMe ? 70 : 42, isMe ? 0.3 : (idx % 2 === 0 ? 0.45 : 0.8))
      doc.roundedRect(col2X, tblY - 3, colW, 5.8, 0.8, 0.8, "F")

      // Rank dot
      doc.setFillColor(rankColor[0], rankColor[1], rankColor[2])
      doc.roundedRect(col2X + 1.8, tblY - 2, 4, 3.8, 0.8, 0.8, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(5.5)
      doc.setFont("helvetica", "bold")
      doc.text(`${idx + 1}`, col2X + 3.8, tblY + 0.8, { align: "center" })

      // Team shortlabel
      doc.setTextColor(isMe ? 116 : 226, isMe ? 172 : 232, isMe ? 223 : 240)
      doc.setFontSize(7)
      doc.setFont("helvetica", isMe ? "bold" : "normal")
      doc.text(t.name.slice(0, 22), col2X + 8, tblY + 0.9)

      // Stats
      doc.setTextColor(isMe ? 116 : 148, isMe ? 172 : 163, isMe ? 223 : 184)
      doc.text(`${t.pts}`, col2X + 60, tblY + 0.9, { align: "center" })
      doc.text(`${t.w + t.d + t.l}`, col2X + 69, tblY + 0.9, { align: "center" })
      
      const dg = t.gf - t.ga
      doc.setTextColor(dg > 0 ? 74 : (dg < 0 ? 239 : 148), dg > 0 ? 222 : (dg < 0 ? 68 : 163), dg > 0 ? 128 : (dg < 0 ? 68 : 184))
      doc.text(`${dg > 0 ? "+" : ""}${dg}`, col2X + 78, tblY + 0.9, { align: "center" })

      tblY += 6
    })

    // Standing Legend
    tblY += 1.5
    doc.setFillColor(59, 130, 246)
    doc.circle(col2X + 3, tblY + 1, 1, "F")
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6.5)
    doc.text("Libertadores", col2X + 6, tblY + 2.1)

    doc.setFillColor(16, 185, 129)
    doc.circle(col2X + 30, tblY + 1, 1, "F")
    doc.text("Sudamericana", col2X + 33, tblY + 2.1)

    doc.setFillColor(239, 68, 68)
    doc.circle(col2X + 60, tblY + 1, 1, "F")
    doc.text("Descenso", col2X + 63, tblY + 2.1)

  } else if (result.rounds) {
    // Copa Bracket view
    let bracketY = colY + 7
    const renderRounds = result.rounds.slice(-3) // Show last 3 rounds (e.g. Cuartos, Semis, Final)
    
    renderRounds.forEach((round: any) => {
      doc.setTextColor(116, 172, 223)
      doc.setFontSize(7.5)
      doc.setFont("helvetica", "bold")
      doc.text(round.round.toUpperCase(), col2X, bracketY)
      bracketY += 4.5

      round.matches.slice(0, 4).forEach((m: any) => {
        const isMe = m.home === result.teamLabel || m.away === result.teamLabel
        
        doc.setFillColor(15, 23, 42, isMe ? 0.9 : 0.5)
        if (isMe) {
          doc.setDrawColor(116, 172, 223, 0.4)
          doc.roundedRect(col2X, bracketY - 3.2, colW, 6.2, 0.5, 0.5, "FD")
        } else {
          doc.roundedRect(col2X, bracketY - 3.2, colW, 6.2, 0.5, 0.5, "F")
        }

        doc.setTextColor(200, 210, 230)
        doc.setFontSize(6.5)
        doc.setFont("helvetica", isMe ? "bold" : "normal")
        doc.text(m.home.slice(0, 16), col2X + 3, bracketY + 0.9)
        doc.text(m.away.slice(0, 16), col2X + colW - 3, bracketY + 0.9, { align: "right" })

        doc.setTextColor(116, 172, 223)
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        const scoreText = `${m.homeGoals} - ${m.awayGoals}`
        doc.text(scoreText, col2X + colW / 2, bracketY + 0.9, { align: "center" })

        bracketY += 7.2
      })
      bracketY += 2
    })
  }

  // 6. Bottom Stats Card (y = 242)
  const statsY = 242
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(pad, statsY, W - pad * 2, 34, 4, 4, "F")

  doc.setTextColor(116, 172, 223)
  doc.setFontSize(10.5)
  doc.setFont("helvetica", "bold")
  doc.text("ESTADÃSTICAS DEL TORNEO", pad + 6, statsY + 7.5)

  doc.setFillColor(116, 172, 223, 0.15)
  doc.rect(pad + 6, statsY + 9.5, W - pad * 2 - 12, 0.5, "F")

  const totalGoals = result.playerStats.reduce((s, p) => s + p.goals, 0)
  const totalAssists = result.playerStats.reduce((s, p) => s + p.assists, 0)
  const topScorer = result.topScorers[0]
  const topAssister = result.topAssisters[0]

  doc.setTextColor(226, 232, 240)
  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.text(`Goles anotados: ${totalGoals}`, pad + 8, statsY + 18)
  doc.text(`Asistencias totales: ${totalAssists}`, pad + 8, statsY + 26)

  if (topScorer) {
    doc.setTextColor(226, 232, 240)
    doc.setFont("helvetica", "bold")
    doc.text("Goleador de la Plantilla", W / 2 + 10, statsY + 15)
    doc.setTextColor(148, 163, 184)
    doc.setFont("helvetica", "normal")
    doc.text(`${topScorer.playerName} (${topScorer.goals} goles)`, W / 2 + 10, statsY + 19)
  }
  if (topAssister) {
    doc.setTextColor(226, 232, 240)
    doc.setFont("helvetica", "bold")
    doc.text("Asistidor de la Plantilla", W / 2 + 10, statsY + 24)
    doc.setTextColor(148, 163, 184)
    doc.setFont("helvetica", "normal")
    doc.text(`${topAssister.playerName} (${topAssister.assists} asist.)`, W / 2 + 10, statsY + 28)
  }

  // 7. Footer (y = 286)
  doc.setFillColor(116, 172, 223)
  doc.rect(0, 294, W, 3, "F")
  doc.setTextColor(71, 85, 105)
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  doc.text("GAMBETA - EL JUEGO DEL FUTBOL ARGENTINO", W / 2, 290, { align: "center" })

  doc.save(`Draft3Estrellas_${result.teamLabel.replace(/\s+/g, "_")}_${result.type}.pdf`)
}
