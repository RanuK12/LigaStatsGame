import type { Metadata, Viewport } from 'next'
import { Archivo, Inter, Bebas_Neue, Anton } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/Header'
import AuthModal from '@/components/AuthModal'
import UserProfileModal from '@/components/UserProfileModal'

// Anton: display condensada de alto impacto para titulares (estilo estadio).
const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-impact',
})

// Malvinas Sans: tipografía creada a raíz de la bandera de Malvinas. Guiño indirecto:
// solo cubre A-Z/0-9 (sin acentos), por eso se usa en el wordmark sin acentos.
const malvinas = localFont({
  src: './fonts/MalvinasSans-Regular.otf',
  variable: '--font-malvinas',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
})

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bandera',
})

export const metadata: Metadata = {
  title: 'Gambeta ⚽ | El Juego del Fútbol Argentino',
  description: 'Armá tu 11 ideal, viví tu carrera de crack y competí por el ranking. El juego del fútbol argentino con planteles reales de toda la historia.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Gambeta ⚽ El Juego del Fútbol Argentino',
    description: 'Armá tu 11 ideal, viví tu carrera y competí por el ranking.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#020813',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${archivo.variable} ${inter.variable} ${bebas.variable} ${malvinas.variable} ${anton.variable}`}>
      <head>
        <link rel="icon" href="/logos/afa.png" />
      </head>
      <body className="bg-[#020813] text-white min-h-screen antialiased font-sans">
        <Header />
        <main className="w-full">
          {children}
        </main>
        {/* Modales a nivel body: fixed inset-0 relativo al viewport (no recortado por el header) */}
        <AuthModal />
        <UserProfileModal />
      </body>
    </html>
  )
}

