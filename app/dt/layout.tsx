import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Modo DT | Gambeta',
  description:
    'Dirigí un club de la Liga Profesional: la dirigencia te pone un objetivo, manejás el presupuesto, comprás y vendés, y si no cumplís te echan. Con planteles reales, gratis y sin registro.',
  alternates: { canonical: '/dt/' },
  openGraph: {
    title: 'Modo DT | Gambeta',
    description:
      'Te dan un club y un objetivo. Comprás, vendés y dirigís. Si no cumplís, te echan y tenés que empezar de nuevo en otro lado.',
    images: ['/social/og-carrera.png'],
  },
}

export default function DTLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
