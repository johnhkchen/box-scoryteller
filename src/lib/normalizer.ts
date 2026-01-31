/**
 * Box Score Normalization Pipeline
 *
 * Converts raw fetched data into our canonical BoxScore structure, validates it,
 * and writes normalized JSON to inbox/processed. This creates the processed data
 * used for testing and fixture creation.
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import type { BoxScore } from '../../baml_client/index.js';
import { parseBoxScoreCached } from './cached-pipeline.js';
import { getRawInput } from './cache.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface NormalizationResult {
  success: boolean;
  filePath?: string;
  boxScore?: BoxScore;
  validation?: ValidationResult;
  error?: string;
}

/**
 * Validate a parsed BoxScore against our schema requirements
 */
export function validateBoxScore(boxScore: BoxScore): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required metadata fields
  if (!boxScore.metadata) {
    errors.push('Missing metadata');
    return { valid: false, errors, warnings };
  }

  const { metadata, home_team, away_team } = boxScore;

  if (!metadata.home_team) errors.push('Missing home_team in metadata');
  if (!metadata.away_team) errors.push('Missing away_team in metadata');
  if (metadata.home_score === undefined || metadata.home_score === null) {
    errors.push('Missing home_score in metadata');
  }
  if (metadata.away_score === undefined || metadata.away_score === null) {
    errors.push('Missing away_score in metadata');
  }

  // Team stats must exist
  if (!home_team) {
    errors.push('Missing home_team stats');
  } else {
    if (!home_team.team_name) errors.push('Missing home_team.team_name');
    if (home_team.total_points === undefined) errors.push('Missing home_team.total_points');
    if (!home_team.players || home_team.players.length === 0) {
      warnings.push('home_team has no players');
    }

    // Validate percentages are in valid range
    if (home_team.field_goal_percentage < 0 || home_team.field_goal_percentage > 100) {
      warnings.push(`home_team field_goal_percentage out of range: ${home_team.field_goal_percentage}`);
    }
    if (home_team.three_point_percentage < 0 || home_team.three_point_percentage > 100) {
      warnings.push(`home_team three_point_percentage out of range: ${home_team.three_point_percentage}`);
    }
    if (home_team.free_throw_percentage < 0 || home_team.free_throw_percentage > 100) {
      warnings.push(`home_team free_throw_percentage out of range: ${home_team.free_throw_percentage}`);
    }

    // Validate point totals match approximately (allow for minor discrepancies)
    if (Math.abs(home_team.total_points - metadata.home_score) > 2) {
      warnings.push(
        `home_team points mismatch: team_total=${home_team.total_points}, metadata=${metadata.home_score}`
      );
    }
  }

  if (!away_team) {
    errors.push('Missing away_team stats');
  } else {
    if (!away_team.team_name) errors.push('Missing away_team.team_name');
    if (away_team.total_points === undefined) errors.push('Missing away_team.total_points');
    if (!away_team.players || away_team.players.length === 0) {
      warnings.push('away_team has no players');
    }

    // Validate percentages
    if (away_team.field_goal_percentage < 0 || away_team.field_goal_percentage > 100) {
      warnings.push(`away_team field_goal_percentage out of range: ${away_team.field_goal_percentage}`);
    }
    if (away_team.three_point_percentage < 0 || away_team.three_point_percentage > 100) {
      warnings.push(`away_team three_point_percentage out of range: ${away_team.three_point_percentage}`);
    }
    if (away_team.free_throw_percentage < 0 || away_team.free_throw_percentage > 100) {
      warnings.push(`away_team free_throw_percentage out of range: ${away_team.free_throw_percentage}`);
    }

    // Validate point totals
    if (Math.abs(away_team.total_points - metadata.away_score) > 2) {
      warnings.push(
        `away_team points mismatch: team_total=${away_team.total_points}, metadata=${metadata.away_score}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Normalize a single raw box score file
 *
 * @param rawFilePath - Path to raw file in inbox/raw
 * @param processedDir - Output directory for normalized JSON
 * @param options - Processing options
 * @returns Normalization result with success status and details
 */
export async function normalizeBoxScore(
  rawFilePath: string,
  processedDir: string,
  options: { forceRefresh?: boolean } = {}
): Promise<NormalizationResult> {
  try {
    // Resolve to absolute path for cache lookup
    const { resolve } = await import('path');
    const absolutePath = resolve(rawFilePath);

    // Get raw content from cache
    const rawInput = getRawInput(absolutePath);
    if (!rawInput) {
      return {
        success: false,
        error: 'File not found in cache. Run import-to-cache first.'
      };
    }

    // Parse using BAML function (with caching)
    const boxScore = await parseBoxScoreCached(rawInput.content, {
      forceRefresh: options.forceRefresh
    });

    // Validate the parsed result
    const validation = validateBoxScore(boxScore);

    // Generate output filename
    const inputFilename = basename(rawFilePath, '.txt');
    const outputFilename = `${inputFilename}.json`;
    const outputPath = join(processedDir, outputFilename);

    // Ensure output directory exists
    await mkdir(processedDir, { recursive: true });

    // Write normalized JSON
    await writeFile(outputPath, JSON.stringify(boxScore, null, 2), 'utf-8');

    return {
      success: true,
      filePath: outputPath,
      boxScore,
      validation
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Normalize all raw box score files
 *
 * @param rawDir - Directory containing raw files
 * @param processedDir - Output directory for normalized JSON
 * @param options - Processing options
 * @returns Summary statistics
 */
export async function normalizeAllBoxScores(
  rawDir: string,
  processedDir: string,
  options: {
    forceRefresh?: boolean;
    skipExisting?: boolean;
    maxFiles?: number;
  } = {}
): Promise<{
  processed: number;
  failed: number;
  skipped: number;
  validationErrors: number;
  validationWarnings: number;
}> {
  const { readdirSync } = await import('fs');
  const files = readdirSync(rawDir)
    .filter(f => f.endsWith('.txt'))
    .map(f => join(rawDir, f));

  const toProcess = options.maxFiles ? files.slice(0, options.maxFiles) : files;

  let processed = 0;
  let failed = 0;
  let skipped = 0;
  let validationErrors = 0;
  let validationWarnings = 0;

  for (const filePath of toProcess) {
    const outputFilename = basename(filePath, '.txt') + '.json';
    const outputPath = join(processedDir, outputFilename);

    // Skip if already processed and not forcing refresh
    if (options.skipExisting && existsSync(outputPath) && !options.forceRefresh) {
      skipped++;
      continue;
    }

    const result = await normalizeBoxScore(filePath, processedDir, {
      forceRefresh: options.forceRefresh
    });

    if (result.success) {
      processed++;

      if (result.validation) {
        if (!result.validation.valid) {
          validationErrors++;
        }
        if (result.validation.warnings.length > 0) {
          validationWarnings++;
        }
      }
    } else {
      failed++;
    }
  }

  return {
    processed,
    failed,
    skipped,
    validationErrors,
    validationWarnings
  };
}
