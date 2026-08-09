"use client"

import Trofeo from "@/components/ui/Trofeo"
import type { FichaDT } from "@/lib/dt-engine"

/**
 * La ficha final del DT: el artefacto que se comparte.
 *
 * No es un resumen, es el producto. Está medido que compartir es el motor de crecimiento del
 * juego —9 personas compartieron en 28 días, y ese número es el techo de todo lo demás— así que
 * esta pantalla se diseña para que alguien la saque de captura y para que un tercero que nunca
 * jugó entienda de qué se trata en dos segundos.
 *
 * De ahí las decisiones:
 * · El titular es el APODO ("El eterno interino"), no un número. Un apodo se comenta; "12
 *   temporadas" no.
 * · Los títulos van con el escudo del club donde se ganaron. Un hincha reconoce el escudo antes
 *   que la palabra "campeón".
 * · Los despidos se muestran igual que los títulos. Una carrera de DT sin despidos no es una
 *   carrera, y esconderlos haría todas las fichas iguales.
 * · Medidas fijas y fondo opaco: una captura de pantalla no puede depender del tema del sistema
 *   ni recortar el nombre.
 */
export default function FichaFinalDT({ ficha, escudoDe }: { ficha: FichaDT; escudoDe: (clubId: string) => string }) {
  const ultimo = ficha.mejorTemporada

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#D4AF37]/30 bg-gradient-to-b from-[#0c1728] to-[#050a14] p-6 shadow-2xl sm:p-8">
      {/* La banda argentina arriba: la ficha tiene que leerse como Gambeta aunque llegue suelta */}
      <div className="banda-argentina absolute inset-x-0 top-0 h-1.5 opacity-90" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#D4AF37]/10 blur-3xl" />

      <header className="relative text-center">
        <p className="font-sport text-[10px] font-black uppercase tracking-[0.35em] text-[#D4AF37]">
          Carrera de DT · Gambeta
        </p>
        <h2 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl">
          {ficha.apodo}
        </h2>
        <p className="mt-2 font-sport text-sm font-bold uppercase tracking-widest text-slate-300">
          {ficha.nombre}
        </p>
      </header>

      {/* Los cuatro números que cuentan la carrera */}
      <div className="relative mt-6 grid grid-cols-4 gap-2">
        {[
          { valor: ficha.temporadas, label: ficha.temporadas === 1 ? "Temporada" : "Temporadas" },
          { valor: ficha.titulos, label: ficha.titulos === 1 ? "Título" : "Títulos", oro: true },
          { valor: ficha.despidos, label: ficha.despidos === 1 ? "Despido" : "Despidos", rojo: true },
          { valor: `${ficha.efectividad}%`, label: "Efectividad" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-white/[0.07] bg-black/25 px-2 py-3 text-center"
          >
            <div
              className={`font-display text-2xl font-black leading-none sm:text-3xl ${
                s.oro ? "text-[#D4AF37]" : s.rojo ? "text-red-300" : "text-white"
              }`}
            >
              {s.valor}
            </div>
            <div className="mt-1 font-sport text-[9px] font-bold uppercase tracking-wider text-slate-500">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Los títulos, con el escudo del club donde se ganaron */}
      {ficha.titulosPorClub.length > 0 && (
        <section className="relative mt-6">
          <h3 className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
            Lo que ganó
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {ficha.titulosPorClub.map((t) => (
              <div
                key={t.clubId}
                className="flex items-center gap-2 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.07] px-3 py-2"
              >
                <img
                  src={escudoDe(t.clubId)}
                  alt=""
                  className="h-7 w-7 object-contain"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
                <span className="font-sport text-[11px] font-bold uppercase tracking-wide text-white">
                  {t.clubNombre}
                </span>
                <span className="flex items-center gap-1 font-display text-sm font-black text-[#D4AF37]">
                  <Trofeo id="lpf" className="h-4 w-4" />×{t.cantidad}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* La trayectoria: los escudos en orden, que es lo que hace reconocible una carrera */}
      <section className="relative mt-6">
        <h3 className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
          Por dónde pasó
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ficha.clubes.map((id, i) => (
            <div key={`${id}-${i}`} className="flex items-center gap-2">
              {i > 0 && <span className="text-slate-600">→</span>}
              <img
                src={escudoDe(id)}
                alt=""
                className="h-9 w-9 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            </div>
          ))}
        </div>
      </section>

      {/* La mejor temporada: el momento concreto que se cuenta cuando alguien pregunta */}
      {ultimo && (
        <section className="relative mt-6 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
          <h3 className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Su mejor año
          </h3>
          <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-slate-200">
            <strong className="text-white">{ultimo.anio}</strong> con{" "}
            <strong className="text-white">{ultimo.clubNombre}</strong>:{" "}
            {ultimo.campeon ? (
              <span className="font-bold text-[#D4AF37]">salieron campeones</span>
            ) : (
              <>terminaron {ultimo.puesto}º de {ultimo.total}</>
            )}
            , {ultimo.ganados} ganados y {ultimo.golesFavor} goles a favor
            {ultimo.goleador && (
              <>
                , con <strong className="text-white">{ultimo.goleador.nombre}</strong> haciendo{" "}
                {ultimo.goleador.goles}
              </>
            )}
            .
          </p>
        </section>
      )}

      <footer className="relative mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
        <span className="font-sport text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
          {ficha.partidos} partidos dirigidos
        </span>
        <span className="font-sport text-[10px] font-black uppercase tracking-[0.25em] text-[#74ACDF]">
          gambetafutbol.games
        </span>
      </footer>
    </div>
  )
}
