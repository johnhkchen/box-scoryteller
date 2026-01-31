#!/usr/bin/env npx tsx

import 'dotenv/config';

/**
 * Process box scores through the cached pipeline
 *
 * Usage:
 *   npx tsx tools/process-boxscores.ts --file <path>          # Process one file
 *   npx tsx tools/process-boxscores.ts --all                  # Process all files
 *   npx tsx tools/process-boxscores.ts --all --limit 5        # Process first 5 files
 *   npx tsx tools/process-boxscores.ts --stats                # Show cache stats
 *   npx tsx tools/process-boxscores.ts --file <path> --force  # Force refresh (skip cache)
 */

import { readdirSync } from 'fs';
import { join, basename } from 'path';
import {
  getCacheStats,
  getRawInput,
  storeRawInput,
  closeCache,
} from '../src/lib/cache.js';
import { processBoxScoreCached } from '../src/lib/cached-pipeline.js';

const RAW_DIR = join(process.cwd(), 'inbox/raw');

function printUsage() {
  console.log(`
Process Box Scores - Cached Pipeline

Usage:
  npx tsx tools/process-boxscores.ts [options]

Options:
  --file <path>     Process a single file
  --all             Process all files in inbox/raw
  --limit <n>       Limit to n files (use with --all)
  --force           Force refresh (skip cache)
  --parse-only      Only parse box scores, don't detect triggers
  --stats           Show cache statistics
  --help            Show this help message

Examples:
  # Process one file
  npx tsx tools/process-boxscores.ts --file inbox/raw/2023-11-01_wbkb_euf7.txt

  # Process all files (uses cache)
  npx tsx tools/process-boxscores.ts --all

  # Process first 3 files, force refresh
  npx tsx tools/process-boxscores.ts --all --limit 3 --force
`);
}

interface Args {
  file?: string;
  all?: boolean;
  limit?: number;
  force?: boolean;
  parseOnly?: boolean;
  stats?: boolean;
  help?: boolean;
}

function parseArgs(args: string[]): Args {
  const result: Args = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--file':
        result.file = args[++i];
        break;
      case '--all':
        result.all = true;
        break;
      case '--limit':
        result.limit = parseInt(args[++i], 10);
        break;
      case '--force':
        result.force = true;
        break;
      case '--parse-only':
        result.parseOnly = true;
        break;
      case '--stats':
        result.stats = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

async function processFile(
  filePath: string,
  options: { forceRefresh?: boolean; parseOnly?: boolean }
): Promise<void> {
  console.log(`\nProcessing: ${basename(filePath)}`);
  console.log('─'.repeat(50));

  // Get raw content from cache
  let rawInput = getRawInput(filePath);

  if (!rawInput) {
    // Try to import it
    const { readFileSync } = await import('fs');
    const content = readFileSync(filePath, 'utf-8');
    const match = basename(filePath).match(/^(\d{4}-\d{2}-\d{2})_(\w+)_\w+\.txt$/);
    const gameDate = match?.[1];
    const sport = match?.[2];
    storeRawInput(filePath, content, sport, gameDate);
    rawInput = { content, contentHash: '' };
  }

  try {
    const result = await processBoxScoreCached(rawInput.content, {
      forceRefresh: options.forceRefresh,
    });

    // Print summary
    const { boxScore, triggers } = result;
    console.log(`\nGame: ${boxScore.metadata.away_team} @ ${boxScore.metadata.home_team}`);
    console.log(`Score: ${boxScore.metadata.away_score} - ${boxScore.metadata.home_score}`);
    console.log(`Date: ${boxScore.metadata.date || 'Unknown'}`);

    if (!options.parseOnly) {
      console.log(`\nTriggers detected: ${triggers.triggers.length}`);
      for (const trigger of triggers.triggers.slice(0, 5)) {
        console.log(`  • [${trigger.category}] ${trigger.description}`);
        console.log(`    Salience: ${trigger.salience_score.toFixed(2)}`);
      }
      if (triggers.triggers.length > 5) {
        console.log(`  ... and ${triggers.triggers.length - 5} more`);
      }
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.stats) {
    const stats = getCacheStats();
    console.log('Cache Statistics:');
    console.log(`  Raw inputs:       ${stats.rawInputs}`);
    console.log(`  Parsed boxscores: ${stats.parsedBoxScores}`);
    console.log(`  Triggers:         ${stats.triggers}`);
    console.log(`  Interviews:       ${stats.interviews}`);
    console.log(`  Narratives:       ${stats.narratives}`);
    process.exit(0);
  }

  if (args.file) {
    await processFile(args.file, {
      forceRefresh: args.force,
      parseOnly: args.parseOnly,
    });
  } else if (args.all) {
    const files = readdirSync(RAW_DIR)
      .filter(f => f.endsWith('.txt'))
      .map(f => join(RAW_DIR, f));

    const toProcess = args.limit ? files.slice(0, args.limit) : files;
    console.log(`Processing ${toProcess.length} files...`);

    for (const file of toProcess) {
      await processFile(file, {
        forceRefresh: args.force,
        parseOnly: args.parseOnly,
      });
    }

    console.log('\n' + '='.repeat(50));
    const stats = getCacheStats();
    console.log('Final Cache Statistics:');
    console.log(`  Parsed boxscores: ${stats.parsedBoxScores}`);
    console.log(`  Triggers:         ${stats.triggers}`);
  } else {
    console.error('Error: Specify --file <path> or --all');
    printUsage();
    process.exit(1);
  }

  closeCache();
}

main();
