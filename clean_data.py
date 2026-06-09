import json, os
from collections import defaultdict

BASE = "/Users/emilioranucoli/Desktop/Oficina_Ranuk/LigaStatsGame"
IN_PATH = os.path.join(BASE, "data", "players_scraped.json")
OUT_PLAYERS = os.path.join(BASE, "data", "players.json")
OUT_SQUADS  = os.path.join(BASE, "data", "squads.json")

def normalize_position(pos):
    pos = pos.lower()
    if "delanter" in pos:   return "FW"
    if "mediocamp" in pos:  return "MF"
    if "defens" in pos:     return "DF"
    if "arquero" in pos:    return "GK"
    return "MF"

def clamp_rating(r):
    return max(1, min(99, int(r)))

def load_raw():
    with open(IN_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def clean():
    raw = load_raw()
    players = []
    squads = defaultdict(list)
    seen = set()
    for club, lst in raw.items():
        for p in lst:
            key = (p["name"], club)
            if key in seen:
                continue
            seen.add(key)
            clean_player = {
                "name": p["name"].strip(),
                "club": club,
                "year": 2024,
                "position": normalize_position(p["position"]),
                "rating": clamp_rating(p.get("rating", 80))
            }
            players.append(clean_player)
            squads[club].append(clean_player)
    squads = {c: v for c, v in squads.items() if len(v) >= 15}
    os.makedirs(os.path.dirname(OUT_PLAYERS), exist_ok=True)
    with open(OUT_PLAYERS, "w", encoding="utf-8") as f:
        json.dump(players, f, ensure_ascii=False, indent=2)
    with open(OUT_SQUADS, "w", encoding="utf-8") as f:
        json.dump(squads, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(players)} jugadores totales")
    print(f"✅ {len(squads)} equipos con ≥15 jugadores")
    print(f"✅ guardados en {OUT_PLAYERS} y {OUT_SQUADS}")

if __name__ == "__main__":
    clean()