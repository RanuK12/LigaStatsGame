import { TROPHY_META, trofeoDeCopaNacional } from "@/lib/career-engine"

/**
 * Un trofeo del juego, dibujado por nosotros.
 *
 * Antes cada título era un emoji y cada sistema lo dibujaba distinto: la ficha que comparte
 * alguien de iPhone no era la misma que la de Android, y al lado de los escudos de los clubes
 * quedaban pobres.
 *
 * `pais` solo importa para la copa nacional: todas se guardan con el id 'copa-arg' —viene de
 * cuando el juego era solo argentino— pero el que ganó la Copa do Brasil tiene que ver la
 * brasileña en su ficha.
 */
export default function Trofeo({
  id,
  pais,
  size = 28,
  className = "",
}: {
  id: string
  pais?: string
  size?: number
  className?: string
}) {
  const meta = id === "copa-arg" ? trofeoDeCopaNacional(pais) : TROPHY_META[id]
  if (!meta) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={meta.icon}
      alt={meta.name}
      title={meta.name}
      width={size}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  )
}

/** El nombre del título, con el país aplicado cuando es la copa nacional. */
export function nombreDeTrofeo(id: string, pais?: string): string {
  if (id === "copa-arg") return trofeoDeCopaNacional(pais).name
  return TROPHY_META[id]?.name ?? id
}
