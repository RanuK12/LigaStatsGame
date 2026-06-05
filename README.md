# LigaStatsGame

🏆 **El draft del fútbol argentino** — El "38-0.app" pero de la Superliga Argentina

Construí el once ideal de la Liga Profesional Argentina. Gira la ruleta, elegí leyendas, jugá una temporada entera.

Inspirado en: [38-0.app](https://38-0.app) · [101pts.com](https://101pts.com) · [7a0.com.br](https://7a0.com.br)

---

## 🚀 Features principales

- 🎰 **Ruleta de asignación:** Gira la ruleta y recibí un club + década al azar
- 🏟️ **28 clubes:** Todos los equipos de la Liga Profesional Argentina
- 📊 **1000+ leyendas:** Base de datos de jugadores desde 1891
- 🏆 **Simulación de temporada:** Jugá 38 fechas y buscá ser campeón
- 🧠 **Modo memoria:** Adiviná sin estadísticas visibles (solo tu conocimiento)
- 🏅 **Leaderboard global:** Competí contra otros usuarios
- 🎯 **5 modos:** Leyendas Draft, Memoria, Records, Decada, Career

## 🎮 Modos de juego

### 1. Leyendas Draft (como 101pts.com)
- Gira la ruleta → te asigna un club + década
- Elegí 11 jugadores para tu formación (4-3-3, 4-4-2, 4-2-3-1, etc.)
- Simulá una temporada de 38 fechas
- Tu once se enfrenta a 19 rivales

### 2. Memoria (sin datos visibles)
- Igual que el draft pero sin ver estadísticas
- Solo tu conocimiento del fútbol argentino
- Menos skips, más desafío

### 3. Records
- ¿Quién tiene más goles en clásicos?
- ¿Cuál fue el equipo con más victorias consecutivas?
- Rankings por década y por club

### 4. Decada
- Te muestran un jugador → adivinás en qué década jugó
- 4 opciones, una sola respuesta

### 5. Career
- Modo carrera: 10 preguntas seguidas
- Puntuación acumulada
- Ranking global

## 📦 Stack técnico

### Frontend
- **Framework:** Next.js 14 + TypeScript
- **UI:** TailwindCSS + Shadcn/ui
- **Animaciones:** Framer Motion
- **Estado:** Zustand

### Backend
- **API:** Next.js API Routes
- **DB:** Supabase (PostgreSQL)
- **Cache:** Redis
- **Scrapers:** Node.js + Cheerio

### Datos
- **Fuente principal:** [Transfermarkt](https://www.transfermarkt.com) (37,000+ jugadores)
- **Fuente argentina:** [BDFA](https://www.bdfa.com.ar) (60,000+ fichas)
- **Dataset:** [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets)

## 📂 Estructura del proyecto

```
LigaStatsGame/
├── app/                  # Next.js App Router
│   ├── games/            # Páginas de juegos
│   ├── api/              # API routes
│   └── layout.tsx
├── components/           # Componentes UI
├── lib/                  # Lógica central
│   ├── game-engine.ts    # Motor de juego
│   └── types.ts          # Tipos TypeScript
├── data/                 # Datos estáticos
│   ├── clubs.json        # Clubes argentinos
│   └── players.json      # Jugadores
├── backend/              # Backend (Express + Supabase)
└── scripts/              # Scripts de automatización
```

## 🚀 Getting Started

### 1. Clonar
```bash
git clone https://github.com/RanuK12/LigaStatsGame.git
cd LigaStatsGame
```

### 2. Frontend
```bash
npm install
npm run dev
```
→ Abrir http://localhost:3000

### 3. Backend
```bash
cd backend
npm install
npm run dev
```
→ Abrir http://localhost:3001

### 4. Datos
```bash
npm run scrape:players    # Descargar jugadores
npm run generate:quizzes  # Generar preguntas
```

## 🔧 Configuración

### Variables de entorno (.env.local)
```bash
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-api-key

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_SECRET=tu-secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (login)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 📊 Base de datos

### Jugadores
- **Total:** 1,000+ jugadores de la liga argentina
- **Décadas:** 1960s - 2020s
- **Club de origen:** Todos los 28 clubes actuales
- **Actualización:** Cada lunes via scrapers automáticos

### Campos
```typescript
{
  id: string;
  name: string;
  position: 'GK' | 'CB' | 'CM' | 'ST' | ...;
  clubs: { id: string; name: string; years: string }[];
  capsClub: number;
  goalsClub: number;
  trophies: { competition: string; year: string }[];
  rating: number; // 0-100 calculado
  legendary: boolean;
  decade: string; // '1990s', '2020s', etc.
}
```

## 🎨 Paleta de colores

- **Primary:** #003DA5 (Azul)
- **Secondary:** #FF0000 (Rojo)
- **Accent:** #FFD700 (Dorado)
- **Background:** #0A0A0A
- **Card:** #1A1A1A

## 🏆 Leaderboard

### Sistema de puntos
- **Victoria:** +3 puntos
- **Empate:** +1 punto
- **Derrota:** 0 puntos
- **Goles:** +0.5 puntos por gol
- **Bonus leyenda:** +5 puntos si el jugador es leyenda

### Récords
- **Récord real:** 101 puntos (Barcelona 2011-12)
- **Objetivo:** Superar 101 puntos en la liga argentina

## 🔧 Deploy

### Frontend: Vercel
```bash
vercel
```

### Backend: Railway
- Push a GitHub
- Railway detecta cambios automáticamente

### Base de datos: Supabase
- Crear proyecto en supabase.com
- Importar esquema SQL
- Configurar variables de entorno

## 📝 Roadmap

### v0.1 (MVP) ✅
- [x] Estructura del proyecto
- [x] Tipos TypeScript
- [x] Base de datos de clubes
- [x] Motor de juego
- [x] Formaciones disponibles

### v0.2 (En progreso)
- [ ] Scrapers de jugadores
- [ ] UI de la ruleta
- [ ] Draft de jugadores
- [ ] Simulación de temporada

### v0.3
- [ ] Modo Memoria
- [ ] Leaderboard global
- [ ] Insignias y badges
- [ ] Login con NextAuth

### v1.0
- [ ] Deploy completo
- [ ] Marketing
- [ ] Comunidad

## 🤝 Contribuir

1. Fork
2. Crear branch (`git checkout -b feature/nueva-feature`)
3. Commit (`git commit -m 'feat: nueva feature'`)
4. Push (`git origin push feature/nueva-feature`)
5. Abrir PR

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE)

## 📞 Contacto

**Emilio Ranucoli**
- GitHub: [@RanuK12](https://github.com/RanuK12)
- Web: [ranuk.dev](https://ranuk.dev)
- Email: ranucoliemilio@gmail.com

---

**¡Hecho con ❤️ para el fútbol argentino!** ⚽🇦🇷
