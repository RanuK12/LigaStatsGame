# LigaStatsGame - Frontend (Next.js 14 + TypeScript)
# App Router + TailwindCSS + Framer Motion

## 📦 Dependencias principales

```bash
npm install next react react-dom framer-motion @radix-ui/react-slot lucide-react zod
npm install -D @types/node @types/react @types/react-dom @types/react-syntax-highlighter autoprefixer postcss tailwindcss typescript tailwind-merge tailwindcss-animate
```

## 🚀 Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit"
}
```

## 📂 Estructura de carpetas (frontend)

```
app/
├── (auth)/
│   ├── login/page.tsx          # Login con NextAuth
│   └── register/page.tsx        # Registro
├── games/
│   ├── legend-draft/page.tsx   # Leyendas Draft
│   ├── memory/page.tsx          # Modo Memoria
│   ├── records/page.tsx         # Récords históricos
│   ├── decade/page.tsx          # Adivina la década
│   └── career/page.tsx          # Modo Carrera
├── dashboard/
│   ├── page.tsx                 # Panel de usuario
│   ├── history/page.tsx         # Historial de partidas
│   └── badges/page.tsx          # Insignias desbloqueadas
├── leaderboard/
│   ├── page.tsx                 # Ranking global
│   └── club/[id]/page.tsx       # Ranking por club
├── api/
│   └── route.ts                 # API routes
└── layout.tsx                   # Layout principal

components/
├── ui/
│   ├── button.tsx               # Botones
│   ├── card.tsx                 # Cartas
│   ├── dialog.tsx               # Modales
│   ├── dropdown-menu.tsx        # Menúes
│   ├── form.tsx                 # Formularios
│   ├── input.tsx                # Inputs
│   ├── label.tsx                # Labels
│   ├── select.tsx               # Selects
│   ├── sheet.tsx                # Sheets
│   ├── skeleton.tsx             # Skeleton loaders
│   ├── tabs.tsx                 # Pestañas
│   └── toast.tsx                # Notificaciones
├── game/
│   ├── FormationSelector.tsx    # Selector de formación
│   ├── PlayerCard.tsx           # Tarjeta de jugador
│   ├── QuizCard.tsx             # Tarjeta de quiz
│   ├── Ruleta.tsx               # Ruleta de asignación
│   ├── ScoreDisplay.tsx         # Mostrar score
│   └── Timer.tsx                # Cronómetro
└── layout/
    ├── Footer.tsx               # Pie de página
    └── Header.tsx               # Cabecera

lib/
├── data/
│   ├── players.ts               # Carga de jugadores (fetch desde Supabase)
│   ├── quizzes.ts               # Carga de preguntas
│   └── clubs.ts                 # Carga de clubes
├── hooks/
│   ├── useGame.ts               # Lógica de juego
│   ├── useAuth.ts               # Autenticación
│   └── useLeaderboard.ts        # Ranking
├── utils/
│   ├── formatters.ts           # Formateadores
│   ├── helpers.ts               # Funciones auxiliares
│   └── games.ts                 # Lógica de simulaciones
└── auth.ts                      # Configuración de NextAuth

styles/
├── globals.css                  # Estilos globales
└── theme.ts                     # Configuración de theme

public/
├── images/
│   ├── players/                 # Imágenes de jugadores
│   ├── clubs/                   # Escudos de clubes
│   └── badges/                  # Insignias
└── sounds/
    ├── success.mp3              # Sonido de acierto
    ├── error.mp3                # Sonido de error
    └── countdown.mp3            # Sonido de cuenta regresiva
```

## 🎨 Paleta de colores

```css
--primary: #003DA5;   /* Azul fuerte (River, etc.) */
--secondary: #FF0000; /* Rojo (Boca, etc.) */
--accent: #FFD700;    /* Dorado */
--background: #0A0A0A;
--foreground: #FFFFFF;
--card: #1A1A1A;
--border: #333333;
--success: #22C55E;
--danger: #EF4444;
--warning: #F59E0B;
--info: #3B82F6;
```

## 📱 Componentes reutilizables

### Button (Shadcn/ui)
```tsx
type ButtonVariant = 'default' | 'ghost' | 'outline' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}
```

### Card
```tsx
interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

### PlayerCard (componente de juego)
```tsx
interface PlayerCardProps {
  player: Player;
  position: number;
  onClick: (player: Player) => void;
  selected: boolean;
  disabled: boolean;
}
```

## 🎯 Game Logic

### Leyenda Draft (inspirado en 101pts.com)
```typescript
// Lógica principal
const draftPlayer = (player: Player, position: Position) => {
  // Validar que el jugador pueda jugar en esa posición
  if (!player.positions.includes(position)) {
    return { success: false, message: 'El jugador no puede jugar en esa posición' };
  }
  
  // Calcular rating basado en estadísticas
  const rating = calculateRating(player, position);
  
  return { success: true, rating };
};

const calculateRating = (player: Player, position: Position): number => {
  const base = 50;
  const caps = player.capsClub / 10;
  const goals = player.goalsClub / 2;
  const trophies = player.trophies.length * 5;
  const marketValue = parseFloat(player.marketValue);
  
  return Math.min(100, base + caps + goals + trophies + (marketValue * 2));
};
```

### Modo Memoria (inspirado en 101pts.com)
```typescript
const startMemoryGame = (quizzes: Quiz[]) => {
  const shuffled = shuffle([...quizzes]).slice(0, 10);
  let score = 0;
  let currentQuestion = 0;
  
  const checkAnswer = (selectedOption: QuizOption) => {
    const correct = shuffled[currentQuestion].options.find(opt => opt.correct);
    if (selectedOption.correct) {
      score += 10;
      return true;
    }
    return false;
  };
  
  return { score, currentQuestion, checkAnswer };
};
```

## 🔗 Estado global (Zustand)

```typescript
import { create } from 'zustand';

interface GameStore {
  currentClub: Club | null;
  currentDecade: string;
  currentFormation: Formation;
  players: (Player | null)[];
  score: number;
  matches: number;
  setClub: (club: Club) => void;
  setDecade: (decade: string) => void;
  setFormation: (formation: Formation) => void;
  draftPlayer: (player: Player, position: number) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentClub: null,
  currentDecade: '2020s',
  currentFormation: '4-3-3',
  players: Array(11).fill(null),
  score: 0,
  matches: 0,
  
  setClub: (club) => set({ currentClub: club }),
  setDecade: (decade) => set({ currentDecade: decade }),
  setFormation: (formation) => set({ currentFormation: formation }),
  
  draftPlayer: (player, position) => set((state) => {
    const newPlayers = [...state.players];
    newPlayers[position] = player;
    return { players: newPlayers };
  }),
  
  reset: () => set({
    players: Array(11).fill(null),
    score: 0,
  }),
}));
```

## 📊 API Routes (Next.js)

### GET /api/players
```typescript
// Obtener jugadores filtrados
// ?club=boca-juniors&decade=1990s&position=ST
```

### POST /api/games
```typescript
// Guardar partida
{
  userId: string;
  clubId: string;
  decade: string;
  formation: Formation;
  players: string[]; // player IDs
  score: number;
  matches: number
}
```

### GET /api/leaderboard
```typescript
// Obtener ranking global
// ?limit=50&mode=legend-draft
```

## 🎵 Animaciones y efectos

```tsx
// Componente con Framer Motion
import { motion } from 'framer-motion';

const AnimatedCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="backdrop-blur-sm"
    >
      {children}
    </motion.div>
  );
};
```

## 🚀 Deployment

### Frontend: Vercel
```bash
# Instalar Vercel CLI
npm install -g vercel

# Desplegar
vercel
```

### Backend (API): Railway
```bash
# Push a GitHub
# Railway detecta cambios y deployea automáticamente
```

### Base de datos: Supabase
```bash
# Crear proyecto en Supabase
# Configurar variables de entorno (.env.local)
```

## 📝 Notas adicionales

1. **Imágenes:** Guardar en Supabase Storage con CDN
2. **Sonidos:** Pre-cargar para evitar retrasos
3. **Caching:** Usar Redis para evitar recargas de datos estáticos
4. **Analytics:** Implementar con Vercel Analytics o Google Analytics
5. **SEO:** Configurar metadata en layout.tsx para cada página
6. **Responsive:** Usar TailwindCSS responsive (sm, md, lg, xl)

## 🔧 Configuración de Tailwind

```js
// tailwind.config.ts
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

**Total estimado para frontend completo: ~10-15 días**
**Stack:** Next.js 14 + TypeScript + TailwindCSS + Framer Motion + Supabase + Zustand
