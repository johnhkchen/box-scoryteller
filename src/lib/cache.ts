/**
 * SQLite Cache for LLM Results
 *
 * Caches parsed box scores and trigger detection results to enable rapid iteration
 * without waiting on LLM calls. The cache is keyed by content hash, so identical
 * inputs will always return cached results.
 */

import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');
const DB_PATH = join(PROJECT_ROOT, 'inbox', 'cache.db');

// Ensure inbox directory exists
const inboxDir = dirname(DB_PATH);
if (!existsSync(inboxDir)) {
  mkdirSync(inboxDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize schema
db.exec(`
  -- Raw box score text inputs
  CREATE TABLE IF NOT EXISTS raw_inputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE NOT NULL,
    content_hash TEXT NOT NULL,
    content TEXT NOT NULL,
    sport TEXT,
    game_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Parsed BoxScore JSON (output of ParseBoxScore)
  CREATE TABLE IF NOT EXISTS parsed_boxscores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_hash TEXT UNIQUE NOT NULL,
    boxscore_json TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Detected triggers (output of DetectTriggers)
  CREATE TABLE IF NOT EXISTS triggers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    boxscore_hash TEXT UNIQUE NOT NULL,
    triggers_json TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Interview questions (output of OnboardingInterview and GameInterview)
  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_hash TEXT UNIQUE NOT NULL,
    interview_type TEXT NOT NULL,  -- 'onboarding' or 'game'
    questions_json TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Narrative synthesis results
  CREATE TABLE IF NOT EXISTS narratives (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_hash TEXT UNIQUE NOT NULL,
    narrative_json TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Game recaps (output of GenerateRecap)
  CREATE TABLE IF NOT EXISTS recaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_hash TEXT UNIQUE NOT NULL,
    recap_json TEXT NOT NULL,
    model TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- In-progress jobs (for deduplication during long LLM calls)
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    input_hash TEXT NOT NULL,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    phase TEXT NOT NULL DEFAULT 'queued',
    phase_message TEXT,
    result_json TEXT,
    error TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Create indexes for fast lookups
  CREATE INDEX IF NOT EXISTS idx_raw_inputs_hash ON raw_inputs(content_hash);
  CREATE INDEX IF NOT EXISTS idx_parsed_boxscores_hash ON parsed_boxscores(input_hash);
  CREATE INDEX IF NOT EXISTS idx_triggers_hash ON triggers(boxscore_hash);
  CREATE INDEX IF NOT EXISTS idx_recaps_hash ON recaps(input_hash);
  CREATE INDEX IF NOT EXISTS idx_jobs_input_hash ON jobs(input_hash);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
`);

/**
 * Generate a SHA-256 hash of content for cache keys
 */
export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Store raw box score input
 */
export function storeRawInput(
  filePath: string,
  content: string,
  sport?: string,
  gameDate?: string
): string {
  const contentHash = hashContent(content);

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO raw_inputs (file_path, content_hash, content, sport, game_date)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(filePath, contentHash, content, sport ?? null, gameDate ?? null);
  return contentHash;
}

/**
 * Get raw input by file path
 */
export function getRawInput(filePath: string): { content: string; contentHash: string } | null {
  const stmt = db.prepare('SELECT content, content_hash FROM raw_inputs WHERE file_path = ?');
  const row = stmt.get(filePath) as { content: string; content_hash: string } | undefined;
  return row ? { content: row.content, contentHash: row.content_hash } : null;
}

/**
 * Store parsed box score result
 */
export function storeParsedBoxScore(inputHash: string, boxScore: object, model?: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO parsed_boxscores (input_hash, boxscore_json, model)
    VALUES (?, ?, ?)
  `);
  stmt.run(inputHash, JSON.stringify(boxScore), model ?? null);
}

/**
 * Get cached parsed box score
 */
export function getParsedBoxScore(inputHash: string): object | null {
  const stmt = db.prepare('SELECT boxscore_json FROM parsed_boxscores WHERE input_hash = ?');
  const row = stmt.get(inputHash) as { boxscore_json: string } | undefined;
  return row ? JSON.parse(row.boxscore_json) : null;
}

/**
 * Store trigger detection results
 */
export function storeTriggers(boxScoreHash: string, triggers: object, model?: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO triggers (boxscore_hash, triggers_json, model)
    VALUES (?, ?, ?)
  `);
  stmt.run(boxScoreHash, JSON.stringify(triggers), model ?? null);
}

/**
 * Get cached triggers for a box score
 */
export function getTriggers(boxScoreHash: string): object | null {
  const stmt = db.prepare('SELECT triggers_json FROM triggers WHERE boxscore_hash = ?');
  const row = stmt.get(boxScoreHash) as { triggers_json: string } | undefined;
  return row ? JSON.parse(row.triggers_json) : null;
}

/**
 * Store interview questions
 */
export function storeInterview(
  inputHash: string,
  interviewType: 'onboarding' | 'game',
  questions: object,
  model?: string
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO interviews (input_hash, interview_type, questions_json, model)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(inputHash, interviewType, JSON.stringify(questions), model ?? null);
}

/**
 * Get cached interview questions
 */
export function getInterview(inputHash: string): object | null {
  const stmt = db.prepare('SELECT questions_json FROM interviews WHERE input_hash = ?');
  const row = stmt.get(inputHash) as { questions_json: string } | undefined;
  return row ? JSON.parse(row.questions_json) : null;
}

/**
 * Store narrative synthesis results
 */
export function storeNarrative(inputHash: string, narrative: object, model?: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO narratives (input_hash, narrative_json, model)
    VALUES (?, ?, ?)
  `);
  stmt.run(inputHash, JSON.stringify(narrative), model ?? null);
}

/**
 * Get cached narrative
 */
export function getNarrative(inputHash: string): object | null {
  const stmt = db.prepare('SELECT narrative_json FROM narratives WHERE input_hash = ?');
  const row = stmt.get(inputHash) as { narrative_json: string } | undefined;
  return row ? JSON.parse(row.narrative_json) : null;
}

/**
 * Store game recap result
 */
export function storeRecap(inputHash: string, recap: object, model?: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO recaps (input_hash, recap_json, model)
    VALUES (?, ?, ?)
  `);
  stmt.run(inputHash, JSON.stringify(recap), model ?? null);
}

/**
 * Get cached recap
 */
export function getRecap(inputHash: string): object | null {
  const stmt = db.prepare('SELECT recap_json FROM recaps WHERE input_hash = ?');
  const row = stmt.get(inputHash) as { recap_json: string } | undefined;
  return row ? JSON.parse(row.recap_json) : null;
}

// Job types for the queue
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type JobPhase = 'queued' | 'validating' | 'calling_llm' | 'parsing_response' | 'complete' | 'error';

export interface Job {
  id: string;
  inputHash: string;
  jobType: string;
  status: JobStatus;
  phase: JobPhase;
  phaseMessage: string | null;
  result: object | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create or get existing job
 */
export function createOrGetJob(jobId: string, inputHash: string, jobType: string): Job {
  // First check if job already exists
  const existing = getJob(jobId);
  if (existing) {
    return existing;
  }

  // Create new job
  const stmt = db.prepare(`
    INSERT INTO jobs (id, input_hash, job_type, status, phase, phase_message)
    VALUES (?, ?, ?, 'pending', 'queued', 'Job queued')
  `);
  stmt.run(jobId, inputHash, jobType);

  return getJob(jobId)!;
}

/**
 * Get job by ID
 */
export function getJob(jobId: string): Job | null {
  const stmt = db.prepare(`
    SELECT id, input_hash, job_type, status, phase, phase_message, result_json, error, created_at, updated_at
    FROM jobs WHERE id = ?
  `);
  const row = stmt.get(jobId) as {
    id: string;
    input_hash: string;
    job_type: string;
    status: string;
    phase: string;
    phase_message: string | null;
    result_json: string | null;
    error: string | null;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    inputHash: row.input_hash,
    jobType: row.job_type,
    status: row.status as JobStatus,
    phase: row.phase as JobPhase,
    phaseMessage: row.phase_message,
    result: row.result_json ? JSON.parse(row.result_json) : null,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get job by input hash (to find existing jobs for the same input)
 */
export function getJobByInputHash(inputHash: string, jobType: string): Job | null {
  const stmt = db.prepare(`
    SELECT id, input_hash, job_type, status, phase, phase_message, result_json, error, created_at, updated_at
    FROM jobs
    WHERE input_hash = ? AND job_type = ? AND status IN ('pending', 'processing')
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const row = stmt.get(inputHash, jobType) as {
    id: string;
    input_hash: string;
    job_type: string;
    status: string;
    phase: string;
    phase_message: string | null;
    result_json: string | null;
    error: string | null;
    created_at: string;
    updated_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    inputHash: row.input_hash,
    jobType: row.job_type,
    status: row.status as JobStatus,
    phase: row.phase as JobPhase,
    phaseMessage: row.phase_message,
    result: row.result_json ? JSON.parse(row.result_json) : null,
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Update job phase
 */
export function updateJobPhase(jobId: string, phase: JobPhase, message: string): void {
  let status: JobStatus = 'processing';
  if (phase === 'queued') status = 'pending';
  else if (phase === 'complete') status = 'completed';
  else if (phase === 'error') status = 'failed';

  const stmt = db.prepare(`
    UPDATE jobs
    SET phase = ?, phase_message = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(phase, message, status, jobId);
}

/**
 * Complete job with result
 */
export function completeJob(jobId: string, result: object): void {
  const stmt = db.prepare(`
    UPDATE jobs
    SET status = 'completed', phase = 'complete', phase_message = 'Job completed successfully',
        result_json = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(JSON.stringify(result), jobId);
}

/**
 * Fail job with error
 */
export function failJob(jobId: string, error: string): void {
  const stmt = db.prepare(`
    UPDATE jobs
    SET status = 'failed', phase = 'error', phase_message = ?, error = ?, updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(error, error, jobId);
}

/**
 * Delete a job
 */
export function deleteJob(jobId: string): void {
  const stmt = db.prepare('DELETE FROM jobs WHERE id = ?');
  stmt.run(jobId);
}

/**
 * Clean up old completed/failed jobs (older than TTL)
 */
export function cleanupOldJobs(ttlMinutes: number = 60): number {
  const stmt = db.prepare(`
    DELETE FROM jobs
    WHERE status IN ('completed', 'failed')
    AND datetime(updated_at) < datetime('now', '-' || ? || ' minutes')
  `);
  const result = stmt.run(ttlMinutes);
  return result.changes;
}

/**
 * Reset stale in-progress jobs (in case of server crash)
 */
export function resetStaleJobs(staleMinutes: number = 5): number {
  const stmt = db.prepare(`
    UPDATE jobs
    SET status = 'failed', phase = 'error', phase_message = 'Job timed out or server restarted',
        error = 'Job was interrupted', updated_at = datetime('now')
    WHERE status = 'processing'
    AND datetime(updated_at) < datetime('now', '-' || ? || ' minutes')
  `);
  const result = stmt.run(staleMinutes);
  return result.changes;
}

/**
 * Get all raw inputs (for batch processing)
 */
export function getAllRawInputs(): Array<{
  filePath: string;
  contentHash: string;
  sport: string | null;
  gameDate: string | null;
}> {
  const stmt = db.prepare('SELECT file_path, content_hash, sport, game_date FROM raw_inputs');
  return stmt.all() as Array<{
    file_path: string;
    content_hash: string;
    sport: string | null;
    game_date: string | null;
  }>;
}

/**
 * Get stats about what's cached
 */
export function getCacheStats(): {
  rawInputs: number;
  parsedBoxScores: number;
  triggers: number;
  interviews: number;
  narratives: number;
} {
  return {
    rawInputs: (db.prepare('SELECT COUNT(*) as count FROM raw_inputs').get() as { count: number }).count,
    parsedBoxScores: (db.prepare('SELECT COUNT(*) as count FROM parsed_boxscores').get() as { count: number }).count,
    triggers: (db.prepare('SELECT COUNT(*) as count FROM triggers').get() as { count: number }).count,
    interviews: (db.prepare('SELECT COUNT(*) as count FROM interviews').get() as { count: number }).count,
    narratives: (db.prepare('SELECT COUNT(*) as count FROM narratives').get() as { count: number }).count,
  };
}

/**
 * Close the database connection (call on shutdown)
 */
export function closeCache(): void {
  db.close();
}

export { db };
