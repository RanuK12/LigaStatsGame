#!/usr/bin/env python3
"""
Script de auditoría y corrección profunda del dataset.
- Verifica cada squad contra Transfermarkt
- Detecta jugadores de clubes erróneos
- Limpia y reconstruye los datos correctamente
"""
import json, os, re, time, random, urllib.request, urllib.error, hashlib

B = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(B, '..', 'data')
C = os.path.join(D, 'cache')
os.makedirs(C, exist_ok=True)

UA = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
]

PM = {
    'goalkeeper':'GK','centre-back':'CB','left-back':'LB','right-back':'RB',
    'defensive midfield':'CDM','central midfield':'CM','attacking midfield':'CAM',
    'left winger':'LW','right winger':'RW','centre-forward':'ST','second striker':'CF',
    'portero':'GK','defensa central':'CB','lateral izquierdo':'LB','lateral derecho':'RB',
    'pivote':'CDM','mediocentro':'CM','mediocentro ofensivo':'CAM',
    'extremo izquierdo':'LW','extremo derecho':'RW','delantero centro':'ST','mediapunta':'CF',
    'interior izquierdo':'CM','interior derecho':'CM','delantero':'ST'
}

def sl(n):
    s = n.lower().replace(' ','-').replace('.','').replace("'",'')
    for a, b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n')]:
        s = s.replace(a, b)
    return s

def fetch(url, cache_key, force=False):
    cp = os.path.join(C, hashlib.md5(cache_key.encode()).hexdigest() + '.html')
    if not force and os.path.exists(cp) and os.path.getmtime(cp) > time.time() - 86400*7:
        return open(cp, errors='ignore').read()
    time.sleep(random.uniform(1.2, 2.5))
    for i in range(3):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': random.choice(UA),
                'Accept': 'text/html',
                'Accept-Language': 'es-AR,es;q=0.9',
                'Referer': 'https://www.transfermarkt.com/'
            })
            r = urllib.request.urlopen(req, timeout=20)
            h = r.read().decode('utf-8', errors='ignore')
            if len(h) > 1000:
                open(cp, 'w').write(h)
            return h
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                time.sleep(30 + random.uniform(0, 20))
            else:
                time.sleep(5 * (i+1))
        except Exception:
            time.sleep(5 * (i+1))
    return ''

def parse_squad(html):
    """Parse squad players from TM HTML."""
    players = []
    start = html.find('<table class="items">')
    if start == -1:
        return players
    # Find end of table
    pos = start + 21
    depth = 1
    while depth > 0 and pos < len(html):
        next_open = html.find('<table', pos)
        next_close = html.find('</table>', pos)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            pos = next_open + 6
        else:
            depth -= 1
            pos = next_close + 8
    table_html = html[start:pos]

    rows = re.split(r'<tr[^>]*class="(?:odd|even)"[^>]*>', table_html)
    for row in rows[1:]:
        nm = re.search(
            r'class="hauptlink"[^>]*>\s*<a[^>]*href="(?P<href>[^"]+)"[^>]*>\s*(?P<name>[^<]+?)\s*</a>'
            r'\s*</td>\s*</tr>\s*<tr>\s*<td>\s*(?P<pos>[^<]+?)\s*</td>',
            row, re.DOTALL
        )
        if not nm:
            continue
        name = nm.group('name').strip()
        pos_str = nm.group('pos').strip().lower()
        pos = 'CM'
        for k, v in PM.items():
            if k in pos_str:
                pos = v
                break
        mv = ''
        mvm = re.search(r'class="rechts[^"#]*"[^>]*>\s*(?:<a[^>]*>)?\s*([\d,.]+[kmK])', row)
        if mvm:
            mv = mvm.group(1).strip()
        nat = 'Argentina'
        imgs = re.findall(r'<img\s+[^>]*class="flaggenrahmen"[^>]*>', row)
        if imgs:
            alt = re.search(r'alt="([^"]+)"', imgs[0])
            if alt:
                nat = alt.group(1).strip()
        players.append({'id': sl(name), 'name': name, 'pos': pos, 'nat': nat, 'mv': mv})
    return players

def rating(mv, pos):
    v = 0
    if mv:
        ms = mv.lower().replace(',', '.')
        try:
            if 'k' in ms: v = float(ms.replace('k','')) / 1000
            elif 'm' in ms: v = float(ms.replace('m',''))
        except: pass
    b = 90 if v>50 else 85 if v>20 else 80 if v>10 else 75 if v>5 else 70 if v>2 else 65 if v>1 else 60 if v>0.5 else 55 if v>0.1 else 52
    adj = {'GK':-2,'CB':0,'LB':1,'RB':1,'CDM':0,'CM':1,'CAM':2,'LW':2,'RW':2,'ST':3,'CF':2}.get(pos, 0)
    return max(50, min(99, b + adj + random.randint(-2, 2)))

# ============================================================
# VERIFIED CORRECT CLUBS (from actual TM HTML search results)
# ============================================================
CORRECT_CLUBS = [
    # [slug, display_name, tm_id, nickname, colors]
    ["club-atletico-river-plate",           "River Plate",       209,   "Millonarios", ["#DC143C","#FFFFFF"]],
    ["boca-juniors",                         "Boca Juniors",      189,   "Xeneizes",    ["#003DA5","#FEDD00"]],
    ["ca-independiente",                     "Independiente",     1234,  "El Rojo",     ["#FF0000","#003DA5"]],
    ["racing-club",                          "Racing Club",       1444,  "La Academia", ["#003DA5","#FFFFFF"]],
    ["club-atletico-san-lorenzo-de-almagro", "San Lorenzo",       1775,  "Cuervos",     ["#003DA5","#FFFFFF"]],
    ["ca-velez-sarsfield",                   "Vélez Sarsfield",   1029,  "El Fortín",   ["#003DA5","#FFFFFF"]],
    ["club-estudiantes-de-la-plata",         "Estudiantes LP",    288,   "Pincha",      ["#FF0000","#003DA5"]],
    ["club-de-gimnasia-y-esgrima-la-plata",  "Gimnasia LP",       1106,  "El Lobo",     ["#003DA5","#FFFFFF"]],
    ["ca-newells-old-boys",                  "Newell's Old Boys", 1286,  "La Lepra",    ["#FF0000","#003DA5"]],
    ["ca-rosario-central",                   "Rosario Central",   1418,  "Canallas",    ["#003DA5","#FEDD00"]],
    ["club-atletico-huracan",                "Huracán",           2063,  "El Globo",    ["#FF0000","#FFFFFF"]],
    ["argentinos-juniors",                   "Argentinos Juniors",1030,  "El Bichito",  ["#FF0000","#FFFFFF"]],
    ["club-atletico-lanus",                  "Lanús",             333,   "El Granate",  ["#8B0000","#FFFFFF"]],
    ["ca-banfield",                          "Banfield",          830,   "El Taladro",  ["#006400","#FFFFFF"]],
    ["ca-talleres",                          "Talleres",          3938,  "Albiazul",    ["#003DA5","#FFFFFF"]],
    ["club-atletico-belgrano",               "Belgrano",          2417,  "El Pirata",   ["#003DA5","#FFFFFF"]],
    ["cd-godoy-cruz-antonio-tomba",          "Godoy Cruz",        12574, "El Tomba",    ["#003DA5","#FFFFFF"]],
]

def verify_id(slug, name, tm_id):
    """Returns True if the TM ID page title contains the club name keywords."""
    url = f'https://www.transfermarkt.com/x/startseite/verein/{tm_id}'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': random.choice(UA)})
        r = urllib.request.urlopen(req, timeout=8)
        html = r.read().decode('utf-8', errors='ignore')
        title_m = re.search(r'<title>(.*?)</title>', html)
        if not title_m:
            return False, 'No title'
        t = title_m.group(1).lower()
        keywords = [w for w in name.lower().split() if len(w) > 3 and w not in ('club','atletico','deportivo')]
        match = any(kw in t for kw in keywords)
        return match, title_m.group(1)
    except Exception as e:
        return None, str(e)

def scrape_club_all_years(slug, name, tm_id, years=range(2015, 2026)):
    """Scrape all seasons for a club, returning {year: [players]}."""
    result = {}
    for yr in years:
        url = f'https://www.transfermarkt.com/{slug}/kader/verein/{tm_id}/saison_id/{yr}/plus/1'
        cache_key = f'VERIFIED_{slug}_{yr}'
        html = fetch(url, cache_key, force=True)  # force fresh download
        if not html or len(html) < 2000:
            print(f'  [{yr}] SKIP (empty)')
            continue
        title_m = re.search(r'<title>(.*?)</title>', html)
        title = title_m.group(1) if title_m else ''
        players = parse_squad(html)
        print(f'  [{yr}] {len(players)} players | title: {title[:60]}')
        result[yr] = players
    return result

def main():
    print('=' * 70)
    print('AUDITORÍA Y CORRECCIÓN PROFUNDA DEL DATASET')
    print('=' * 70)

    # Step 1: Verify all IDs
    print('\n[PASO 1] Verificando IDs en Transfermarkt...')
    wrong_clubs = []
    for slug, name, tm_id, *_ in CORRECT_CLUBS:
        ok, title = verify_id(slug, name, tm_id)
        if ok is True:
            print(f'  ✅ {name} (ID={tm_id}): {title[:60]}')
        elif ok is False:
            print(f'  ❌ {name} (ID={tm_id}): WRONG → {title[:60]}')
            wrong_clubs.append((slug, name, tm_id))
        else:
            print(f'  ⚠️  {name} (ID={tm_id}): {title}')
        time.sleep(0.4)

    if wrong_clubs:
        print(f'\n⛔ CLUBS CON IDs INCORRECTOS: {[n for _,n,_ in wrong_clubs]}')
        print('Por favor corrige los IDs manualmente en CORRECT_CLUBS y vuelve a ejecutar.')
        return

    # Step 2: Load existing data
    print('\n[PASO 2] Cargando datos existentes...')
    with open(os.path.join(D, 'players_historical.json')) as f:
        existing_players = json.load(f)
    with open(os.path.join(D, 'squads_historical.json')) as f:
        existing_squads = json.load(f)

    player_map = {p['id']: p for p in existing_players}
    squad_map = {s['id']: s for s in existing_squads}
    print(f'  Jugadores existentes: {len(player_map)}')
    print(f'  Planteles existentes: {len(squad_map)}')

    # Step 3: Find corrupt squads (non-Argentine clubs)
    print('\n[PASO 3] Detectando planteles corruptos...')
    correct_club_ids = {slug for slug, *_ in CORRECT_CLUBS}
    corrupt_squad_ids = []
    corrupt_player_ids = set()

    for sq in existing_squads:
        club_id = sq['clubId']
        if club_id not in correct_club_ids:
            print(f'  ❌ SQUAD CORRUPTO: {sq["label"]} (clubId={club_id})')
            corrupt_squad_ids.append(sq['id'])
            for pid in sq['playerIds']:
                corrupt_player_ids.add(pid)

    # Also check squads by nationality
    for sq in existing_squads:
        pids = sq['playerIds']
        nat_counts = {}
        for pid in pids:
            p = player_map.get(pid, {})
            nat = p.get('nationality', 'Unknown')
            nat_counts[nat] = nat_counts.get(nat, 0) + 1
        total = sum(nat_counts.values())
        arg_pct = (nat_counts.get('Argentina', 0) / total * 100) if total > 0 else 0
        if arg_pct < 15 and total >= 5:
            print(f'  ❌ SQUAD SOSPECHOSO: {sq["label"]} ({arg_pct:.0f}% ARG, total={total})')
            if sq['id'] not in corrupt_squad_ids:
                corrupt_squad_ids.append(sq['id'])
                for pid in pids:
                    corrupt_player_ids.add(pid)

    print(f'\n  Planteles corruptos: {len(corrupt_squad_ids)}')
    print(f'  Jugadores a eliminar (posiblemente): {len(corrupt_player_ids)}')

    # Only delete players that ONLY appear in corrupt squads
    players_in_good_squads = set()
    for sq in existing_squads:
        if sq['id'] not in corrupt_squad_ids:
            for pid in sq['playerIds']:
                players_in_good_squads.add(pid)

    truly_corrupt_players = corrupt_player_ids - players_in_good_squads
    print(f'  Jugadores SOLO en planteles corruptos (a eliminar): {len(truly_corrupt_players)}')

    # Step 4: Remove corrupt data
    print('\n[PASO 4] Eliminando datos corruptos...')
    clean_squads = [s for s in existing_squads if s['id'] not in corrupt_squad_ids]
    clean_players = [p for p in existing_players if p['id'] not in truly_corrupt_players]
    print(f'  Planteles limpios: {len(clean_squads)} (eliminados: {len(existing_squads)-len(clean_squads)})')
    print(f'  Jugadores limpios: {len(clean_players)} (eliminados: {len(existing_players)-len(clean_players)})')

    # Step 5: Re-scrape corrupt clubs with CORRECT IDs
    print('\n[PASO 5] Re-scrapeando clubes con IDs correctos...')

    # Figure out which clubs had corrupt data
    clubs_to_rescrape = set()
    for sq_id in corrupt_squad_ids:
        # Extract club slug from squad ID (format: "slug_year")
        parts = sq_id.rsplit('_', 1)
        if len(parts) == 2:
            clubs_to_rescrape.add(parts[0])
    # Also add new slug if it was renamed
    renamed_slugs = {
        'aa-argentinos-juniors': 'argentinos-juniors',
    }
    for old, new in renamed_slugs.items():
        if old in clubs_to_rescrape:
            clubs_to_rescrape.discard(old)
            clubs_to_rescrape.add(new)

    new_squad_map = {s['id']: s for s in clean_squads}
    new_player_map = {p['id']: p for p in clean_players}
    added_players = 0
    added_squads = 0

    for club_entry in CORRECT_CLUBS:
        slug, name, tm_id = club_entry[0], club_entry[1], club_entry[2]
        # Re-scrape if this club was corrupt OR if it's a renamed club
        needs_scrape = slug in clubs_to_rescrape
        # Also check if any season is missing
        existing_seasons = {s['season'] for s in new_squad_map.values() if s['clubId'] == slug}
        missing_seasons = [str(y) for y in range(2015, 2026) if str(y) not in existing_seasons]

        if not needs_scrape and not missing_seasons:
            continue

        print(f'\n  Scrapeando {name} (ID={tm_id})...')
        if missing_seasons:
            print(f'    Temporadas faltantes: {missing_seasons}')
        years_to_scrape = [int(y) for y in missing_seasons] if missing_seasons else list(range(2015, 2026))

        club_data = scrape_club_all_years(slug, name, tm_id, years_to_scrape)

        for yr, ps in club_data.items():
            if not ps:
                continue
            sq_id = f'{slug}_{yr}'
            squad_pids = []
            for p in ps:
                pid = p['id']
                if pid not in new_player_map:
                    new_player_map[pid] = {
                        'id': pid, 'name': p['name'], 'position': p['pos'],
                        'nationality': p['nat'], 'marketValue': p['mv'],
                        'clubs': [{'id': slug, 'name': name, 'years': str(yr)}],
                        'rating': rating(p['mv'], p['pos'])
                    }
                    added_players += 1
                else:
                    cur = new_player_map[pid]
                    have = {c['id'] for c in cur.get('clubs', [])}
                    if slug not in have:
                        cur['clubs'].append({'id': slug, 'name': name, 'years': str(yr)})
                squad_pids.append(pid)

            if squad_pids and sq_id not in new_squad_map:
                new_squad_map[sq_id] = {
                    'id': sq_id, 'clubId': slug, 'clubName': name,
                    'season': str(yr), 'competition': 'Liga Profesional',
                    'label': f'{name} {yr}', 'playerIds': squad_pids
                }
                added_squads += 1

    print(f'\n  Nuevos jugadores añadidos: {added_players}')
    print(f'  Nuevos planteles añadidos: {added_squads}')

    # Step 6: Save corrected files
    print('\n[PASO 6] Guardando archivos corregidos...')
    final_players = sorted(new_player_map.values(), key=lambda x: x.get('rating', 50), reverse=True)
    final_squads = [s for s in new_squad_map.values() if len(s['playerIds']) >= 5]

    with open(os.path.join(D, 'players_historical.json'), 'w') as f:
        json.dump(final_players, f, ensure_ascii=False, indent=1)
    with open(os.path.join(D, 'squads_historical.json'), 'w') as f:
        json.dump(final_squads, f, ensure_ascii=False, indent=1)

    print(f'  players_historical.json: {len(final_players)} jugadores')
    print(f'  squads_historical.json: {len(final_squads)} planteles')

    # Final audit
    print('\n[PASO 7] Auditoría final...')
    player_map_final = {p['id']: p for p in final_players}
    bad = 0
    for sq in final_squads:
        nat_counts = {}
        for pid in sq['playerIds']:
            p = player_map_final.get(pid, {})
            nat = p.get('nationality', 'Unknown')
            nat_counts[nat] = nat_counts.get(nat, 0) + 1
        total = sum(nat_counts.values())
        arg_pct = (nat_counts.get('Argentina', 0) / total * 100) if total > 0 else 0
        if arg_pct < 20 and total >= 5:
            bad += 1
            print(f'  ❌ AÚN MALO: {sq["label"]} ({arg_pct:.0f}% ARG)')

    if bad == 0:
        print('  ✅ TODOS los planteles superaron la auditoría de nacionalidad.')
    else:
        print(f'  ⚠️  {bad} planteles aún necesitan revisión manual.')

    print('\n✅ CORRECCIÓN COMPLETADA')
    print(f'  Total jugadores: {len(final_players)}')
    print(f'  Total planteles: {len(final_squads)}')

if __name__ == '__main__':
    main()
