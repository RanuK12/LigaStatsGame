import type { Metadata } from "next"
import CarreraCompartidaCliente from "./CarreraCompartidaCliente"

// La carrera viaja en la URL, así que el título y la imagen de previsualización son los mismos
// para todas. Personalizarlos necesita un servidor que lea el parámetro y arme el PNG al vuelo,
// y el sitio es export estático: es la fase siguiente, con un Worker aparte.
export const metadata: Metadata = {
  title: "La carrera de un crack | Gambeta",
  description:
    "Mirá la carrera completa: clubes, títulos, goles y a qué leyenda del fútbol argentino se pareció. Después creá la tuya, gratis y sin registrarte.",
  // Sin indexar: todas las carreras comparten la misma ruta y solo cambia el parámetro, así que
  // lo único que Google podría guardar es la página vacía con el cartel de "este link no anda".
  // El valor del link son las visitas y la previsualización, no aparecer en el buscador.
  robots: { index: false, follow: true },
}

export default function CarreraCompartidaPage() {
  return <CarreraCompartidaCliente />
}
