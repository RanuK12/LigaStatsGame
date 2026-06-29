#!/bin/bash
# Espera a que termine el scrape de Transfermarkt, fusiona a la DB del juego, buildea y avisa por Telegram.
cd "$HOME/Desktop/Oficina_Ranuk/LigaStatsGame" || exit 1
SCRAPE_PID="${1:-44580}"

# 1) esperar a que el scrape termine (o muera)
while kill -0 "$SCRAPE_PID" 2>/dev/null; do sleep 120; done

{
  echo "[$(date)] scrape terminó: $(tail -1 data/scrape_full.log 2>/dev/null)"
  if [ -f data/players_historical.json ]; then
    node scripts/merge-historical.mjs
    CNT=$(node -e "const a=JSON.parse(require('fs').readFileSync('data/players.json'));console.log((Array.isArray(a)?a:a.players).length)" 2>/dev/null)
    if npx next build > /tmp/liga_build.log 2>&1; then BUILD="OK"; else BUILD="FALLÓ (ver /tmp/liga_build.log)"; fi
    MSG="🎮 <b>LigaStatsGame</b>: scrape + merge listos. La DB ahora tiene <b>${CNT}</b> jugadores reales. next build: ${BUILD}."
  else
    MSG="⚠️ <b>LigaStatsGame</b>: el scrape no escribió players_historical.json (se debe haber cortado, ej. la Mac durmió). El cache queda, re-correr el scrape lo retoma rápido."
  fi
  TOK=$(python3 -c "import json,os;print(json.load(open(os.path.expanduser('~/.ranukita/telegram_config.json')))['channels']['telegram']['botToken'])" 2>/dev/null)
  [ -n "$TOK" ] && curl -s "https://api.telegram.org/bot$TOK/sendMessage" \
    -d chat_id=8107555656 -d parse_mode=HTML --data-urlencode "text=$MSG" >/dev/null
  echo "[$(date)] $MSG"
} 2>&1 | tee data/scrape_then_merge.log
