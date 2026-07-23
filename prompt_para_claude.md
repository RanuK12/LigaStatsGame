# PROMPT Y PLAN DE EJECUCIÓN MAESTRO PARA CLAUDE
=====================================================================
Este documento contiene las especificaciones detalladas, auditoría y prompt listo para que Claude ejecute la siguiente fase de desarrollo de **Draft Tres Estrellas / LigaStatsGame**.

---

## 📋 PROMPT PRINCIPAL PARA CLAUDE

```text
Actúa como Antigravity / Senior Full-Stack Engineer especializado en Next.js, React, Tailwind CSS y juegos deportivos. Tu objetivo es realizar una actualización integral de LigaStatsGame (Draft Tres Estrellas - El Juego del Fútbol Argentino) ubicada en /Users/emilioranucoli/Desktop/Oficina_Ranuk/LigaStatsGame.

Debes ejecutar las siguientes tareas con máxima calidad profesional:

=====================================================================
1. CORRECCIÓN Y PROFESIONALIZACIÓN DEL SISTEMA DE AUTH (AuthModal)
=====================================================================
- BUGFIX: Corregir el AuthModal (components/AuthModal.tsx) para que se pueda cerrar en cualquier momento al presionar la '✕', la tecla ESC o hacer clic en el backdrop transparente.
- INTEGRACIÓN OAUTH PROFESIONAL: Agregar botones de inicio de sesión social con Google y Twitter/X a través de Supabase Auth, permitiendo crear la base de datos de usuarios registrados en tiempo real además del modo invitado por apodo.
- HEADER: Asegurar que el botón del usuario en el Header actualice el avatar, username y badge de ELO (⚡ 1000 ELO) automáticamente.

=====================================================================
2. MODO CARRERA / LEYENDA INTERACTIVO (Inspirado en Copero)
=====================================================================
- AUDITORÍA COPERO (copero.com.ar): Implementar un Modo Carrera verdaderamente interactivo en /app/carrera/page.tsx.
- FUNCIONALIDAD INTERACTIVA: El usuario debe poder:
  a) Crear su propio jugador personalizado (Nombre, Dorsal, Posición, Nacionalidad) o seleccionar un jugador real de la base.
  b) Elegir su club de inicio en la Liga Profesional o Sudamérica.
  c) Simular temporada a temporada (1 a 15 años) participando en Liga Profesional, Copa Argentina, Copa Libertadores y Copa Sudamericana.
  d) Recibir ofertas de transferencias entre clubes, aumentar su Valor de Mercado en Millones (€M), su OVR y acumular trofeos reales.
  e) Generar y descargar la FICHA COPERO-STYLE HD (PDF / Imagen PNG) con OVR dorado 3D, Bandera 🇦🇷, Valor €M, PJ/GLS/AST, escudos de trayectoria y trofeos 3D rendereados con contadores (×3 Libertadores, ×1 Sudamericana, etc.).

=====================================================================
3. RESULTADOS EN VIVO REALES EN LA HOME (Widget al día)
=====================================================================
- Reemplazar la data simulada de LiveScoresWidget.tsx por una integración de datos reales de partidos al día.
- Utilizar una API deportiva gratuita/pública o script de sincronización diaria (ej: TheSportsDB / football-data.org / Supabase cache) para cargar partidos reales de la Liga Profesional Argentina, Copa Libertadores y Ligas Top (LaLiga, Premier, Champions).
- Mantener la ubicación en la parte inferior de la Home sin opacar el Héroe del Draft.

=====================================================================
4. VERIFICACIÓN Y ASIGNACIÓN DE ESCUDOS FALTANTES
=====================================================================
- Asegurar que los escudos HD en formato PNG/SVG transparente existan y carguen correctamente en ambas rutas (/public/logos/ y /public/logos/clubs/) para:
  1. Colón (colon)
  2. Central Córdoba (central-cordoba)
  3. Barracas Central (barracas-central)
  4. Deportivo Riestra (riestra)
  5. Independiente Rivadavia (independiente-rivadavia)
  6. Aldosivi (aldosivi)

=====================================================================
5. SCRAPING Y DEPURACIÓN CONTINUA DE JUGADORES
=====================================================================
- Verificar la base de datos de 4.095 jugadores en data/players.json.
- Incluir un script de scraping/enriquecimiento (Transfermarkt / Wikipedia) para asegurar que los campos de marketValue, activeYears, decade, trophies y fotos estén completos.

=====================================================================
6. SECCIÓN DE DONACIONES CON MERCADOPAGO Y STRIPE INTEGRADOS
=====================================================================
- Rediseñar la sección de donaciones en la Home (components/DonationSection.tsx o app/page.tsx) con un diseño visualmente irresistible y gratificante para el donante.
- Integración MercadoPago: Enlace de preferencia / Alias directo (ej. ranuk.mp) y QR con montos sugeridos ($1.000, $2.500, $5.000 ARS).
- Integración Stripe: Enlace Checkout ($5, $10, $25 USD) para fanáticos internacionales.

=====================================================================
7. AUDITORÍA DE UI/UX Y MOBILE RESPONSIVENESS COMPLETA
=====================================================================
- Auditar y pulir la tipografía, contraste y experiencia en móviles (320px a 412px).
- Ejecutar tests unitarios (npx vitest run) y build de producción (npm run build).
- Subir los cambios a GitHub en la rama main.
```

---

## 🎯 PLAN DE IMPLEMENTACIÓN PASO A PASO

### Paso 1: Fix de AuthModal y OAuth con Supabase (`components/AuthModal.tsx`)
1. Agregar manejador `onKeyDown` para tecla ESC y evento de click fuera del modal (backdrop).
2. Agregar botones visuales para "Iniciar Sesión con Google" y "Iniciar Sesión con X / Twitter".

### Paso 2: Modo Carrera Interactivo (`app/carrera/page.tsx` & `components/pitch/CareerCardView.tsx`)
1. Crear flujo de creación de personaje: paso 1 (Datos & Foto/Avatar), paso 2 (Selección de Club Inicial), paso 3 (Simulación de Carrera paso a paso).
2. Conectar la Ficha HD con los datos dinámicos generados por la carrera interactiva del usuario.

### Paso 3: Data Real de Partidos (`components/LiveScoresWidget.tsx`)
1. Integrar servicio de sincronización diaria en `scripts/fetch_live_scores.py` / API client.
2. Renderizar los partidos reales de la fecha de Liga Argentina y Europa.

### Paso 4: Donaciones MercadoPago & Stripe (`components/DonationSection.tsx`)
1. Botones interactivos de donación MercadoPago ($1000, $2500, $5000 ARS) y Stripe Checkout ($5, $10 USD).
2. Badges de agradecimiento y animaciones de impacto positivo.

### Paso 5: QA, Tests & Build
1. Correr suite de vitest: `npx vitest run`.
2. Correr build estático de producción: `npm run build`.
3. Commit y push a `origin/main`.
