#!/usr/bin/env node
// merge-historical.mjs — fusiona players_historical.json (scrapeado de Transfermarkt) y
// squads_historical.json dentro de players.json / squads.json del juego, SIN pisar los curados.
// Datos reales: nombre, posicion (enum), nacionalidad, valor de mercado, rating (derivado del valor),
// clubs. Lo desconocido (caps/goles exactos) queda en 0 — NO se inventa. height/weight son placeholders
// neutros (flavor irrelevante para el draft). Hace backup antes de escribir.
//
// Uso: node scripts/merge-historical.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const read = (f) => { try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); } catch { return null; } };
const arr = (d) => (Array.isArray(d) ? d : (d && d.players) ? d.players : []);

function decadeOf(clubs) {
  let min = 9999;
  for (const c of clubs || []) {
    for (const y of String(c.years || '').split(/[,\s-]+/)) {
      const n = parseInt(y, 10);
      if (n && n < min) min = n;
    }
  }
  return min === 9999 ? '' : `${Math.floor(min / 10) * 10}s`;
}

function activeYearsOf(clubs) {
  const ys = [];
  for (const c of clubs || []) for (const y of String(c.years || '').split(/[,\s-]+/)) { const n = parseInt(y, 10); if (n) ys.push(n); }
  if (!ys.length) return '';
  return `${Math.min(...ys)}-${Math.max(...ys)}`;
}

// Convierte un player scrapeado (minimo) a un record completo del schema del juego.
function toFull(s) {
  const clubs = (s.clubs && s.clubs.length) ? s.clubs : [{ id: 'desconocido', name: 'Desconocido', years: '' }];
  const rating = Math.max(40, Math.min(99, Math.round(s.rating || 55)));
  return {
    id: s.id,
    name: s.name,
    fullName: s.name,
    birthDate: '',
    position: s.position || 'CM',
    positions: [s.position || 'CM'],
    nationality: s.nationality || 'Argentina',
    height: 1.78,          // placeholder neutro (no usado en el draft)
    weight: 75,            // placeholder neutro
    preferredFoot: 'Derecho',
    clubs,
    capsNationalTeam: 0,   // desconocido (no inventado)
    goalsNationalTeam: 0,
    capsClub: 0,
    goalsClub: 0,
    assistsClub: 0,
    trophies: [],
    image: '',
    marketValue: s.marketValue || '',
    activeYears: activeYearsOf(clubs),
    decade: decadeOf(clubs),
    rating,
    legendary: rating >= 88,
    source: 'transfermarkt',
  };
}

function main() {
  const existing = arr(read('players.json'));
  const scraped = arr(read('players_historical.json'));
  if (!scraped.length) { console.error('No hay players_historical.json (¿el scrape no terminó?)'); process.exit(1); }

  // backup
  fs.writeFileSync(path.join(DATA, `players.backup-${Date.now()}.json`), JSON.stringify(existing));

  const byId = new Map(existing.map((p) => [p.id, p]));
  let added = 0, enriched = 0;
  for (const s of scraped) {
    if (!s.id) continue;
    if (byId.has(s.id)) {
      // ya existe (curado) -> enriquecer clubs faltantes, NO pisar lo curado
      const cur = byId.get(s.id);
      const have = new Set((cur.clubs || []).map((c) => c.id));
      for (const c of (s.clubs || [])) if (!have.has(c.id)) { cur.clubs.push(c); enriched++; }
    } else {
      byId.set(s.id, toFull(s));
      added++;
    }
  }
  const merged = [...byId.values()];
  fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify(merged, null, 1));
  console.log(`players.json: ${existing.length} -> ${merged.length} (+${added} nuevos, ${enriched} clubs enriquecidos)`);

  // squads
  const exSquads = arr(read('squads.json'));
  const histSquads = arr(read('squads_historical.json'));
  if (histSquads.length) {
    const sById = new Map(exSquads.map((q) => [q.id, q]));
    let sAdded = 0;
    for (const q of histSquads) {
      const id = q.id || `${q.clubId}_${q.season}`;
      if (!sById.has(id)) {
        sById.set(id, { id, clubId: q.clubId, season: String(q.season), competition: q.competition || 'Liga Profesional', label: q.label || `${q.clubName || q.clubId} ${q.season}`, playerIds: q.playerIds || [] });
        sAdded++;
      }
    }
    const mergedSquads = [...sById.values()];
    fs.writeFileSync(path.join(DATA, 'squads.json'), JSON.stringify(mergedSquads, null, 1));
    console.log(`squads.json: ${exSquads.length} -> ${mergedSquads.length} (+${sAdded})`);
  }
}

main();
