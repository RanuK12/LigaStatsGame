# Plata y tráfico — 25 de agosto de 2026

Dos preguntas, una sola respuesta: **la publicidad ya está puesta y bien puesta, pero lo que
decide cuánto paga no es dónde va el aviso sino cuánta gente juega.** Con los números de hoy el
sitio entero rinde entre 2 y 4 dólares por mes. Con los mismos avisos y 50.000 sesiones, entre
60 y 150. Así que este documento tiene una parte corta (la publicidad, hecha) y una larga (de
dónde sale la gente).

---

## 1. La publicidad, cómo quedó

Tres formatos, elegidos por lo que pagan y por lo que molestan, no por costumbre:

| Dónde | Formato | Se ve | Por qué ahí |
|---|---|---|---|
| Sin comodines en el draft | **Video recompensado** | Solo si el jugador toca "+1 con un aviso" | Es el único aviso que el jugador elige. Es también el que más paga: en Argentina 1-3 USD cada mil vistas, contra la mitad un intersticial y una fracción un banner |
| Entre un draft y el siguiente, del tercero en adelante | **Intersticial** | Pantalla completa, corte natural | Los que completan hacen 5,4 drafts por visita. Entre partida y partida no interrumpe nada |
| Al final de toda página que se lee | **Display** | Bloque rotulado, después del contenido | Equipos, cada equipo histórico, la landing, cómo jugar, datos, ranking, récords, retos, legal y privacidad |
| Pegado abajo en esas mismas páginas | **Cartel anclado** | Barra fija con una cruz para cerrarla | Es el formato que más rinde por visita en una página de lectura: se ve todo el rato sin comerle lugar al texto. Cerrado no vuelve en toda la sesión |

Y dónde **no** hay nada, a propósito:

- **El reto diario.** Es la partida que se comparte y la que suma ELO. Ahí un comodín comprado
  con un aviso sería comprar puesto en la tabla.
- **La carrera y el modo DT** mientras se juegan.
- **La portada.** El que llega y ve un aviso antes de jugar se va.
- **Adentro del reproductor de un portal.** CrazyGames, Poki y GameDistribution monetizan ellos:
  un aviso nuestro adentro de su iframe es motivo de rechazo. Se apaga solo (`lib/embebido.ts`).
- Los dos primeros drafts de cada visita, y nunca dos intersticiales en menos de 4 minutos.

Todo esto está apagado hasta que existan las variables de entorno: hoy el sitio se despliega
igual que ayer, sin un byte de AdSense.

### Lo que queda del lado de Emilio

1. **Crear la cuenta de AdSense** con el dominio `gambetafutbol.games` y esperar la aprobación
   (días o semanas). Requisitos que ya cumplimos: contenido propio, navegación clara, política
   de privacidad publicada (`/privacidad/`, escrita en este mismo cambio y linkeada desde el pie
   del home), aviso legal y datos de titularidad.
2. **Pedir el alta en H5 Games Ads**: `adsense.google.com/start/h5-beta` — es el permiso para
   los dos formatos que pagan (recompensado e intersticial). Necesita la cuenta ya aprobada.
3. **Crear dos bloques de display** ("Anuncios > Por unidad de anuncio") y guardar los dos IDs
   numéricos: uno para el bloque de contenido y otro para el cartel anclado. Van separados para
   poder medir cuál rinde y apagar uno sin tocar el otro.
4. **Cargar los secretos del repo** (Settings > Secrets and variables > Actions):
   `NEXT_PUBLIC_ADSENSE_CLIENT` = `ca-pub-…`, `NEXT_PUBLIC_ADSENSE_SLOT_CONTENIDO` y
   `NEXT_PUBLIC_ADSENSE_SLOT_ANCLA` = los números de los bloques. Con el primer despliegue
   posterior queda todo prendido, incluido `ads.txt`.

   **Los avisos por país no se configuran**: Google elige qué mostrarle a cada visitante según
   desde dónde entra y qué anunciantes pujan por él. Lo que cambia por país es el precio, no el
   trabajo: la misma pantalla paga 1-3 USD cada mil vistas en Argentina y 15-28 en Estados
   Unidos. Por eso el inglés y el portugués del sitio valen plata, no solo alcance.
5. **Activar el mensaje de consentimiento de la UE** en AdSense (Privacidad y mensajes). Es un
   requisito de Google para el tráfico europeo y se resuelve con dos clics en el panel: no hace
   falta tocar código.
6. **Cargar los datos fiscales y de pago.**

### Cómo se cobra (la pregunta del PayPal)

- **AdSense en Argentina no paga por PayPal.** Paga por transferencia electrónica a una cuenta
  bancaria a nombre del titular, con CUIT y CBU; el dinero entra convertido a pesos. El umbral
  es de **100 USD acumulados**: por debajo se acumula mes a mes. Hay que cargar además la
  información fiscal que pide Google antes del primer pago.
- **Los portales sí pagan por PayPal**, y con umbrales más bajos: GameDistribution paga desde
  **50 EUR por PayPal** (100 por transferencia), itch.io paga a PayPal, y CrazyGames paga con
  Tipalti (PayPal o transferencia) desde **100 EUR**, quedándose el desarrollador con el 60 % de
  la publicidad.
- Conclusión práctica: **la primera plata que se cobre de verdad va a venir de un portal, no de
  AdSense**, porque el portal aporta el tráfico junto con el aviso. AdSense es el piso que
  acompaña, y recién paga cuando el sitio propio tenga volumen.

### Cuánto es "poco" (los números, sin maquillar)

Con 1.714 usuarios en 28 días: unas 250 vistas de video recompensado, 300 intersticiales y unas
2.000 vistas de página en las páginas con display. A los precios de Argentina eso da **entre 2 y
4 dólares por mes**. Son 25 meses para llegar al umbral de AdSense.

Con 50.000 sesiones por mes, los mismos avisos dan entre 60 y 150 dólares. **La publicidad no es
un problema de publicidad: es un problema de tráfico.** Por eso el resto del documento.

---

## 2. El diagnóstico, en una frase

Todo lo que se probó hasta ahora fue **emitir desde canales propios**: nuestra cuenta de X,
nuestras páginas de SEO, nuestros botones de compartir. Con 400 usuarios por semana un canal
propio no compone: llega a la misma gente que ya está. Lo único que mueve la aguja desde cero es
**meterse adentro de tráfico que ya corre**.

Los números que lo sostienen, medidos:

- 61 de 62 consultas de Google son la marca. Google no descubre: devuelve.
- 1.243 de 1.244 usuarios son nuevos. No hay ningún mecanismo para volver a hablarle a nadie.
- 21 personas compartieron en 28 días y las páginas que reciben esos links tuvieron 1 visita.
- Copero tiene 34 millones de visitas. La diferencia no es de producto —el que entra juega 5,4
  drafts— es de puerta.

---

## 3. Los cuatro frentes, por retorno

### Frente 1 — Portales (el único que puede multiplicar por diez)

Es mecánico: no hay que convencer a nadie, hay que completar un formulario. Y ahora, además,
**paga**.

- **CrazyGames**: el envío está armado y el QA pasado; falta que Emilio firme el checklist,
  arrastre las tres portadas y grabe 30 segundos de video. Reparte 60 % de la publicidad.
- **GameDistribution**: **este canal estaba cerrado por decisión propia** —exige su SDK de
  anuncios y el sitio prometía "sin publicidad"—. Esa promesa ya no está: el canal se abre. Son
  4.000 portales chicos de una sola integración, y pagan desde 50 EUR por PayPal.
- **Poki, Y8, Playgama**: la misma ficha, otro formulario. itch.io ya está publicado.

Medición: hoy los portales traen **13 sesiones en 28 días**. A las dos semanas de una aceptación
eso tiene que estar arriba de 500. Si no, el problema es la miniatura y la ficha, no el canal.

### Frente 2 — Un canal para volver a hablarles (retención)

Hoy el juego no tiene ninguno: ni mail, ni notificación, ni app. El reto diario —que es el
motivo de volver— lo jugaron 34 personas en 28 días, el 2 %.

Lo que falta construir, en este orden:

1. **Notificaciones web** atadas al reto diario: "el reto de hoy ya está" a las 20:00. Es la
   única forma de traer de vuelta a alguien que no dejó un mail. Necesita un service worker, la
   suscripción guardada en Supabase y un cron en Cloudflare que las despache.
2. **Instalar como app** (el sitio ya tiene manifest): ofrecerlo después del segundo día seguido
   de racha, no antes.
3. **Que el reto diario sea la puerta y no una tarjeta más**, con el resultado en bloques que ya
   está hecho para pegar en un grupo de WhatsApp.

Objetivo medible: recurrentes del 12,4 % al 25 %, y el reto diario de 34 a 150 personas por mes.

### Frente 3 — Búsqueda que no sea la marca

Dos cosas concretas, y ninguna es escribir más páginas informativas (eso ya se probó: 46
impresiones y 0 clics en las 36 páginas de equipos).

1. **Dejar entrar a los buscadores con IA.** Hoy el `robots.txt` que sirve Cloudflare bloquea
   GPTBot, ClaudeBot, Google-Extended y compañía con su bloque administrado. En 2026 una parte
   del descubrimiento pasa por respuestas de IA: bloquearlas es elegir no existir ahí. Se puede
   seguir prohibiendo el entrenamiento y permitir la búsqueda. Se cambia en el panel de
   Cloudflare, no en el repo.
2. **Una puerta por idioma, con las consultas de cada mercado.** `/en/` y `/pt/` existían como
   espejos del juego, pero ninguna de sus URLs le decía al buscador de qué se trata: cero
   páginas escritas para una consulta en inglés o en portugués. Medido en el autocompletado de
   Google el 29/8 (solo sugiere lo que la gente tipea de verdad):

   | Mercado | Lo que se busca | Página |
   |---|---|---|
   | en-US | "football draft game" (+ online, free, simulator), "soccer draft game unblocked", "build your xi" | `/en/football-draft-game/` |
   | pt-BR | "monte seu time de futebol", "monte seu time dos sonhos", "jogo de montar time de futebol online", "jogos como 7a0" | `/pt/monte-seu-time/` |

   Y no es solo alcance: **un visitante de Estados Unidos vale diez veces uno argentino** (15-28
   USD cada mil vistas de aviso contra 1-3). Las tres puertas se declaran entre sí con hreflang.

   **Ojo con la carrera afuera**: los dilemas y las crónicas del modo carrera siguen escritos en
   castellano dentro de `lib/`, así que las páginas en inglés y portugués empujan el draft, el
   reto diario y el ranking, que sí están traducidos, y NO la carrera. Traducir esa narrativa es
   la tanda que desbloquea la consulta más grande de las dos ("football career simulator online",
   "simulador de carreira de jogador de futebol").

3. **Páginas de comparación con la competencia**: "juegos como Copero", "alternativas a El
   Ídolo". Es otra cosa que las páginas de equipos: el que busca eso quiere exactamente lo que
   tenemos. Volumen real, competencia nula, y se mide en Search Console a los 30 días.

### Frente 4 — Audiencias prestadas

El precedente está medido: a Copero lo encendió un club (Atlético San Luis) presentando un
fichaje con el juego, no un tweet propio.

- **Clubes**: un link por club con su propio plantel cargado, más una placa lista para publicar.
- **Cuentas de datos del fútbol argentino** (@LanusStats, @LigaArgStats, @Hist_futbol): pueden
  auditar la base de datos, cosa que con un juego de azar no podían. Ese es el diferencial.
- **Streamers**: un "reto con código" —mismo bombo para el streamer y su chat— es una función
  chica que convierte a un stream en una partida colectiva.

---

## 4. Qué NO hacer

- No llenar el sitio de banners. Al tráfico de hoy, cada banner extra suma centavos y resta
  jugadores.
- No poner publicidad en el reto diario ni en la carrera.
- No escribir más páginas informativas de equipos hasta que Search Console muestre un clic.
- No seguir empujando desde la cuenta propia de X como si fuera un canal: trae el 1,8 %.

## 5. Cómo se sabe si funcionó

Un solo número por frente, a 30 días:

| Frente | Hoy | A 30 días |
|---|---|---|
| Portales | 13 sesiones referidas / 28 d | 500 |
| Retención | 12,4 % recurrentes · 34 en el reto | 25 % · 150 |
| Búsqueda no-marca | 1 clic en 12 días | 50 clics |
| Plata | 0 USD | Primer dólar contado en AdSense o en un portal |
