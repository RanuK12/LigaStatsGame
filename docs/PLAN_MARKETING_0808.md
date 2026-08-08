# Plan de tráfico y marketing — Gambeta

Escrito el **2026-08-08** con los datos de Google Analytics (propiedad `G-G772RDTN8G`,
`a273742100p547276243`) y de Google Search Console leídos directo de la consola, no estimados.
Reemplaza el diagnóstico de `PLAN_CRECIMIENTO.md` § 1, que estaba equivocado en su conclusión
principal.

---

## 1. Los números medidos

### Volumen (11 jul – 7 ago, 28 días)

| Métrica | Valor |
|---|---|
| Usuarios | 1.244 |
| Sesiones | 1.588 |
| **Usuarios nuevos (`first_visit`)** | **1.243 de 1.244** |
| Interacción media por sesión | 2 min 51 s |
| Tasa de interacción | 69,1 % |
| Eventos clave | 934 (11,4 % de las sesiones) |

Contra los 28 días anteriores (740 sesiones) el tráfico **más que se duplicó**. Pero los
últimos 7 días cierran en **439 usuarios, −47,7 %**: subió de golpe y se está desinflando.

### Canales

| Canal | Sesiones | % |
|---|---|---|
| Organic Search | 1.380 | 86,9 % |
| Direct | 157 | 9,9 % |
| **Organic Social** | **36** | **2,3 %** |
| Referral | 13 | 0,8 % |

### El dato que cambia todo: qué se busca en Google

Search Console (propiedad dada de alta el 02-08, hay 6 días de datos: 366 clics, 2.000
impresiones, CTR 18,3 %, posición media 5,4). **Las diez consultas principales, completas:**

| Consulta | Clics | Impresiones |
|---|---|---|
| gambeta juego | 191 | 487 |
| gambeta | 65 | 580 |
| gambeta futbol | 15 | 132 |
| la gambeta juego | 15 | 47 |
| gambeta oficial | 3 | 197 |
| gambeta fútbol | 2 | 7 |
| gambetaoficial | 1 | 56 |
| gambeta argentina | 1 | 4 |
| gambeta gamma | 1 | 2 |
| la gambeta futbol | 0 | 18 |

**Las diez son la marca.** No hay una sola consulta genérica. Cero clics de
"juegos de futbol", "armar tu 11", "simulador de carrera", "plantel Vélez 1994".

Y las páginas:

| Página | Clics | Impresiones |
|---|---|---|
| `/` | 358 | 1.882 |
| `/como-jugar/` | 8 | 301 |
| `/carrera/` | 2 | 34 |
| `/equipos/boca-juniors-2001/` | **0** | 36 |
| `/equipos/river-plate-1996/` | **0** | 10 |

Comprobado a mano en Google: para `plantel velez 1994`, `boca juniors 2000 plantel campeon` y
`juegos de futbol gratis armar equipo`, **Gambeta no aparece en las primeras 20 posiciones**.
Están indexadas 38 de las 48 URLs del sitemap; las 36 páginas de equipos históricos suman
**46 impresiones y 0 clics en 6 días**.

### El embudo, evento por evento (28 días, sobre 1.244 usuarios)

| Evento | Eventos | Usuarios | % de usuarios |
|---|---|---|---|
| `page_view` | 7.988 | 1.243 | 100 % |
| `draft_iniciado` | 418 | 240 | 19,3 % |
| `draft_completado` | 774 | 144 | 11,6 % |
| `torneo_simulado` | 259 | 132 | 10,6 % |
| `carrera_iniciada` | 155 | 108 | 8,7 % |
| `ranking_visto` | 104 | 25 | 2,0 % |
| `dato_tirado` | 20 | 7 | 0,6 % |
| **`compartido`** | **14** | **9** | **0,72 %** |
| `reto_diario_jugado` | 10 | 10 | 0,8 % |
| `donacion_click` | 8 | 8 | 0,6 % |
| **`carrera_retiro`** | **4** | **4** | **0,32 %** |
| `ficha_descargada` | 3 | 2 | 0,16 % |

---

## 2. El diagnóstico

**El juego no tiene un problema de producto. Tiene un problema de puertas.**

Lo que funciona, medido: los 144 que completan un draft completan **5,4 drafts cada uno**. Se
quedan 2 min 51 s. La tasa de interacción es 69 %. El que entra, juega, y juega bastante.

Lo que no existe:

**a) No hay canal de descubrimiento.** El 87 % del tráfico es Google, y el 100 % de ese Google
es gente que **ya sabía el nombre y lo tipeó**. Google no nos trae gente nueva: nos devuelve la
que alguien ya nos mandó. Es un termómetro de la marca, no una fuente. La conclusión de
`PLAN_CRECIMIENTO.md` —"el canal ya existe y funciona solo, hay que ensancharlo"— está mal: no
hay canal, hay un eco.

**b) No hay circuito viral.** 9 personas compartieron en 28 días. El factor K es 0,007. Un
juego que no se comparte crece solo hasta donde llega el que lo empuja a mano.

**c) No hay retención.** 1.243 de 1.244 usuarios son nuevos. 10 personas jugaron el reto
diario. Nadie vuelve al día siguiente.

Los tres se explican entre sí: sin compartidos no entra gente nueva, sin gente nueva la
demanda de marca se agota, y por eso los últimos 7 días caen 47 %. La curva no es ruido: es lo
que pasa cuando la única fuente de tráfico es un stock finito de personas que ya te conocen.

**El eslabón exacto que se rompe:** el artefacto que se comparte —la ficha de la carrera, que
es lo que a Copero le dio 9.901 seguidores— **lo produce 4 personas por mes**. 108 empiezan una
carrera, 4 llegan al retiro. El 96 % la abandona antes de tener algo que mostrar.

Copero cierra una carrera en 5 minutos. Gambeta pide 15 temporadas con decisiones, ofertas y
lesiones. Es un modo más rico y por eso mismo nadie lo termina, y si nadie lo termina, nadie lo
publica, y si nadie lo publica, no entra nadie.

**Hipótesis con test pendiente:** X trae 36 sesiones/mes por link, pero la consulta
"gambeta juego" tiene 191 clics. Es posible que los tweets generen **búsquedas de marca** en
vez de clics —la gente ve el nombre y lo googlea después—, y que el aporte de X esté
subestimado por atribución. Se comprueba cruzando los días de publicación de
`@GambetafutbolAR` contra la curva diaria de "gambeta juego" en Search Console. Si correlaciona,
X vale mucho más de lo que dice Analytics y hay que multiplicarlo, no abandonarlo.

---

## 2 bis. Qué se ejecutó el 8 de agosto

Todo lo de abajo está en `main` y desplegado. Lo que quedó pendiente lleva el motivo al lado.

| Frente | Qué se hizo | Commit |
|---|---|---|
| **0** | **Los despliegues estaban trabados desde el 6/8.** La corrida #307 dejó el job `deploy` en "waiting" y, con `cancel-in-progress: false`, el grupo "pages" nunca se soltó: 20 corridas canceladas y nada publicado en dos días. Se destrabó a mano y se cambió a `cancel-in-progress: true` con timeout por job | `73b20d8` |
| **1** | La ficha y el botón de compartir salieron de atrás de `career.finished`: ahora están desde la primera temporada, con placa de historias y link a `/c/` con tu carrera | `24773a6` `e08cf8e` |
| **1** | El home ofrece seguir la carrera guardada. Ya se guardaba sola; nada se lo decía a nadie | `24773a6` |
| **1** | `carrera_temporada_fin` medido: en una semana sabemos en qué año se abandona | `1efd137` |
| **2.2** | `/juegos-de-futbol-argentino/`: la única página escrita para el que no sabe que existimos | `a39d288` |
| **2.4** | Search Console vinculado a Analytics (estaba sin vincular; ahora las consultas aparecen al lado del embudo) | — configuración |
| **3** | El resultado del reto en cuadraditos, para pegar en un grupo sin imagen ni link | `73b20d8` |
| **—** | El ícono de la app era el escudo de la AFA y no era cuadrado. Reemplazado por el logo real en 192 y 512 | `12599d5` |
| **—** | Borrado el pipeline de marketing que no leía nadie y la etiqueta `keywords`, que Google ignora desde 2009 | `5a3559a` |
| **2.1** | Preparado entero en `docs/PORTALES_HTML5.md`: comprobado que se puede embeber, ficha escrita, íconos listos. **Falta Emilio**: crear las cuentas y subir | `12599d5` |
| **2.3** | Comunidades: pendiente, necesita a Emilio publicando con su cuenta | — |
| **4** | La hipótesis de la búsqueda de marca no se puede comprobar todavía: Search Console tiene 6 días de datos y hacen falta al menos tres semanas para cruzar contra los días de publicación | — |

Una corrección respecto de lo que dice el Frente 1 más abajo: la **carrera express de 5
temporadas quedó descartada**. Al leer el código apareció que el botón "🏁 Simular completa" ya
termina la carrera de un clic, así que el largo no era el bloqueo. El bloqueo real era que el
artefacto compartible estaba detrás del retiro, y eso es lo que se arregló.

---

## 3. El plan

Cuatro frentes, en este orden. El orden importa: abrir puertas antes de tapar el agujero es
tirar tráfico a un balde perforado.

### Frente 1 — Que la carrera se termine (2 semanas) · **el más importante**

Objetivo medible: **de 4 a 60 carreras terminadas por mes**. Es el insumo de todo lo demás.

1. **Carrera express de 5 temporadas** como opción por defecto, con la de 15 disponible para el
   que quiera. Cinco temporadas es una historia completa: debut, primer título, salto a Europa,
   Mundial, retiro. `simulateSeason` no cambia: cambia cuántas se corren y cómo se cierra.
2. **Guardar y seguir**: hoy la carrera vive en la URL (707 chars). Que el navegador recuerde la
   partida sin cuenta y el home diga "tenés una carrera en la temporada 7, seguila" convierte el
   abandono en retorno. Es la palanca de retención más barata que hay.
3. **Compartir en el pico**, no al final: cada temporada con un hito (primer título, primera
   convocatoria, oferta de Europa) ofrece la placa ahí mismo. No hay que llegar al retiro para
   tener algo que mostrar.
4. `carrera_temporada_fin` ya se dispara desde el commit de hoy. **En una semana sabemos en qué
   año exacto se van** y se ataca ese punto, no el promedio.

### Frente 2 — Abrir una puerta que no sea la marca (3 semanas)

**2.1 Portales de juegos HTML5 — el canal más grande sin tocar.**
CrazyGames, Poki, itch.io y GameDistribution mandan cientos de miles de visitas a juegos de
navegador y **no piden nada que Gambeta no tenga**: es un export estático, gratis, sin login,
sin instalación. Es exactamente el formato que curan. Un solo juego aceptado en CrazyGames
supera todo el tráfico histórico del sitio. Trabajo: ficha, capturas, video de 30 s, y el juego
servido en un iframe. **Es la acción de mayor retorno por hora de este plan.**

**2.2 SEO con la intención correcta.**
Las 36 páginas de equipos históricos apuntan a consultas informativas donde gana Wikipedia:
0 clics en 6 días. La intención que sí podemos ganar es la de **jugar**, no la de leer:
"juego para armar tu 11", "simulador de carrera de futbolista", "juegos de futbol sin
descargar", "juego de draft de futbol". Una página por intención, con **el juego jugable arriba
del pliegue** —eso es lo que Wikipedia no puede ofrecer y lo que Google premia en esas
consultas—. Las de equipos se dejan como están: ya están escritas y no molestan.

La lista de `keywords` que se agregó en `app/layout.tsx` no hace nada: Google ignora esa
etiqueta desde 2009. No es dañina, pero no cuenta como trabajo de SEO.

**2.3 Comunidades.** r/futbol, r/argentina, los grupos de Facebook de hinchadas, los foros de
cada club. Una publicación por semana, con la placa, sin link en el primer mensaje (los subs de
fútbol banean el autopromo directo; el link va en el comentario).

**2.4 Search Console ↔ Analytics.** Están sin vincular: Analytics lo pide en un cartel de la
portada. Son dos clics y hace que las consultas de búsqueda aparezcan al lado del embudo.

### Frente 3 — Retención: el reto diario, en serio (1 semana)

10 personas lo jugaron en 28 días. El mecanismo de Wordle necesita tres cosas y tenemos una:

1. Un reto por día — **hecho**.
2. **Una racha con algo que perder**, visible antes de jugar. Sin racha no hay motivo de volver.
3. **Un resultado copiable en bloques**, sin spoiler, que se pega en un grupo de WhatsApp sin
   imagen ni link. Es lo que hizo Wordle: el texto viaja donde la imagen no llega.

Y una notificación web opcional a la hora que el usuario elija.

### Frente 4 — X, medido de nuevo (continuo)

- Comprobar la hipótesis de la búsqueda de marca (arriba). Si se confirma, el objetivo de la
  cuenta deja de ser el clic y pasa a ser **la impresión con el nombre bien puesto**.
- Copiar lo que a Copero le funcionó, que está medido: **citar a la gente que publica su
  carrera**. Requiere que haya carreras publicadas, o sea el Frente 1.
- El responder a quien pide ligas (`rk-x-ligas-pedidas.py`, ya en producción) es la única
  mecánica de X que traía gente calificada. Mantenerla.
- Las cuentas siguen separadas: `@ranuk_dev` y `@GambetafutbolAR` no comparten contenido.

---

## 4. Qué NO hacer

- **No escribir más páginas de equipos históricos.** 36 páginas, 46 impresiones, 0 clics. La
  hipótesis se probó y salió que no. Escribir 24 más es repetir el experimento esperando otro
  resultado.
- **No agregar `keywords` a más páginas.** Google ignora la etiqueta.
- **No comprar tráfico** hasta que el circuito de compartir funcione: sería pagar por llenar el
  balde perforado.

---

## 5. Cómo se mide si funciona

Se revisa a los 30 días (2026-09-07) contra la línea de base de hoy:

| Métrica | Hoy | Objetivo |
|---|---|---|
| Carreras terminadas / mes | 4 | 60 |
| `compartido` (usuarios) | 9 | 60 (5 % de los usuarios) |
| Usuarios que vuelven | 1 de 1.244 | 10 % |
| Sesiones de Organic Social + Referral | 49 | 400 |
| Consultas de Google **no** de marca | 0 clics | 100 clics |
| Usuarios / mes | 1.244 | 4.000 |

Si a los 30 días las carreras terminadas siguen abajo de 30, el problema no es el largo de la
carrera y hay que volver a mirar: es la única hipótesis de este plan que, si falla, invalida
los otros tres frentes.
