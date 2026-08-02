"use client"

/**
 * La ficha compartible. Se dibuja a canvas para no depender del CSS del sitio y que salga
 * siempre igual, con la marca de Gambeta y el link.
 *
 * Dos medidas, porque cada red recorta distinto:
 *
 *   · "historia" (1080×1920) para historias de Instagram y estados de WhatsApp.
 *   · "ancha" (1200×675) para la línea de tiempo de X y para el chat de WhatsApp. X muestra
 *     las imágenes verticales recortadas a una tira: de una ficha de 1920 de alto se veía el
 *     encabezado y nada más, justo la parte que no dice nada.
 */

const SITE = "gambetafutbol.games"

export type FormatoFicha = "historia" | "ancha"

const MEDIDAS: Record<FormatoFicha, { W: number; H: number }> = {
  historia: { W: 1080, H: 1920 },
  ancha: { W: 1200, H: 675 },
}

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

export function renderStoryCard(data: StoryData, formato: FormatoFicha = "historia"): HTMLCanvasElement {
  if (formato === "ancha") return renderFichaAncha(data)

  const { W, H } = MEDIDAS.historia
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

  // El título entra entero o se achica, pero no se corta.
  //
  // Antes se dibujaban dos líneas a 108 px y el resto se tiraba: "Nicolás Ferrari se pareció a
  // Juan Román Riquelme" salía como "...SE PARECIÓ A JUAN" y el titular quedaba sin el nombre,
  // que es justo lo único que la placa tiene para decir. Ahora se prueban tamaños hasta que el
  // texto completo entre en las líneas disponibles.
  ctx.fillStyle = "#FFFFFF"
  const TOPE_LINEAS = 4
  let tam = 108
  let tituloLineas: string[] = []
  for (const prueba of [108, 96, 84, 74, 66]) {
    ctx.font = `900 ${prueba}px Impact, 'Arial Black', sans-serif`
    tituloLineas = wrap(ctx, data.titulo.toUpperCase(), W - 140)
    tam = prueba
    if (tituloLineas.length <= TOPE_LINEAS) break
  }
  // Aunque no haya entrado en el más chico, se dibuja lo que hay: mejor apretado que mutilado.
  ctx.font = `900 ${tam}px Impact, 'Arial Black', sans-serif`
  const alto = Math.round(tam * 1.02)
  tituloLineas.forEach((l, i) => ctx.fillText(l, W / 2, 650 + i * alto))

  if (data.subtitulo) {
    ctx.fillStyle = "#B9C6DA"
    ctx.font = "600 38px system-ui, sans-serif"
    wrap(ctx, data.subtitulo, W - 180)
      .slice(0, 2)
      .forEach((l, i) => ctx.fillText(l, W / 2, 650 + tituloLineas.length * alto + 20 + i * 50))
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

/**
 * La misma ficha, apaisada, para la línea de tiempo de X y el chat de WhatsApp.
 *
 * No es la vertical escalada: en 675 px de alto no entra la misma composición. Acá el texto va a
 * la izquierda y las métricas a la derecha, que es lo que se lee de un vistazo al pasar el dedo.
 */
function renderFichaAncha(data: StoryData): HTMLCanvasElement {
  const { W, H } = MEDIDAS.ancha
  const acento = data.acento || "#F6C750"
  const canvas = document.createElement("canvas")
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext("2d")!

  const fondo = ctx.createLinearGradient(0, 0, W, H)
  fondo.addColorStop(0, "#0a1428")
  fondo.addColorStop(0.55, "#050a16")
  fondo.addColorStop(1, "#02040c")
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(880, 340, 30, 880, 340, 520)
  glow.addColorStop(0, `${acento}2E`)
  glow.addColorStop(1, "transparent")
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const franja = ["#74ACDF", "#FFFFFF", "#74ACDF"]
  franja.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(0, i * 7, W, 7)
  })

  // Columna izquierda: marca, volanta, titular.
  const X = 64
  ctx.textAlign = "left"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 40px Impact, 'Arial Black', sans-serif"
  ctx.fillText("GAMBETA", X, 100)
  ctx.fillStyle = "#74ACDF"
  ctx.font = "700 17px system-ui, sans-serif"
  ctx.fillText("EL JUEGO DEL FÚTBOL ARGENTINO", X, 128)

  ctx.fillStyle = acento
  ctx.font = "800 22px system-ui, sans-serif"
  ctx.fillText(data.volanta.toUpperCase(), X, 208)

  // Mismo criterio que en la vertical: entra entero o se achica, pero no se corta. Cortar el
  // titular en "…SE PARECIÓ A JUAN" deja la placa sin lo único que tenía para decir.
  ctx.fillStyle = "#FFFFFF"
  let tam = 62
  let titulo: string[] = []
  for (const prueba of [62, 54, 47, 42]) {
    ctx.font = `900 ${prueba}px Impact, 'Arial Black', sans-serif`
    titulo = wrap(ctx, data.titulo.toUpperCase(), 620)
    tam = prueba
    if (titulo.length <= 3) break
  }
  ctx.font = `900 ${tam}px Impact, 'Arial Black', sans-serif`
  const alto = Math.round(tam * 1.06)
  titulo.forEach((l, i) => ctx.fillText(l, X, 282 + i * alto))

  let y = 282 + titulo.length * alto + 10
  if (data.subtitulo) {
    ctx.fillStyle = "#B9C6DA"
    ctx.font = "600 25px system-ui, sans-serif"
    wrap(ctx, data.subtitulo, 620)
      .slice(0, 2)
      .forEach((l, i) => ctx.fillText(l, X, y + i * 34))
    y += 34 * Math.min(2, wrap(ctx, data.subtitulo, 620).length) + 8
  }

  if (data.pie) {
    ctx.fillStyle = "#8FA3BD"
    ctx.font = "italic 21px system-ui, sans-serif"
    wrap(ctx, data.pie, 620)
      .slice(0, 2)
      .forEach((l, i) => ctx.fillText(l, X, y + 24 + i * 30))
  }

  // Columna derecha: las métricas, en dos por dos.
  const stats = data.stats.slice(0, 4)
  const cajaW = 178
  const cajaH = 132
  const x0 = W - 64 - (cajaW * 2 + 20)
  const y0 = 190
  stats.forEach((s, i) => {
    const x = x0 + (i % 2) * (cajaW + 20)
    const yy = y0 + Math.floor(i / 2) * (cajaH + 20)
    ctx.fillStyle = "rgba(255,255,255,0.05)"
    roundRect(ctx, x, yy, cajaW, cajaH, 22)
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.10)"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.textAlign = "center"
    ctx.fillStyle = acento
    ctx.font = "900 56px Impact, 'Arial Black', sans-serif"
    ctx.fillText(s.valor, x + cajaW / 2, yy + 78)
    ctx.fillStyle = "#8FA3BD"
    ctx.font = "700 16px system-ui, sans-serif"
    ctx.fillText(s.label.toUpperCase(), x + cajaW / 2, yy + 110)
    ctx.textAlign = "left"
  })

  // El link, abajo a la derecha: es lo que tiene que quedar cuando alguien ve la captura.
  ctx.textAlign = "right"
  ctx.fillStyle = "#FFFFFF"
  ctx.font = "900 26px Impact, 'Arial Black', sans-serif"
  ctx.fillText("JUGÁ GRATIS", W - 64, H - 74)
  ctx.fillStyle = "#74ACDF"
  ctx.font = "800 23px system-ui, sans-serif"
  ctx.fillText(SITE.toUpperCase(), W - 64, H - 44)

  franja.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(0, H - 21 + i * 7, W, 7)
  })

  return canvas
}

/** Ficha lista para compartir. Por defecto, la vertical de historias. */
export function storyBlob(data: StoryData, formato: FormatoFicha = "historia"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    renderStoryCard(data, formato).toBlob(
      (b) => (b ? resolve(b) : reject(new Error("no blob"))),
      "image/png",
    )
  })
}
