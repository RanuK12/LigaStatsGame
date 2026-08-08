"use client"

import { useUserStore } from "@/lib/user-store"
import { useEmbebido } from "@/lib/embebido"

/**
 * El pedido de cuenta, justo después de que la persona terminó un torneo.
 *
 * Hoy el único lugar donde se pide identidad es el botón INGRESAR del header: se le pide a alguien
 * que todavía no jugó nada y no sabe si el juego le gusta. Mientras tanto la racha, el ELO, los
 * puntajes y la plaza continental viven en localStorage, así que cambiar de teléfono a la
 * computadora te borra. De 640 usuarios en 28 días, ninguno volvió.
 *
 * El momento correcto es este: acaba de conseguir algo y lo tiene en pantalla.
 */
export default function GuardarProgreso({ elo }: { elo?: number }) {
  const { user, openAuthModal } = useUserStore()
  const embebido = useEmbebido()

  // Si ya tiene cuenta, no se le pide nada.
  if (user?.isLoggedIn) return null
  // Dentro del reproductor de un portal tampoco: CrazyGames no permite que el juego ofrezca su
  // propio login. Se juega de invitado y el progreso sigue en el navegador. Ver lib/embebido.ts.
  if (embebido) return null

  return (
    <div className="mb-5 rounded-3xl border border-[#74ACDF]/30 bg-gradient-to-b from-[#74ACDF]/[0.09] to-slate-950/50 p-5 text-center">
      <p className="font-sport text-[10px] font-black uppercase tracking-[0.28em] text-[#74ACDF]">
        Esto no se está guardando
      </p>
      <p className="mx-auto mt-2 max-w-sm font-sans text-[13px] leading-relaxed text-slate-300">
        {typeof elo === "number" && elo !== 0 ? (
          <>
            Ganaste <strong className="text-white">{elo > 0 ? `+${elo}` : elo} de ELO</strong> y ahora
            mismo vive solo en este navegador.{" "}
          </>
        ) : (
          <>Tu ELO, tu racha y tus partidas viven solo en este navegador. </>
        )}
        Con una cuenta entrás al <strong className="text-white">ranking global</strong>, guardás la
        plaza a la <strong className="text-white">Libertadores</strong> y no perdés nada al cambiar de
        teléfono.
      </p>
      <button
        onClick={openAuthModal}
        className="btn-primary mt-4 px-8 py-3 font-sport text-[11px] font-black uppercase"
      >
        Guardar mi progreso
      </button>
      <p className="mt-2 font-sans text-[11px] text-slate-500">Es gratis y tarda diez segundos</p>
    </div>
  )
}
