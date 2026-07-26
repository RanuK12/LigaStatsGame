"use client"

/**
 * Export the career "ficha" DOM node to ultra-crisp HD PNG or PDF (300 DPI / 3x Retina).
 * Uses html2canvas (DOM -> canvas) and jsPDF.
 */

async function captureNodeHD(node: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default

  // Wait for all images inside the node to load fully before capturing
  const images = Array.from(node.querySelectorAll('img'))
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        })
    )
  )

  return html2canvas(node, {
    scale: 3, // 3x Retina resolution for ultra-crisp HD rendering
    backgroundColor: '#03060d',
    useCORS: true,
    allowTaint: true,
    logging: false,
    imageTimeout: 15000,
    // La ficha usa efecto 3D (preserve-3d, rotateX/Y, translateZ). html2canvas NO soporta
    // 3D y lo captura desfasado. Aplanamos todos los transforms en el CLON antes de rasterizar.
    onclone: (clonedDoc: Document) => {
      clonedDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
        const t = el.style.transform
        if (t && /rotate|translatez|perspective|scale3d/i.test(t)) el.style.transform = 'none'
        el.style.transformStyle = 'flat'
        el.style.perspective = 'none'
        el.style.transition = 'none'
        el.style.animation = 'none'
      })
      clonedDoc.querySelectorAll<HTMLElement>('.perspective-1000, [class*="perspective"]').forEach((el) => {
        el.style.perspective = 'none'
        el.style.transform = 'none'
      })
    },
  })
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
  const canvas = await captureNodeHD(node)
  const dataUrl = canvas.toDataURL('image/png', 1.0)
  triggerDownload(dataUrl, `ficha-${slug(playerName)}.png`)
}

export async function downloadFichaJpg(node: HTMLElement, playerName: string): Promise<void> {
  const canvas = await captureNodeHD(node)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.98) // máxima calidad JPG
  triggerDownload(dataUrl, `ficha-${slug(playerName)}.jpg`)
}

const SITE_URL = 'https://gambetafutbol.games/'

export async function downloadFichaPdf(node: HTMLElement, playerName: string): Promise<void> {
  const canvas = await captureNodeHD(node)
  // PNG lossless: texto y escudos nítidos (JPEG artefactaba los bordes del OVR).
  const imgData = canvas.toDataURL('image/png', 1.0)
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({
    orientation: canvas.height >= canvas.width ? 'portrait' : 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height],
    compress: true,
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'SLOW')
  // Hotspot invisible: toda la ficha es clickeable y lleva al sitio.
  pdf.link(0, 0, canvas.width, canvas.height, { url: SITE_URL })
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
