import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LigaStatsGame 🏆 | El Draft del Fútbol Argentino',
  description: 'Arma tu equipo de leyendas de la Superliga Argentina. Draft, ruleta y simulación de temporada.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
