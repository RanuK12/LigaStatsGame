import type { Metadata } from "next"
import DatosCliente from "./DatosCliente"

export const metadata: Metadata = {
  title: "¿Sabías que? Datos curiosos del fútbol argentino | Gambeta",
  description:
    "Tirá el dado y sacá un dato de fútbol: Vélez y el Milan del 94, los siete Libertadores de Independiente, la final de Madrid. Cada dato, con dos fuentes.",
  alternates: { canonical: "/datos/" },
}

export default function DatosPage() {
  return <DatosCliente />
}
