/**
 * Box Score Fetcher for College of Marin Athletics
 *
 * Fetches basketball box scores from athletics.marin.edu and stores them
 * as plain-text files in the inbox/raw directory. Uses the monospace template
 * format which is cleaner for parsing with the BAML ParseBoxScore function.
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');
const RAW_DIR = join(PROJECT_ROOT, 'inbox/raw');

export type Sport = 'mbkb' | 'wbkb' | 'bsb' | 'wwaterpolo';

export interface GameInfo {
  date: string;       // YYYY-MM-DD
  opponent: string;
  result: string;     // "W, 78-65" or "L, 65-70"
  boxScoreUrl: string;
  gameCode: string;
}

export interface FetchResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Parse the schedule page to extract game information
 */
export async function fetchSchedule(sport: Sport, season: string): Promise<GameInfo[]> {
  const url = `https://athletics.marin.edu/sports/${sport}/${season}/schedule`;

  console.log(`Fetching schedule from ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch schedule: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const games: GameInfo[] = [];

  // Parse box score links from the HTML
  // Pattern: /sports/mbkb/2023-24/boxscores/20231101_17et.xml
  // (URLs in HTML are .xml, but we fetch the text template and save as .txt)
  const boxScoreRegex = new RegExp(
    `\\/sports\\/${sport}\\/${season}\\/boxscores\\/(\\d{8})_(\\w+)\\.xml`,
    'g'
  );

  let match;
  const seen = new Set<string>();

  while ((match = boxScoreRegex.exec(html)) !== null) {
    const [fullUrl, dateStr, gameCode] = match;
    const uniqueKey = `${dateStr}_${gameCode}`;

    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    // Convert YYYYMMDD to YYYY-MM-DD
    const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

    // For basketball, use the monospace template for cleaner plain-text output
    // For baseball and water polo, use the raw HTML since no text template exists
    const boxScoreUrl = (sport === 'bsb' || sport === 'wwaterpolo')
      ? `https://athletics.marin.edu${fullUrl}`
      : `https://athletics.marin.edu${fullUrl}?tmpl=bbxml-monospace-template`;

    games.push({
      date,
      opponent: 'Unknown', // Would need more parsing to get this
      result: 'Unknown',
      boxScoreUrl,
      gameCode
    });
  }

  console.log(`Found ${games.length} games with box scores`);
  return games;
}

/**
 * Fetch a single box score XML file and save it
 */
export async function fetchBoxScore(
  sport: Sport,
  game: GameInfo,
  options: { delay?: number } = {}
): Promise<FetchResult> {
  const { delay = 500 } = options;

  // Rate limiting
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    const response = await fetch(game.boxScoreUrl);
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const text = await response.text();

    // Save to inbox/raw - use .html extension for baseball and water polo since it's HTML content
    const extension = (sport === 'bsb' || sport === 'wwaterpolo') ? 'html' : 'txt';
    const filename = `${game.date}_${sport}_${game.gameCode}.${extension}`;
    const filePath = join(RAW_DIR, filename);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, text, 'utf-8');

    return {
      success: true,
      filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetch all box scores for a sport and season
 */
export async function fetchAllBoxScores(
  sport: Sport,
  season: string,
  options: { delay?: number; maxGames?: number } = {}
): Promise<{ fetched: number; failed: number; skipped: number }> {
  const { delay = 500, maxGames } = options;

  const games = await fetchSchedule(sport, season);
  const toFetch = maxGames ? games.slice(0, maxGames) : games;

  let fetched = 0;
  let failed = 0;
  let skipped = 0;

  for (const game of toFetch) {
    const extension = (sport === 'bsb' || sport === 'wwaterpolo') ? 'html' : 'txt';
    const filename = `${game.date}_${sport}_${game.gameCode}.${extension}`;
    const filePath = join(RAW_DIR, filename);

    // Skip if already fetched
    if (existsSync(filePath)) {
      console.log(`Skipping ${filename} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`Fetching ${filename}...`);
    const result = await fetchBoxScore(sport, game, { delay });

    if (result.success) {
      console.log(`  Saved to ${result.filePath}`);
      fetched++;
    } else {
      console.error(`  Failed: ${result.error}`);
      failed++;
    }
  }

  return { fetched, failed, skipped };
}

/**
 * List available seasons for a sport
 */
export function getAvailableSeasons(): string[] {
  // College basketball seasons span two calendar years
  // The 2023-24 season means games from fall 2023 through spring 2024
  return ['2023-24', '2022-23', '2021-22'];
}
