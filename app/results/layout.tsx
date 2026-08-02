import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resultados | Gambeta',
  description: 'Cómo terminó tu torneo: tabla, goleadores y asistidores de tu temporada.',
  // El resultado es de una partida concreta: no hay nada que Google pueda ofrecerle a nadie más.
  robots: { index: false, follow: true },
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
