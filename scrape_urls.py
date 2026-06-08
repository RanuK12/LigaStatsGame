import requests
from bs4 import BeautifulSoup
import json
import os

def get_players():
    # URLs identificadas para los 5 grandes
    # Usamos Wikipedia como base principal por su estructura de tablas
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
            
            # Buscamos tablas de planteles (esto es una simplificación para la Fase 1)
            # En la Fase 2 limpiaremos esto a fondo.
            tables = soup.find_all('table')
            players = []
            
            for table in tables:
                rows = table.find_all('tr')
                for row in rows[1:]: # saltar cabecera
                    cols = row.find_all('td')
                    if len(cols) > 2:
                        name = cols[1].get_text(strip=True)
                        pos = cols[2].get_text(strip=True)
                        # Rating estimado para Fase 1 (se normaliza en Fase 2)
                        rating = 80 
                        players.append({
                            "name": name,
                            "position": pos,
                            "rating": rating
                        })
            
            # Filtrar por mínimo 15 jugadores
            if len(players) >= 15:
                club_name = url.split('/')[-1]
                all_data[club_name] = players
        except Exception as e:
            print(f"Error en {url}: {e}")

    # Guardar resultados
    os.makedirs('data', exist_ok=True)
    with open('data/players_scraped.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"Data guardada con {len(all_data)} clubes.")

if __name__ == "__main__":
    get_players()