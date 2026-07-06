# LigaStatsGame Data Pipeline

## Archivos principales

- `clubs.json`
- `players.json`
- `squads.json`

## Raw data

- `raw/transfermarkt`
- `raw/bdfa`

## Curated data

- `curated/`

## Reports

- `reports/dataset-audit.json`
- `reports/dataset-audit.md`

## Comandos

- `npm run audit:data`
- `npm run normalize:data`

## Reglas de calidad

- Player debe tener `id`, `name`, `position`, `positions`, `rating`
- Squad debe tener mínimo 11 jugadores
- Squad debe tener arquero
- Squad debe tener defensores, medios y delanteros
- Ratings deben estar entre 40 y 99
