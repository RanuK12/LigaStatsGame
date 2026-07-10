#!/usr/bin/env python3
"""Build squads.json from existing players.json + add Argentina national team squads."""
import json
import os
import random

BASE = os.path.join(os.path.dirname(__file__), '..')
DATA = os.path.join(BASE, 'data')

def classify_position(pos):
    if pos == 'GK':
        return 'gk'
    if pos in ['CB', 'LB', 'RB', 'LWB', 'RWB']:
        return 'def'
    if pos in ['CDM', 'CM', 'CAM', 'LM', 'RM']:
        return 'mid'
    if pos in ['LW', 'RW', 'ST', 'CF']:
        return 'att'
    return 'unknown'

def main():
    players = json.load(open(os.path.join(DATA, 'players.json')))
    clubs = json.load(open(os.path.join(DATA, 'clubs.json')))
    
    player_by_id = {p['id']: p for p in players}
    
    # Map club ID to a list of players (unique)
    club_players = {}
    for p in players:
        seen_clubs = set()
        for c in p.get('clubs', []):
            cid = c['id']
            if cid in seen_clubs:
                continue
            seen_clubs.add(cid)
            if cid not in club_players:
                club_players[cid] = []
            club_players[cid].append(p)
            
    squads = []
    
    for club in clubs:
        cid = club['id']
        all_club_pool = club_players.get(cid, [])
        if len(all_club_pool) < 11:
            # Not enough total players for this club to form a squad
            continue
            
        for decade in club.get('era', []):
            year = decade.rstrip('s') # Corrects "1970s" -> "1970" (previously dec.replace('s', '0') -> "19700")
            
            # Players of this club who played in this decade (or activeYears overlap)
            decade_year_int = int(year)
            decade_players = []
            for p in all_club_pool:
                # Check if the player belongs to this decade
                # Using decade string or checking years
                p_decade = p.get('decade', '')
                if p_decade == decade:
                    decade_players.append(p)
                else:
                    # Fallback check on years
                    for c_info in p.get('clubs', []):
                        if c_info['id'] == cid:
                            # If years contains the decade prefix
                            y_str = c_info.get('years', '')
                            if year[:3] in y_str:
                                decade_players.append(p)
                                break
                                
            # If we don't have enough decade-specific players, seed with all club players
            if len(decade_players) < 11:
                decade_players = list(all_club_pool)
                
            # Randomize/sample selection
            random.seed(hash(cid + decade))
            
            # Form a valid playable squad. Must have:
            # - At least 1 GK
            # - At least 3 DEF
            # - At least 3 MID
            # - At least 1 ATT
            # - Total >= 11 and <= 23
            
            # Start with all selected decade players (unique)
            selected = {p['id'] for p in decade_players}
            
            # Ensure we satisfy GK
            gks = [p for p in selected if classify_position(player_by_id[p]['position']) == 'gk']
            if not gks:
                # Find any GK from the club's entire pool
                club_gks = [p['id'] for p in all_club_pool if classify_position(p['position']) == 'gk']
                if club_gks:
                    selected.add(club_gks[0])
                    
            # Ensure we satisfy DEF (at least 3)
            defs = [p for p in selected if classify_position(player_by_id[p]['position']) == 'def']
            if len(defs) < 3:
                club_defs = [p['id'] for p in all_club_pool if classify_position(p['position']) == 'def']
                for d in club_defs:
                    if d not in selected:
                        selected.add(d)
                        if len([p for p in selected if classify_position(player_by_id[p]['position']) == 'def']) >= 3:
                            break
                            
            # Ensure we satisfy MID (at least 3)
            mids = [p for p in selected if classify_position(player_by_id[p]['position']) == 'mid']
            if len(mids) < 3:
                club_mids = [p['id'] for p in all_club_pool if classify_position(p['position']) == 'mid']
                for m in club_mids:
                    if m not in selected:
                        selected.add(m)
                        if len([p for p in selected if classify_position(player_by_id[p]['position']) == 'mid']) >= 3:
                            break
                            
            # Ensure we satisfy ATT (at least 1)
            atts = [p for p in selected if classify_position(player_by_id[p]['position']) == 'att']
            if not atts:
                club_atts = [p['id'] for p in all_club_pool if classify_position(p['position']) == 'att']
                if club_atts:
                    selected.add(club_atts[0])
                    
            # If total players is still < 11, add remaining players from the club pool
            if len(selected) < 11:
                for p in all_club_pool:
                    selected.add(p['id'])
                    if len(selected) >= 11:
                        break
                        
            # Final list of player IDs (unique)
            squad_pids = list(selected)
            
            # Limit squad size to max 22 players to keep it realistic
            if len(squad_pids) > 22:
                # Keep GKs, DEFs, MIDs, ATTs required, sample the rest
                gks_p = [p for p in squad_pids if classify_position(player_by_id[p]['position']) == 'gk']
                defs_p = [p for p in squad_pids if classify_position(player_by_id[p]['position']) == 'def']
                mids_p = [p for p in squad_pids if classify_position(player_by_id[p]['position']) == 'mid']
                atts_p = [p for p in squad_pids if classify_position(player_by_id[p]['position']) == 'att']
                
                core = set(gks_p[:2] + defs_p[:5] + mids_p[:5] + atts_p[:4])
                others = [p for p in squad_pids if p not in core]
                
                # fill up to 18-22
                target_size = min(len(squad_pids), 18)
                while len(core) < target_size and others:
                    core.add(others.pop(0))
                squad_pids = list(core)
                
            if len(squad_pids) >= 11:
                squads.append({
                    'id': f"{cid}-{year}",
                    'clubId': cid,
                    'season': year,
                    'competition': 'Liga Profesional',
                    'label': f"{club['name']} {year}s",
                    'playerIds': squad_pids
                })
                
    # Argentina National Team Squads
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
            
        squad_pids = [p['id'] for p in relevant[:23]]
        
        # Verify position constraints for Argentina squads as well
        selected = set(squad_pids)
        # Ensure GK
        if not any(classify_position(player_by_id[p]['position']) == 'gk' for p in selected):
            all_gks = [p['id'] for p in nat_players if classify_position(p['position']) == 'gk']
            if all_gks: selected.add(all_gks[0])
        # Ensure DEF >= 3
        while len([p for p in selected if classify_position(player_by_id[p]['position']) == 'def']) < 3:
            all_defs = [p['id'] for p in nat_players if classify_position(p['position']) == 'def']
            added_any = False
            for d in all_defs:
                if d not in selected:
                    selected.add(d)
                    added_any = True
                    break
            if not added_any: break
        # Ensure MID >= 3
        while len([p for p in selected if classify_position(player_by_id[p]['position']) == 'mid']) < 3:
            all_mids = [p['id'] for p in nat_players if classify_position(p['position']) == 'mid']
            added_any = False
            for m in all_mids:
                if m not in selected:
                    selected.add(m)
                    added_any = True
                    break
            if not added_any: break
        # Ensure ATT >= 1
        if not any(classify_position(player_by_id[p]['position']) == 'att' for p in selected):
            all_atts = [p['id'] for p in nat_players if classify_position(p['position']) == 'att']
            if all_atts: selected.add(all_atts[0])
            
        squads.append({
            'id': f"argentina-{year}",
            'clubId': 'argentina',
            'season': year,
            'competition': comp,
            'label': f"Argentina {label}",
            'playerIds': list(selected)
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
