import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reto Diario | Gambeta',
  description: 'El desafío de hoy: mismo bombo para todos. Jugá tu racha y compará tu 11 con el del resto.',
}

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
