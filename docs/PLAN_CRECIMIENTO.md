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

### 5.1 El bombo repite equipos (confirmado, y peor de lo que parecía)
`data/squads.json` (170) + `data/squads_historical.json` (187) = **357 planteles de solo 44
clubes**. Y **134 planteles están duplicados literalmente** entre los dos archivos: el mismo
club-temporada cargado con dos slugs distintos (`independiente` y `ca-independiente`,
`banfield` y `ca-banfield`, ...). Godoy Cruz aparece 20 veces, con 2015, 2016, 2018, 2019, 2023,
2024 y 2025 **repetidos dos veces cada uno**. Boca tiene 23 entradas.

Como `spinSquad()` (`lib/game-engine.ts:255`) elige uniforme sobre todos los planteles, Boca sale
23 veces más seguido que un club con uno solo. Eso es exactamente lo que se ve jugando.

Arreglo:
1. Deduplicar por `clubId` normalizado + `season`, unificando los dos espacios de slugs.
2. Que la ruleta **no repita club** dentro de una misma tanda: elegir club primero, después
   temporada. Un bombo de 15 debería tener 15 clubes distintos.
3. Balancear: como mucho 3–4 temporadas por club en el bombo, priorizando las memorables.

### 5.2 Bug de barajado
`lib/game-engine.ts:333` y `:387` usan `sort(() => Math.random() - 0.5)` para elegir los 29
rivales. **El propio archivo advierte en la línea 537 que ese comparador no baraja de verdad.**
Los rivales salen sesgados hacia el orden del archivo. Usar el `shuffle()` que ya está escrito
ahí abajo.

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
| 8 | Álbum de figuritas (1.4) | El gancho más fuerte, pero el que más trabajo pide |
| 9 | Páginas de contenido de fútbol (3.1) | SEO compuesto: rinde a partir del mes |

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
