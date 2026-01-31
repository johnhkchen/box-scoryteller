#!/usr/bin/env npx tsx

import 'dotenv/config';

/**
 * Process baseball box scores through the cached pipeline
 *
 * Usage:
 *   npx tsx tools/process-baseball.ts --file <path>          # Process one file
 *   npx tsx tools/process-baseball.ts --file <path> --force  # Force refresh (skip cache)
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import {
  getCacheStats,
  storeRawInput,
  closeCache,
} from '../src/lib/cache.js';
import { parseBaseballBoxScoreCached, detectBaseballTriggersCached } from '../src/lib/cached-pipeline.js';
import { extractBaseballBoxScoreText } from '../src/lib/baseball-parser.js';

function printUsage() {
  console.log(`
Process Baseball Box Scores - Cached Pipeline

Usage:
  npx tsx tools/process-baseball.ts [options]

Options:
  --file <path>     Process a single file
  --force           Force refresh (skip cache)
  --parse-only      Only parse box scores, don't detect triggers
  --stats           Show cache statistics
  --help            Show this help message

Examples:
  # Process one file
  npx tsx tools/process-baseball.ts --file inbox/raw/2026-01-30_bsb_crvb.html

  # Process with forced refresh
  npx tsx tools/process-baseball.ts --file inbox/raw/2026-01-30_bsb_crvb.html --force
`);
}

interface Args {
  file?: string;
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

  // Read the file content
  const rawContent = readFileSync(filePath, 'utf-8');

  // Store raw in cache
  const match = basename(filePath).match(/^(\d{4}-\d{2}-\d{2})_(\w+)_\w+\.(html|txt)$/);
  const gameDate = match?.[1];
  const sport = match?.[2];
  storeRawInput(filePath, rawContent, sport, gameDate);

  // For HTML files, extract clean text first
  const isHtml = filePath.endsWith('.html') || rawContent.includes('<!DOCTYPE html');
  const content = isHtml ? extractBaseballBoxScoreText(rawContent) : rawContent;

  console.log(`\nExtracted text (${content.length} chars):`);
  console.log('─'.repeat(50));
  console.log(content.slice(0, 2000));
  if (content.length > 2000) {
    console.log(`... (${content.length - 2000} more chars)`);
  }
  console.log('─'.repeat(50));

  try {
    const boxScore = await parseBaseballBoxScoreCached(content, {
      forceRefresh: options.forceRefresh,
    });

    // Print summary
    console.log(`\nGame: ${boxScore.metadata.away_team} @ ${boxScore.metadata.home_team}`);
    console.log(`Score: ${boxScore.metadata.away_score} - ${boxScore.metadata.home_score}`);
    console.log(`Date: ${boxScore.metadata.date || 'Unknown'}`);
    console.log(`Venue: ${boxScore.metadata.venue || 'Unknown'}`);
    console.log(`Innings: ${boxScore.metadata.innings}`);

    // Print inning scores
    if (boxScore.inning_scores && boxScore.inning_scores.length === 2) {
      console.log(`\nLine Score:`);
      const awayScores = boxScore.inning_scores[0].join(' ');
      const homeScores = boxScore.inning_scores[1].join(' ');
      console.log(`  ${boxScore.metadata.away_team}: ${awayScores} | R:${boxScore.away_team.runs} H:${boxScore.away_team.hits} E:${boxScore.away_team.errors}`);
      console.log(`  ${boxScore.metadata.home_team}: ${homeScores} | R:${boxScore.home_team.runs} H:${boxScore.home_team.hits} E:${boxScore.home_team.errors}`);
    }

    // Print top batters
    console.log(`\n${boxScore.away_team.team_name} Top Batters:`);
    const awayTopBatters = [...boxScore.away_team.batters]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 3);
    for (const batter of awayTopBatters) {
      console.log(`  ${batter.name}: ${batter.hits}-${batter.at_bats}, ${batter.rbi} RBI`);
    }

    console.log(`\n${boxScore.home_team.team_name} Top Batters:`);
    const homeTopBatters = [...boxScore.home_team.batters]
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 3);
    for (const batter of homeTopBatters) {
      console.log(`  ${batter.name}: ${batter.hits}-${batter.at_bats}, ${batter.rbi} RBI`);
    }

    // Print pitchers
    console.log(`\n${boxScore.away_team.team_name} Pitching:`);
    for (const pitcher of boxScore.away_team.pitchers) {
      const decision = pitcher.decision ? ` (${pitcher.decision}${pitcher.record ? ', ' + pitcher.record : ''})` : '';
      console.log(`  ${pitcher.name}${decision}: ${pitcher.innings_pitched} IP, ${pitcher.strikeouts} K, ${pitcher.runs_allowed} R`);
    }

    console.log(`\n${boxScore.home_team.team_name} Pitching:`);
    for (const pitcher of boxScore.home_team.pitchers) {
      const decision = pitcher.decision ? ` (${pitcher.decision}${pitcher.record ? ', ' + pitcher.record : ''})` : '';
      console.log(`  ${pitcher.name}${decision}: ${pitcher.innings_pitched} IP, ${pitcher.strikeouts} K, ${pitcher.runs_allowed} R`);
    }

    if (!options.parseOnly) {
      const triggers = await detectBaseballTriggersCached(boxScore, {
        forceRefresh: options.forceRefresh,
      });

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
  } else {
    console.error('Error: Specify --file <path>');
    printUsage();
    process.exit(1);
  }

  closeCache();
}

main();
