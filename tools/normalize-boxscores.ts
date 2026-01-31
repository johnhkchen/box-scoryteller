#!/usr/bin/env npx tsx

import 'dotenv/config';

/**
 * Normalize Box Scores
 *
 * Converts raw box score files into validated, normalized JSON format
 * suitable for testing and fixture creation.
 *
 * Usage:
 *   npx tsx tools/normalize-boxscores.ts --file <path>           # Normalize one file
 *   npx tsx tools/normalize-boxscores.ts --all                   # Normalize all files
 *   npx tsx tools/normalize-boxscores.ts --all --limit 5         # Normalize first 5 files
 *   npx tsx tools/normalize-boxscores.ts --all --skip-existing   # Skip already processed
 *   npx tsx tools/normalize-boxscores.ts --all --force           # Force refresh (ignore cache)
 */

import { join, basename } from 'path';
import { closeCache } from '../src/lib/cache.js';
import {
  normalizeBoxScore,
  normalizeAllBoxScores,
  type ValidationResult
} from '../src/lib/normalizer.js';

const RAW_DIR = join(process.cwd(), 'inbox/raw');
const PROCESSED_DIR = join(process.cwd(), 'inbox/processed');

function printUsage() {
  console.log(`
Normalize Box Scores

Converts raw box score files into validated, normalized JSON format.

Usage:
  npx tsx tools/normalize-boxscores.ts [options]

Options:
  --file <path>       Normalize a single file
  --all               Normalize all files in inbox/raw
  --limit <n>         Limit to n files (use with --all)
  --skip-existing     Skip files that are already processed
  --force             Force refresh (ignore cache, reparse)
  --verbose           Show detailed validation results
  --help              Show this help message

Examples:
  # Normalize one file
  npx tsx tools/normalize-boxscores.ts --file inbox/raw/2023-11-01_wbkb_euf7.txt

  # Normalize all files (uses cache)
  npx tsx tools/normalize-boxscores.ts --all

  # Normalize first 5 files, skip existing
  npx tsx tools/normalize-boxscores.ts --all --limit 5 --skip-existing

  # Force refresh all files (ignore cache)
  npx tsx tools/normalize-boxscores.ts --all --force
`);
}

interface Args {
  file?: string;
  all?: boolean;
  limit?: number;
  skipExisting?: boolean;
  force?: boolean;
  verbose?: boolean;
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
      case '--skip-existing':
        result.skipExisting = true;
        break;
      case '--force':
        result.force = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

function printValidation(validation: ValidationResult, verbose: boolean): void {
  if (!validation.valid) {
    console.log(`  ❌ Validation FAILED`);
    for (const error of validation.errors) {
      console.log(`     • ${error}`);
    }
  } else {
    console.log(`  ✓ Validation passed`);
  }

  if (validation.warnings.length > 0) {
    console.log(`  ⚠ ${validation.warnings.length} warning(s)`);
    if (verbose) {
      for (const warning of validation.warnings) {
        console.log(`     • ${warning}`);
      }
    }
  }
}

async function normalizeFile(
  filePath: string,
  options: { force?: boolean; verbose?: boolean }
): Promise<void> {
  console.log(`\nNormalizing: ${basename(filePath)}`);
  console.log('─'.repeat(60));

  const result = await normalizeBoxScore(filePath, PROCESSED_DIR, {
    forceRefresh: options.force
  });

  if (!result.success) {
    console.log(`  ❌ Failed: ${result.error}`);
    return;
  }

  console.log(`  ✓ Saved to: ${basename(result.filePath!)}`);

  if (result.boxScore) {
    const { metadata } = result.boxScore;
    console.log(`  Game: ${metadata.away_team} @ ${metadata.home_team}`);
    console.log(`  Score: ${metadata.away_score} - ${metadata.home_score}`);
    console.log(`  Date: ${metadata.date || 'Unknown'}`);
  }

  if (result.validation) {
    printValidation(result.validation, options.verbose || false);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.file) {
    // Normalize single file
    await normalizeFile(args.file, {
      force: args.force,
      verbose: args.verbose
    });
  } else if (args.all) {
    // Normalize all files
    console.log('Normalizing all box scores...');
    console.log('═'.repeat(60));

    const startTime = Date.now();

    const summary = await normalizeAllBoxScores(RAW_DIR, PROCESSED_DIR, {
      forceRefresh: args.force,
      skipExisting: args.skipExisting,
      maxFiles: args.limit
    });

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '═'.repeat(60));
    console.log('Normalization Complete');
    console.log('═'.repeat(60));
    console.log(`  Processed: ${summary.processed}`);
    console.log(`  Failed:    ${summary.failed}`);
    console.log(`  Skipped:   ${summary.skipped}`);
    console.log('');
    console.log(`  Validation errors:   ${summary.validationErrors}`);
    console.log(`  Validation warnings: ${summary.validationWarnings}`);
    console.log('');
    console.log(`  Time elapsed: ${elapsedTime}s`);

    if (summary.validationErrors > 0 || summary.validationWarnings > 0) {
      console.log('');
      console.log('  Tip: Run with --verbose to see detailed validation messages');
    }
  } else {
    console.error('Error: Specify --file <path> or --all');
    printUsage();
    process.exit(1);
  }

  closeCache();
}

main();
