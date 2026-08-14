import type { Metadata } from "next"
import EquipoCompartidoCliente from "./EquipoCompartidoCliente"

// El once viaja en la URL, así que el título y la imagen de previsualización son los mismos para
// todos. Personalizarlos necesita un servidor que lea el parámetro y arme el PNG al vuelo: es la
// fase siguiente, con un Worker aparte.
export const metadata: Metadata = {
  title: "El once que armó un hincha | Gambeta",
  description:
    "Mirá el equipo completo: los once, la formación y cómo le fue en el torneo. Después armá el tuyo, gratis y sin registrarte.",
  // Sin indexar: todos los equipos comparten la misma ruta y solo cambia el parámetro, así que
  // lo único que Google podría guardar es la página vacía. El valor del link son las visitas.
  robots: { index: false, follow: true },
}

export default function EquipoCompartidoPage() {
  return <EquipoCompartidoCliente />
}
