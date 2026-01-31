/**
 * Cached Pipeline Functions
 *
 * Wraps BAML functions with SQLite caching. On cache hit, returns immediately.
 * On cache miss, calls the LLM and stores the result for future use.
 */

import {
  hashContent,
  getRawInput,
  getParsedBoxScore,
  storeParsedBoxScore,
  getTriggers,
  storeTriggers,
  getInterview,
  storeInterview,
  getNarrative,
  storeNarrative,
} from './cache.js';

import { b, type BoxScore, type TriggerList, type BaseballBoxScore, type BaseballTriggerList, type WaterPoloBoxScore, type WaterPoloTriggerList } from '../../baml_client/index.js';

/**
 * Parse a box score with caching
 *
 * @param rawText - The raw box score text
 * @param options - Optional settings
 * @returns Parsed BoxScore object
 */
export async function parseBoxScoreCached(
  rawText: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<BoxScore> {
  const inputHash = hashContent(rawText);

  // Check cache first (unless forced refresh)
  if (!options.forceRefresh) {
    const cached = getParsedBoxScore(inputHash);
    if (cached) {
      console.log(`[cache hit] ParseBoxScore (hash: ${inputHash.slice(0, 8)}...)`);
      return cached as BoxScore;
    }
  }

  // Cache miss - call LLM
  console.log(`[cache miss] ParseBoxScore - calling LLM...`);
  const result = await b.ParseBoxScore(rawText);

  // Store in cache
  storeParsedBoxScore(inputHash, result, options.model);
  console.log(`[cached] ParseBoxScore (hash: ${inputHash.slice(0, 8)}...)`);

  return result;
}

/**
 * Detect triggers with caching
 *
 * @param boxScore - Parsed BoxScore object
 * @param options - Optional settings
 * @returns TriggerList with detected triggers
 */
export async function detectTriggersCached(
  boxScore: BoxScore,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<TriggerList> {
  // Hash the box score JSON for cache key
  const boxScoreHash = hashContent(JSON.stringify(boxScore));

  // Check cache first
  if (!options.forceRefresh) {
    const cached = getTriggers(boxScoreHash);
    if (cached) {
      console.log(`[cache hit] DetectTriggers (hash: ${boxScoreHash.slice(0, 8)}...)`);
      return cached as TriggerList;
    }
  }

  // Cache miss - call LLM
  console.log(`[cache miss] DetectTriggers - calling LLM...`);
  const result = await b.DetectTriggers(boxScore);

  // Store in cache
  storeTriggers(boxScoreHash, result, options.model);
  console.log(`[cached] DetectTriggers (hash: ${boxScoreHash.slice(0, 8)}...)`);

  return result;
}

/**
 * Full pipeline: parse raw text and detect triggers, with caching at each step
 */
export async function processBoxScoreCached(
  rawText: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<{ boxScore: BoxScore; triggers: TriggerList }> {
  const boxScore = await parseBoxScoreCached(rawText, options);
  const triggers = await detectTriggersCached(boxScore, options);
  return { boxScore, triggers };
}

/**
 * Process a file from the cache by its path
 */
export async function processFileCached(
  filePath: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<{ boxScore: BoxScore; triggers: TriggerList } | null> {
  const rawInput = getRawInput(filePath);
  if (!rawInput) {
    console.error(`File not found in cache: ${filePath}`);
    return null;
  }

  return processBoxScoreCached(rawInput.content, options);
}

// ============================================================================
// Baseball Pipeline Functions
// ============================================================================

/**
 * Parse a baseball box score with caching
 *
 * @param rawText - The raw box score HTML/text
 * @param options - Optional settings
 * @returns Parsed BaseballBoxScore object
 */
export async function parseBaseballBoxScoreCached(
  rawText: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<BaseballBoxScore> {
  const inputHash = hashContent(rawText);

  // Check cache first (unless forced refresh)
  if (!options.forceRefresh) {
    const cached = getParsedBoxScore(inputHash);
    if (cached) {
      console.log(`[cache hit] ParseBaseballBoxScore (hash: ${inputHash.slice(0, 8)}...)`);
      return cached as BaseballBoxScore;
    }
  }

  // Cache miss - call LLM
  console.log(`[cache miss] ParseBaseballBoxScore - calling LLM...`);
  const result = await b.ParseBaseballBoxScore(rawText);

  // Store in cache
  storeParsedBoxScore(inputHash, result, options.model);
  console.log(`[cached] ParseBaseballBoxScore (hash: ${inputHash.slice(0, 8)}...)`);

  return result;
}

/**
 * Detect baseball triggers with caching
 *
 * @param boxScore - Parsed BaseballBoxScore object
 * @param options - Optional settings
 * @returns BaseballTriggerList with detected triggers
 */
export async function detectBaseballTriggersCached(
  boxScore: BaseballBoxScore,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<BaseballTriggerList> {
  // Hash the box score JSON for cache key
  const boxScoreHash = hashContent(JSON.stringify(boxScore));

  // Check cache first
  if (!options.forceRefresh) {
    const cached = getTriggers(boxScoreHash);
    if (cached) {
      console.log(`[cache hit] DetectBaseballTriggers (hash: ${boxScoreHash.slice(0, 8)}...)`);
      return cached as BaseballTriggerList;
    }
  }

  // Cache miss - call LLM
  console.log(`[cache miss] DetectBaseballTriggers - calling LLM...`);
  const result = await b.DetectBaseballTriggers(boxScore);

  // Store in cache
  storeTriggers(boxScoreHash, result, options.model);
  console.log(`[cached] DetectBaseballTriggers (hash: ${boxScoreHash.slice(0, 8)}...)`);

  return result;
}

/**
 * Full baseball pipeline: parse raw text and detect triggers, with caching at each step
 */
export async function processBaseballBoxScoreCached(
  rawText: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<{ boxScore: BaseballBoxScore; triggers: BaseballTriggerList }> {
  const boxScore = await parseBaseballBoxScoreCached(rawText, options);
  const triggers = await detectBaseballTriggersCached(boxScore, options);
  return { boxScore, triggers };
}

// ============================================================================
// Water Polo Pipeline Functions
// ============================================================================

/**
 * Parse a water polo box score with caching
 *
 * @param rawText - The raw box score HTML/text
 * @param options - Optional settings
 * @returns Parsed WaterPoloBoxScore object
 */
export async function parseWaterPoloBoxScoreCached(
  rawText: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<WaterPoloBoxScore> {
  const inputHash = hashContent(rawText);

  // Check cache first (unless forced refresh)
  if (!options.forceRefresh) {
    const cached = getParsedBoxScore(inputHash);
    if (cached) {
      console.log(`[cache hit] ParseWaterPoloBoxScore (hash: ${inputHash.slice(0, 8)}...)`);
      return cached as WaterPoloBoxScore;
    }
  }

  // Cache miss - call LLM
  console.log(`[cache miss] ParseWaterPoloBoxScore - calling LLM...`);
  const result = await b.ParseWaterPoloBoxScore(rawText);

  // Store in cache
  storeParsedBoxScore(inputHash, result, options.model);
  console.log(`[cached] ParseWaterPoloBoxScore (hash: ${inputHash.slice(0, 8)}...)`);

  return result;
}

/**
 * Detect water polo triggers with caching
 *
 * @param boxScore - Parsed WaterPoloBoxScore object
 * @param options - Optional settings
 * @returns WaterPoloTriggerList with detected triggers
 */
export async function detectWaterPoloTriggersCached(
  boxScore: WaterPoloBoxScore,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<WaterPoloTriggerList> {
  // Hash the box score JSON for cache key
  const boxScoreHash = hashContent(JSON.stringify(boxScore));

  // Check cache first
  if (!options.forceRefresh) {
    const cached = getTriggers(boxScoreHash);
    if (cached) {
      console.log(`[cache hit] DetectWaterPoloTriggers (hash: ${boxScoreHash.slice(0, 8)}...)`);
      return cached as WaterPoloTriggerList;
    }
  }

  // Cache miss - call LLM
  console.log(`[cache miss] DetectWaterPoloTriggers - calling LLM...`);
  const result = await b.DetectWaterPoloTriggers(boxScore);

  // Store in cache
  storeTriggers(boxScoreHash, result, options.model);
  console.log(`[cached] DetectWaterPoloTriggers (hash: ${boxScoreHash.slice(0, 8)}...)`);

  return result;
}

/**
 * Full water polo pipeline: parse raw text and detect triggers, with caching at each step
 */
export async function processWaterPoloBoxScoreCached(
  rawText: string,
  options: { forceRefresh?: boolean; model?: string } = {}
): Promise<{ boxScore: WaterPoloBoxScore; triggers: WaterPoloTriggerList }> {
  const boxScore = await parseWaterPoloBoxScoreCached(rawText, options);
  const triggers = await detectWaterPoloTriggersCached(boxScore, options);
  return { boxScore, triggers };
}
