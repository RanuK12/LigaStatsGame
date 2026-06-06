import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Draft de Leyendas | LigaStatsGame',
}

export default function DraftLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
