import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ruleta de Leyendas | Gambeta',
  description: 'Tirá la ruleta y mirá qué leyenda del fútbol argentino te toca.',
}

export default function RuletaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
