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

### 5.7 Libertadores y Sudamericana: se clasifica, no se elige — HECHO, y después arreglado

La clasificación salió en el PR #34: 1° a 4° Libertadores, 5° a 8° Sudamericana, la plaza vive en
la cuenta, se gasta al jugarla y vale 150 y 120 contra los 100 de la Liga.

Pero el torneo en sí estaba a medio hacer y **no se podía ganar**:

- la "fase de grupos" eran tres partidos sueltos que no eliminaban a nadie;
- los rivales estaban cargados en escala FIFA (72-84) y el motor de partidos usa otra: un once de
  95 da 73 de overall. El equipo perfecto entraba último del grupo;
- la Sudamericana era idéntica a la Libertadores, así que clasificar 5°-8° no cambiaba nada.

Arreglado: grupo de cuatro ida y vuelta con tabla, llaves a doble partido con global y penales,
final única, dos cuadros de 24 clubes con escudo propio, y el puesto en la copa entra al ranking
(irse en el grupo ya no puntúa igual que perder la final). Con un once de 78, la Sudamericana se
gana el 18 % de las veces y la Libertadores el 6 %.

**Queda pendiente**: la plaza se guarda en el navegador (`ligastats_user_profile_v1`), no en
Supabase. El login por Supabase sí es real, pero si cambiás de dispositivo, perdés la plaza.

### 5.7 bis · Lo que decía el plan original

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

### 5.5 Los equipos históricos — HECHO

**36 planteles históricos, de 1994 a 2021, ya están en el bombo.** El Vélez del 94 de Bianchi y
Chilavert, el River del 96, los Boca de la era Bianchi (2000, 2001, 2003, 2007), el Estudiantes
de Verón, el Huracán de Cappa. 17 clubes, 395 jugadores nuevos en la base.

**Cómo se hizo (el pipeline queda, es reanudable y se puede volver a correr):**

1. `data/historicos/candidatos.json` — 64 equipos desde el palmarés, no de memoria. Cada año se
   verificó contra Wikipedia antes de escribirlo (así se corrigió que el hito continental de
   Talleres es la **Copa Conmebol 1999**, no 1996).
2. `scripts/data/verificar-historicos.mjs` — QID del club en Wikidata y plantel de esa temporada
   (P54 con P580/P582). 63 de 64 equipos con plantel armable.
3. `scripts/data/cruzar-historicos.mjs` — cruza **tres fuentes**: Wikidata, el artículo de
   es.wikipedia del jugador y del club, y nuestra propia base. **Un jugador entra solo si lo
   respaldan dos de tres.** El OVR de los que ya teníamos manda; los nuevos se calculan con la
   misma fórmula de `recompute-ovr.mjs`, nunca a ojo. 56 de 63 equipos quedaron armables.
4. `scripts/data/merge-historicos.mjs` — fusiona sin romper: no toca el rating ni el id de nadie
   que ya estuviera, no borra ningún plantel actual, deja backup y es idempotente. El criterio de
   entrada es el mismo que usa `npm run audit:data` para llamar jugable a un plantel: arquero,
   tres del fondo, tres del medio y un delantero.
5. Bonus de época **+2** solo a los jugadores nuevos y con techo de 85, para que ninguno pase por
   encima de las leyendas curadas a mano.
6. En el bombo salen con **peso 0,4** contra 1 de los actuales (`HISTORICO_PESO`), con tier
   legendario y su hito en el reveal. Tres tests nuevos en `__tests__/draft-historicos.test.ts`.

**Lo que se aprendió, en tres errores que valían la mitad del trabajo:**

1. La etiqueta de Wikidata en español para el arco es «guardameta», y el mapa de posiciones no la
   tenía. Todos los arqueros nuevos se caían y equipos enteros quedaban afuera por "sin arquero".
2. Wikidata no tiene la carrera de clubes de Verón (su ítem no registra un solo P54), así que el
   Estudiantes campeón de América se armaba sin Verón. Los ídolos hay que buscarlos en nuestra
   propia base, que es la fuente más confiable que tenemos para eso.
3. Wikidata tiene períodos de club abiertos, que empiezan y no terminan nunca. Arrastraban al
   jugador a todas las temporadas siguientes: Rugilo, que jugó en los 40, aparecía en el Vélez
   del 94, y Chividini (1930) en el San Lorenzo 2014. Una etapa sin cerrar de más de doce años no
   es una etapa, es un dato incompleto.

**Lo que no entró, y por qué (no se completa a ojo):**

- 14 equipos porque **esa temporada ya estaba en el juego** con datos actuales, que le ganan al
  scrapeo: River 2015 y 2018, Boca 2015, 2020 y 2022, Racing 2019 y 2024, Independiente 2017,
  Rosario Central 2023, Estudiantes 2023, River 2023, Vélez 2024, Talleres 2024, Platense 2025.
- 13 por **falta de respaldo**: Newell's 1991 y 2013, Independiente 2002 y 2010, Talleres 1999,
  Gimnasia 1994, River 2004, Defensa y Justicia 2020 y 2021, Colón 2021, Racing 2001,
  Central Córdoba 2024. Wikidata no tiene el plantel entero de esas temporadas.
- Pendiente: cada plantel histórico es además **una página de contenido** ("Boca 2001: el plantel
  campeón de América") y **un tweet** con la ruleta mostrándolo. Ese trabajo es la Fase 3.


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

## Lo que sigue, en orden

1. **Álbum de figuritas** (§1.4). Es el gancho más fuerte de la lista y el que más trabajo pide.
   Cada leyenda que sale en la ruleta queda en tu álbum. Coleccionar sin gastar plata, que es
   cultura argentina pura.
2. **¿Sabías que?** — datos curiosos que se *tiran* como un dado, con rareza y carta compartible.
   Plan completo en `docs/PLAN_SABIAS_QUE.md`. Comparte mazo y mecánica con el álbum: conviene
   construirlos juntos, no uno detrás del otro.
3. **Páginas de contenido** por plantel histórico y por dato de rareza leyenda (§3.1). El dato ya
   está cargado; falta escribir las páginas.

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
| 4 | ~~Equipos históricos: scrape y bombo (5.5)~~ HECHO | El más grande, y el que más contenido genera para X y SEO |
| 5 | Álbum de figuritas (1.4) | El gancho más fuerte, pero el que más trabajo pide |
| 6 | Páginas de contenido de fútbol (3.1) | SEO compuesto: rinde a partir del mes |

### Ya hecho

| Cuándo | Qué |
|---|---|
| 07-31 | Fase 0: título y descripción por ruta, eventos del juego instrumentados (PR #30) |
| 07-31 | El bombo no repite clubes, con test (PR #30) |
| 07-31 | Ranking: top real por ELO, tu puesto contado en la base, sin rivales de la casa en global, y explicación en el draft (PR #31) |
| 07-31 | Outreach en X a quienes juegan Copero / El Ídolo / 7a0, con la regla de contestar primero |
| 07-31 | Reto diario al frente del home con la racha (PR #32) |
| 07-31 | Compartir en X con la imagen preparada y mención a @GambetafutbolAR, sin hashtags (PR #32) |
| 07-31 | Caja de sugerencias en el home, sobre el backend que ya existía (PR #32) |
| 07-31 | Donaciones al terminar torneo y carrera, y explicando quiénes somos (PR #32) |
| 07-31 | Ficha de cierre de torneo: ELO ganado a la vista y camino de la Copa (PR #33) |
| 07-31 | Libertadores y Sudamericana por clasificación, con cuenta y puntos propios (PR #34) |
| 07-31 | 38 planteles históricos en el bombo (1994-2021), cruzados contra tres fuentes (5.5) |
| 07-31 | Card de novedades en el home, que se actualiza desde `data/novedades.json` |
| 07-31 | Los ídolos de cada plantel histórico salen de nuestra base: Verón, Riquelme, Palermo |
| 07-31 | La Libertadores y la Sudamericana con fases reales, escudos y dos cuadros distintos |

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

---

## Pendientes anotados el 07-31 (pedidos de Emilio)

- **Donaciones más destacadas.** `DonationSection` ya está en el home, pero aparece abajo de todo,
  después de las sugerencias. Hay que subirla y darle peso propio.
- **Álbum de figuritas** (§1.4). Sigue siendo el gancho más fuerte sin construir. Comparte mazo y
  mecánica de rareza con `/datos`, así que conviene hacerlo encima de eso y no de cero.
- **Plaza continental en Supabase.** Hoy vive en `ligastats_user_profile_v1` (localStorage): si
  cambiás de dispositivo, la perdés. Emilio lo dejó para más adelante.
- **Más redes.** En el footer están X y ranuk.dev. Faltan Instagram y TikTok cuando existan las
  cuentas; los handles conviene tomarlos antes de que los tome otro (ver `docs/PRIORIDAD_NOMBRE.md`).
- **Registro de marca en el INPI.** Es la única acción que da un derecho oponible sobre el nombre.
  Detalle y pasos en `docs/PRIORIDAD_NOMBRE.md`.
