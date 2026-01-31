#!/usr/bin/env npx tsx

import 'dotenv/config';

/**
 * Process water polo box scores through the cached pipeline
 *
 * Usage:
 *   npx tsx tools/process-waterpolo.ts --file <path>          # Process one file
 *   npx tsx tools/process-waterpolo.ts --file <path> --force  # Force refresh (skip cache)
 */

import { readFileSync } from 'fs';
import { basename } from 'path';
import {
  getCacheStats,
  storeRawInput,
  closeCache,
} from '../src/lib/cache.js';
import { parseWaterPoloBoxScoreCached, detectWaterPoloTriggersCached } from '../src/lib/cached-pipeline.js';
import { extractWaterPoloBoxScoreText } from '../src/lib/waterpolo-parser.js';
import { computeWaterPoloStorySignals } from '../src/lib/story-signals.js';

function printUsage() {
  console.log(`
Process Water Polo Box Scores - Cached Pipeline

Usage:
  npx tsx tools/process-waterpolo.ts [options]

Options:
  --file <path>     Process a single file
  --force           Force refresh (skip cache)
  --parse-only      Only parse box scores, don't detect triggers
  --raw             Show raw extracted text before parsing
  --stats           Show cache statistics
  --help            Show this help message

Examples:
  # Process one file
  npx tsx tools/process-waterpolo.ts --file "inbox/Women's Water Polo vs CSUN.html"

  # Process with forced refresh and show raw text
  npx tsx tools/process-waterpolo.ts --file "inbox/waterpolo.html" --force --raw
`);
}

interface Args {
  file?: string;
  force?: boolean;
  parseOnly?: boolean;
  showRaw?: boolean;
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
      case '--raw':
        result.showRaw = true;
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
  options: { forceRefresh?: boolean; parseOnly?: boolean; showRaw?: boolean }
): Promise<void> {
  console.log(`\nProcessing: ${basename(filePath)}`);
  console.log('═'.repeat(60));

  // Read the file content
  const rawContent = readFileSync(filePath, 'utf-8');

  // For HTML files, extract clean text first
  const isHtml = filePath.endsWith('.html') || rawContent.includes('<!DOCTYPE html');
  const content = isHtml ? extractWaterPoloBoxScoreText(rawContent) : rawContent;

  // Store the EXTRACTED text in cache (not raw HTML) so hash matches parsed_boxscores
  const match = basename(filePath).match(/^(\d{4}-\d{2}-\d{2})_(\w+)_\w+\.(html|txt)$/);
  const gameDate = match?.[1];
  const sport = match?.[2] || 'wwaterpolo';
  storeRawInput(filePath, content, sport, gameDate);

  if (options.showRaw) {
    console.log(`\nExtracted text (${content.length} chars):`);
    console.log('─'.repeat(60));
    console.log(content.slice(0, 3000));
    if (content.length > 3000) {
      console.log(`... (${content.length - 3000} more chars)`);
    }
    console.log('─'.repeat(60));
  }

  try {
    const boxScore = await parseWaterPoloBoxScoreCached(content, {
      forceRefresh: options.forceRefresh,
    });

    // Print game summary
    console.log(`\n📊 GAME SUMMARY`);
    console.log('─'.repeat(60));
    console.log(`${boxScore.metadata.away_team} @ ${boxScore.metadata.home_team}`);
    console.log(`Final: ${boxScore.metadata.away_score} - ${boxScore.metadata.home_score}`);
    console.log(`Date: ${boxScore.metadata.date || 'Unknown'}`);
    console.log(`Venue: ${boxScore.metadata.venue || 'Unknown'}`);
    console.log(`Periods: ${boxScore.metadata.periods || 4}`);

    // Print period scores
    if (boxScore.period_scores) {
      console.log(`\n📋 SCORE BY PERIOD`);
      console.log('─'.repeat(60));
      const periods = boxScore.period_scores.away_scores.length;
      const header = ['Team', ...Array.from({length: periods}, (_, i) => `Q${i+1}`), 'Total'].map(h => h.padStart(5)).join(' ');
      console.log(header);

      const awayScores = boxScore.period_scores.away_scores;
      const homeScores = boxScore.period_scores.home_scores;
      const awayTotal = awayScores.reduce((a, b) => a + b, 0);
      const homeTotal = homeScores.reduce((a, b) => a + b, 0);

      console.log([boxScore.metadata.away_team.slice(0, 5).padEnd(5), ...awayScores.map(s => String(s).padStart(5)), String(awayTotal).padStart(5)].join(' '));
      console.log([boxScore.metadata.home_team.slice(0, 5).padEnd(5), ...homeScores.map(s => String(s).padStart(5)), String(homeTotal).padStart(5)].join(' '));
    }

    // Print team stats comparison
    console.log(`\n📈 TEAM STATISTICS`);
    console.log('─'.repeat(60));
    console.log(`${'Stat'.padEnd(15)} ${boxScore.metadata.away_team.slice(0,8).padStart(10)} ${boxScore.metadata.home_team.slice(0,8).padStart(10)}`);
    console.log(`${'Goals'.padEnd(15)} ${String(boxScore.away_team.goals).padStart(10)} ${String(boxScore.home_team.goals).padStart(10)}`);
    console.log(`${'Shots'.padEnd(15)} ${String(boxScore.away_team.shots).padStart(10)} ${String(boxScore.home_team.shots).padStart(10)}`);
    console.log(`${'Assists'.padEnd(15)} ${String(boxScore.away_team.assists).padStart(10)} ${String(boxScore.home_team.assists).padStart(10)}`);
    console.log(`${'Steals'.padEnd(15)} ${String(boxScore.away_team.steals).padStart(10)} ${String(boxScore.home_team.steals).padStart(10)}`);
    console.log(`${'Exclusions'.padEnd(15)} ${String(boxScore.away_team.exclusions).padStart(10)} ${String(boxScore.home_team.exclusions).padStart(10)}`);

    // Print top scorers from each team
    console.log(`\n🏆 TOP PERFORMERS`);
    console.log('─'.repeat(60));

    // Away team top scorers
    console.log(`\n${boxScore.away_team.team_name}:`);
    const awayTopScorers = [...(boxScore.away_team.players || [])]
      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
      .slice(0, 3);
    for (const player of awayTopScorers) {
      if (player.goals > 0 || player.assists > 0) {
        console.log(`  ${player.name}: ${player.goals}G, ${player.assists}A, ${player.steals}STL`);
      }
    }

    // Home team top scorers
    console.log(`\n${boxScore.home_team.team_name}:`);
    const homeTopScorers = [...(boxScore.home_team.players || [])]
      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
      .slice(0, 3);
    for (const player of homeTopScorers) {
      if (player.goals > 0 || player.assists > 0) {
        console.log(`  ${player.name}: ${player.goals}G, ${player.assists}A, ${player.steals}STL`);
      }
    }

    // Print goalkeepers
    console.log(`\n🥅 GOALKEEPERS`);
    console.log('─'.repeat(60));

    console.log(`\n${boxScore.away_team.team_name}:`);
    for (const gk of boxScore.away_team.goalkeepers || []) {
      console.log(`  ${gk.name}: ${gk.saves} saves, ${gk.goals_allowed} GA (${gk.minutes})`);
    }

    console.log(`\n${boxScore.home_team.team_name}:`);
    for (const gk of boxScore.home_team.goalkeepers || []) {
      console.log(`  ${gk.name}: ${gk.saves} saves, ${gk.goals_allowed} GA (${gk.minutes})`);
    }

    // Compute story signals
    console.log(`\n📰 STORY SIGNALS`);
    console.log('─'.repeat(60));
    const signals = computeWaterPoloStorySignals(boxScore, 'college');
    console.log(`Priority: ${signals.tier.toUpperCase()} (score: ${signals.priority_score})`);
    console.log(`Reasons:`);
    for (const reason of signals.signal_reasons) {
      console.log(`  • ${reason}`);
    }

    if (!options.parseOnly) {
      console.log(`\n🎯 NARRATIVE TRIGGERS`);
      console.log('─'.repeat(60));

      const triggers = await detectWaterPoloTriggersCached(boxScore, {
        forceRefresh: options.forceRefresh,
      });

      console.log(`Detected ${triggers.triggers.length} triggers:\n`);
      for (const trigger of triggers.triggers.slice(0, 6)) {
        console.log(`  [${trigger.category}] ${trigger.description}`);
        console.log(`    Salience: ${trigger.salience_score.toFixed(2)}`);
        console.log(`    Follow-up: ${trigger.follow_up_question}`);
        console.log('');
      }
      if (triggers.triggers.length > 6) {
        console.log(`  ... and ${triggers.triggers.length - 6} more triggers`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('Processing complete!');

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
      showRaw: args.showRaw,
    });
  } else {
    console.error('Error: Specify --file <path>');
    printUsage();
    process.exit(1);
  }

  closeCache();
}

main();
