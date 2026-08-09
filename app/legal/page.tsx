import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Legal y propiedad intelectual | Gambeta",
  description:
    "Titularidad, marca y condiciones de uso de Gambeta, el juego de fútbol argentino de Ranuk IT Solutions. En línea desde julio de 2026.",
  alternates: { canonical: "/legal/" },
}

/**
 * Página legal.
 *
 * Existe por una razón concreta: dejar publicada, con fecha y en un lugar que Google indexa, la
 * titularidad del proyecto y desde cuándo el nombre está en uso. Un aviso publicado no reemplaza
 * a un registro de marca, pero es la prueba de uso anterior que un registro necesita.
 */
export default function LegalPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-14">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Legal y <span className="gradient-text">propiedad intelectual</span>
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-slate-400">
          Última actualización: 31 de julio de 2026.
        </p>

        <Bloque titulo="Quién es el titular">
          <p>
            Gambeta es un proyecto de <strong className="text-white">Emilio Ranucoli</strong>, bajo{" "}
            <strong className="text-white">Ranuk IT Solutions</strong> (
            <a href="https://ranuk.dev" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
              ranuk.dev
            </a>
            ), República Argentina.
          </p>
        </Bloque>

        <Bloque titulo="La marca y desde cuándo está en uso">
          <p>
            <strong className="text-white">GAMBETA</strong> y <strong className="text-white">GAMBETA FÚTBOL</strong>,
            con su logo y su identidad visual, son signos distintivos usados en el comercio por Ranuk IT Solutions
            para identificar este juego de fútbol argentino.
          </p>
          <ul className="mt-3 space-y-1.5">
            <li>· Repositorio del proyecto creado el <strong className="text-white">6 de junio de 2026</strong>.</li>
            <li>· Sitio <strong className="text-white">gambetafutbol.games</strong> publicado y accesible al público,
              con tráfico orgánico medido desde el <strong className="text-white">3 de julio de 2026</strong>.</li>
            <li>· Cuenta oficial <strong className="text-white">@GambetafutbolAR</strong> en X, activa desde julio de 2026.</li>
          </ul>
          <p className="mt-3">
            El uso de un signo idéntico o similar para identificar juegos, aplicaciones o servicios de fútbol puede
            generar confusión en el público y afectar derechos preexistentes.
          </p>
        </Bloque>

        <Bloque titulo="Qué está protegido">
          <p>
            El código fuente, la base de datos de jugadores y planteles, los textos, el diseño, los escudos generados
            y las fichas del juego son obra propia, protegidos por la{" "}
            <strong className="text-white">Ley 11.723</strong> de Propiedad Intelectual de la República Argentina y
            por los tratados internacionales aplicables.
          </p>
          <p className="mt-3">
            No está permitido, sin autorización previa y por escrito: copiar o distribuir el código, crear obras
            derivadas del juego o de su base de datos, ni usar la marca o la identidad visual para productos o
            servicios similares.
          </p>
        </Bloque>

        <Bloque titulo="Uso del juego">
          <p>
            Jugar es gratis y no requiere pago. El acceso es personal y no transfiere ningún derecho sobre la obra.
            No hay publicidad ni venta de datos. Las donaciones son voluntarias y se destinan a servidores y a
            seguir desarrollando el juego.
          </p>
        </Bloque>

        <Bloque titulo="Clubes, jugadores y competiciones">
          <p>
            Los nombres de clubes, futbolistas y competiciones se usan con fines informativos y de referencia
            histórica, y pertenecen a sus respectivos titulares. Gambeta no está afiliado a ellos, ni patrocinado ni
            avalado por ellos. Los escudos que se muestran son ilustraciones propias generadas a partir de los
            colores de cada club.
          </p>
          <p className="mt-3">
            Los datos históricos se construyen cruzando fuentes públicas —Wikidata y Wikipedia en español— y se
            publican solo cuando al menos dos fuentes independientes coinciden.
          </p>
        </Bloque>

        <Bloque titulo="Contacto">
          <p>
            Para licencias, permisos, reclamos de titularidad o correcciones de datos:{" "}
            <a href="https://ranuk.dev" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
              ranuk.dev
            </a>
            .
          </p>
        </Bloque>

        <p className="mt-10 font-sport text-[10px] uppercase tracking-widest text-slate-600">
          © 2026 Ranuk IT Solutions · Todos los derechos reservados
        </p>
        <Link
          href="/"
          className="mt-6 block font-sport text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-white inline-block py-2.5 px-3"
        >
          ← Volver al inicio
        </Link>
      </main>
    </div>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="card-gradient mt-6 rounded-3xl border border-white/5 p-5 sm:p-6">
      <h2 className="font-display text-lg font-black uppercase tracking-tight text-white">{titulo}</h2>
      <div className="mt-2.5 space-y-1 font-sans text-[13px] leading-relaxed text-slate-400">{children}</div>
    </section>
  )
}
