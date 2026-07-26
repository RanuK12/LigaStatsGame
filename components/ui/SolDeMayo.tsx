"use client"

/**
 * Sol de Mayo vectorial: 32 rayos alternados (rectos y flamígeros) alrededor de un disco
 * con degradado dorado. Sirve de sello y de textura de fondo (con `spin` gira lentísimo).
 * Es SVG puro: escala sin perder nitidez y no pesa nada.
 */
export default function SolDeMayo({
  className = "",
  spin = false,
  opacity = 1,
  rays = 32,
}: {
  className?: string
  spin?: boolean
  opacity?: number
  rays?: number
}) {
  const cx = 100
  const cy = 100
  const rInner = 30
  const rays_ = Array.from({ length: rays }, (_, i) => {
    const angle = (360 / rays) * i
    const largo = i % 2 === 0 ? 92 : 74
    const ancho = i % 2 === 0 ? 5.5 : 9
    return { angle, largo, ancho, recto: i % 2 === 0 }
  })

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="solDisco" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#FFF3C4" />
          <stop offset="45%" stopColor="#F6C750" />
          <stop offset="100%" stopColor="#D99A2B" />
        </radialGradient>
        <linearGradient id="solRayo" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFE27A" />
          <stop offset="100%" stopColor="#E0A93C" />
        </linearGradient>
      </defs>

      <g className={spin ? "sol-spin" : undefined}>
        {rays_.map((r, i) => (
          <g key={i} transform={`rotate(${r.angle} ${cx} ${cy})`}>
            {r.recto ? (
              // Rayo recto: triángulo afilado
              <path
                d={`M ${cx} ${cy - r.largo} L ${cx + r.ancho} ${cy - rInner - 4} L ${cx - r.ancho} ${cy - rInner - 4} Z`}
                fill="url(#solRayo)"
              />
            ) : (
              // Rayo flamígero: la ondulación clásica del sol de la bandera
              <path
                d={`M ${cx} ${cy - r.largo}
                    C ${cx + r.ancho} ${cy - r.largo + 16}, ${cx - r.ancho} ${cy - r.largo + 30}, ${cx + r.ancho * 0.7} ${cy - rInner - 4}
                    L ${cx - r.ancho * 0.7} ${cy - rInner - 4}
                    C ${cx + r.ancho * 0.2} ${cy - r.largo + 26}, ${cx - r.ancho * 0.6} ${cy - r.largo + 14}, ${cx} ${cy - r.largo} Z`}
                fill="url(#solRayo)"
              />
            )}
          </g>
        ))}
        <circle cx={cx} cy={cy} r={rInner} fill="url(#solDisco)" />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#B67C1E" strokeWidth="1.5" opacity="0.6" />
        {/* Rostro apenas insinuado: elegante, sin caricatura */}
        <g fill="#B67C1E" opacity="0.55">
          <ellipse cx={cx - 10} cy={cy - 6} rx="2.6" ry="3.4" />
          <ellipse cx={cx + 10} cy={cy - 6} rx="2.6" ry="3.4" />
          <path d={`M ${cx - 11} ${cy + 8} Q ${cx} ${cy + 17} ${cx + 11} ${cy + 8}`} fill="none" stroke="#B67C1E" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  )
}
