import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import Database from 'better-sqlite3';
import { join } from 'path';
import { createHash } from 'crypto';

const DB_PATH = join(process.cwd(), 'inbox', 'cache.db');

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

interface RawInput {
  id: number;
  file_path: string;
  content_hash: string;
  sport: string | null;
  game_date: string | null;
  created_at: string;
}

interface ParsedBoxScore {
  input_hash: string;
  boxscore_json: string;
  model: string | null;
  created_at: string;
}

interface TriggerRecord {
  boxscore_hash: string;
  triggers_json: string;
  model: string | null;
  created_at: string;
}

export const GET: RequestHandler = async ({ url }) => {
  const db = new Database(DB_PATH, { readonly: true });

  try {
    // Get all raw inputs with their parsed data and triggers
    const rawInputs = db.prepare(`
      SELECT id, file_path, content_hash, sport, game_date, created_at
      FROM raw_inputs
      ORDER BY game_date DESC
    `).all() as RawInput[];

    const parsedBoxScores = db.prepare(`
      SELECT input_hash, boxscore_json, model, created_at
      FROM parsed_boxscores
    `).all() as ParsedBoxScore[];

    const triggers = db.prepare(`
      SELECT boxscore_hash, triggers_json, model, created_at
      FROM triggers
    `).all() as TriggerRecord[];

    // Create lookup maps
    const parsedMap = new Map(parsedBoxScores.map(p => [p.input_hash, JSON.parse(p.boxscore_json)]));
    const triggersMap = new Map(triggers.map(t => [t.boxscore_hash, JSON.parse(t.triggers_json)]));

    // Combine data
    const games = rawInputs.map(raw => {
      const boxScore = parsedMap.get(raw.content_hash);
      // Triggers are keyed by hash of the BoxScore JSON, not the raw input hash
      const boxScoreHash = boxScore ? hashContent(JSON.stringify(boxScore)) : null;
      const triggerData = boxScoreHash ? triggersMap.get(boxScoreHash) : null;

      return {
        id: raw.id,
        filePath: raw.file_path,
        contentHash: raw.content_hash,
        sport: raw.sport,
        gameDate: raw.game_date,
        importedAt: raw.created_at,
        parsed: !!boxScore,
        boxScore: boxScore || null,
        triggers: triggerData?.triggers || null
      };
    });

    // Get stats
    const stats = {
      totalGames: rawInputs.length,
      parsedGames: parsedBoxScores.length,
      gamesWithTriggers: triggers.length,
      sports: [...new Set(rawInputs.map(r => r.sport).filter(Boolean))]
    };

    return json({ games, stats });
  } finally {
    db.close();
  }
};
