#!/usr/bin/env npx ts-node

/**
 * CLI tool for fetching basketball box scores from College of Marin Athletics
 *
 * Usage:
 *   npx ts-node tools/fetch-boxscores.ts --sport wbkb --season 2023-24
 *   npx ts-node tools/fetch-boxscores.ts --sport mbkb --season 2023-24 --max 5
 *   npx ts-node tools/fetch-boxscores.ts --list-seasons
 */

import { fetchAllBoxScores, getAvailableSeasons, type Sport } from '../src/lib/fetcher.js';

function printUsage() {
  console.log(`
Box Score Fetcher - College of Marin Athletics

Usage:
  npx ts-node tools/fetch-boxscores.ts [options]

Options:
  --sport <mbkb|wbkb>   Sport to fetch (mbkb = men's basketball, wbkb = women's)
  --season <YYYY-YY>    Season to fetch (e.g., 2023-24)
  --max <number>        Maximum games to fetch (for testing)
  --delay <ms>          Delay between requests (default: 500ms)
  --list-seasons        List available seasons
  --help                Show this help message

Examples:
  # Fetch all women's basketball games for 2023-24
  npx ts-node tools/fetch-boxscores.ts --sport wbkb --season 2023-24

  # Fetch first 5 men's basketball games
  npx ts-node tools/fetch-boxscores.ts --sport mbkb --season 2023-24 --max 5

  # List available seasons
  npx ts-node tools/fetch-boxscores.ts --list-seasons
`);
}

function parseArgs(args: string[]): {
  sport?: Sport;
  season?: string;
  max?: number;
  delay?: number;
  listSeasons?: boolean;
  help?: boolean;
} {
  const result: ReturnType<typeof parseArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--sport':
        result.sport = args[++i] as Sport;
        break;
      case '--season':
        result.season = args[++i];
        break;
      case '--max':
        result.max = parseInt(args[++i], 10);
        break;
      case '--delay':
        result.delay = parseInt(args[++i], 10);
        break;
      case '--list-seasons':
        result.listSeasons = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (args.listSeasons) {
    console.log('Available seasons:');
    for (const season of getAvailableSeasons()) {
      console.log(`  ${season}`);
    }
    process.exit(0);
  }

  if (!args.sport) {
    console.error('Error: --sport is required (mbkb or wbkb)');
    printUsage();
    process.exit(1);
  }

  if (!['mbkb', 'wbkb'].includes(args.sport)) {
    console.error(`Error: Invalid sport "${args.sport}". Must be mbkb or wbkb.`);
    process.exit(1);
  }

  if (!args.season) {
    console.error('Error: --season is required (e.g., 2023-24)');
    printUsage();
    process.exit(1);
  }

  console.log(`\nFetching ${args.sport} box scores for ${args.season}...`);
  if (args.max) {
    console.log(`(Limited to ${args.max} games)`);
  }
  console.log('');

  try {
    const result = await fetchAllBoxScores(args.sport, args.season, {
      delay: args.delay ?? 500,
      maxGames: args.max
    });

    console.log('\n--- Summary ---');
    console.log(`Fetched: ${result.fetched}`);
    console.log(`Skipped: ${result.skipped} (already existed)`);
    console.log(`Failed:  ${result.failed}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
