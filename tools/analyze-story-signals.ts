#!/usr/bin/env tsx
/**
 * Analyze Story Signals
 *
 * This tool demonstrates the story signals extraction by processing box scores
 * and displaying their priority signals. It helps visualize which games would
 * be prioritized for deeper coverage.
 *
 * Usage:
 *   tsx tools/analyze-story-signals.ts [file.json]
 *   tsx tools/analyze-story-signals.ts  # processes all fixtures
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { computeStorySignals } from '../src/lib/story-signals.js';
import type { BoxScore } from '../baml_client/index.js';

/**
 * Format a box score's story signals for display
 */
function formatSignals(filename: string, boxScore: BoxScore) {
  const signals = computeStorySignals(boxScore);
  const { metadata } = boxScore;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 ${filename}`);
  console.log(`   ${metadata.away_team} @ ${metadata.home_team}`);
  console.log(`   Score: ${metadata.away_score}-${metadata.home_score}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log(`\n🎯 Priority Score: ${signals.priority_score}`);

  console.log('\n📋 Signals:');
  console.log(`   Close Game: ${signals.is_close_game ? '✓' : '✗'} (${signals.margin} point margin)`);
  console.log(`   Overtime: ${signals.is_overtime ? '✓' : '✗'}`);
  console.log(
    `   Standout Performance: ${signals.has_standout_performance ? '✓' : '✗'} (${signals.standout_count} players)`
  );
  console.log(`   Conference Game: ${signals.is_conference_game ? '✓' : '✗'}`);

  console.log('\n💡 Reasons:');
  signals.signal_reasons.forEach((reason) => {
    console.log(`   • ${reason}`);
  });
}

/**
 * Load a box score from a file, handling both direct BoxScore JSON
 * and fixture files with nested structure
 */
function loadBoxScore(content: string): BoxScore {
  const parsed = JSON.parse(content);

  // If it has a box_score property, it's a fixture file
  if ('box_score' in parsed) {
    return parsed.box_score as BoxScore;
  }

  // Otherwise it's a direct BoxScore
  return parsed as BoxScore;
}

/**
 * Process a single box score file
 */
async function processFile(filePath: string) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const boxScore = loadBoxScore(content);
    const filename = filePath.split('/').pop() || filePath;

    formatSignals(filename, boxScore);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

/**
 * Process all fixtures and show them ranked by priority
 */
async function processAllFixtures() {
  const fixturesDir = 'inbox/fixtures';

  try {
    const files = await readdir(fixturesDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.log('No fixture files found in inbox/fixtures/');
      return;
    }

    // Load all box scores with their signals
    const results: Array<{
      filename: string;
      boxScore: BoxScore;
      priority: number;
    }> = [];

    for (const file of jsonFiles) {
      const filePath = join(fixturesDir, file);
      const content = await readFile(filePath, 'utf-8');
      const boxScore = loadBoxScore(content);
      const signals = computeStorySignals(boxScore);

      results.push({
        filename: file,
        boxScore,
        priority: signals.priority_score,
      });
    }

    // Sort by priority (highest first)
    results.sort((a, b) => b.priority - a.priority);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  STORY PRIORITY RANKING - ALL FIXTURES');
    console.log('═══════════════════════════════════════════════════');

    results.forEach(({ filename, boxScore }) => {
      formatSignals(filename, boxScore);
    });

    console.log('\n\n📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    results.forEach((result, index) => {
      const teamNames = `${result.boxScore.metadata.away_team} @ ${result.boxScore.metadata.home_team}`;
      console.log(
        `${(index + 1).toString().padStart(2)}. [${result.priority}] ${teamNames.substring(0, 45)}`
      );
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('Error processing fixtures:', error);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  await processAllFixtures();
} else {
  await processFile(args[0]);
}
