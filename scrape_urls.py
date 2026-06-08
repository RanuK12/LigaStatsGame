import requests
from bs4 import BeautifulSoup
import json
import os

def get_players():
    # Rutas absolutas para evitar errores de directorio
    base_path = "/Users/emilioranucoli/Desktop/Oficina_Ranuk/LigaStatsGame"
    output_path = os.path.join(base_path, "data", "players_scraped.json")
    
    urls = [
        "https://es.wikipedia.org/wiki/Club_Atlético_Boca_Juniors",
        "https://es.wikipedia.org/wiki/Club_Atlético_River_Plate",
        "https://es.wikipedia.org/wiki/Racing_Club_de_Avellaneda",
        "https://es.wikipedia.org/wiki/Club_Atlético_Independiente",
        "https://es.wikipedia.org/wiki/Club_Atlético_San_Lorenzo_de_Almagro"
    ]
    
    all_data = {}

    for url in urls:
        try:
            response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
            soup = BeautifulSoup(response.content, 'html.parser')
            tables = soup.find_all('table')
            players = []
            
            for table in tables:
                rows = table.find_all('tr')
                for row in rows[1:]:
                    cols = row.find_all('td')
                    if len(cols) > 2:
                        name = cols[1].get_text(strip=True)
                        pos = cols[2].get_text(strip=True)
                        players.append({
                            "name": name,
                            "position": pos,
                            "rating": 80
                        })
            
            if len(players) >= 15:
                club_name = url.split('/')[-1]
                all_data[club_name] = players
        except Exception as e:
            print(f"Error en {url}: {e}")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"Data guardada en: {output_path}")
    print(f"Clubes procesados: {len(all_data)}")

if __name__ == "__main__":
    get_players()