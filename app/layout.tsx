import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Liga Argentina Fans ⚽ | Arma tu 11 de la Historia',
  description: 'Armá tu 11 ideal de la historia del fútbol argentino. Elegí plantels reales, simulá partidos y compartí tu resultado.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Liga Argentina Fans',
    description: 'El juego del fútbol argentino',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#071422',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logos/afa/afa.svg" />
      </head>
      <body className="bg-[#071422] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
