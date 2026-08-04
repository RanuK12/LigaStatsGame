"use client"

export interface Reto {
  id: string
  tier: "bronce" | "plata" | "oro" | "platino"
  title: string
  description: string
  icon: string
  reqCount?: number
}

export const RETOS_GAMBETA: Reto[] = [
  // ── BRONCE (15) ──
  { id: "b1", tier: "bronce", title: "Primer Draft", description: "Completa tu primer 11 en cualquier modo de Draft.", icon: "📋" },
  { id: "b2", tier: "bronce", title: "Dado en Acción", description: "Tirá el dado 3D en la sección ¿Sabías que? por primera vez.", icon: "🎲" },
  { id: "b3", tier: "bronce", title: "Reto del Día", description: "Completa 1 Reto Diario en /daily.", icon: "📅" },
  { id: "b4", tier: "bronce", title: "Debut Profesional", description: "Crea a tu jugador e inicia tu camino en el Modo Carrera.", icon: "👟" },
  { id: "b5", tier: "bronce", title: "Primer Gol de Carrera", description: "Anota tu primer gol oficial en el Modo Carrera.", icon: "⚽" },
  { id: "b6", tier: "bronce", title: "Camiseta Propia", description: "Personaliza el patrón y color de tu camiseta en Modo Carrera.", icon: "👕" },
  { id: "b7", tier: "bronce", title: "Rincón de la Memoria", description: "Consulta un plantel histórico retro en el Draft.", icon: "🏛️" },
  { id: "b8", tier: "bronce", title: "Primer Triunfo", description: "Gana tu primer partido de Liga o Copa.", icon: "✌️" },
  { id: "b9", tier: "bronce", title: "Afición Contenta", description: "Alcanza el Nivel 2 de Idolatría en cualquier club.", icon: "👏" },
  { id: "b10", tier: "bronce", title: "Química Aceptable", description: "Consigue 75+ de Química táctica en el Draft.", icon: "🧪" },
  { id: "b11", tier: "bronce", title: "Curioso del Fútbol", description: "Descubre 5 curiosidades verificadas en ¿Sabías que?.", icon: "💡" },
  { id: "b12", tier: "bronce", title: "Duelo Amistoso", description: "Juega 1 partido en Modo Versus 1v1.", icon: "⚔️" },
  { id: "b13", tier: "bronce", title: "Tabla de Leyendas", description: "Revisa el ranking de máximos goleadores en /records.", icon: "📖" },
  { id: "b14", tier: "bronce", title: "Cambio de Aire", description: "Acepta una oferta de transferencia a un nuevo club.", icon: "✈️" },
  { id: "b15", tier: "bronce", title: "Registro Oficial", description: "Registra tu cuenta en Gambeta para resguardar tu ELO y logros.", icon: "🆔" },

  // ── PLATA (15) ──
  { id: "p1", tier: "plata", title: "Química Perfecta", description: "Alcanza 100 de Química táctica en un Draft.", icon: "🔥" },
  { id: "p2", tier: "plata", title: "Plantel Galáctico", description: "Arma un 11 con 85+ de OVR promedio en el Draft.", icon: "🌟" },
  { id: "p3", tier: "plata", title: "Ascenso Heroico", description: "Logra el ascenso a Primera División en Modo Carrera.", icon: "🚀" },
  { id: "p4", tier: "plata", title: "Campeón Nacional", description: "Levanta la Copa Argentina o Copa del País.", icon: "🏆" },
  { id: "p5", tier: "plata", title: "Racha Diaria", description: "Completa 5 Retos Diarios consecutivos.", icon: "🔥" },
  { id: "p6", tier: "plata", title: "Crack Consagrado", description: "Supera los 80 de OVR con tu jugador de carrera.", icon: "⭐" },
  { id: "p7", tier: "plata", title: "Ídolo de la Hinchada", description: "Alcanza Nivel 4 de Idolatría ('Ídolo') en un club.", icon: "👑" },
  { id: "p8", tier: "plata", title: "Fortaleza de Local", description: "Gana 10 partidos consecutivos jugando en tu estadio.", icon: "🏰" },
  { id: "p9", tier: "plata", title: "Goleador del Torneo", description: "Anota 25+ goles en una sola temporada de carrera.", icon: "🎯" },
  { id: "p10", tier: "plata", title: "Asistente Estratégico", description: "Reparte 15+ asistencias en una sola temporada.", icon: "👟" },
  { id: "p11", tier: "plata", title: "Maestro del Versus", description: "Gana 5 partidos en Modo Versus 1v1.", icon: "⚔️" },
  { id: "p12", tier: "plata", title: "Ruleta Afortunada", description: "Gira la Ruleta táctica 10 veces.", icon: "🎡" },
  { id: "p13", tier: "plata", title: "Pasaje Continental", description: "Clasifica a la Copa Libertadores o Sudamericana.", icon: "🌎" },
  { id: "p14", tier: "plata", title: "Carrera Compartida", description: "Comparte el enlace oficial de tu carrera con tus amigos.", icon: "🔗" },
  { id: "p15", tier: "plata", title: "ELO en Crecimiento", description: "Alcanza 1100 puntos de ELO en el Ranking Global.", icon: "📈" },

  // ── ORO (12) ──
  { id: "g1", tier: "oro", title: "Gloria Eterna", description: "Gana la Copa Libertadores de América.", icon: "🏆" },
  { id: "g2", tier: "oro", title: "Campeón Sudamericano", description: "Conquista la Copa Sudamericana.", icon: "🥇" },
  { id: "g3", tier: "oro", title: "Estatua en la Sede", description: "Alcanza Nivel 5 de Idolatría ('Leyenda') en un club.", icon: "🗿" },
  { id: "g4", tier: "oro", title: "Capitán Legendario", description: "Supera los 200 partidos oficiales jugados en tu carrera.", icon: "🎖️" },
  { id: "g5", tier: "oro", title: "Balón de Oro", description: "Alcanza 90+ de OVR con tu jugador de carrera.", icon: "⚽" },
  { id: "g6", tier: "oro", title: "Campeón del Mundo", description: "Levanta la Copa del Mundo con tu Selección Nacional.", icon: "🌎" },
  { id: "g7", tier: "oro", title: "Constancia de Campeón", description: "Completa 15 Retos Diarios.", icon: "🗓️" },
  { id: "g8", tier: "oro", title: "Invicto de Élite", description: "Mantén una racha de 15 partidos invicto en el Draft.", icon: "🛡️" },
  { id: "g9", tier: "oro", title: "Maestro Táctico", description: "Gana partidos utilizando las 4 formaciones del juego.", icon: "📐" },
  { id: "g10", tier: "oro", title: "Top Ranking", description: "Alcanza 1250 puntos de ELO en el Ranking Global.", icon: "⚡" },
  { id: "g11", tier: "oro", title: "Enciclopedia de Crack", description: "Descubre 25 curiosidades en ¿Sabías que?.", icon: "📚" },
  { id: "g12", tier: "oro", title: "Vitrina de Gala", description: "Obtén 5 títulos oficiales distintos en tu vitrina de carrera.", icon: "💎" },

  // ── PLATINO / LEYENDA (10) ──
  { id: "l1", tier: "platino", title: "El Sextete", description: "Gana Liga, Copa, Libertadores, Sudamericana, Supercopa y Mundial.", icon: "👑" },
  { id: "l2", tier: "platino", title: "Botín de Leyenda", description: "Anota 50+ goles en una sola temporada oficial.", icon: "🔥" },
  { id: "l3", tier: "platino", title: "Tricampeón de América", description: "Levanta 3 Copas Libertadores a lo largo de tu carrera.", icon: "🏆" },
  { id: "l4", tier: "platino", title: "Racha Inmortal", description: "Suma 20 partidos seguidos sin conocer la derrota.", icon: "⚡" },
  { id: "l5", tier: "platino", title: "Valla Invicta", description: "Mantén 8 partidos seguidos sin recibir goles.", icon: "🧱" },
  { id: "l6", tier: "platino", title: "Trotamundos de LATAM", description: "Compite y gana títulos en 3 ligas distintas de Latinoamérica.", icon: "🌎" },
  { id: "l7", tier: "platino", title: "Gran Maestro ELO", description: "Alcanza 1400+ puntos de ELO en el Ranking Global.", icon: "🌌" },
  { id: "l8", tier: "platino", title: "Retador Supremo", description: "Completa 30 Retos Diarios.", icon: "🎖️" },
  { id: "l9", tier: "platino", title: "Ficha Millonaria", description: "Supera los €100.000.000 de valor de mercado en tu carrera.", icon: "💰" },
  { id: "l10", tier: "platino", title: "PLATINAR GAMBETA", description: "Completa los 51 retos anteriores para graduarte de Leyenda Absoluta.", icon: "🏆" }
]

const KEY_RETOS = "gambeta_retos_completados_v1"

export function getRetosCompletados(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(KEY_RETOS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function marcarRetoCompletado(retoId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    const actual = getRetosCompletados()
    if (!actual.includes(retoId)) {
      const nuevo = [...actual, retoId]
      // Auto-unlock l10 if all 51 completed
      if (nuevo.length === 51 && !nuevo.includes("l10")) {
        nuevo.push("l10")
      }
      localStorage.setItem(KEY_RETOS, JSON.stringify(nuevo))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function calcularPorcentajeRetos(): { completados: number; total: number; pct: number } {
  const comp = getRetosCompletados().length
  const total = RETOS_GAMBETA.length
  return {
    completados: comp,
    total,
    pct: Math.min(100, Math.round((comp / total) * 100)),
  }
}
