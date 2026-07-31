# Plan de crecimiento y retención — Gambeta

Escrito el 2026-07-31 con los datos reales de Google Analytics (propiedad `G-G772RDTN8G`,
28 días: 3–30 jul) y una lectura del código. No hay estimaciones acá: cada número está medido.

---

## 1. Qué dicen los datos (y qué cambia respecto de lo que creíamos)

**Lo primero: la página SÍ está posicionada en Google.** De 740 sesiones, **646 son Organic
Search** (Google 616, Bing 23). Direct 68, Organic Social 23, Referral 2. El canal ya existe y
funciona solo; no hay que crearlo, hay que ensancharlo. Esto cambia la prioridad: SEO no es
"empezar de cero", es "apalancar lo único que ya trae gente".

| Métrica (28 días) | Valor | Lectura |
|---|---|---|
| Usuarios activos | 640 | |
| Usuarios **nuevos** | 641 | **Todos son nuevos: no vuelve nadie** |
| Sesiones | 740 | 1,16 por usuario |
| Interacción media | 3 min 06 s | Sano. El juego engancha en la primera visita |
| Tasa de interacción | 70,68 % | Sano |
| Argentina | 527 (82 %) | Chile 16, Uruguay 15, México 9, Venezuela 8, España 7 |
| Mobile / desktop | 338 / 302 | **Mobile es mayoría y engancha peor**: 66,75 % vs 75,15 % |
| Eventos clave | **0** | No hay ninguna conversión definida |
| Eventos `click` | **4** | El juego no está instrumentado |

**Embudo real:** 636 usuarios ven el home → **377 llegan al draft (59 %)**. Cuatro de cada diez
se van sin jugar. Y el home se lleva 2 min 22 s de atención antes de eso: la gente lee, le
interesa, y igual no entra.

**Punto ciego grave:** en 28 días GA registra **solo 2 títulos de página**: el home y "Draft de
Leyendas". Carrera, ranking, ruleta, versus, records y daily **no existen en los datos** porque
todas las rutas comparten el mismo `<title>`. Hoy no sabemos cuánta gente juega el modo carrera
—el modo más profundo que tenemos— ni si alguien abre el ranking. Se decide a ciegas.

### El diagnóstico en una línea

No tenemos un problema de tráfico. Tenemos **650 personas que entraron, jugaron tres minutos y
no volvieron nunca**. Todo lo demás es secundario a arreglar eso.

---

## 2. Orden de trabajo

El orden no es por gusto: primero medir (barato, desbloquea todo), después retener (es la fuga),
después viralizar (convierte retención en tráfico), y recién ahí ensanchar SEO y pedir plata.

---

## Fase 0 — Ver lo que pasa (medio día)

Sin esto, las fases siguientes son opinión.

1. **Un `<title>` por ruta.** `app/*/layout.tsx` o `metadata` por página. Sin esto GA no puede
   separar carrera de draft de ranking.
2. **Instrumentar los momentos del juego** en `components/Analytics.tsx` (ya expone `gtag`):
   `draft_iniciado`, `draft_completado`, `torneo_simulado`, `carrera_iniciada`,
   `carrera_temporada_fin`, `carrera_retiro`, `ficha_descargada`, `compartido` (con `red`),
   `reto_diario_jugado`, `ranking_visto`, `sugerencia_enviada`, `donacion_click`.
3. **Marcar como eventos clave** en GA: `draft_completado`, `carrera_retiro`, `compartido`,
   `donacion_click`.
4. **Google Search Console** conectado a la propiedad. Hoy sabemos que Google nos trae 616
   sesiones pero **no con qué búsquedas**. Ese dato es la base de la Fase 3.

Criterio de éxito: dentro de una semana poder responder "¿cuánta gente termina un draft?" con un
número, no con una intuición.

---

## Fase 1 — Retención: que vuelvan (el corazón del plan)

Hoy no hay una sola razón para volver mañana. Estas son, en orden de impacto por esfuerzo.

### 1.1 El reto diario, al frente
Ya existe (`app/daily/`, `lib/daily-challenge.ts`, `lib/daily-progress.ts`) y está escondido.
Es el mecanismo de retorno diario más probado que hay (Wordle).
- Card fija arriba del home: el reto de hoy, cuántos lo jugaron, tu racha.
- **Racha visible y con algo que perder**: "3 días seguidos". La racha es el gancho, no el reto.
- Resultado compartible en una línea de texto tipo Wordle (bloques de color, sin spoilers).

### 1.2 Un motivo semanal
- **Plantel de la semana**: un draft con bombo acotado (ej. "solo campeones de Libertadores"),
  mismo bombo para todos, tabla propia que cierra el domingo. Da un evento con fecha.
- **Clásico de la semana**: Boca-River, Racing-Independiente. Armás el 11 de uno de los dos y se
  simula el cruce contra el 11 promedio del rival que armó la gente. Es contenido de fútbol puro
  y se explica solo en un tweet.

### 1.3 Identidad y progreso persistente
Hoy el ELO vive en el navegador (`lib/storage.ts`) y el perfil es opcional (`AuthModal.tsx`).
Sin identidad no hay nada que perder al irse.
- Pedir nombre/club de hinchaje **después** del primer draft terminado, no antes (no romper el
  embudo del 59 %).
- **Escudo de hinchaje** elegido una vez: cambia el acento visual del sitio y el marco de la
  ficha. Cuesta poco y ata al usuario a su cuenta.
- **Historial propio**: "tus últimos 10 drafts", mejor puesto, ELO máximo. Ver el historial
  propio es lo que hace que borrar la cuenta duela.

### 1.4 Objetivos y colección (la parte adictiva)
- **Logros de fútbol**: "Armaste un 11 con 5 leyendas", "Campeón invicto", "Ganaste con un 11 de
  un solo club", "Sacaste a Riquelme en la ruleta". Se muestran en el perfil.
- **Álbum de figuritas**: cada leyenda que te toca en la ruleta queda en tu álbum. Es coleccionar
  sin gastar plata, es cultura argentina pura, y da una razón concreta para tirar la ruleta otra
  vez. Es, de largo, el mayor gancho de re-visita de toda la lista.

### 1.5 Mobile
53 % del tráfico y peor interacción (66,75 % vs 75,15 %). Auditar el draft en pantalla chica:
el arrastre de jugadores, el tamaño de la ruleta y la tabla del torneo. Cada punto de interacción
que se recupere en mobile vale más que cualquier campaña.

---

## Fase 2 — Que compartir traiga gente (viralidad)

Hoy `ShareBar.tsx` comparte **texto + link con hashtags** (`components/ShareBar.tsx:31`). En X,
un link solo rinde poco; una **imagen** rinde mucho más. Y no menciona la cuenta.

### 2.1 Ficha en imagen, no en link
- Al terminar un draft y al retirarse en carrera, generar la ficha en JPG/PNG (ya existen
  `lib/share-card.ts` y `lib/story-card.ts`) y **adjuntarla** al compartir.
- En mobile: `navigator.share` con el archivo (X, WhatsApp e Instagram lo aceptan) — ya está la
  base en `compartirHistoria()`.
- En desktop: descargar la imagen **y** abrir el intent de X con el texto listo, avisando
  "arrastrá la imagen al tweet". Es un paso manual, pero el salto de alcance lo justifica.

### 2.2 El texto del tweet
- Mencionar **@GambetafutbolAR** siempre (es lo que convierte un share en un seguidor).
- Que el texto cuente el resultado, no el producto: "Salí campeón con Estudiantes 2010 y un
  Verón de 89. Tu turno." + link + @GambetafutbolAR.
- Sacar los hashtags amontonados (`&hashtags=Gambeta,FutbolArgentino`): no traen a nadie y hacen
  ver la cuenta como marca.

### 2.3 Facebook e Instagram
Facebook ya trae 15 usuarios sin que hagamos nada. Historia de Instagram 1080x1920 ya está
generada; falta que el botón sea visible al final del draft, no solo en carrera.

---

## Fase 3 — SEO y marketing (ensanchar lo que ya funciona)

### 3.1 SEO: el canal que ya trae 646 sesiones
- **Search Console primero** (Fase 0). Sin saber qué se busca, todo lo demás es adivinar.
- **Páginas de contenido de fútbol**, que es lo que Google puede indexar y el juego no:
  fichas de planteles históricos ("Boca 2003: el plantel completo"), de leyendas, de clásicos.
  Cada una enlaza al draft con ese bombo. Esto es a la vez SEO y contenido para la cuenta de X.
- Metadatos por ruta (sale gratis con la Fase 0), Open Graph con imagen por sección, sitemap.
- Segundo mercado natural: **Chile, Uruguay, México** ya entran solos. La versión en inglés y
  portugués ya está planificada en `docs/PLAN_I18N.md`.

### 3.2 Outreach en X (lo que pediste)
Buscar gente que habla de **Copero**, **El Ídolo** y **7a0** e invitarla. El motor ya existe:
`rk-x-futbol-reply.py` en el bot, con sus reglas duras (nunca dos veces al mismo usuario, máximo
4 por día, nada de temas delicados).
- Agregar esas búsquedas a `BUSQUEDAS` en ese script.
- **Regla que no se negocia**: responder al tweet primero, y recién después mencionar el juego,
  con captura. Caer a decirle "probá el mío" a alguien que juega otro juego es spam y quema la
  cuenta nueva. La respuesta tiene que aportar algo aunque saques el link.
- Adjuntar siempre imagen (ruleta o ficha), nunca link pelado.

### 3.3 Comunidad
Los subreddits y grupos de fútbol argentino aceptan contenido si es contenido, no aviso: postear
**el resultado de un draft** ("me tocó este bombo, armé este 11, ¿ustedes qué ponían?") funciona;
postear el link no.

---

## Fase 4 — Sugerencias y donaciones

### 4.1 Caja de sugerencias
**El backend ya está hecho y no lo usa nadie**: `submitSuggestion()` en `lib/supabase.ts:69`
escribe en la tabla `suggestions` de Supabase (que está configurada en producción). Falta solo la
UI.
- Componente simple en el home: un textarea, un campo de contacto opcional, un botón.
- Privado: va a Supabase, lo vemos nosotros. Nada público.
- Un `resumen semanal de sugerencias` al Telegram del bot, para no tener que entrar a mirar.

### 4.2 Donaciones
Hoy `DonationSection` está en `app/page.tsx:762`, **pegada al footer**: la ve quien scrollea todo
el home, o sea casi nadie.
- Moverla a **después de un momento de disfrute**: al terminar un draft o una carrera, junto al
  botón de compartir. Ahí la persona acaba de pasarla bien.
- Texto corto y honesto: somos un grupo chico de programadores, lo pagamos de nuestro bolsillo,
  no hay publicidad ni datos vendidos, y lo que entre va a servidores y jugadores nuevos.
- Mostrar en qué se gasta ("un mes de servidor = X"). La transparencia recauda más que el pedido.
- Nunca bloquear nada del juego. Es donación, no paywall.

---

## Fase 5 — Arreglos del juego que estaban mal

### 5.1 El bombo repite equipos — HECHO
Corrección sobre la primera versión de este plan: los 134 planteles duplicados están entre
`squads.json` y `squads_historical.json`, pero **el juego solo importa `squads.json`**
(`app/draft/page.tsx:7`, `app/versus/page.tsx:8`, `app/page.tsx:8`). El histórico no lo carga
nadie, así que esos duplicados nunca llegaron a la ruleta.

La causa real es la desproporción: **170 planteles de solo 29 clubes**. Boca y Rosario Central
entran con 12 temporadas cada uno, Godoy Cruz con 9, y trece clubes con 1 o 2. Como
`spinSquadWithPity` sorteaba parejo sobre los 170, Boca salía 12 veces más seguido que Central
Córdoba, y en 11 giros repetir club era casi seguro.

Arreglado: el draft recuerda los clubes que ya salieron y los saca del bombo mientras queden
otros; si para ese puesto no queda ninguno fresco, vuelve al bombo completo antes que dejar al
jugador sin tirar. Con test que reproduce la repetición sin el arreglo.

Queda pendiente, opcional: balancear el dataset a 3–4 temporadas por club, priorizando las
memorables. Con el filtro de club puesto ya no se nota, así que no es urgente.

### 5.6 Los torneos tienen que dar algo al terminar

Hoy la Copa termina en una tabla y ahí muere. El draft tiene ficha compartible pero los torneos
no cierran con nada propio, y por eso no generan ni una vuelta ni un compartido.

Cada torneo cierra con **su ficha**, igual que la carrera:

- **Liga**: la tabla final con tu puesto, el campeón, tu goleador y tu asistidor.
- **Copa**: el camino ronda por ronda —a quién eliminaste, dónde te quedaste—, que es lo que se
  cuenta cuando alguien pregunta cómo te fue.
- En las dos: el 11 que armaste, el escudo del club del bombo, tu ELO nuevo y cuánto sumaste.
- Y el botón de compartir con la imagen adjunta y la mención a @GambetafutbolAR, igual que en
  la sección 2.1. Sin imagen, un resultado no se comparte.

Esto es lo que convierte "simulé un torneo" en "mirá cómo me fue", que es el único momento en que
un jugador trae a otro.

### 5.7 Libertadores y Sudamericana: se clasifica, no se elige

La idea es que no sean un botón más sino **algo que te ganaste**, que es lo que hace que alguien
vuelva al día siguiente:

1. **Clasificás con tu draft.** Terminás la Liga en zona de Libertadores (1° a 4°) o de
   Sudamericana (5° a 8°) y esa plaza te queda guardada.
2. **Hay que estar registrado.** La plaza vive en tu cuenta, no en el navegador. Es, de paso, el
   mejor motivo para crear cuenta que va a tener el juego: te la ganaste jugando, no te la
   pidieron en la puerta.
3. **Se juega con el mismo 11** con el que clasificaste. Si querés otro plantel, hay que volver a
   clasificar.
4. **Vale más en el ranking**: Sudamericana 120, Libertadores 150 sobre la base de 100 de la Liga
   (`tournamentPoints`, `lib/ranking.ts:67`, hoy solo entiende `'liga' | 'copa'`).
5. Ganarla deja algo permanente en el perfil: una estrella al lado del nombre en la tabla. El
   ranking necesita cosas que se muestren, no solo un número.

Lo que hay que escribir es poco: `simulateContinentalTournament` (`lib/copa-libertadores.ts`) ya
existe y ya se usa en carrera. Lo nuevo es la plaza guardada en Supabase y el gate de sesión.

### 5.2 El código muerto: no revivirlo, reemplazarlo por torneos que faltan
`simulateSeasonMatchByMatch` y `simulateCopaArgentinaMatchByMatch` (con el `sort(() =>
Math.random() - 0.5)` que no baraja) no las llama nadie. Miradas de cerca, **son versiones
viejas de las que ya corren**: `simulateSeasonWithStats` hace la misma liga y
`simulateCopaWithStats` la misma copa de 32 equipos, las dos con `pickOpponents`, que sortea
bien. Revivirlas no agregaría un modo nuevo: agregaría un duplicado peor del que ya está.

Lo que sí falta, y es la idea buena detrás de esto: **el draft solo ofrece Liga y Copa**
(`startSim(type: "liga" | "copa")`). Los motores de **Libertadores** (`lib/copa-libertadores.ts`,
`simulateContinentalTournament`) y **Mundial de Clubes** (`lib/world-cup.ts`) ya existen y
funcionan, pero solo se usan en el modo carrera. Llevarlos al draft da dos competencias nuevas
de verdad, sin escribir motor nuevo:

1. Agregar `libertadores` y `mundial-clubes` a `startSim`, con sus rivales continentales.
2. Extender `tournamentPoints` (`lib/ranking.ts:67`), que hoy solo entiende `'liga' | 'copa'`
   con base 100 y 70. La escala natural: Libertadores 130 y Mundial de Clubes 160, porque son
   más difíciles y tienen que valer más en el ranking.
3. Borrar las dos funciones muertas recién cuando los modos nuevos estén andando, no antes.

Esto le da al ranking algo que hoy no tiene: **varias formas de sumar**, que es lo que hace que
alguien vuelva a intentar con otro 11.

### 5.5 Los equipos históricos (el pedido grande)

Hoy el bombo arranca en 2015. Faltan los planteles que un hincha argentino reconoce al toque:
los Boca de Bianchi, el River de Gallardo, el Vélez del 94, el Estudiantes de Verón, el Huracán
de Cappa, el Independiente de Bochini. Son, además, el mejor material posible para la cuenta de X
y para SEO.

**Qué hay y qué falta (medido, no estimado):**

- `data/players.json` tiene 2.939 jugadores con club y años (`clubs[].years`), 606 de los 90 y
  561 de los 2000, y 35 marcados como leyenda.
- Pero solo están **las figuras, no los planteles**. Probado: para Boca 2001 la base da 4
  jugadores (Tevez, Riquelme, Palermo, Abbondanzieri); para Boca 2007, 2; para el River de
  Gallardo 2015, **0**; para Talleres 1999, 0.
- `data/squads_historical.json` **no sirve para esto**: a pesar del nombre, son los mismos
  2015-2025 con otros slugs de club. Es un residuo de scraping, no planteles históricos.

O sea: **el scrape nuevo hace falta**, y es sobre todo de jugadores, no de equipos.

**Cómo hacerlo:**

1. **Definir la lista desde el palmarés, no de memoria.** Exhaustiva, en este orden de prioridad:
   - todos los **campeones argentinos de Libertadores** (Independiente ×7, Boca ×6, Estudiantes
     ×4, River ×4, Racing, Vélez, Argentinos, San Lorenzo);
   - los campeones de **Intercontinental / Mundial de Clubes**;
   - campeones de **Sudamericana, Copa Conmebol y Supercopa**;
   - los **campeones de liga** de cada club desde los 80;
   - y los **hitos sin título**: el Huracán de Cappa, el Newell's de Bielsa, equipos que quedaron
     en la memoria aunque no dieron la vuelta.

   Cada equipo queda respaldado por una fuente; si un año no se confirma, no entra. (Ojo con dos
   del pedido: el hito continental de Talleres es la **Copa Conmebol 1999**, no 1996, y "el
   Belgrano campeón" hay que definir a cuál nos referimos. Lo resuelve la fuente, no nosotros.)
2. **Scrapear el plantel** de cada temporada elegida con el pipeline que ya usa el repo:
   Wikidata + es.wikipedia.org, igual que `scripts/data/enrich-wikidata-stats.mjs` y
   `verify-vs-wikidata.mjs`. Script nuevo: `scripts/data/scrape-squads-historicos.mjs`.
3. **Fusionar sin romper**: los jugadores que ya existen se reusan por id; los nuevos se agregan
   con su OVR calculado igual que el resto (`recompute-ovr.mjs`), no a ojo.
4. **OVR un poco más alto**, como pediste, pero acotado: un bonus de época de +2/+3 sobre el
   plantel, no más. Si un equipo histórico arrasa siempre, deja de ser un premio y rompe el
   equilibrio del torneo.
5. **Que se sientan un premio al salir**: estos planteles entran en la ruleta con menor
   probabilidad que los actuales y con animación propia, como ya pasa con las cartas de leyenda.
   Salir el Boca de Bianchi tiene que ser un momento.
6. **Validar** con `npm run audit:data` (ya existe) antes de publicar: sin jugadores duplicados,
   sin planteles de menos de 11, sin años inventados.

Cada equipo histórico es además **una página de contenido** para la Fase 3 ("Boca 2001: el
plantel campeón de América") y **un tweet** con la ruleta mostrándolo. El mismo trabajo sirve
para las tres cosas.

### 5.3 Que el equipo bueno gane más seguido
El OVR y la química **ya entran** en la simulación (`teamToStrength`, `simulateMatchGoals`), así
que la base está. Lo que falta es que **se note y se entienda**:
- Subir el peso de la diferencia de fuerza frente al azar en `simulateMatchGoals`: hoy un 11 de
  85 puede perder contra uno de 60 más seguido de lo que se siente justo.
- Mostrar **antes de simular** la probabilidad de salir campeón según tu OVR y tu química. Es
  información honesta y es lo que hace que la gente vuelva a intentar armar mejor el 11.
- Que la química pese de verdad: hoy es 8 % del overall. Si el mensaje del juego es "armá bien",
  la química tiene que doler cuando está mal.

### 5.4 Ranking
Hoy (`app/leaderboard/page.tsx:59` y `lib/supabase.ts:39`):
- trae **solo 50 filas**, y ordenadas por `pts`;
- las mezcla con **rivales falsos** (`SEED_RIVALS`);
- y recién ahí ordena todo por ELO.

O sea: el orden que pide la base y el que se muestra son distintos, y hay puestos ocupados por
jugadores que no existen. Por eso "se muestran solo algunos y los puntos no se entienden".

Arreglo:
1. Pedir a Supabase **ordenado por ELO**, que es lo que se muestra.
2. **Top 100 global** + tu fila anclada con tu puesto real, aunque estés 300°.
3. Sacar los rivales sembrados en cuanto haya jugadores reales (hoy ya los hay).
4. Explicar el puntaje en una línea al lado del número, no en un modal aparte
   (`EloExplainer.tsx` ya tiene el texto): "ganás ELO según en qué puesto salís y con qué equipo".
5. Filtros que dan ganas de volver: hoy / esta semana / histórico, y por club de hinchaje.

---

## Fase 6 — Consolidarnos en fútbol (más allá del trimestre)

Todo lo que agreguemos tiene que ser de fútbol, no de "gaming":
- **Modo Copa**: eliminación directa con Libertadores y Mundial de Clubes (el motor ya existe en
  `lib/copa-libertadores.ts` y `lib/world-cup.ts`).
- **Predicciones de la fecha real**: el widget de resultados en vivo ya está
  (`components/LiveScoresWidget.tsx`). Predecir la fecha del torneo real da un motivo de visita
  **semanal, atado al calendario del fútbol**, que es el reloj que ya tiene el usuario.
- **Enfrentar amigos**: `app/versus/` existe. Un link de desafío con el mismo bombo es la vía más
  corta a que un usuario traiga a otro.
- **Efemérides**: "un día como hoy" con el plantel de ese equipo listo para draftear. Contenido
  diario para X y para SEO, generado del dato que ya tenemos.

---

## Orden concreto de ejecución

| # | Qué | Por qué primero |
|---|---|---|
| 1 | Fase 0 completa (títulos, eventos, Search Console) | Sin esto no se puede decidir nada |
| 2 | Dedupe del bombo + shuffle (5.1, 5.2) | Es el defecto que ya se nota jugando |
| 3 | Ranking real (5.4) | Es el motivo de volver que ya está construido a medias |
| 4 | Reto diario al frente + racha (1.1) | El mecanismo de retorno diario más barato |
| 5 | Ficha en imagen + mención a @GambetafutbolAR (2.1, 2.2) | Convierte los 650 en tráfico nuevo |
| 6 | Caja de sugerencias (4.1) | El backend ya existe; es media hora |
| 7 | Donaciones reubicadas (4.2) | Después de un momento de disfrute, no en el footer |
| 8 | Ficha de cierre de Liga y Copa (5.6) | Hoy el torneo termina en una tabla y no genera ni un compartido |
| 9 | Libertadores y Sudamericana con clasificación (5.7) | El mejor motivo para crear cuenta que va a tener el juego |
| 10 | Equipos históricos: scrape y bombo (5.5) | El más grande, y el que más contenido genera para X y SEO |
| 11 | Álbum de figuritas (1.4) | El gancho más fuerte, pero el que más trabajo pide |
| 12 | Páginas de contenido de fútbol (3.1) | SEO compuesto: rinde a partir del mes |

### Ya hecho

| Cuándo | Qué |
|---|---|
| 07-31 | Fase 0: título y descripción por ruta, eventos del juego instrumentados (PR #30) |
| 07-31 | El bombo no repite clubes, con test (PR #30) |
| 07-31 | Ranking: top real por ELO, tu puesto contado en la base, sin rivales de la casa en global, y explicación en el draft (PR #31) |
| 07-31 | Outreach en X a quienes juegan Copero / El Ídolo / 7a0, con la regla de contestar primero |

---

## Cómo sabremos que funcionó

Hoy la línea de base, medida:

- Usuarios que vuelven: **prácticamente 0** (641 nuevos de 640 activos)
- Home → draft: **59 %**
- Compartidos: **no se miden**
- Donaciones: **no se miden**
- Sesiones por usuario: **1,16**

A 30 días, con la Fase 0 andando, las metas son: usuarios recurrentes por encima del 15 %,
home → draft por encima del 70 %, y al menos un compartido cada 20 drafts terminados. Si el
tráfico de Google se mantiene y la retención sube a 15 %, la base de usuarios activos crece sin
gastar un peso en publicidad.
