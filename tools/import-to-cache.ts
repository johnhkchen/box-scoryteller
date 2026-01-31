#!/usr/bin/env npx tsx

/**
 * Import raw box score files into the SQLite cache
 *
 * Usage:
 *   npx tsx tools/import-to-cache.ts
 *   npx tsx tools/import-to-cache.ts --stats
 */

import { readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { storeRawInput, getCacheStats } from '../src/lib/cache.js';

const RAW_DIR = join(process.cwd(), 'inbox/raw');

function parseFilename(filename: string): { sport: string | null; gameDate: string | null } {
  // Pattern: 2023-11-01_wbkb_euf7.txt or 2026-01-30_bsb_crvb.html
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\w+)_\w+\.(txt|html)$/);
  if (match) {
    return {
      gameDate: match[1],
      sport: match[2]
    };
  }
  return { sport: null, gameDate: null };
}

function importRawFiles(): void {
  console.log(`Scanning ${RAW_DIR} for box score files...\n`);

  const files = readdirSync(RAW_DIR).filter(f => f.endsWith('.txt') || f.endsWith('.html'));
  console.log(`Found ${files.length} box score files\n`);

  let imported = 0;

  for (const file of files) {
    const filePath = join(RAW_DIR, file);
    const content = readFileSync(filePath, 'utf-8');
    const { sport, gameDate } = parseFilename(file);

    const hash = storeRawInput(filePath, content, sport ?? undefined, gameDate ?? undefined);
    console.log(`Imported ${file} (hash: ${hash.slice(0, 8)}...)`);
    imported++;
  }

  console.log(`\nImported ${imported} files`);
}

function showStats(): void {
  const stats = getCacheStats();
  console.log('Cache Statistics:');
  console.log(`  Raw inputs:       ${stats.rawInputs}`);
  console.log(`  Parsed boxscores: ${stats.parsedBoxScores}`);
  console.log(`  Triggers:         ${stats.triggers}`);
  console.log(`  Interviews:       ${stats.interviews}`);
  console.log(`  Narratives:       ${stats.narratives}`);
}

const args = process.argv.slice(2);

if (args.includes('--stats')) {
  showStats();
} else {
  importRawFiles();
  console.log('');
  showStats();
}
