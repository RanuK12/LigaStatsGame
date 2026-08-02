# Tracción — qué dicen los números del 31 jul y 1 ago, y qué hacer

Leído de Google Analytics (propiedad Gambeta, 2026-08-02).

## 1. Los números

**31 jul – 1 ago · 323 usuarios · 381 sesiones**

| | |
|---|---|
| Sesiones con interacción | 70,1 % |
| Tiempo medio por sesión | 2 min 52 s |
| Eventos por sesión | 9,78 |

**De dónde vienen** (sesiones)

| Canal | Sesiones | % |
|---|---|---|
| Organic Search | 324 | **85,0 %** |
| Direct | 46 | 12,1 % |
| Organic Social | 7 | 1,8 % |
| Referral | 3 | 0,8 % |

**Qué hacen** (usuarios que dispararon cada evento)

| Evento | Usuarios | % de 323 |
|---|---|---|
| page_view | 321 | 99 % |
| first_visit | 287 | **88,9 %** |
| draft_iniciado | 92 | 28,5 % |
| draft_completado | 50 | 15,5 % |
| torneo_simulado | 47 | 14,6 % |
| carrera_iniciada | 46 | 14,2 % |
| ranking_visto | 13 | 4,0 % |
| compartido | 3 | **0,9 %** |
| dato_tirado | 2 | 0,6 % |
| donacion_click | 1 | 0,3 % |
| reto_diario_jugado | 1 | **0,3 %** |

**Por página**

| Página | Usuarios | Tiempo |
|---|---|---|
| `/` | 299 | 30 s |
| `/draft/` | 179 (57 %) | 2 min 49 s |
| `/carrera/` | 104 (33 %) | 3 min 41 s |
| `/daily/` | 24 (7,7 %) | 58 s |
| `/leaderboard/` | 17 | 42 s |
| `/datos/` | 6 | 9 s |

**28 días**: 927 usuarios activos, **928 usuarios nuevos**.

**Por dispositivo** (28 días)

| | Usuarios | Eventos clave | Clave por usuario |
|---|---|---|---|
| Escritorio | 459 | 94 (80 %) | 0,205 |
| Móvil | 471 | 23 (20 %) | **0,049** |

## 2. Lo que sale de ahí

**Lo que mejoró.** El trabajo de retención de la semana pasada funcionó: el 15,5 % de los
visitantes termina un draft, contra el 2,7 % de la medición anterior. Los 50 que lo terminan
hacen 4,6 drafts cada uno. Adentro de la sesión el juego engancha.

**Lo que no.** 928 usuarios nuevos y 927 activos en 28 días: **nadie vuelve**. Y el mecanismo
que existe para que vuelvan —el reto diario— lo jugó **una persona en dos días**.

**El canal es Google, no X.** 324 sesiones de búsqueda contra 7 de redes en dos días. Todo el
esfuerzo de outreach en X mueve el 1,8 % del tráfico. Google mueve el 85 %.

**Móvil rinde cuatro veces menos.** Mitad del público, un quinto de los eventos clave.

## 3. Los agujeros que encontré revisando

| # | Qué | Efecto |
|---|---|---|
| 1 | **Search Console no estaba dado de alta** | El 85 % del tráfico venía de Google y no había forma de saber por qué búsquedas |
| 2 | **`sitemap.xml` da 404** y `robots.txt` lo anuncia | Google descubre las páginas de casualidad |
| 3 | **No hay `og:image`** en ninguna página | Todo link compartido sale como texto pelado en WhatsApp, X y Facebook |
| 4 | `twitter:card` es `summary`, no `summary_large_image` | Aun con imagen, saldría en miniatura |
| 5 | **No hay canonical ni `metadataBase`** | Riesgo de contenido duplicado, y `og:url` ausente |
| 6 | **No hay JSON-LD** | Sin datos estructurados no hay resultados enriquecidos |
| 7 | **El reto diario está a dos clics** | El home lleva a `/daily`, que es una página de descripción con otro botón |
| 8 | El commit de UTM quedó sin subir | Lo compartido no se puede atribuir |

Los puntos 3, 4 y 5 explican en parte por qué compartir no trae a nadie: el 0,9 % que comparte
está mandando un link que se ve mal.

## 4. Plan

Ordenado por tamaño de palanca, no por facilidad.

### A · SEO — el canal que ya trae el 85 %

Es el único canal con volumen real y el único que compone. Cada arreglo acá se multiplica por
las 970 sesiones semanales que ya llegan solas.

1. Verificar Search Console (archivo HTML en la raíz) y enviar el sitemap.
2. `app/sitemap.ts` de verdad, con las 11 rutas y sus prioridades.
3. `metadataBase` + canonical por ruta.
4. `og:image` de 1200×630 y `twitter:card: summary_large_image`.
5. JSON-LD: `WebSite` con `SearchAction` y `VideoGame` para el juego.

### B · Que compartir se vea

Con `og:image` puesto, el link compartido pasa de texto pelado a una placa. No cambia el
número de gente que comparte, cambia cuánta gente hace clic en lo compartido.

### C · El bucle de vuelta

El botón del home tiene que llevar **directo a jugar el reto**, no a una página que lo describe.
`/daily` se queda para el que quiere el detalle, pero deja de ser peaje.

### D · Móvil

Auditoría real a 390×844 y arreglar lo que corte el embudo. Es la mitad del público rindiendo
a un cuarto.

## 5. Marketing — dónde poner el esfuerzo

Los números dicen que la distribución de esfuerzo actual está al revés.

| Canal | Lo que trae hoy | Qué hacer |
|---|---|---|
| **Google** | 85 % | Todo lo de la sección A. Es donde está el crecimiento |
| Directo | 12 % | Es gente que vuelve a escribir la URL: se sostiene con retención, no con marketing |
| X | 1,8 % | Mantener los 8 replies diarios, pero dejar de tratarlo como el canal principal |
| Facebook | 10 usuarios en 7 días | Igual |

La conclusión incómoda: **el marketing que funciona es que las páginas existan y estén bien
indexadas**, no los posteos. Argentina son 756 de los 927 usuarios, así que el idioma y el
recorte del contenido están bien apuntados.

## 6. Criterio de éxito

- `sitemap.xml` devuelve 200 y está enviado en Search Console.
- Un link de Gambeta pegado en WhatsApp muestra placa con imagen.
- El botón del reto en el home lleva a jugar en un clic.
- Search Console empieza a acumular búsquedas para decidir qué contenido escribir después.
