import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ranking Global | Gambeta',
  description: 'La tabla de los mejores del fútbol argentino. Subí de Bronce a Leyenda según cómo te vaya con tu 11.',
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
