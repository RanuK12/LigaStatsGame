"use client"

/**
 * Exporta la ficha de carrera a PNG / JPG / PDF en alta.
 *
 * Se usa `html-to-image` (SVG + foreignObject) y NO html2canvas: html2canvas reimplementa el
 * layout de texto y con la tipografía de impacto corría los números hacia abajo y los cortaba
 * (el OVR y la columna de OVR por temporada salían desfasados). Con foreignObject dibuja el
 * navegador, así que lo exportado es idéntico a lo que se ve en pantalla.
 */

const BG = '#03060d'

async function esperarRecursos(node: HTMLElement): Promise<void> {
  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready
  } catch {
    /* noop */
  }
  const imgs = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }),
    ),
  )
}

async function capturar(node: HTMLElement, tipo: 'png' | 'jpeg'): Promise<{ dataUrl: string; width: number; height: number }> {
  const { toPng, toJpeg } = await import('html-to-image')
  await esperarRecursos(node)

  const rect = node.getBoundingClientRect()
  const opciones = {
    pixelRatio: 3, // retina: nítido para imprimir o compartir
    backgroundColor: BG,
    cacheBust: true,
    width: Math.ceil(rect.width),
    height: Math.ceil(rect.height),
    style: {
      // El efecto 3D de la tarjeta no aporta nada en una imagen fija y desalinea el recorte.
      transform: 'none',
      transformStyle: 'flat',
      perspective: 'none',
      animation: 'none',
      transition: 'none',
      margin: '0',
    } as Partial<CSSStyleDeclaration>,
    filter: (el: HTMLElement) => !(el.dataset && el.dataset.exportar === 'no'),
  }

  const dataUrl = tipo === 'png' ? await toPng(node, opciones) : await toJpeg(node, { ...opciones, quality: 0.98 })
  return {
    dataUrl,
    width: Math.ceil(rect.width * 3),
    height: Math.ceil(rect.height * 3),
  }
}

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadFichaPng(node: HTMLElement, playerName: string): Promise<void> {
  const { dataUrl } = await capturar(node, 'png')
  triggerDownload(dataUrl, `ficha-${slug(playerName)}.png`)
}

export async function downloadFichaJpg(node: HTMLElement, playerName: string): Promise<void> {
  const { dataUrl } = await capturar(node, 'jpeg')
  triggerDownload(dataUrl, `ficha-${slug(playerName)}.jpg`)
}

const SITE_URL = 'https://gambetafutbol.games/'

export async function downloadFichaPdf(node: HTMLElement, playerName: string): Promise<void> {
  const { dataUrl, width, height } = await capturar(node, 'png')
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({
    orientation: height >= width ? 'portrait' : 'landscape',
    unit: 'px',
    format: [width, height],
    compress: true,
  })

  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'SLOW')
  // Hotspot invisible: toda la ficha es clickeable y lleva al sitio.
  pdf.link(0, 0, width, height, { url: SITE_URL })
  pdf.save(`ficha-${slug(playerName)}.pdf`)
}

/** Filename-safe slug. NFD + stripping non-alphanumerics removes accents. */
function slug(name: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return s || 'jugador'
}
