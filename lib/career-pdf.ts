"use client"

/**
 * Export the career "ficha" DOM node to HD PNG or PDF.
 * Uses html2canvas (DOM -> canvas) and jsPDF, both already project dependencies,
 * loaded dynamically so they stay out of the main bundle.
 */

async function captureNode(node: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import('html2canvas')).default
  return html2canvas(node, {
    scale: 2,
    backgroundColor: '#020813',
    useCORS: true,
    logging: false,
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
  const canvas = await captureNode(node)
  triggerDownload(canvas.toDataURL('image/png'), `ficha-${slug(playerName)}.png`)
}

export async function downloadFichaPdf(node: HTMLElement, playerName: string): Promise<void> {
  const canvas = await captureNode(node)
  const imgData = canvas.toDataURL('image/png')
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: canvas.height >= canvas.width ? 'portrait' : 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height],
  })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`ficha-${slug(playerName)}.pdf`)
}

/** Filename-safe slug. NFD + stripping non-alphanumerics also removes accents. */
function slug(name: string): string {
  const s = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return s || 'jugador'
}
