# Automatizaciones: qué puede tocar este repo y qué no

## Regla

**Ningún proceso automático escribe en `data/`.** La base de jugadores es curada: sale de un
cruce con el dataset FIFA + Wikidata + correcciones a mano (OVR real, 35 leyendas con foto,
170 planteles). Un scraper que falla a medias la puede destruir en un commit.

## Qué pasó (2026-07-27)

El workflow `Weekly Data Update` corrió con el scraper fallando parcialmente. Los scripts
reescribieron `data/players.json` igual y el job commiteó **285 jugadores, 0 leyendas y
`squads.json` vaciado**, borrando el OVR real, las fotos y los planteles. El sitio quedó en
vivo con esa base hasta que se restauró.

## Qué se hizo

1. **`Weekly Data Update` eliminado.** No hay ningún workflow que haga `git push` a este repo.
2. **`deploy.yml` tiene `contents: read`**: aunque quisiera, no puede escribir en el repo. Solo
   construye y publica en Pages.
3. El launchd local `com.ranuk.ligastats-scrape.plist` está **desactivado** (`.disabled`) y
   ningún cron ni agente del bot toca este directorio.

## Si alguna vez hace falta actualizar los datos

A mano, corriendo los scripts y **revisando el resultado antes de commitear**:

```bash
node scripts/data/fetch-fifa-dataset.mjs   # dataset FIFA -> data/fifa-index.json
node scripts/data/match-fifa.mjs           # matching con score de confianza
node scripts/data/apply-real-ovr.mjs       # OVR + fechas + valor (hace backup .bak)
node scripts/data/fetch-legend-photos.mjs  # fotos de leyendas
npm run build:data && npm run audit:data   # derivados + auditoría
```

Antes de commitear, la base tiene que cumplir estos mínimos (si no, algo se rompió):

- **≥ 2500 jugadores** en `data/players.json`
- **≥ 150 planteles** en `data/squads.json`
- **≥ 30 leyendas** (`legendary: true`)
- todos los `rating` numéricos
- `npm run audit:data` sin refs de squad rotas

Comprobación rápida:

```bash
node -e "
  const p = require('./data/players.json'), s = require('./data/squads.json');
  const l = p.filter(x => x.legendary).length;
  console.log(p.length + ' jugadores, ' + s.length + ' planteles, ' + l + ' leyendas');
  if (p.length < 2500 || s.length < 150 || l < 30) { console.error('BASE INVÁLIDA — no commitear'); process.exit(1) }
"
```
