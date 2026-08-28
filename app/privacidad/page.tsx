import type { Metadata } from "next"
import Link from "next/link"
import AdSlot from '@/components/AdSlot'

export const metadata: Metadata = {
  title: "Privacidad y cookies | Gambeta",
  description:
    "Qué datos guarda Gambeta, qué mide, qué cookies usa la publicidad y cómo desactivar los anuncios personalizados.",
  alternates: { canonical: "/privacidad/" },
}

/**
 * Política de privacidad.
 *
 * No es un trámite: sin una página como esta, publicada y accesible desde el sitio, AdSense
 * rechaza la cuenta. Es requisito de sus políticas para cualquier sitio que muestre publicidad,
 * y lo revisan a mano en la aprobación.
 *
 * Está escrita con lo que el juego hace de verdad —localStorage, Analytics, Supabase para el
 * ranking, AdSense— y no con el molde genérico de siempre. Si algo de eso cambia, cambia acá.
 */
export default function PrivacidadPage() {
  return (
    <div className="gradient-bg min-h-screen">
      <main className="relative z-10 mx-auto max-w-3xl px-4 pb-24 pt-14">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Privacidad y <span className="gradient-text">cookies</span>
        </h1>
        <p className="mt-3 font-sans text-sm leading-relaxed text-slate-400">
          Última actualización: 25 de agosto de 2026. Responsable: Ranuk IT Solutions (Emilio
          Ranucoli), República Argentina.
        </p>

        <Bloque titulo="Lo corto">
          <p>
            Para jugar no hace falta cuenta ni dar ningún dato. Tu progreso vive en tu navegador.
            Medimos cómo se usa el juego de forma anónima y mostramos publicidad para bancar los
            servidores. No vendemos datos a nadie.
          </p>
        </Bloque>

        <Bloque titulo="Qué se guarda en tu navegador">
          <p>
            El once que armás, tu ELO, la racha del reto diario, la carrera en curso y el idioma
            se guardan en el <strong className="text-white">almacenamiento local</strong> de tu
            navegador. No viajan a ningún servidor nuestro y se borran si limpiás los datos del
            sitio.
          </p>
        </Bloque>

        <Bloque titulo="Si creás una cuenta">
          <p>
            La cuenta es opcional y sirve para una sola cosa: que tu ELO cuente en el ranking
            global. En ese caso se guardan tu nombre de usuario y tus puntajes en{" "}
            <strong className="text-white">Supabase</strong>, nuestro proveedor de base de datos.
            Podés pedir que se borre escribiendo a{" "}
            <a href="https://ranuk.dev" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
              ranuk.dev
            </a>
            .
          </p>
        </Bloque>

        <Bloque titulo="Medición">
          <p>
            Usamos <strong className="text-white">Google Analytics 4</strong> para saber cuánta
            gente juega, qué modos usa y en qué paso abandona. Se miden acciones (un draft
            completado, un reto jugado), no personas: no guardamos nombre, mail ni nada que te
            identifique.
          </p>
        </Bloque>

        <Bloque titulo="Publicidad">
          <p>
            El juego muestra publicidad de <strong className="text-white">Google AdSense</strong>{" "}
            en cuatro lugares y en ninguno más: un bloque al final de las páginas que se leen, un
            cartel anclado abajo en esas mismas páginas —que se cierra con una cruz—, un aviso
            entre una partida y otra, y un video que <em>vos elegís</em> mirar a cambio de un
            comodín. Ni el reto diario ni la carrera se interrumpen.
          </p>
          <p className="mt-3">
            Google y sus socios usan cookies para mostrar avisos según tus visitas a este y a
            otros sitios. Podés desactivar los anuncios personalizados en{" "}
            <a
              href="https://www.google.com/settings/ads"
              className="text-[#74ACDF] underline underline-offset-2 hover:text-white"
              rel="nofollow noopener"
              target="_blank"
            >
              google.com/settings/ads
            </a>
            , y ver cómo Google usa los datos de los sitios que la utilizan en{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              className="text-[#74ACDF] underline underline-offset-2 hover:text-white"
              rel="nofollow noopener"
              target="_blank"
            >
              policies.google.com/technologies/partner-sites
            </a>
            . Si estás en la Unión Europea o el Reino Unido, antes de cargar la publicidad se te
            pide el consentimiento y podés cambiarlo cuando quieras desde el mismo cartel.
          </p>
        </Bloque>

        <Bloque titulo="Menores">
          <p>
            El juego no está dirigido a menores de 13 años y no les pedimos datos. Si detectamos
            una cuenta de un menor, se elimina.
          </p>
        </Bloque>

        <Bloque titulo="Contacto">
          <p>
            Cualquier consulta sobre datos, o un pedido de borrado:{" "}
            <a href="https://ranuk.dev" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
              ranuk.dev
            </a>
            . Ver también{" "}
            <Link href="/legal/" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
              legal y propiedad intelectual
            </Link>
            .
          </p>
        </Bloque>

        <Link
          href="/"
          className="mt-8 inline-block py-2.5 px-3 font-sport text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
        >
          ← Volver al inicio
        </Link>

      <AdSlot />
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
