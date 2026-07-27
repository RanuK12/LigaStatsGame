# Plan: modo carrera v2

Escrito el 2026-07-27. Marca qué se hizo y qué queda, en orden de impacto.

## Hecho

### Titularidad, lesiones y declive real

- **La titularidad se gana.** Antes todos jugaban 28-42 partidos desde el primer año, incluso un
  pibe de 17 recién subido a River. Ahora sale de la brecha entre tu OVR y la fuerza del club,
  la edad y si es tu primer año ahí. Medido: un OVR 60 en River juega 6-8 partidos; el mismo 60
  en Banfield, 10-16; un OVR 78 en Banfield, 29. El año que pasás a titular se avisa una sola
  vez con un cartel.
- **Lesiones** con riesgo creciente por edad (6% a los 28, hasta 55% pasados los 34). Una lesión
  seria te recorta más de la mitad de la temporada y deja secuela de −2 OVR.
- **Declive**: hasta los 31 se afloja de a poco; de 32 a 34 se cae −2/−3 por año, y pasados los
  35 −3/−4. Medido en una carrera: OVR 88 a los 28 → 55 a los 39.
- **Goles según el club**: en un equipo que ataca bien te llegan más pelotas. Un delantero en un
  grande convierte ~30% más que el mismo jugador en un club chico.

### Torneos

- Copa Libertadores anunciada al clasificar (solo cuando subís desde la Sudamericana) y visible
  como fase mientras corre la temporada.
- Mundial de Clubes: se entra ganando la continental, se juega al año siguiente, tiene su cartel,
  su trofeo y su lugar en el historial.
- Títulos recalibrados: de 11-13 por carrera a una mediana de 7, con carreras que terminan sin
  ninguno.

### Techo de talento

Cada carrera sortea al nacer un techo que queda fijo: normal (78%, tope 85), destacado (18%,
tope 89), generacional (4%, tope 97). Resultado: 3% de las carreras llega a 90+. Antes era 0%.

---

## Pendiente

### 1. El Mundial, simulado aparte (lo más grande)

Hoy la Selección es una línea de texto: te convocan, sumás caps y goles, y si sale campeón se
marca el hito. Falta que el Mundial **se juegue**.

**Cómo debería funcionar**

- Cada 4 años (2026, 2030, 2034...) si estás convocado, entre la fase de la copa continental y
  el cierre aparece el **Mundial** como fase propia del progreso de temporada.
- Se simula el recorrido: fase de grupos → octavos → cuartos → semi → final, con rival y
  resultado en cada cruce. El mini resumen dice hasta dónde llegaron y contra quién quedaron
  afuera ("Eliminados en cuartos por Francia 1-2").
- **Tu participación depende de la fuerza de la Selección y de tu OVR relativo:**

  | Tu OVR vs el nivel de tu selección | Rol | Minutos |
  |---|---|---|
  | +6 o más | Figura del equipo | todos los partidos, más goles |
  | −4 a +5 | Titular | casi todos |
  | −12 a −5 | Alternativa | entra desde el banco |
  | −13 o menos | Convocado | 1-2 partidos sueltos |

- Selecciones con su propia fuerza: Argentina/Brasil/Francia ~88, el segundo pelotón ~80, el
  resto 70-78. Si sos argentino y tu OVR es 75, vas a ir al banco; con 88 sos titular. Si sos de
  una selección chica, con 80 ya sos la figura, pero el equipo llega menos lejos.
- **Ganarlo tiene animación propia** (más grande que el estallido común) y deja el hito.
- **Consecuencias medidas**: un buen Mundial (titular + goles + llegar lejos) sube la chance de
  que te vengan a buscar de Europa y da un plus de OVR. Un Mundial flojo no resta, pero no suma.

**Trabajo**: tabla de selecciones con su fuerza, simulador de cruces reutilizando la lógica de
copa que ya existe en `lib/game-engine.ts`, panel de resumen del Mundial, animación de campeón,
y enganche con las ofertas europeas. Un día y medio.

### 2. Carrera larga: hasta los 40 en vez de 15 temporadas

Hoy la carrera termina a las 15 temporadas sin importar la edad. Debería poder elegirse:

- **Clásica**: 15 temporadas (como ahora).
- **Hasta el retiro**: seguís hasta los 40, o hasta que el OVR baje de 60 y ningún club te
  quiera. Con las lesiones y el declive ya implementados, los últimos años se sienten como el
  final real de un futbolista.
- En la carrera larga hacen falta **eventos de veterano**: la renovación que no llega, el club
  que te ofrece ser ayudante de campo, la vuelta al club de los inicios, la lesión que casi te
  retira, el llamado para ser capitán.

**Trabajo**: opción en el wizard, `MAX_SEASONS` variable, 6-8 eventos nuevos de veterano. Medio
día.

### 3. Escala de ofertas del exterior

Ya no hay cifras absurdas, pero el salto a Europa podría estar mejor escalonado: primero clubes
medianos (Portugal, Países Bajos, Italia media tabla), y recién con un Mundial o una Libertadores
encima llegan Madrid, City o Bayern. Hoy puede saltar directo a un grande.

**Trabajo**: escalones de club europeo por prestigio acumulado. Medio día.

---

## Criterio para todo

Nada se agrega sin medirlo. Cada cambio de balance se audita con 100-200 carreras simuladas
antes de darlo por bueno, como se hizo con el techo de talento y los traspasos. Los invariantes
quedan fijados en `__tests__/career-balance.test.ts`.
