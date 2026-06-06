#!/usr/bin/env python3
"""Build squads.json from existing players.json + add Argentina national team squads."""
import json, os, random

BASE = os.path.join(os.path.dirname(__file__), '..')
DATA = os.path.join(BASE, 'data')

def main():
    players = json.load(open(os.path.join(DATA, 'players.json')))
    clubs = json.load(open(os.path.join(DATA, 'clubs.json')))
    
    club_players = {}
    for p in players:
        for c in p.get('clubs', []):
            cid = c['id']
            if cid not in club_players:
                club_players[cid] = []
            club_players[cid].append(p['id'])
    
    squads = []
    
    for club in clubs:
        cid = club['id']
        pids = club_players.get(cid, [])
        if len(pids) < 5:
            continue
        for decade in club.get('era', []):
            year = decade.replace('s', '0')
            random.seed(hash(cid + decade))
            n = min(len(pids), random.randint(14, 22))
            squad_pids = random.sample(pids, n) if n <= len(pids) else pids
            if len(squad_pids) >= 11:
                squads.append({
                    'id': f"{cid}-{year}",
                    'clubId': cid,
                    'season': year,
                    'competition': 'Liga Profesional',
                    'label': f"{club['name']} {year}s",
                    'playerIds': squad_pids
                })
    
    nat_players = sorted([p for p in players if p.get('capsNationalTeam', 0) > 0],
                         key=lambda p: p.get('rating', 0), reverse=True)
    
    tournaments = [
        ('1978','Mundial 1978','Copa del Mundo'),('1986','Mundial 1986','Copa del Mundo'),
        ('1990','Mundial 1990','Copa del Mundo'),('2014','Mundial 2014','Copa del Mundo'),
        ('2022','Mundial 2022','Copa del Mundo'),('2021','Copa América 2021','Copa América'),
        ('2024','Copa América 2024','Copa América'),
    ]
    
    for year, label, comp in tournaments:
        target_decade = int(year[:3]) * 10
        relevant = [p for p in nat_players
                    if abs(int(p.get('decade','1990s').replace('s','0')) - target_decade) <= 15]
        if len(relevant) < 18:
            relevant = nat_players[:23]
        squads.append({
            'id': f"argentina-{year}",
            'clubId': 'argentina',
            'season': year,
            'competition': comp,
            'label': f"Argentina {label}",
            'playerIds': [p['id'] for p in relevant[:23]]
        })
    
    if not any(c['id'] == 'argentina' for c in clubs):
        clubs.append({
            'id': 'argentina', 'name': 'Argentina', 'shortName': 'Argentina',
            'founded': 1893, 'stadium': 'Estadio Monumental', 'city': 'Buenos Aires',
            'colors': ['#75AADB', '#FFFFFF'], 'titles': 3, 'Libertadores': 0,
            'era': ['1970s','1980s','1990s','2000s','2010s','2020s'],
            'nickname': 'La Albiceleste'
        })
        json.dump(clubs, open(os.path.join(DATA, 'clubs.json'), 'w'), ensure_ascii=False, indent=2)
    
    json.dump(squads, open(os.path.join(DATA, 'squads.json'), 'w'), ensure_ascii=False, indent=2)
    
    print(f"Squads: {len(squads)}, Players: {len(players)}")
    for s in squads[:5]:
        print(f"  {s['label']}: {len(s['playerIds'])} players")
    print(f"  ... and {len(squads)-5} more")

if __name__ == '__main__':
    main()
