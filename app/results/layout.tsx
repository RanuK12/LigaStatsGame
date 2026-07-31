import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Resultados | Gambeta',
  description: 'Cómo terminó tu torneo: tabla, goleadores y asistidores de tu temporada.',
}

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
