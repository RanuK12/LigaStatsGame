#!/usr/bin/env python3
"""Build players.json and squads.json from raw_squads.txt + existing players.json"""
import json, os, sys

BASE = os.path.join(os.path.dirname(__file__), '..')
DATA = os.path.join(BASE, 'data')

def pid(n):
    s=n.lower().replace(' ','-').replace('.','').replace("'","").replace(',','')
    for a,b in [('á','a'),('é','e'),('í','i'),('ó','o'),('ú','u'),('ñ','n')]:
        s=s.replace(a,b)
    return s

def load_existing():
    path = os.path.join(DATA, 'players.json')
    if os.path.exists(path):
        return json.load(open(path))
    return []

def parse_raw(path):
    """Parse raw_squads.txt format:
    CLUB_ID|SEASON|COMPETITION|LABEL
    Name|POS|Rating
    Name|POS|Rating
    ...
    (blank line separates squads)
    """
    squads = []
    current = None
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                if current:
                    squads.append(current)
                    current = None
                continue
            if line.startswith('#'):
                continue
            if '|' in line and not current:
                parts = line.split('|')
                current = {
                    'id': f"{parts[0]}-{parts[1]}",
                    'clubId': parts[0],
                    'season': parts[1],
                    'competition': parts[2] if len(parts)>2 else 'Liga Profesional',
                    'label': parts[3] if len(parts)>3 else f"{parts[0]} {parts[1]}",
                    'playerNames': []
                }
            elif '|' in line and current:
                parts = line.split('|')
                if len(parts) >= 3:
                    current['playerNames'].append({
                        'name': parts[0].strip(),
                        'position': parts[1].strip(),
                        'rating': int(parts[2].strip())
                    })
    if current:
        squads.append(current)
    return squads

def build_players(existing, squads_raw):
    """Merge existing players with new ones from squads."""
    # Index existing by name
    by_name = {}
    for p in existing:
        by_name[p['name'].lower()] = p

    all_players = list(existing)
    added_ids = set(p['id'] for p in existing)

    for squad in squads_raw:
        for pl in squad['playerNames']:
            key = pl['name'].lower()
            if key in by_name:
                continue  # already exists
            p_id = pid(pl['name'])
            if p_id in added_ids:
                p_id = f"{p_id}-{pl['position'].lower()}"
            if p_id in added_ids:
                continue
            new_player = {
                'id': p_id,
                'name': pl['name'],
                'fullName': pl['name'],
                'birthDate': '',
                'position': pl['position'],
                'positions': [pl['position']],
                'nationality': 'Argentina',
                'height': 0,
                'weight': 0,
                'preferredFoot': 'Derecho',
                'clubs': [],
                'capsNationalTeam': 0,
                'goalsNationalTeam': 0,
                'capsClub': 0,
                'goalsClub': 0,
                'assistsClub': 0,
                'trophies': [],
                'image': '',
                'marketValue': '',
                'activeYears': '',
                'decade': '',
                'rating': pl['rating'],
                'legendary': pl['rating'] >= 80
            }
            all_players.append(new_player)
            by_name[key] = new_player
            added_ids.add(p_id)

    return all_players, by_name

def build_squads(squads_raw, player_index):
    """Convert raw squad data to final squads.json format."""
    clubs_json = json.load(open(os.path.join(DATA, 'clubs.json')))
    club_ids = {c['id'] for c in clubs_json}
    # Add Argentina
    club_ids.add('argentina')

    squads = []
    for s in squads_raw:
        player_ids = []
        for pl in s['playerNames']:
            key = pl['name'].lower()
            if key in player_index:
                player_ids.append(player_index[key]['id'])
        if len(player_ids) >= 11:  # Only squads with full XI+
            squads.append({
                'id': s['id'],
                'clubId': s['clubId'],
                'season': s['season'],
                'competition': s['competition'],
                'label': s['label'],
                'playerIds': player_ids
            })
    return squads

def main():
    raw_path = os.path.join(DATA, 'raw_squads.txt')
    if not os.path.exists(raw_path):
        print(f"ERROR: {raw_path} not found")
        sys.exit(1)

    existing = load_existing()
    squads_raw = parse_raw(raw_path)
    all_players, player_index = build_players(existing, squads_raw)
    squads = build_squads(squads_raw, player_index)

    # Write players.json
    out_players = os.path.join(DATA, 'players.json')
    with open(out_players, 'w') as f:
        json.dump(all_players, f, ensure_ascii=False, indent=2)
    print(f"players.json: {len(all_players)} players")

    # Write squads.json
    out_squads = os.path.join(DATA, 'squads.json')
    with open(out_squads, 'w') as f:
        json.dump(squads, f, ensure_ascii=False, indent=2)
    print(f"squads.json: {len(squads)} squads")

    # Stats
    for s in squads:
        print(f"  {s['label']}: {len(s['playerIds'])} players")

if __name__ == '__main__':
    main()
