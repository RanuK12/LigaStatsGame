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

/** Corre `p`, pero si tarda más de `ms` sigue de largo en vez de quedarse esperando. */
function conLimite<T>(p: Promise<T>, ms: number, siFalla: T): Promise<T> {
  return Promise.race([p, new Promise<T>((r) => setTimeout(() => r(siFalla), ms))])
}

async function esperarRecursos(node: HTMLElement): Promise<void> {
  try {
    await conLimite((document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve(), 3000, undefined as never)
  } catch {
    /* noop */
  }
  // Una ficha de 15 temporadas tiene ~17 escudos. Si alguno no dispara ni onload ni onerror
  // (pasa con imágenes que quedan pendientes), la espera no terminaba nunca y el botón se
  // quedaba en "..." para siempre. Con tope: la ficha sale, y a lo sumo sin ese escudo.
  const imgs = Array.from(node.querySelectorAll('img'))
  await conLimite(
    Promise.all(
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
    ),
    4000,
    [] as never,
  )
}

async function capturar(node: HTMLElement, tipo: 'png' | 'jpeg'): Promise<{ dataUrl: string; width: number; height: number }> {
  const { toPng, toJpeg } = await import('html-to-image')
  await esperarRecursos(node)

  const rect = node.getBoundingClientRect()
  // Escala adaptativa: una carrera de 15 temporadas da una ficha de ~1300px de alto, y a 3x
  // son casi 8 megapíxeles — tardaba 36 segundos en generarse. A 2x sigue siendo nítida para
  // compartir o imprimir y baja el tiempo a un tercio. Las fichas cortas mantienen el 3x.
  const escala = rect.height > 900 ? 2 : 3
  const opciones = {
    pixelRatio: escala, // retina: nítido para imprimir o compartir
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

  const dataUrl = await conLimite(
    tipo === 'png' ? toPng(node, opciones) : toJpeg(node, { ...opciones, quality: 0.98 }),
    20000,
    '',
  )
  if (!dataUrl) throw new Error('La exportación tardó demasiado. Probá de nuevo.')
  return {
    dataUrl,
    width: Math.ceil(rect.width * escala),
    height: Math.ceil(rect.height * escala),
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
