# Plan: script de mejora de la base de datos y OVR real

Objetivo: que cada jugador tenga un **OVR que corresponda a su nivel real** y que la base
esté **limpia y actualizada** (club actual correcto, sin duplicados, sin anacronismos,
planteles completos). Hoy los OVR salen del scraping original (inflados) + un boost de
Wikidata; no hay una fuente autoritativa del "rating".

---

## 0. Diagnóstico actual

- **2.956 jugadores** (post-dedup por acento). ~37 con OVR ≥85 (ya desinflado).
- OVR = mezcla de scraping original (inflado, sobre todo jugadores de liga local a 85-87)
  + recompute Wikidata "solo-sube" + deflación 0.5 del top.
- Problemas conocidos: transferencias desactualizadas (un jugador figura en un club que ya
  dejó), OVR que no refleja el rendimiento real, cobertura de stats parcial (~38% Wikidata).
- Limitación madre: **no tenemos una fuente de rating autoritativa cableada**. SoFIFA (FIFA/EA
  FC) está bloqueado por Cloudflare vía `curl`.

---

## 1. Fuente de verdad del OVR (la decisión clave)

Prioridad de fuentes, de mejor a peor:

1. **FIFA / EA FC (SoFIFA)** — es el OVR que la gente reconoce y espera. Dos vías:
   - **Dataset público** (Kaggle "FIFA 15-24 complete player dataset" o mirrors en GitHub):
     CSV con `short_name`, `club`, `overall`, `age`, `nationality`, `player_positions`,
     `value_eur` por versión de FIFA. Es la vía más limpia y masiva. Requiere descargar el
     CSV una vez (Kaggle CLI con token, o un mirror raw en GitHub).
   - **SoFIFA en vivo** vía navegador real (Chrome automation, que pasa Cloudflare) o
     ScrapingBee/proxy. Más frágil y lento; solo si el dataset no alcanza.
2. **Transfermarkt** — no da "OVR" pero sí **valor de mercado real**, **club actual** y stats
   por temporada (PJ, goles, minutos). Ideal para (a) corregir el club actual y (b) derivar
   un OVR proxy cuando FIFA no tiene al jugador (juveniles/ascenso argentino).
3. **Wikidata** (ya cableado) — caps/goles estructurados, ~38% cobertura. Complemento.

**Recomendación:** dataset FIFA como base + Transfermarkt para el fútbol argentino de ascenso
y transferencias recientes + Wikidata como relleno.

---

## 2. Matching (jugador nuestro ↔ fuente)

Clave para no asignar el OVR del homónimo equivocado.

- Normalizar nombre (NFD, sin acentos, minúsculas) — ya tenemos `norm()`.
- Match por **nombre + (club actual O nacionalidad O año de nacimiento)**. Si hay varios
  candidatos, desempatar por posición y club.
- Guardar un **score de confianza**; los de baja confianza van a una lista para revisión
  manual, no se pisan a ciegas.
- Cachear el mapeo (`data/ovr-source-cache.json`) para que sea idempotente y resumible.

---

## 3. Cálculo del OVR final

- **Si hay rating FIFA:** usarlo casi directo (es la referencia), con un pequeño ajuste por
  año para reflejar la evolución (FIFA por temporada). Cap 99, leyendas ancladas.
- **Si NO hay FIFA** (juvenil/ascenso): derivar un OVR proxy por fórmula, ya conocida y
  balanceada:
  - Base por nivel de rendimiento (goles/asistencias por posición, o vallas invictas para
    arqueros/defensores) relativo a la expectativa de su posición.
  - Ajuste por nivel del club (jugar en River pesa más que en un club chico).
  - Ajuste por caps de selección (señal de élite).
  - Respetar el **tope por edad** (`ovrCapForAge`: <19 máx 72, escala hasta 99).
- **OVR por temporada/edad** (opcional, gran mejora): guardar el arco (como la ficha timeline
  de Copero muestra OVR por edad). Requiere el rating FIFA por versión → mapear a edades.

---

## 4. Limpieza de la base

Reusar/extender los scripts que ya existen:

1. **Dedup** insensible a acentos (hecho: `fix-draft-quality.mjs`). Extender a apodos.
2. **Club actual correcto**: de Transfermarkt (o Wikidata P54 con qualifier de fecha),
   actualizar el club vigente y las fechas de cada etapa.
3. **Re-poda de squads** sin tolerancia +1 (hecho): un jugador solo en el plantel del año que
   realmente pertenece.
4. **Completitud de planteles**: agregar los jugadores reales que falten por temporada
   (backfill ya existe: `backfill-squads-full.mjs`), recalculando tras actualizar clubes.
5. **Anacronismos**: podar jugadores en temporadas fuera de su etapa (ya existe).

---

## 5. Validación (para saber que quedó bien)

- **Distribución**: chequear la pirámide de OVR (pocos 90+, muchos 70-78). Objetivo: ~15-25
  jugadores 88+, ~40-60 en 85+.
- **Muestra aleatoria** contra Wikidata/FIFA (ya existe `verify-vs-wikidata.mjs` para posición;
  extender a rating: comparar nuestro OVR con el de la fuente en N jugadores random).
- **Spot-check** de jugadores conocidos (Messi, Di María, Armani, un pibe de ascenso) y de los
  casos que reportó el usuario (Zenón, etc.).
- **Refs de squad**: 0 rotas, tamaño min/prom/max razonable.

---

## 6. Ejecución (cómo se corre)

1. `scripts/data/fetch-fifa-ratings.mjs` — baja/parsea el dataset FIFA (o SoFIFA vía navegador)
   → `data/ovr-source-cache.json`. Cacheado, resumible, rate-limited.
2. `scripts/data/fetch-transfermarkt.mjs` (opcional) — club actual + valor + stats por
   temporada para el fútbol argentino. Cacheado.
3. `scripts/data/apply-real-ovr.mjs` — matchea, calcula el OVR final (FIFA directo / proxy /
   Wikidata), actualiza club y valor, con **backup previo** de `players.json`.
4. `scripts/data/fix-draft-quality.mjs` (ya existe) — dedup + re-poda + deflación de respaldo.
5. `npm run build:data` — regenera derivados.
6. Validación + reporte.

Todo con **backup** (`.bak`), **idempotente** (caché) y **verificable** (reporte de
distribución + muestra). Nada se corre en masa sin una muestra chica primero.

---

## 7. Riesgos y decisiones para Emilio

- **Fuente FIFA**: ¿bajamos el dataset de Kaggle (necesito el token de Kaggle o un mirror), o
  scrapeo SoFIFA con el navegador (más lento/frágil)? Esta es la decisión que destraba todo.
- **Ascenso argentino / juveniles**: FIFA no los cubre bien → dependen del proxy o
  Transfermarkt. El OVR de esos será "estimado", no oficial.
- **OVR por año**: si queremos el arco por edad (como Copero), es más trabajo pero es la mejor
  versión. Se puede hacer en una 2da pasada.
