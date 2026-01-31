#!/usr/bin/env npx tsx

import 'dotenv/config';

/**
 * Fixture Curator
 *
 * Promotes interesting games from processed data into test fixtures.
 * Scans processed box scores, analyzes triggers, and creates curated fixtures
 * with metadata for prompt testing.
 *
 * Usage:
 *   npx tsx tools/curate-fixtures.ts --discover              # Auto-discover interesting games
 *   npx tsx tools/curate-fixtures.ts --promote <file-path>   # Manually promote a specific game
 *   npx tsx tools/curate-fixtures.ts --list                  # List existing fixtures
 *   npx tsx tools/curate-fixtures.ts --stats                 # Show discovery statistics
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { db, hashContent, getTriggers } from '../src/lib/cache.js';
import type { BoxScore, TriggerList, Trigger } from '../baml_client/index.js';

const PROCESSED_DIR = join(process.cwd(), 'inbox/processed');
const FIXTURES_DIR = join(process.cwd(), 'inbox/fixtures');

// Ensure fixtures directory exists
if (!existsSync(FIXTURES_DIR)) {
  mkdirSync(FIXTURES_DIR, { recursive: true });
}

interface FixtureMetadata {
  fixture_id: string;
  tags: string[];
  notes: string;
  source_file: string;
  trigger_count: number;
  top_triggers: Array<{
    category: string;
    description: string;
    salience: number;
  }>;
  created_at: string;
}

interface Fixture {
  metadata: FixtureMetadata;
  box_score: BoxScore;
  triggers: TriggerList;
}

/**
 * Derive tags from triggers
 */
function deriveTagsFromTriggers(triggers: TriggerList): string[] {
  const tags = new Set<string>();

  for (const trigger of triggers.triggers) {
    // Add category-based tags
    switch (trigger.category) {
      case 'STATISTICAL_EXTREME':
        // Check for specific extremes
        if (trigger.description.toLowerCase().includes('triple-double')) {
          tags.add('triple-double');
        }
        if (trigger.description.toLowerCase().includes('double-double')) {
          tags.add('double-double');
        }
        if (trigger.description.match(/\d{2,}\+?\s*points?/)) {
          tags.add('high-scoring');
        }
        if (trigger.description.toLowerCase().includes('assists')) {
          tags.add('playmaking');
        }
        if (trigger.description.toLowerCase().includes('rebounds')) {
          tags.add('rebounding');
        }
        tags.add('statistical-extreme');
        break;

      case 'CLUTCH_MOMENT':
        if (trigger.description.toLowerCase().includes('overtime')) {
          tags.add('overtime');
        }
        if (trigger.description.toLowerCase().includes('close') ||
            trigger.description.toLowerCase().includes('finish')) {
          tags.add('close-game');
        }
        if (trigger.description.toLowerCase().includes('free throw')) {
          tags.add('clutch-free-throws');
        }
        tags.add('clutch-moment');
        break;

      case 'UNEXPECTED_PERFORMANCE':
        if (trigger.description.toLowerCase().includes('bench')) {
          tags.add('bench-impact');
        }
        if (trigger.description.toLowerCase().includes('reserve')) {
          tags.add('reserve-star');
        }
        tags.add('unexpected-performance');
        break;

      case 'ANOMALY':
        if (trigger.description.toLowerCase().includes('guard') &&
            trigger.description.toLowerCase().includes('zero assist')) {
          tags.add('anomaly-assists');
        }
        if (trigger.description.toLowerCase().includes('turnovers')) {
          tags.add('turnover-heavy');
        }
        tags.add('anomaly');
        break;

      case 'TREND':
        if (trigger.description.toLowerCase().includes('shooting')) {
          if (trigger.description.toLowerCase().includes('hot') ||
              trigger.description.match(/\d{2,}%/)) {
            tags.add('hot-shooting');
          } else if (trigger.description.toLowerCase().includes('cold')) {
            tags.add('cold-shooting');
          }
        }
        if (trigger.description.toLowerCase().includes('balanced')) {
          tags.add('balanced-scoring');
        }
        tags.add('trend');
        break;
    }
  }

  return Array.from(tags);
}

/**
 * Generate fixture notes from box score and triggers
 */
function generateNotes(boxScore: BoxScore, triggers: TriggerList): string {
  const winner = boxScore.metadata.home_score > boxScore.metadata.away_score
    ? boxScore.metadata.home_team
    : boxScore.metadata.away_team;

  const margin = Math.abs(boxScore.metadata.home_score - boxScore.metadata.away_score);
  const gameType = margin <= 5 ? 'close' : margin >= 20 ? 'blowout' : 'competitive';

  const topTrigger = triggers.triggers[0];
  const topDescription = topTrigger ? topTrigger.description : 'Multiple interesting triggers';

  return `${winner} won ${gameType} game. ${topDescription}`;
}

/**
 * Generate a unique fixture ID
 */
function generateFixtureId(boxScore: BoxScore, triggers: TriggerList): string {
  const date = boxScore.metadata.date?.replace(/\//g, '-') || 'unknown-date';
  const topCategory = triggers.triggers[0]?.category.toLowerCase().replace(/_/g, '-') || 'game';

  // Add teams to avoid collisions on same date
  const awayTeam = boxScore.metadata.away_team.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 15);
  const homeTeam = boxScore.metadata.home_team.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 15);

  return `${topCategory}-${date}-${awayTeam}-${homeTeam}`;
}

/**
 * Create a fixture from a processed box score
 */
function createFixture(
  processedFilePath: string,
  boxScore: BoxScore,
  triggers: TriggerList
): Fixture {
  const fixtureId = generateFixtureId(boxScore, triggers);
  const tags = deriveTagsFromTriggers(triggers);
  const notes = generateNotes(boxScore, triggers);

  const metadata: FixtureMetadata = {
    fixture_id: fixtureId,
    tags,
    notes,
    source_file: processedFilePath,
    trigger_count: triggers.triggers.length,
    top_triggers: triggers.triggers.slice(0, 3).map(t => ({
      category: t.category,
      description: t.description,
      salience: t.salience_score,
    })),
    created_at: new Date().toISOString(),
  };

  return {
    metadata,
    box_score: boxScore,
    triggers,
  };
}

/**
 * Save a fixture to disk
 */
function saveFixture(fixture: Fixture): string {
  const fileName = `${fixture.metadata.fixture_id}.json`;
  const filePath = join(FIXTURES_DIR, fileName);

  writeFileSync(filePath, JSON.stringify(fixture, null, 2));
  return filePath;
}

/**
 * Load existing fixtures
 */
function loadFixtures(): Fixture[] {
  if (!existsSync(FIXTURES_DIR)) {
    return [];
  }

  const files = readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const content = readFileSync(join(FIXTURES_DIR, f), 'utf-8');
    return JSON.parse(content) as Fixture;
  });
}

/**
 * Check if a game is already fixtured
 */
function isAlreadyFixtured(sourceFile: string): boolean {
  const fixtures = loadFixtures();
  return fixtures.some(f => f.metadata.source_file === sourceFile);
}

/**
 * Score a game for interestingness based on triggers
 */
function scoreGame(triggers: TriggerList): number {
  if (triggers.triggers.length === 0) return 0;

  // Weight by trigger count and average salience
  const avgSalience = triggers.triggers.reduce((sum, t) => sum + t.salience_score, 0) / triggers.triggers.length;
  const countBonus = Math.min(triggers.triggers.length / 10, 1); // Max bonus at 10 triggers

  return avgSalience * 0.7 + countBonus * 0.3;
}

/**
 * Auto-discover interesting games
 */
async function discoverInterestingGames(options: {
  minScore?: number;
  maxResults?: number;
  categoryFilter?: string;
}): Promise<Array<{ file: string; boxScore: BoxScore; triggers: TriggerList; score: number }>> {
  const minScore = options.minScore ?? 0.6;
  const maxResults = options.maxResults ?? 20;

  const processedFiles = readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));

  const candidates: Array<{
    file: string;
    boxScore: BoxScore;
    triggers: TriggerList;
    score: number;
  }> = [];

  for (const file of processedFiles) {
    const filePath = join(PROCESSED_DIR, file);

    // Skip if already fixtured
    if (isAlreadyFixtured(filePath)) {
      continue;
    }

    // Load box score
    const content = readFileSync(filePath, 'utf-8');
    const boxScore = JSON.parse(content) as BoxScore;

    // Get triggers from cache
    const boxScoreHash = hashContent(JSON.stringify(boxScore));
    const triggers = getTriggers(boxScoreHash) as TriggerList | null;

    if (!triggers || triggers.triggers.length === 0) {
      continue;
    }

    // Filter by category if specified
    if (options.categoryFilter) {
      const hasCategory = triggers.triggers.some(
        t => t.category === options.categoryFilter
      );
      if (!hasCategory) {
        continue;
      }
    }

    // Score the game
    const score = scoreGame(triggers);

    if (score >= minScore) {
      candidates.push({ file: filePath, boxScore, triggers, score });
    }
  }

  // Sort by score descending and limit results
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, maxResults);
}

/**
 * Promote a specific game to fixture
 */
function promoteGame(filePath: string): void {
  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  // Check if already fixtured
  if (isAlreadyFixtured(filePath)) {
    console.log(`Already fixtured: ${basename(filePath)}`);
    process.exit(0);
  }

  // Load box score
  const content = readFileSync(filePath, 'utf-8');
  const boxScore = JSON.parse(content) as BoxScore;

  // Get triggers from cache
  const boxScoreHash = hashContent(JSON.stringify(boxScore));
  const triggers = getTriggers(boxScoreHash) as TriggerList | null;

  if (!triggers) {
    console.error('No triggers found for this game. Run trigger detection first.');
    process.exit(1);
  }

  // Create and save fixture
  const fixture = createFixture(filePath, boxScore, triggers);
  const fixturePath = saveFixture(fixture);

  console.log(`\n✓ Created fixture: ${basename(fixturePath)}`);
  console.log(`  Source: ${basename(filePath)}`);
  console.log(`  Game: ${boxScore.metadata.away_team} @ ${boxScore.metadata.home_team}`);
  console.log(`  Score: ${boxScore.metadata.away_score} - ${boxScore.metadata.home_score}`);
  console.log(`  Triggers: ${triggers.triggers.length}`);
  console.log(`  Tags: ${fixture.metadata.tags.join(', ')}`);
}

/**
 * List existing fixtures
 */
function listFixtures(): void {
  const fixtures = loadFixtures();

  if (fixtures.length === 0) {
    console.log('No fixtures found.');
    return;
  }

  console.log(`\nFound ${fixtures.length} fixture(s):\n`);

  for (const fixture of fixtures) {
    const { metadata, box_score } = fixture;
    console.log(`${metadata.fixture_id}`);
    console.log(`  Game: ${box_score.metadata.away_team} @ ${box_score.metadata.home_team}`);
    console.log(`  Score: ${box_score.metadata.away_score} - ${box_score.metadata.home_score}`);
    console.log(`  Tags: ${metadata.tags.join(', ')}`);
    console.log(`  Triggers: ${metadata.trigger_count}`);
    console.log(`  Notes: ${metadata.notes}`);
    console.log('');
  }
}

/**
 * Show discovery statistics
 */
async function showStats(): Promise<void> {
  console.log('Analyzing processed games...\n');

  const processedFiles = readdirSync(PROCESSED_DIR).filter(f => f.endsWith('.json'));
  const fixtures = loadFixtures();

  let totalWithTriggers = 0;
  let totalHighScore = 0;
  const categoryCount: Record<string, number> = {};

  for (const file of processedFiles) {
    const content = readFileSync(join(PROCESSED_DIR, file), 'utf-8');
    const boxScore = JSON.parse(content) as BoxScore;
    const boxScoreHash = hashContent(JSON.stringify(boxScore));
    const triggers = getTriggers(boxScoreHash) as TriggerList | null;

    if (triggers && triggers.triggers.length > 0) {
      totalWithTriggers++;

      const score = scoreGame(triggers);
      if (score >= 0.6) {
        totalHighScore++;
      }

      for (const trigger of triggers.triggers) {
        categoryCount[trigger.category] = (categoryCount[trigger.category] || 0) + 1;
      }
    }
  }

  console.log(`Total processed games: ${processedFiles.length}`);
  console.log(`Games with triggers: ${totalWithTriggers}`);
  console.log(`High-interest games (score ≥ 0.6): ${totalHighScore}`);
  console.log(`Existing fixtures: ${fixtures.length}`);
  console.log('');
  console.log('Trigger categories:');
  for (const [category, count] of Object.entries(categoryCount)) {
    console.log(`  ${category}: ${count}`);
  }
}

/**
 * Print usage information
 */
function printUsage(): void {
  console.log(`
Fixture Curator - Promote interesting games to test fixtures

Usage:
  npx tsx tools/curate-fixtures.ts [command] [options]

Commands:
  --discover              Auto-discover interesting games
  --discover --min-score 0.7    Discover with custom minimum score (default: 0.6)
  --discover --category CLUTCH_MOMENT    Discover games with specific trigger category
  --discover --auto       Automatically promote top 10 discovered games

  --promote <file-path>   Manually promote a specific processed game
  --list                  List existing fixtures
  --stats                 Show discovery statistics
  --help                  Show this help message

Examples:
  # Find interesting games
  npx tsx tools/curate-fixtures.ts --discover

  # Find high-salience clutch games
  npx tsx tools/curate-fixtures.ts --discover --min-score 0.8 --category CLUTCH_MOMENT

  # Promote a specific game
  npx tsx tools/curate-fixtures.ts --promote inbox/processed/2023-11-01_mbkb_17et.json

  # Auto-promote top 10 games
  npx tsx tools/curate-fixtures.ts --discover --auto
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  if (args.includes('--list')) {
    listFixtures();
    return;
  }

  if (args.includes('--stats')) {
    await showStats();
    return;
  }

  if (args.includes('--promote')) {
    const fileIndex = args.indexOf('--promote') + 1;
    if (fileIndex >= args.length) {
      console.error('Error: --promote requires a file path');
      process.exit(1);
    }
    promoteGame(args[fileIndex]);
    return;
  }

  if (args.includes('--discover')) {
    const minScoreIndex = args.indexOf('--min-score');
    const minScore = minScoreIndex >= 0 ? parseFloat(args[minScoreIndex + 1]) : 0.6;

    const categoryIndex = args.indexOf('--category');
    const categoryFilter = categoryIndex >= 0 ? args[categoryIndex + 1] : undefined;

    const auto = args.includes('--auto');

    console.log('Discovering interesting games...');
    if (categoryFilter) {
      console.log(`  Filtering by category: ${categoryFilter}`);
    }
    console.log(`  Minimum score: ${minScore}`);
    console.log('');

    const candidates = await discoverInterestingGames({
      minScore,
      categoryFilter,
      maxResults: auto ? 10 : 20,
    });

    if (candidates.length === 0) {
      console.log('No interesting games found matching criteria.');
      return;
    }

    console.log(`Found ${candidates.length} interesting game(s):\n`);

    for (let i = 0; i < candidates.length; i++) {
      const { file, boxScore, triggers, score } = candidates[i];
      console.log(`${i + 1}. ${basename(file)} (score: ${score.toFixed(2)})`);
      console.log(`   ${boxScore.metadata.away_team} @ ${boxScore.metadata.home_team}`);
      console.log(`   Score: ${boxScore.metadata.away_score} - ${boxScore.metadata.home_score}`);
      console.log(`   Triggers: ${triggers.triggers.length} (top: ${triggers.triggers[0]?.category})`);
      console.log(`   Top trigger: ${triggers.triggers[0]?.description.slice(0, 80)}...`);
      console.log('');
    }

    if (auto) {
      console.log('Auto-promoting top games...\n');
      for (const { file, boxScore, triggers } of candidates) {
        const fixture = createFixture(file, boxScore, triggers);
        const fixturePath = saveFixture(fixture);
        console.log(`✓ Created: ${basename(fixturePath)}`);
      }
      console.log(`\nPromoted ${candidates.length} games to fixtures.`);
    } else {
      console.log('To promote a game, run:');
      console.log(`  npx tsx tools/curate-fixtures.ts --promote <file-path>`);
      console.log('\nOr auto-promote top 10:');
      console.log('  npx tsx tools/curate-fixtures.ts --discover --auto');
    }

    return;
  }

  console.error('Error: Unknown command');
  printUsage();
  process.exit(1);
}

main();
