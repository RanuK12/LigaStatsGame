# La previsualización de los links compartidos — lo que hay que hacer

## El problema, medido

Del 7 al 13 de agosto de 2026: 13 personas compartieron algo y `/c/` —la página que recibe al que
abre un link de una carrera— tuvo **1 vista**. La campaña `carrera_share` no aparece en el informe
de adquisición y `carrera_link_visto` no registró un solo evento en 28 días.

Una de las causas se ve pegando cualquier link en WhatsApp: como el sitio es un export estático en
GitHub Pages, `/c/` y `/e/` sirven el mismo título y la misma imagen para todas las carreras y
todos los equipos. El que recibe ve una tarjeta gris que no dice nada de la persona que se la
mandó.

## Por qué hace falta Cloudflare

GitHub Pages sirve archivos y nada más: no puede leer el parámetro del link ni cambiar el `head`
según quién lo comparte. Se necesita algo que corra en el medio. Cloudflare Workers es gratis en
el plan free y ya hay cuenta (la misma de los túneles `ranuk-data` y `ranuk-scan`).

El sitio **se queda en GitHub Pages**. Cloudflare solo pasa a ser el DNS y el que reescribe cuatro
etiquetas en dos rutas.

## Lo que tiene que hacer Emilio (una vez)

El dominio está en **name.com** con los nameservers de ellos. La migración es cambiar de
nameservers, y eso pide una cuenta y una firma: por eso va con tu mano.

1. En Cloudflare: **Add a site** → `gambetafutbol.games` → plan **Free**.
2. Cloudflare escanea y te muestra los registros actuales. **Verificá que estén los cuatro A de
   GitHub Pages** (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) y el CNAME
   de `www`. Si falta alguno, agregalo antes de seguir: sin esos registros el sitio se cae al
   cambiar los nameservers.
3. Todos los registros que apunten al sitio van en **DNS only** (nube gris), MENOS el de la raíz,
   que va **proxied** (nube naranja): sin proxy el Worker no puede interceptar nada.
4. En name.com: cambiar los nameservers por los dos que te da Cloudflare.
5. Esperar la propagación (suele ser menos de una hora, el máximo son 24).
6. Comprobar que el sitio sigue vivo: `curl -sI https://gambetafutbol.games/ | head -3`.

## Lo que se despliega después

El Worker está escrito en `workers/preview.js` de este repo.

```bash
npx wrangler deploy workers/preview.js --name gambeta-preview \
  --compatibility-date 2026-01-01 \
  --route "gambetafutbol.games/c/*" --route "gambetafutbol.games/e/*"
```

Qué hace: lee el parámetro del link (viaja en la query justamente para que se pueda leer desde el
borde), y reescribe `og:title`, `og:description` y `og:image` con lo que hay adentro. El HTML
sigue siendo el del sitio; el juego no se entera.

Con eso, un link de una carrera pasa de

> **Gambeta ⚽ El Juego del Fútbol Argentino** · Armá tu 11 ideal, viví tu carrera…

a

> **Thiago Fernández se pareció a Riquelme** · 15 temporadas · 84 de OVR · 6 títulos. Creá la tuya
> en Gambeta, gratis y sin registrarte.

## Cómo se comprueba que sirvió

1. Técnico, en el momento: pegar un link de `/c/` en el validador de tarjetas de X y en un chat de
   WhatsApp propio. El título tiene que traer el nombre del jugador.
2. Real, a los 14 días: **vistas de `/c/` y `/e/`** en Analytics, hoy 1 por semana entre las dos, y
   los eventos `carrera_link_visto` y `equipo_link_visto`, hoy en cero. Si después de esto siguen
   en cero, el problema no es la previsualización y hay que dejar de invertir acá: querría decir
   que lo que viaja es la imagen y no el link, y entonces lo que falta es la URL adentro de la
   placa.

## Lo que queda para después

La imagen sigue siendo una sola para todos, elegida a mano. Armar el PNG al vuelo con la ficha de
esa carrera necesita satori y resvg compilados a wasm dentro del Worker: es la fase siguiente y
solo vale la pena si el paso de arriba mueve el número. El título y la descripción personalizados
ya convierten la tarjeta de genérica en específica, que es la parte barata del efecto.
