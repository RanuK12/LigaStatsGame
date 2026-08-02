# Plan de redes — cómo funcionan los que ya ganaron, y qué copiar

Medido el 2026-08-02 mirando las cuentas y la prensa que las cubrió, no de memoria.

## 1. La competencia, con números

### Copero · [@coperoweb](https://x.com/coperoweb) · copero.com.ar

| | |
|---|---|
| Seguidores | 9.901 |
| Posteos | 161 |
| Cuenta abierta | mayo 2026 (tres meses) |
| Bio | "Por fanáticos, para fanáticos." |

Rinde **61 seguidores por posteo**. Nosotros, con 750 tweets, teníamos 4 seguidores.

**Sus posteos, medidos**

| Posteo | Vistas | Likes | RT | Respuestas |
|---|---|---|---|---|
| Video de "Convertite en leyenda" (fijado) | **1,8 M** | 2,8 K | 772 | 374 |
| Resumen de la semana + trastienda | 292 K | 12 K | 481 | 179 |
| Chiste sobre un bug propio | 56 K | 4,6 K | 214 | 27 |
| Agradecimiento a un club que jugó | 17 K | 526 | 10 | 16 |

**Qué hacen, en orden de importancia**

1. **Citan y agradecen a cada persona que publica su carrera.** Ejemplo real: Montevideo City
   Torque (club verificado) tuiteó "Probando el copero. Tamos todos en esta, no?" y Copero lo citó
   con "¿Ídolo en Montevideo y en Barcelona? Conozco a uno. ¡Gracias City Torque por probar
   Convertite en Leyenda!". El contenido lo hace el usuario; ellos solo lo amplifican.
2. **Nombran periodistas y streamers para que jueguen.** "Muy buenas carreras, falta la de
   @gbeder nada más, que la esperamos con ansias" — Germán Beder tiene 219,2 K seguidores. Es un
   pedido público, en tono de chiste, imposible de leer como spam.
3. **Se ríen de sus propios bugs.** "Muvzep, el delantero argentino que usaba la 12, durante la
   madrugada del 1 de agosto de 2026 (ya lo corregimos)". Un error se convierte en 56 K vistas.
4. **Muestran la trastienda.** La TV grabando, la oficina, el equipo. Los cubrió la televisión.

### El Ídolo · Potrero

Modo carrera dentro de una app de resultados y estadísticas.

- Una carrera completa **en cinco minutos**.
- Más de 300 eventos de decisión por temporada, cartas de entrenamiento, minijuegos en las finales.
- Arrancás en el Ascenso, elegís posición y país.
- **Al retirarte te da un balance completo y te compara con una leyenda real del fútbol.** Esa
  comparación es lo que la gente saca de captura. Es la función más copiada del rubro.
- El Ídolo 2.0 salió el 26 de julio: nacionalidad, liga y equipo a elección.

### 7A0 · 7a0.com.br

El original, brasileño, el que arrancó todo antes del Mundial.

- Tirás el dado, te toca una selección y una edición de Mundial al azar, elegís un jugador, armás
  el 11 y simulás el Mundial.
- 52 países, 250 selecciones, 5.729 jugadores.
- Sin cuenta, gratis, del navegador.
- **Es exactamente la mecánica del draft de Gambeta**, con selecciones en vez de clubes argentinos.

### La fórmula, en palabras de la prensa que los cubrió

> "Partidas cortas, decisiones aleatorias y resultados diferentes en cada intento. Los usuarios
> repiten para conseguir carreras perfectas y luego las comparten."
> — Diario Huarpe, *Qué son Copero y El Ídolo, los juegos de fútbol que son furor en redes*

Las tres piezas: **corto**, **distinto cada vez**, **con algo para mostrar al final**.

## 2. Dónde está Gambeta

**Lo que ya tenemos y ellos no**

- Las dos mecánicas juntas: el draft (lo de 7A0) y la carrera (lo de El Ídolo), en un solo sitio.
- 3.334 jugadores reales, 206 planteles, 36 equipos históricos argentinos de los últimos 35 años.
  7A0 tiene selecciones; nosotros tenemos el Vélez del 94 y los Boca de Bianchi.
- Libertadores y Sudamericana que se clasifican, no se eligen.

**Lo que nos falta**

| | |
|---|---|
| La comparación con una leyenda al final de la carrera | Es *la* captura de El Ídolo, y no la tenemos |
| Estar en la conversación | La nota de Diario Huarpe se llama "Qué son Copero y El Ídolo". No figuramos |
| Que la ficha se comparta | `ficha_descargada`: **1 usuario en dos días**. `compartido`: 3 |
| Formato de imagen | La ficha sale 1080×1920, que sirve para historias de Instagram y se recorta feo en X |

## 3. El plan

### A · Las fichas: una sola no alcanza

Es lo que pediste y es lo correcto: la ficha final es el anuncio. Tres cosas.

**A.1 · La comparación con una leyenda.** Al colgar los botines, la ficha tiene que decir a quién
te pareciste, calculado con los números de la carrera (goles, títulos, clubes, años, posición) y
contra jugadores reales de nuestra base. "Te pareciste a Riquelme" es infinitamente más
compartible que "12 títulos". Es lo que hace El Ídolo y es la razón de sus capturas.

**A.2 · El formato correcto por red.** Hoy hay una sola medida, 1080×1920, pensada para historias.

| Red | Medida | Para qué |
|---|---|---|
| X, WhatsApp en el chat | 1200×675 | La que se ve entera en la línea de tiempo, sin recorte |
| Instagram y feed | 1080×1080 | Cuadrada |
| Historias | 1080×1920 | La que ya existe |

**A.3 · Fichas distintas según lo que pasó.** Una carrera que terminó campeón del mundo y una que
terminó en el Ascenso no merecen la misma placa. Variantes por hito: campeón del mundo, Balón de
Oro, campeón de América, ídolo de un solo club, el que la rompió en Europa, el que se quedó.
Y en el draft: el 11 armado, el torneo ganado, la Libertadores.

### B · El circuito en X, copiado de Copero

No hace falta inventar nada. Lo que hacen ellos, en orden:

1. **Buscar y citar a todo el que publique su carrera o su 11.** Es el trabajo principal. Un cron
   que busca menciones de gambetafutbol.games, capturas del sitio y la palabra Gambeta con
   contexto de fútbol, y arma la cita para aprobar.
2. **Nombrar gente del ambiente.** Periodistas y streamers de fútbol argentino, en tono de
   desafío, no de pedido. Una por semana, no una por día.
3. **Publicar los bugs propios con humor** cuando aparezcan. Cuesta cero y rinde.
4. **Mostrar la trastienda**: cómo se armó la base histórica, por qué el Vélez del 94 tiene esos
   OVR, qué se rompió esta semana.

Las 8 respuestas diarias que ya corren se quedan, pero bajan de prioridad: traen 7 sesiones cada
dos días. El circuito de citas es lo que mueve la aguja.

### C · Prensa

Copero salió en televisión y El Ídolo en Minuto Uno, MDZ, El Destape, Cultura Geek y Diario
Huarpe. Todas esas notas son del mismo molde: qué es, cómo se juega, por qué es viral.

El ángulo que ellos no tienen: **Gambeta es el único con los equipos históricos argentinos
reales**, cruzados contra tres fuentes. El Vélez del 94, el Boca de Bianchi, el Estudiantes de
Verón. Eso es una nota en sí misma, y es contenido que a un periodista de fútbol le sirve.

### D · Lo que no vamos a hacer

- No pelear con 7A0 en selecciones: ese terreno ya está tomado y es global.
- No subir el volumen de respuestas automáticas. El problema no es la cantidad, es que nadie
  entra.
- No abrir Instagram ni TikTok hasta que la ficha se comparta sola. Un canal más sin contenido
  que valga la pena compartir es más trabajo por el mismo cero.

## 4. Orden de ejecución

1. La comparación con una leyenda en la ficha de carrera. *(lo que más rinde por línea de código)*
2. Formato 1200×675 para X y WhatsApp.
3. Fichas por hito.
4. El cron de citas en X.
5. La nota de prensa sobre los equipos históricos.

## 5. Cómo sabemos si funcionó

Hoy: `ficha_descargada` 1 usuario, `compartido` 3, Organic Social 7 sesiones en dos días.

A las dos semanas queremos ver `compartido` arriba del 5 % de los que terminan un draft o una
carrera, y Organic Social arriba de 50 sesiones semanales. Si la ficha no se comparte, el resto
del plan no importa.
