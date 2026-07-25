// Carta viral del resultado del Draft: se dibuja a canvas (1080x1350, formato IG/WhatsApp/X)
// para tener un asset nítido y branded, independiente del CSS del sitio. Exporta PNG, share
// nativo con imagen y un PDF con hotspot invisible clickeable que devuelve tráfico al sitio.

export interface SharePlayer {
  name?: string
  rating?: number
  position?: string
  club?: string
}
export interface ShareData {
  label?: string
  score: number
  formation?: string
  players: SharePlayer[]
}

const SITE = "gambetafutbol.games"
const SITE_URL = "https://gambetafutbol.games/"

const POS_COLOR: Record<string, string> = {
  GK: "#f59e0b", CB: "#3b82f6", LB: "#06b6d4", RB: "#06b6d4", CM: "#10b981",
  CDM: "#059669", CAM: "#8b5cf6", LW: "#ef4444", RW: "#ef4444", ST: "#dc2626",
  CF: "#ea580c", LM: "#ef4444", RM: "#ef4444", LWB: "#06b6d4", RWB: "#06b6d4",
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Dibuja la carta y devuelve el canvas (1080x1350). */
export function renderShareCard(data: ShareData): HTMLCanvasElement {
  const W = 1080, H = 1350
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // Fondo
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, "#04101f")
  bg.addColorStop(0.5, "#071627")
  bg.addColorStop(1, "#020a14")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  // Glow celeste superior
  const glow = ctx.createRadialGradient(W / 2, 120, 40, W / 2, 120, 620)
  glow.addColorStop(0, "rgba(116,172,223,0.22)")
  glow.addColorStop(1, "rgba(116,172,223,0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 420)

  // Franja argentina superior
  ctx.fillStyle = "#74ACDF"; ctx.fillRect(0, 0, W, 8)
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 8, W, 6)
  ctx.fillStyle = "#74ACDF"; ctx.fillRect(0, 14, W, 8)

  // Header wordmark
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.font = "900 74px Arial, sans-serif"
  ctx.fillText("GAMBETA", W / 2, 118)
  ctx.fillStyle = "#74ACDF"
  ctx.font = "700 22px Arial, sans-serif"
  ctx.fillText("EL JUEGO DEL FÚTBOL ARGENTINO", W / 2, 152)

  // Label
  ctx.fillStyle = "#93a4bd"
  ctx.font = "700 26px Arial, sans-serif"
  ctx.fillText("MI ONCE IDEAL", W / 2, 232)

  // Score gigante con gradiente
  const grd = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0)
  grd.addColorStop(0, "#22d3ee")
  grd.addColorStop(1, "#34d399")
  ctx.fillStyle = grd
  ctx.font = "900 180px Arial, sans-serif"
  ctx.fillText(String(data.score), W / 2 - 40, 400)
  ctx.fillStyle = "#5b6b82"
  ctx.font = "900 56px Arial, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("/99", W / 2 + 90, 400)
  ctx.textAlign = "center"

  // Equipo + formación
  if (data.label || data.formation) {
    ctx.fillStyle = "#dbe6f5"
    ctx.font = "800 34px Arial, sans-serif"
    ctx.fillText([data.label, data.formation].filter(Boolean).join("  ·  "), W / 2, 462)
  }

  // Figura de la cancha
  const best = [...data.players].filter(Boolean).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]
  if (best?.name) {
    ctx.fillStyle = "#D4AF37"
    ctx.font = "800 22px Arial, sans-serif"
    ctx.fillText(`★ FIGURA: ${best.name.toUpperCase()} (${best.rating})`, W / 2, 502)
  }

  // Lista de jugadores
  const players = data.players.filter(Boolean).slice(0, 11)
  const listTop = 540
  const listBottom = 1250
  const rowH = Math.min(62, (listBottom - listTop) / Math.max(players.length, 1))
  const padX = 90
  players.forEach((p, i) => {
    const y = listTop + i * rowH
    roundRect(ctx, padX, y, W - padX * 2, rowH - 10, 14)
    ctx.fillStyle = "rgba(255,255,255,0.05)"
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.08)"
    ctx.lineWidth = 1
    ctx.stroke()

    // chip de posición
    const pos = (p.position || "").toUpperCase()
    const chipW = 74
    roundRect(ctx, padX + 16, y + (rowH - 10) / 2 - 17, chipW, 34, 8)
    ctx.fillStyle = POS_COLOR[pos] || "#556"
    ctx.fill()
    ctx.fillStyle = "#ffffff"
    ctx.font = "900 20px Arial, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(pos || "-", padX + 16 + chipW / 2, y + (rowH - 10) / 2 + 7)

    // nombre
    ctx.textAlign = "left"
    ctx.fillStyle = "#e8eefb"
    ctx.font = "700 30px Arial, sans-serif"
    ctx.fillText(p.name || "—", padX + 108, y + (rowH - 10) / 2 + 10)

    // rating
    ctx.textAlign = "right"
    ctx.fillStyle = "#34d399"
    ctx.font = "900 32px Arial, sans-serif"
    ctx.fillText(String(p.rating ?? "—"), W - padX - 22, y + (rowH - 10) / 2 + 11)
  })

  // Footer / CTA (canal de retorno)
  roundRect(ctx, 0, H - 78, W, 78, 0)
  ctx.fillStyle = "rgba(116,172,223,0.14)"
  ctx.fill()
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.font = "900 30px Arial, sans-serif"
  ctx.fillText(`ARMÁ TU 11  →  ${SITE}`, W / 2, H - 30)

  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("no blob"))), "image/png"))
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Descarga la carta como PNG. */
export async function downloadShareImage(data: ShareData) {
  const blob = await canvasToBlob(renderShareCard(data))
  triggerDownload(blob, "mi-once-gambeta.png")
}

/** Comparte la imagen por el share nativo (con archivo); cae a descarga si no está disponible. */
export async function shareImage(data: ShareData, text: string) {
  const blob = await canvasToBlob(renderShareCard(data))
  const file = new File([blob], "mi-once-gambeta.png", { type: "image/png" })
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Mi once en Gambeta", text, url: SITE_URL })
      return
    } catch {
      /* usuario canceló o falló: cae a descarga */
    }
  }
  triggerDownload(blob, "mi-once-gambeta.png")
}

/** Descarga un PDF con la carta + un hotspot invisible clickeable que vuelve al sitio. */
export async function downloadSharePDF(data: ShareData) {
  const { jsPDF } = await import("jspdf")
  const canvas = renderShareCard(data)
  const img = canvas.toDataURL("image/png")
  const doc = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] })
  doc.addImage(img, "PNG", 0, 0, canvas.width, canvas.height)
  // Hotspot invisible: toda la página es clickeable y devuelve al sitio.
  doc.link(0, 0, canvas.width, canvas.height, { url: SITE_URL })
  doc.save("mi-once-gambeta.pdf")
}
