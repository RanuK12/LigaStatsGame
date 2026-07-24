import type { Metadata, Viewport } from 'next'
import { Outfit, Space_Grotesk, Inter, Bebas_Neue, Anton } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/Header'
import AuthModal from '@/components/AuthModal'
import UserProfileModal from '@/components/UserProfileModal'

// Outfit: tipografía moderna geométrica de alto impacto para títulos y displays
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
})

// Space Grotesk: font deportivo/tecnológico ultra-moderno para números y badges
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sport',
})

// Inter: lectura limpia e impecable en cuerpo de texto
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-sans',
})

// Anton: display condensado estilo estadio
const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-impact',
})

// Malvinas Sans: tipografía creada a raíz de la bandera de Malvinas
const malvinas = localFont({
  src: './fonts/MalvinasSans-Regular.otf',
  variable: '--font-malvinas',
  display: 'swap',
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
    <html
      lang="es"
      className={`${outfit.variable} ${spaceGrotesk.variable} ${inter.variable} ${bebas.variable} ${malvinas.variable} ${anton.variable}`}
    >
      <head>
        <link rel="icon" href="/logos/gambeta.svg" />
      </head>
      <body className="bg-[#020813] text-white min-h-screen antialiased font-sans">
        <Header />
        <main className="w-full">{children}</main>
        <AuthModal />
        <UserProfileModal />
      </body>
    </html>
  )
}
