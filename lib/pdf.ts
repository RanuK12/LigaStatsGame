import type { Player, TournamentResult } from "./types"
import { POS_LABELS } from "./game-engine"

export
async function generatePDF(result: TournamentResult, draftedPlayers: (Player | null)[], formation: any) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ format: "a4", unit: "mm" })
  const W = 210, pad = 18

  // Background
  doc.setFillColor(10, 14, 27)
  doc.rect(0, 0, W, 297, "F")

  // Header accent line
  doc.setFillColor(117, 170, 219)
  doc.rect(0, 0, W, 3, "F")

  let y = 14

  // Title
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.text("Draft Tres Estrellas", W / 2, y, { align: "center" })
  y += 8

  doc.setTextColor(180, 180, 200)
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Temporada · ${new Date().toLocaleDateString("es-AR")}`, W / 2, y, { align: "center" })
  y += 10

  // Champion banner
  if (result.isChampion) {
    doc.setFillColor(251, 191, 36, 0.15)
    doc.roundedRect(pad, y - 4, W - pad * 2, 20, 4, 4, "F")
    doc.setTextColor(251, 191, 36)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("🏆 ¡CAMPEÓN! 🏆", W / 2, y + 9, { align: "center" })
    y += 24
  } else {
    doc.setTextColor(200, 200, 220)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    const msg = result.type === "liga"
      ? `Posición ${result.playerPos}° de ${result.table?.length || "?"}`
      : result.eliminated ? `Eliminado en ${result.eliminatedRound}` : "Subcampeón"
    doc.text(msg, W / 2, y + 6, { align: "center" })
    y += 16
  }

  // Team info
  doc.setFillColor(20, 27, 50)
  doc.roundedRect(pad, y, W - pad * 2, 26, 4, 4, "F")
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.text(result.teamLabel, W / 2, y + 10, { align: "center" })
  doc.setTextColor(140, 150, 180)
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Formación: ${result.formation}   ·   Score: ${result.teamScore} pts`, W / 2, y + 20, { align: "center" })
  y += 34

  // Players list
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Plantilla", pad, y)
  y += 6
  doc.setFillColor(117, 170, 219, 0.1)
  doc.rect(pad, y, W - pad * 2, 0.5, "F")
  y += 5

  draftedPlayers.filter(Boolean).forEach((p, i) => {
    if (!p) return
    const slot = formation.positions[i]
    doc.setFillColor(i % 2 === 0 ? 15 : 20, i % 2 === 0 ? 20 : 27, i % 2 === 0 ? 40 : 50)
    doc.rect(pad, y - 3, W - pad * 2, 8, "F")
    doc.setTextColor(200, 210, 230)
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text(`${POS_LABELS[slot?.pos] || slot?.pos || "?"}`, pad + 2, y + 2)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(230, 235, 250)
    doc.text(p.name, pad + 22, y + 2)
    doc.setTextColor(117, 170, 219)
    doc.text(`${p.rating}`, W - pad - 2, y + 2, { align: "right" })
    y += 8
  })
  y += 6

  // Stats
  const totalGoals = result.playerStats.reduce((s, p) => s + p.goals, 0)
  const totalAssists = result.playerStats.reduce((s, p) => s + p.assists, 0)
  const topScorer = result.topScorers[0]
  const topAssister = result.topAssisters[0]

  doc.setFillColor(20, 27, 50)
  doc.roundedRect(pad, y, W - pad * 2, 32, 4, 4, "F")
  doc.setTextColor(117, 170, 219)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Estadísticas del torneo", pad + 6, y + 9)
  doc.setTextColor(200, 210, 230)
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.text(`⚽ Goles del equipo: ${totalGoals}`, pad + 6, y + 18)
  doc.text(`🅰️ Asistencias: ${totalAssists}`, pad + 6, y + 25)
  if (topScorer) doc.text(`🥇 Goleador: ${topScorer.playerName} (${topScorer.goals} goles)`, W / 2 + 4, y + 18)
  if (topAssister) doc.text(`🥇 Asistidor: ${topAssister.playerName} (${topAssister.assists} asist.)`, W / 2 + 4, y + 25)
  y += 40

  // Footer
  doc.setFillColor(117, 170, 219)
  doc.rect(0, 294, W, 3, "F")
  doc.setTextColor(100, 110, 140)
  doc.setFontSize(8)
  doc.text("Draft Tres Estrellas · draft3estrellas.com · Generado automáticamente", W / 2, 291, { align: "center" })

  doc.save(`Draft3Estrellas_${result.teamLabel.replace(/\s+/g, "_")}_${result.type}.pdf`)
}
