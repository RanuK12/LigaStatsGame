import type { Metadata } from "next"
import LangDelDocumento from "@/components/LangDelDocumento"

/**
 * El sitio en inglés.
 *
 * El layout raíz escribe `<html lang="es-AR">` y desde un layout anidado no se puede cambiar esa
 * etiqueta, así que la corrige `LangDelDocumento` al montar. Lo que sí se define acá es la ficha
 * que leen Google y las redes, que es lo que decide si esta versión existe para el buscador.
 */
export const metadata: Metadata = {
  title: "Gambeta ⚽ | The Argentine Football Game & Draft Simulator",
  description: "Build your ideal XI from real Argentine football squads, play the daily challenge with the same draw as everyone, live a player's career and climb the ranking. Free, in your browser.",
  alternates: {
    canonical: "/en",
    languages: { es: "/", en: "/en", "pt-BR": "/pt" },
  },
  openGraph: {
    title: "Gambeta ⚽ The Argentine Football Game",
    description: "Build your ideal XI, live your career and play for the ranking.",
    url: "https://gambetafutbol.games/en",
    locale: "en_US",
  },
}

export default function LocaleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LangDelDocumento lang="en" />
      {children}
    </>
  )
}
