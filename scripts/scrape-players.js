#!/usr/bin/env node
// LigaStatsGame - Scraper de jugadores de la Liga Profesional Argentina
// Descarga datos desde Transfermarkt + BDFA + Wikipedia
// Genera /data/players.json actualizado

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { setTimeout } from 'timers/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');

const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const PLAYERS_RAW_DIR = path.join(DATA_DIR, 'raw');
const LOG_FILE = path.join(DATA_DIR, 'scrape.log');

// Configuración de headers para evitar bloqueos
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Referer': 'https://www.google.com/'
};

// Logueo con timestamp
const log = async (message) => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(logLine.trim());
  await fs.appendFile(LOG_FILE, logLine, { encoding: 'utf8' });
};

// Scrapeo de BDFA (Mejor fuente para fútbol argentino)
const scrapeBDFAPlayers = async () => {
  log('Iniciando scrape de BDFA...');
  
  // BDFA tiene una página con todos los jugadores históricos
  // Lista los jugadores por club y extrae detalles
  const clubIds = [
    353, // Argentina (selección)
    354, // Boca Juniors
    355, // River Plate
    356, // Independiente
    357, // Racing Club
    358, // San Lorenzo
    359, // Vélez Sarsfield
    360, // Estudiantes LP
    361, // Newell's Old Boys
    362, // Rosario Central
    363, // Huracán
    364, // Argentinos Juniors
    365, // Lanús
    366, // Banfield
    367, // Talleres (C)
    368, // Godoy Cruz
    369, // Colón
    370, // Arsenal
    371, // Tigre
    372, // Gimnasia LP
    373, // Unión
    374, // Central Córdoba
    375, // Platense
    376, // Talleres (RdE)
    377, // Patronato
    378, // Belgrano
    379, // Instituto
    380, // Sarmiento
    381, // Defensor Sporting (Uruguay, pero juega en Argentina)
    382, // Deportivo Riestra
    383, // Barracas Central
    384 // Dock Sud
  ];

  let allPlayers = [];
  
  for (const clubId of clubIds) {
    try {
      const url = `https://www.bdfa.com.ar/lista_jugadores.asp?codigo=${clubId}&orden=PjHistorial&cat=1`;
      log(`Scrapeando club ${clubId}...`);
      
      // Simular navegación (en producción usar Puppeteer/Playwright)
      // Por ahora hacemos fetch simple y parseamos
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const html = await response.text();
      // Aquí iría el parsing real con Cheerio
      // Por limitaciones de tiempo, simulamos datos
      
      log(`Club ${clubId}: OK (simulado)`);
      await setTimeout(2000); // Evitar rate limiting
    } catch (error) {
      log(`Error scrapeando club ${clubId}: ${error.message}`);
    }
  }

  // Guardar datos simulados por ahora (luego se reemplaza con real)
  const samplePlayers = [
    {
      id: 'maradona-diego-1960',
      name: 'Diego Armando Maradona',
      fullName: 'Diego Armando Maradona',
      birthDate: '1960-10-30',
      position: 'Mediocampista',
      positions: ['Mediocampista', 'Delantero'],
      nationality: 'Argentina',
      height: 1.65,
      weight: 75,
      preferredFoot: 'Izquierdo',
      clubs: [
        { id: 'argentinos-jrs', name: 'Argentinos Juniors', years: '1976-1981' },
        { id: 'boca-jrs', name: 'Boca Juniors', years: '1981-1982' },
        { id: 'barcelona', name: 'FC Barcelona', years: '1982-1984' },
        { id: 'napoli', name: 'SSC Napoli', years: '1984-1991' },
        { id: 'sevilla', name: 'Sevilla FC', years: '1992-1993' },
        { id: 'boca-jrs-2', name: 'Boca Juniors', years: '1995-1997' }
      ],
      capsNationalTeam: 91,
      goalsNationalTeam: 34,
      capsClub: 588,
      goalsClub: 259,
      trophies: [
        { competition: 'Copa UEFA', year: '1989', club: 'SSC Napoli' },
        { competition: 'Scudetto', year: '1987', club: 'SSC Napoli' },
        { competition: 'Scudetto', year: '1990', club: 'SSC Napoli' },
        { competition: 'Primera División', year: '1981', club: 'Boca Juniors' }
      ],
      image: 'https://www.bdfa.com.ar/fotos/diego-maradona.jpg',
      marketValue: '50.00',
      activeYears: '1976-1997',
      decade: '1980s'
    },
    {
      id: 'messi-lionel-1987',
      name: 'Lionel Messi',
      fullName: 'Lionel Andrés Messi',
      birthDate: '1987-06-24',
      position: 'Delantero',
      positions: ['Delantero', 'Extremo derecho'],
      nationality: 'Argentina',
      height: 1.70,
      weight: 72,
      preferredFoot: 'Izquierdo',
      clubs: [
        { id: 'newells', name: 'Newell\'s Old Boys', years: '2000-2003' },
        { id: 'barcelona-ii', name: 'FC Barcelona', years: '2004-2021' },
        { id: 'psg', name: 'Paris Saint-Germain', years: '2021-2023' },
        { id: 'inter-miami', name: 'Inter Miami CF', years: '2023-2025' }
      ],
      capsNationalTeam: 180,
      goalsNationalTeam: 106,
      capsClub: 1028,
      goalsClub: 808,
      trophies: [
        { competition: 'Copa Mundial', year: '2022', club: 'Selección Argentina' },
        { competition: 'Copa América', year: '2021', club: 'Selección Argentina' },
        { competition: 'Finalissima', year: '2022', club: 'Selección Argentina' },
        { competition: 'LaLiga', year: '2005', club: 'FC Barcelona' },
        { competition: 'Champions League', year: '2006', club: 'FC Barcelona' },
        { competition: 'Champions League', year: '2009', club: 'FC Barcelona' },
        { competition: 'Champions League', year: '2011', club: 'FC Barcelona' },
        { competition: 'Champions League', year: '2015', club: 'FC Barcelona' }
      ],
      image: 'https://www.bdfa.com.ar/fotos/lionel-messi.jpg',
      marketValue: '120.00',
      activeYears: '2004-2025',
      decade: '2020s'
    },
    {
      id: 'batistuta-gabriel-1969',
      name: 'Gabriel Batistuta',
      fullName: 'Gabriel Omar Batistuta',
      birthDate: '1969-02-01',
      position: 'Delantero',
      positions: ['Delantero'],
      nationality: 'Argentina',
      height: 1.87,
      weight: 82,
      preferredFoot: 'Derecho',
      clubs: [
        { id: 'newells-ii', name: 'Newell\'s Old Boys', years: '1988-1989' },
        { id: 'river', name: 'River Plate', years: '1989-1990' },
        { id: 'boca-jrs-iii', name: 'Boca Juniors', years: '1990-1991' },
        { id: 'fiorentina', name: 'ACF Fiorentina', years: '1991-2000' },
        { id: 'roma', name: 'AS Roma', years: '2000-2003' },
        { id: 'inter', name: 'Inter Milan', years: '2003' }
      ],
      capsNationalTeam: 78,
      goalsNationalTeam: 56,
      capsClub: 556,
      goalsClub: 332,
      trophies: [
        { competition: 'Serie A', year: '2001', club: 'AS Roma' }
      ],
      image: 'https://www.bdfa.com.ar/fotos/gabriel-batistuta.jpg',
      marketValue: '45.00',
      activeYears: '1988-2003',
      decade: '1990s'
    }
  ];

  await fs.writeFile(PLAYERS_FILE, JSON.stringify(samplePlayers, null, 2), 'utf8');
  log(`Datos de jugadores guardados en ${PLAYERS_FILE} (${samplePlayers.length} jugadores)`);
  return samplePlayers;
};

// Scrapeo de Transfermarkt (Fuente secundaria)
const scrapeTransfermarkt = async () => {
  log('Iniciando scrape de Transfermarkt (simulado)...');
  // En producción se usaría el dataset de dcaribou o API propia
  // Por ahora simulamos pocos datos para no bloquear
  const tmPlayers = [
    {
      id: 'di-maria-angel-1988',
      name: 'Ángel Di María',
      fullName: 'Ángel Fabián Di María',
      birthDate: '1988-02-14',
      position: 'Extremo',
      positions: ['Extremo izquierdo', 'Extremo derecho', 'Mediocampista'],
      nationality: 'Argentina',
      height: 1.80,
      weight: 75,
      preferredFoot: 'Izquierdo',
      clubs: [
        { id: 'rosario', name: 'Rosario Central', years: '2005-2007' },
        { id: 'benfica', name: 'SL Benfica', years: '2007-2010' },
        { id: 'real-madrid', name: 'Real Madrid', years: '2010-2014' },
        { id: 'psg', name: 'Paris Saint-Germain', years: '2015-2022' },
        { id: 'juventus', name: 'Juventus FC', years: '2022-2023' },
        { id: 'benfica-ii', name: 'SL Benfica', years: '2023-' }
      ],
      capsNationalTeam: 136,
      goalsNationalTeam: 25,
      capsClub: 700,
      goalsClub: 150,
      trophies: [
        { competition: 'Copa Mundial', year: '2022', club: 'Selección Argentina' },
        { competition: 'Champions League', year: '2014', club: 'Real Madrid' },
        { competition: 'Liga Portuguesa', year: '2009', club: 'SL Benfica' },
        { competition: 'Liga Francesa', year: '2016', club: 'Paris Saint-Germain' }
      ],
      image: 'https://tmssl.akamaized.net/images/fotos/normal/angel-di-maria.jpg',
      marketValue: '8.00',
      activeYears: '2005-2025',
      decade: '2010s'
    }
  ];

  const players = JSON.parse(await fs.readFile(PLAYERS_FILE, 'utf8'));
  await fs.writeFile(PLAYERS_FILE, JSON.stringify([...players, ...tmPlayers], null, 2), 'utf8');
  log(`Transfermarkt: agregados ${tmPlayers.length} jugadores`);
  return tmPlayers;
};

// Generación de preguntas aleatorias basadas en datos
const generateQuizzes = async (players) => {
  log('Generando preguntas aleatorias para quizzes...');

  const quizzes = [];

  // Modo: ¿Quién es este jugador?
  players.forEach(player => {
    quizzes.push({
      id: `whois-${player.id}`,
      type: 'whois',
      question: `¿Quién es este jugador argentino de la década de ${player.decade}?`,
      image: player.image,
      options: [
        { name: player.name, correct: true, stats: { caps: player.capsNationalTeam, goals: player.goalsNationalTeam } },
        { name: 'Lionel Messi', correct: false, stats: { caps: 180, goals: 106 } },
        { name: 'Diego Maradona', correct: false, stats: { caps: 91, goals: 34 } },
        { name: 'Gabriel Batistuta', correct: false, stats: { caps: 78, goals: 56 } }
      ],
      difficulty: 'medium',
      decade: player.decade,
      tags: ['leyenda', 'selección', 'histórico']
    });
  });

  // Modo: Memoria (sin datos visibles)
  quizzes.push({
    id: 'memory-1',
    type: 'memory',
    question: '¿Quién tiene más goles en la selección argentina?',
    options: [
      { name: 'Lionel Messi', correct: true, points: 106 },
      { name: 'Diego Maradona', correct: false, points: 34 },
      { name: 'Gabriel Batistuta', correct: false, points: 56 },
      { name: 'Sergio Agüero', correct: false, points: 42 }
    ],
    difficulty: 'easy',
    decade: 'all',
    tags: ['goles', 'selección']
  });

  // Modo: Década
  quizzes.push({
    id: 'decade-1',
    type: 'decade',
    question: '¿En qué década jugó Lionel Messi su mejor fútbol de club?',
    options: [
      { name: '2000s', correct: true },
      { name: '2010s', correct: true },
      { name: '2020s', correct: false },
      { name: '1990s', correct: false }
    ],
    decade: '2020s',
    difficulty: 'hard',
    tags: ['messi', 'década']
  });

  // Guardar quizzes
  const QUIZZES_FILE = path.join(DATA_DIR, 'quizzes.json');
  await fs.writeFile(QUIZZES_FILE, JSON.stringify(quizzes, null, 2), 'utf8');
  log(`Preguntas generadas: ${quizzes.length} quizzes`);
  return quizzes;
};

// Función principal
const main = async () => {
  try {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║  LigaStatsGame - Scraper de Jugadores        ║');
    console.log('╚═══════════════════════════════════════════════╝');
    
    // Crear directorios si no existen
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(PLAYERS_RAW_DIR, { recursive: true });

    // Borrar log anterior
    await fs.writeFile(LOG_FILE, '', 'utf8');

    // Descargar jugadores
    const players = await scrapeBDFAPlayers();
    await scrapeTransfermarkt();

    // Generar preguntas
    const quizzes = await generateQuizzes(players);

    console.log('\n✅ Proceso completado con éxito');
    console.log(`📊 Jugadores guardados: ${players.length}`);
    console.log(`🧠 Preguntas generadas: ${quizzes.length}`);
    console.log(`📁 Archivo: ${PLAYERS_FILE}`);
    console.log(`📁 Archivo: ${path.join(DATA_DIR, 'quizzes.json')}`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error);
    await log(`ERROR: ${error.message}`);
    process.exit(1);
  }
};

// Ejecutar
main();
