"use client"

/**
 * Imagen vertical 1080x1920 para historias (Instagram / WhatsApp). Se dibuja a canvas para no
 * depender del CSS del sitio y que salga siempre igual, con la marca de Gambeta y el link.
 */

const W = 1080
const H = 1920
const SITE = "gambetafutbol.games"

export interface StoryData {
  /** Volanta chica arriba del título (ej: "DRAFT COMPLETADO") */
  volanta: string
  /** Título grande (ej: "¡CAMPEÓN!") */
  titulo: string
  /** Línea de contexto bajo el título */
  subtitulo?: string
  /** Hasta 4 métricas destacadas */
  stats: { valor: string; label: string }[]
  /** Frase de cierre (ej: la crónica del retiro) */
  pie?: string
  /** Acento principal (dorado si hay título, celeste si no) */
  acento?: string
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

function wrap(ctx: CanvasRenderingContext2D, texto: string, max: number): string[] {
  const palabras = texto.split(" ")
  const lineas: string[] = []
  let actual = ""
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p
    if (ctx.measureText(prueba).width > max && actual) {
      lineas.push(actual)
      actual = p
    } else {
      actual = prueba
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

export function renderStoryCard(data: StoryData): HTMLCanvasElement {
  const acento = data.acento || "#F6C750"
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  // Fondo
  const fondo = ctx.createLinearGradient(0, 0, W, H)
  fondo.addColorStop(0, "#0a1428")
  fondo.addColorStop(0.55, "#050a16")
  fondo.addColorStop(1, "#02040c")
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, W, H)

  // Resplandor del acento
  const glow = ctx.createRadialGradient(W / 2, 640, 40, W / 2, 640, 700)
  glow.addColorStop(0, `${acento}33`)
  glow.addColorStop(1, "transparent")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Franja celeste y blanca arriba
  const franja = [ "#74ACDF", "#FFFFFF", "#74ACDF" ]
  franja.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(0, i * 10, W, 10)
  })

  // Marca
  ctx.textAlign = "center"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 62px Impact, 'Arial Black', sans-serif"
  ctx.fillText("GAMBETA", W / 2, 190)
  ctx.fillStyle = acento
  ctx.font = "600 40px system-ui, sans-serif"
  ctx.fillText("★ ★ ★", W / 2, 245)
  ctx.fillStyle = "#74ACDF"
  ctx.font = "700 26px system-ui, sans-serif"
  ctx.fillText("EL JUEGO DEL FÚTBOL ARGENTINO", W / 2, 300)

  // Volanta + título
  ctx.fillStyle = acento
  ctx.font = "800 30px system-ui, sans-serif"
  ctx.fillText(data.volanta.toUpperCase(), W / 2, 520)

  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 108px Impact, 'Arial Black', sans-serif"
  const tituloLineas = wrap(ctx, data.titulo.toUpperCase(), W - 140)
  tituloLineas.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, 650 + i * 110))

  if (data.subtitulo) {
    ctx.fillStyle = "#B9C6DA"
    ctx.font = "600 38px system-ui, sans-serif"
    const subLineas = wrap(ctx, data.subtitulo, W - 180)
    subLineas.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, 650 + tituloLineas.length * 110 + 20 + i * 50))
  }

  // Métricas
  const stats = data.stats.slice(0, 4)
  if (stats.length) {
    const cajaW = 420
    const cajaH = 190
    const cols = stats.length <= 2 ? stats.length : 2
    const filas = Math.ceil(stats.length / cols)
    const totalW = cols * cajaW + (cols - 1) * 40
    const x0 = (W - totalW) / 2
    const y0 = 1080

    stats.forEach((s, i) => {
      const col = i % cols
      const fila = Math.floor(i / cols)
      const x = x0 + col * (cajaW + 40)
      const y = y0 + fila * (cajaH + 32)
      ctx.fillStyle = "rgba(255,255,255,0.05)"
      roundRect(ctx, x, y, cajaW, cajaH, 28)
      ctx.fill()
      ctx.strokeStyle = "rgba(255,255,255,0.10)"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = acento
      ctx.font = "900 82px Impact, 'Arial Black', sans-serif"
      ctx.fillText(s.valor, x + cajaW / 2, y + 108)
      ctx.fillStyle = "#8FA3BD"
      ctx.font = "700 24px system-ui, sans-serif"
      ctx.fillText(s.label.toUpperCase(), x + cajaW / 2, y + 152)
    })

    if (data.pie) {
      const yPie = y0 + filas * (cajaH + 32) + 60
      ctx.fillStyle = "#CBD5E1"
      ctx.font = "italic 32px system-ui, sans-serif"
      wrap(ctx, data.pie, W - 200)
        .slice(0, 3)
        .forEach((l, i) => ctx.fillText(l, W / 2, yPie + i * 46))
    }
  }

  // Pie de marca
  ctx.fillStyle = "rgba(255,255,255,0.08)"
  ctx.fillRect(120, H - 240, W - 240, 2)
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 44px Impact, 'Arial Black', sans-serif"
  ctx.fillText("JUGÁ GRATIS", W / 2, H - 160)
  ctx.fillStyle = "#74ACDF"
  ctx.font = "800 38px system-ui, sans-serif"
  ctx.fillText(SITE.toUpperCase(), W / 2, H - 100)

  franja.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(0, H - 30 + i * 10, W, 10)
  })

  return canvas
}

/** Imagen de historia lista para compartir. */
export function storyBlob(data: StoryData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    renderStoryCard(data).toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png")
  })
}
