# LigaStatsGame - Backend (API Routes + Scrapers)

## 📁 Estructura

```
backend/
├── src/
│   ├── controllers/
│   │   ├── games.controller.ts
│   │   ├── players.controller.ts
│   │   ├── quizzes.controller.ts
│   │   └── leaderboard.controller.ts
│   ├── models/
│   │   ├── game.model.ts
│   │   ├── player.model.ts
│   │   ├── quiz.model.ts
│   │   └── user.model.ts
│   ├── routes/
│   │   ├── games.route.ts
│   │   ├── players.route.ts
│   │   ├── quizzes.route.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── db.service.ts         # Supabase
│   │   ├── cache.service.ts       # Redis
│   │   ├── scrape.service.ts      # Scrapers
│   │   └── leaderboard.service.ts
│   └── app.ts                     # Configuración de Express
├── package.json
└── tsconfig.json
```

## 🚀 Scripts

```json
{
  "start": "node dist/index.js",
  "dev": "ts-node-dev src/app.ts",
  "build": "tsc",
  "lint": "eslint . --ext .ts",
  "typecheck": "tsc --noEmit",
  "scrape:players": "ts-node src/services/scrape.service.ts",
  "update:leaderboard": "ts-node src/services/leaderboard.service.ts",
  "test": "jest"
}
```

## 📦 Dependencias

```bash
npm install express cors dotenv helmet morgan helmet
npm install @supabase/supabase-js redis ioredis
npm install cheerio puppeteer axios
npm install @types/express @types/cors @types/node --save-dev
npm install typescript ts-node ts-node-dev @types/express @types/cors --save-dev
```

## 📝 Configuración de Supabase

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 🔄 Scrapers

### Scraper de BDFA
```typescript
// src/services/scrape.service.ts
import { writeFileSync } from 'fs';
import { load } from 'cheerio';
import axios from 'axios';

const scrapeBDFAPlayers = async () => {
  const clubs = [353, 354, 355, 356, 357, 358]; // Argentina, Boca, River, Independiente, Racing, San Lorenzo
  const players: any[] = [];

  for (const clubId of clubs) {
    try {
      const response = await axios.get(`https://www.bdfa.com.ar/lista_jugadores.asp?codigo=${clubId}&orden=PjHistorial&cat=1`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const $ = load(response.data);
      // Parsear tabla de jugadores
      $('table tr').each((i, el) => {
        const name = $(el).find('td').eq(1).text().trim();
        // Extraer datos
      });

      console.log(`Scrapeado club ${clubId}: ${players.length} jugadores`);
    } catch (error) {
      console.error(`Error scraping club ${clubId}:`, error);
    }
  }

  writeFileSync('./data/players.json', JSON.stringify(players, null, 2));
};

scrapeBDFAPlayers();
```

### Scraper de Transfermarkt (dataset)
```typescript
// Usar el dataset de dcaribou o API propia
import { readFileSync } from 'fs';

const players = JSON.parse(readFileSync('./data/players.json', 'utf8'));
// Filtrar por equipos argentinos
const argentinaPlayers = players.filter(p => p.nationality === 'Argentina');
```

## 🎯 API Endpoints

### GET /api/players
Obtener jugadores filtrados
- ?club=boca-juniors
- ?decade=1990s
- ?position=ST
- ?search=maradona

```typescript
import { supabase } from '../services/db.service';

export const getPlayers = async (req: Request, res: Response) => {
  const { club, decade, position, search } = req.query;
  
  let query = supabase
    .from('players')
    .select('*');

  if (club) query = query.eq('clubs', club);
  if (decade) query = query.eq('decade', decade);
  if (position) query = query.contains('positions', position);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  
  if (error) return res.status(500).json({ error });
  res.json(data);
};
```

### POST /api/games
Guardar partida
```typescript
interface GameData {
  userId: string;
  clubId: string;
  decade: string;
  formation: string;
  players: string[]; // player IDs
  score: number;
  matches: number;
}
```

### GET /api/quizzes
Generar preguntas aleatorias
```typescript
// ?type=whois&difficulty=medium&limit=10
```

### GET /api/leaderboard
Obtener ranking global
```typescript
// ?limit=50&mode=legend-draft
```

## 🏆 Lógica de Leaderboard

```typescript
// src/services/leaderboard.service.ts
import { supabase } from './db.service';

export async function updateLeaderboard() {
  const { data: games, error } = await supabase
    .from('games')
    .select('userId, score')
    .order('score', { ascending: false });

  // Calcular posiciones y badges
  const leaderboard = games.map((game, index) => ({
    rank: index + 1,
    userId: game.userId,
    score: game.score,
  }));

  // Guardar en tabla leaderboard
  await supabase.from('leaderboard').upsert(leaderboard);
  console.log('Leaderboard actualizado');
}
```

## 📊 Base de datos (Supabase Schema)

```sql
-- Jugadores
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birthDate TEXT,
  position TEXT NOT NULL,
  positions TEXT[],
  nationality TEXT,
  clubs JSONB[],
  capsNationalTeam INTEGER,
  goalsNationalTeam INTEGER,
  capsClub INTEGER,
  goalsClub INTEGER,
  assistsClub INTEGER,
  trophies JSONB[],
  image TEXT,
  marketValue TEXT,
  activeYears TEXT,
  decade TEXT,
  rating INTEGER,
  legendary BOOLEAN DEFAULT false,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Juegos guardados
CREATE TABLE games (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  userId TEXT NOT NULL REFERENCES users(id),
  clubId TEXT NOT NULL REFERENCES clubs(id),
  decade TEXT NOT NULL,
  formation TEXT NOT NULL,
  players TEXT[],
  score INTEGER NOT NULL,
  matches INTEGER DEFAULT 0,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Ranking
CREATE TABLE leaderboard (
  rank INTEGER PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  createdAt TIMESTAMPTZ DEFAULT NOW()
);

-- Preguntas
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  question TEXT NOT NULL,
  image TEXT,
  options JSONB NOT NULL,
  difficulty TEXT NOT NULL,
  decade TEXT,
  tags TEXT[]
);
```

## 🔒 Seguridad

```typescript
// src/middlewares/security.ts
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet(),
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
];
```

## 🚦 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
});

app.use(limiter);
```

## 📈 Logging

```typescript
import morgan from 'morgan';

app.use(morgan('combined'));
```

## 🔧 Deployment

### Railway
```json
{
  "services": [
    {
      "name": "ligastats-backend",
      "type": "web",
      "env": "production",
      "build": "npm run build",
      "start": "npm start",
      "envVars": {
        "SUPABASE_URL": "...",
        "SUPABASE_KEY": "...",
        "REDIS_URL": "..."
      }
    },
    {
      "name": "ligastats-scrapers",
      "type": "worker",
      "schedule": "0 0 * * 1", // Todos los lunes a medianoche
      "cmd": "npm run scrape:players && npm run update:leaderboard"
    }
  ]
}
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```typescript
// src/tests/player.test.ts
import { calculatePlayerRating } from '../lib/game-engine';

test('rating calculation', () => {
  const player = {
    capsClub: 500,
    goalsClub: 100,
    capsNationalTeam: 50,
    goalsNationalTeam: 20,
    trophies: [{ competition: 'Primera División' }],
    marketValue: '20.00',
    position: 'ST',
    decade: '2010s'
  };

  const rating = calculatePlayerRating(player, 'ST');
  expect(rating).toBeGreaterThan(80);
});
```

## 📝 Notas

1. **Actualización automática:** Los scrapers corren cada lunes en Railway
2. **Cache:** Usar Redis para evitar recargas de datos estáticos
3. **Analytics:** Implementar con Vercel Analytics o Google Analytics
4. **Monitoring:** Configurar logging y alertas con Sentry o Datadog
5. **Backup:** Configurar backups automáticos de Supabase
6. **CI/CD:** GitHub Actions para tests y deployment automático

## 🔗 Integración con Frontend

```typescript
// Frontend fetching
const fetchPlayers = async (filters: { club?: string; decade?: string }) => {
  const query = new URLSearchParams(filters);
  const response = await fetch(`/api/players?${query.toString()}`);
  return await response.json();
};

// Guardar partida
const saveGame = async (gameData: GameData) => {
  const response = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(gameData),
  });
  return await response.json();
};
```
