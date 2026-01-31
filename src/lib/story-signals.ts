/**
 * Story Signals Extraction and Multi-Game Priority Ranking
 *
 * Extracts simple boolean and numeric signals from box scores to enable game-level
 * prioritization. This is a lightweight first pass that runs before deeper analysis,
 * using deterministic rule-based logic rather than LLM calls.
 */

import type {
  BoxScore,
  StorySignals,
  RankedGame,
  PriorityRanking,
  WaterPoloBoxScore,
} from '../../baml_client/index.js';

/**
 * Threshold configuration for basketball story signals.
 * Adjust these based on competition level to properly identify standout performances.
 */
export interface BasketballThresholds {
  /** Point margin that qualifies as a "close game" */
  closeGameMargin: number;
  /** Points threshold for standout performance */
  standoutPoints: number;
  /** Rebounds threshold for standout performance */
  standoutRebounds: number;
  /** Assists threshold for standout performance */
  standoutAssists: number;
}

/**
 * Preset threshold configurations for different competition levels.
 * These are calibrated based on typical stat distributions at each level.
 */
export const BASKETBALL_PRESETS = {
  /** NBA/WNBA professional level */
  pro: {
    closeGameMargin: 5,
    standoutPoints: 30,
    standoutRebounds: 12,
    standoutAssists: 10,
  },
  /** NCAA Division I level */
  college: {
    closeGameMargin: 5,
    standoutPoints: 20,
    standoutRebounds: 10,
    standoutAssists: 7,
  },
  /** High school varsity level */
  highSchool: {
    closeGameMargin: 5,
    standoutPoints: 15,
    standoutRebounds: 8,
    standoutAssists: 5,
  },
  /** Youth/recreational leagues */
  youth: {
    closeGameMargin: 5,
    standoutPoints: 10,
    standoutRebounds: 6,
    standoutAssists: 4,
  },
} as const satisfies Record<string, BasketballThresholds>;

export type BasketballPresetLevel = keyof typeof BASKETBALL_PRESETS;

/**
 * Default thresholds (college level) for backward compatibility.
 * Use BASKETBALL_PRESETS for level-specific thresholds.
 */
export const BASKETBALL_THRESHOLDS: BasketballThresholds = BASKETBALL_PRESETS.college;

/**
 * Threshold configuration for water polo story signals.
 * Water polo is lower-scoring than basketball, so thresholds are calibrated accordingly.
 */
export interface WaterPoloThresholds {
  /** Goal margin that qualifies as a "close game" */
  closeGameMargin: number;
  /** Goals threshold for standout performance */
  standoutGoals: number;
  /** Assists threshold for standout performance (water polo is more goal-centric) */
  standoutAssists: number;
  /** Steals threshold for standout defensive performance */
  standoutSteals: number;
  /** Saves threshold for standout goalkeeper performance */
  standoutSaves: number;
}

/**
 * Preset threshold configurations for water polo at different competition levels.
 */
export const WATERPOLO_PRESETS = {
  /** NCAA Division I / Olympic level */
  elite: {
    closeGameMargin: 2,
    standoutGoals: 5,
    standoutAssists: 3,
    standoutSteals: 4,
    standoutSaves: 12,
  },
  /** NCAA Division II/III / Varsity college level */
  college: {
    closeGameMargin: 3,
    standoutGoals: 4,
    standoutAssists: 2,
    standoutSteals: 3,
    standoutSaves: 10,
  },
  /** High school varsity level */
  highSchool: {
    closeGameMargin: 3,
    standoutGoals: 3,
    standoutAssists: 2,
    standoutSteals: 3,
    standoutSaves: 8,
  },
  /** Club / recreational level */
  club: {
    closeGameMargin: 3,
    standoutGoals: 3,
    standoutAssists: 2,
    standoutSteals: 2,
    standoutSaves: 6,
  },
} as const satisfies Record<string, WaterPoloThresholds>;

export type WaterPoloPresetLevel = keyof typeof WATERPOLO_PRESETS;

/**
 * Default water polo thresholds (college level).
 */
export const WATERPOLO_THRESHOLDS: WaterPoloThresholds = WATERPOLO_PRESETS.college;

/**
 * Weights for priority score calculation
 */
export const PRIORITY_WEIGHTS = {
  closeGame: 2,
  overtime: 3,
  standoutPerformance: 2,
  conferenceGame: 1,
} as const;

/**
 * Get thresholds for a given preset level.
 * Accepts either a preset name or a custom threshold object.
 */
export function getThresholds(
  levelOrThresholds: BasketballPresetLevel | BasketballThresholds = 'college'
): BasketballThresholds {
  if (typeof levelOrThresholds === 'string') {
    return BASKETBALL_PRESETS[levelOrThresholds];
  }
  return levelOrThresholds;
}

/**
 * Check if a player has a standout performance based on basketball thresholds
 */
function hasStandoutStats(
  points: number,
  rebounds: number,
  assists: number,
  thresholds: BasketballThresholds = BASKETBALL_THRESHOLDS
): boolean {
  return (
    points >= thresholds.standoutPoints ||
    rebounds >= thresholds.standoutRebounds ||
    assists >= thresholds.standoutAssists
  );
}

/**
 * Compute story signals from a box score using deterministic rules
 *
 * This function is rule-based and deterministic — the same input always produces
 * the same output. It extracts signals that help prioritize which games deserve
 * deeper coverage.
 *
 * @param boxScore - Parsed box score data
 * @param levelOrThresholds - Preset level name ('pro', 'college', 'highSchool', 'youth') or custom thresholds
 * @returns StorySignals object with flags, counts, and priority score
 */
export function computeStorySignals(
  boxScore: BoxScore,
  levelOrThresholds: BasketballPresetLevel | BasketballThresholds = 'college'
): StorySignals {
  const thresholds = getThresholds(levelOrThresholds);
  const { metadata, home_team, away_team } = boxScore;

  // Calculate margin
  const margin = Math.abs(metadata.home_score - metadata.away_score);

  // Check if it's a close game
  const is_close_game = margin <= thresholds.closeGameMargin;

  // Check if it went to overtime
  const is_overtime = metadata.is_overtime || false;

  // Check for standout performances across both teams
  const homePlayers = home_team?.players || [];
  const awayPlayers = away_team?.players || [];
  const allPlayers = [...homePlayers, ...awayPlayers];

  const standoutPlayers = allPlayers.filter((player) =>
    hasStandoutStats(player.points, player.rebounds, player.assists, thresholds)
  );

  const has_standout_performance = standoutPlayers.length > 0;
  const standout_count = standoutPlayers.length;

  // Check if it's a conference game
  const is_conference_game =
    metadata.game_type?.toLowerCase().includes('conference') || false;

  // Calculate priority score using weighted formula
  const priority_score =
    (is_close_game ? PRIORITY_WEIGHTS.closeGame : 0) +
    (is_overtime ? PRIORITY_WEIGHTS.overtime : 0) +
    (has_standout_performance ? PRIORITY_WEIGHTS.standoutPerformance : 0) +
    (is_conference_game ? PRIORITY_WEIGHTS.conferenceGame : 0);

  // Generate human-readable signal reasons
  const signal_reasons: string[] = [];

  if (is_close_game) {
    signal_reasons.push(`Close game (${margin}-point margin)`);
  }

  if (is_overtime) {
    signal_reasons.push('Overtime game');
  }

  if (has_standout_performance) {
    if (standout_count === 1) {
      const player = standoutPlayers[0];
      const stats: string[] = [];
      if (player.points >= thresholds.standoutPoints) stats.push(`${player.points} points`);
      if (player.rebounds >= thresholds.standoutRebounds)
        stats.push(`${player.rebounds} rebounds`);
      if (player.assists >= thresholds.standoutAssists) stats.push(`${player.assists} assists`);
      signal_reasons.push(`Standout performance: ${player.name} (${stats.join(', ')})`);
    } else {
      signal_reasons.push(`${standout_count} standout performances`);
    }
  }

  if (is_conference_game) {
    signal_reasons.push('Conference game');
  }

  // If no signals, add a default reason
  if (signal_reasons.length === 0) {
    signal_reasons.push('No major story signals detected');
  }

  // Determine tier based on priority score
  const tier = determineTier(priority_score);

  return {
    is_close_game,
    is_overtime,
    has_standout_performance,
    is_conference_game,
    margin,
    standout_count,
    priority_score,
    signal_reasons,
    tier,
  };
}

/**
 * Tier thresholds for priority classification
 */
export const TIER_THRESHOLDS = {
  high: 5, // score >= 5
  medium: 2, // score 2-4
  // low is anything < 2
} as const;

/**
 * Determine the priority tier based on the priority score
 */
function determineTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= TIER_THRESHOLDS.high) {
    return 'high';
  } else if (score >= TIER_THRESHOLDS.medium) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate coverage guidance based on priority tier and signals
 */
function generateCoverageGuidance(tier: string, signals: StorySignals): string {
  if (tier === 'high') {
    return 'Emphasize clutch moments, individual performances, and game flow. This is a featured story that deserves deep coverage with quotes, context, and narrative arc.';
  } else if (tier === 'medium') {
    return 'Cover key performances and game outcome. Focus on standout moments and statistics without extensive narrative development.';
  } else {
    return 'Keep coverage concise and factual. Report final score, top performers, and basic game summary.';
  }
}

/**
 * Rank games for coverage based on story signals
 *
 * Takes multiple box scores, computes their story signals, and produces a ranked list
 * with priority tiers. This helps SIDs see "what matters tonight" before any deep
 * analysis begins.
 *
 * @param boxScores - Array of parsed box score data
 * @param levelOrThresholds - Preset level name ('pro', 'college', 'highSchool', 'youth') or custom thresholds
 * @returns PriorityRanking with games sorted by priority score and summary
 */
export function rankGamesForCoverage(
  boxScores: BoxScore[],
  levelOrThresholds: BasketballPresetLevel | BasketballThresholds = 'college'
): PriorityRanking {
  // Compute signals for each game
  const gamesWithSignals = boxScores.map((boxScore) => ({
    boxScore,
    signals: computeStorySignals(boxScore, levelOrThresholds),
  }));

  // Sort by priority score (descending)
  const sortedGames = gamesWithSignals.sort(
    (a, b) => b.signals.priority_score - a.signals.priority_score
  );

  // Create ranked games with tiers and coverage guidance
  const rankedGames: RankedGame[] = sortedGames.map(({ boxScore, signals }) => {
    const tier = determineTier(signals.priority_score);
    const coverage_guidance = generateCoverageGuidance(tier, signals);

    return {
      box_score: boxScore,
      signals,
      tier,
      coverage_guidance,
    };
  });

  // Generate summary
  const tierCounts = {
    high: rankedGames.filter((g) => g.tier === 'high').length,
    medium: rankedGames.filter((g) => g.tier === 'medium').length,
    low: rankedGames.filter((g) => g.tier === 'low').length,
  };

  const summaryParts: string[] = [];

  if (tierCounts.high > 0) {
    const highGames = rankedGames.filter((g) => g.tier === 'high');
    const descriptors = highGames
      .map((g) => {
        if (g.signals.is_overtime) return 'OT thriller';
        if (g.signals.is_close_game) return 'close game';
        return 'high-priority game';
      })
      .slice(0, 2); // Show up to 2 descriptors

    summaryParts.push(
      `${tierCounts.high} high-priority ${tierCounts.high === 1 ? 'game' : 'games'} (${descriptors.join(', ')})`
    );
  }

  if (tierCounts.medium > 0) {
    summaryParts.push(
      `${tierCounts.medium} medium-priority ${tierCounts.medium === 1 ? 'game' : 'games'}`
    );
  }

  if (tierCounts.low > 0) {
    summaryParts.push(
      `${tierCounts.low} routine ${tierCounts.low === 1 ? 'game' : 'games'}`
    );
  }

  const summary = summaryParts.join(', ') || 'No games to rank';

  return {
    games: rankedGames,
    summary,
  };
}

/**
 * Get water polo thresholds for a given preset level.
 * Accepts either a preset name or a custom threshold object.
 */
export function getWaterPoloThresholds(
  levelOrThresholds: WaterPoloPresetLevel | WaterPoloThresholds = 'college'
): WaterPoloThresholds {
  if (typeof levelOrThresholds === 'string') {
    return WATERPOLO_PRESETS[levelOrThresholds];
  }
  return levelOrThresholds;
}

/**
 * Check if a water polo player has a standout performance
 */
function hasStandoutWaterPoloStats(
  goals: number,
  assists: number,
  steals: number,
  thresholds: WaterPoloThresholds = WATERPOLO_THRESHOLDS
): boolean {
  return (
    goals >= thresholds.standoutGoals ||
    assists >= thresholds.standoutAssists ||
    steals >= thresholds.standoutSteals
  );
}

/**
 * Check if a water polo goalkeeper has a standout performance
 */
function hasStandoutGoalkeeperStats(
  saves: number,
  thresholds: WaterPoloThresholds = WATERPOLO_THRESHOLDS
): boolean {
  return saves >= thresholds.standoutSaves;
}

/**
 * Compute story signals from a water polo box score using deterministic rules
 *
 * @param boxScore - Parsed water polo box score data
 * @param levelOrThresholds - Preset level name or custom thresholds
 * @returns StorySignals object with flags, counts, and priority score
 */
export function computeWaterPoloStorySignals(
  boxScore: WaterPoloBoxScore,
  levelOrThresholds: WaterPoloPresetLevel | WaterPoloThresholds = 'college'
): StorySignals {
  const thresholds = getWaterPoloThresholds(levelOrThresholds);
  const { metadata, home_team, away_team } = boxScore;

  // Calculate margin
  const margin = Math.abs(metadata.home_score - metadata.away_score);

  // Check if it's a close game
  const is_close_game = margin <= thresholds.closeGameMargin;

  // Water polo doesn't have "overtime" in the same sense, but can have extra periods
  // Check if more than 4 periods were played
  const is_overtime = (metadata.periods || 4) > 4;

  // Check for standout performances across both teams
  const homePlayers = home_team?.players || [];
  const awayPlayers = away_team?.players || [];
  const allPlayers = [...homePlayers, ...awayPlayers];

  const standoutFieldPlayers = allPlayers.filter((player) =>
    hasStandoutWaterPoloStats(
      player.goals,
      player.assists,
      player.steals,
      thresholds
    )
  );

  // Check goalkeepers
  const homeGoalkeepers = home_team?.goalkeepers || [];
  const awayGoalkeepers = away_team?.goalkeepers || [];
  const allGoalkeepers = [...homeGoalkeepers, ...awayGoalkeepers];

  const standoutGoalkeepers = allGoalkeepers.filter((gk) =>
    hasStandoutGoalkeeperStats(gk.saves, thresholds)
  );

  const standout_count = standoutFieldPlayers.length + standoutGoalkeepers.length;
  const has_standout_performance = standout_count > 0;

  // Check if it's a conference game
  const is_conference_game =
    metadata.game_type?.toLowerCase().includes('conference') || false;

  // Calculate priority score using weighted formula
  const priority_score =
    (is_close_game ? PRIORITY_WEIGHTS.closeGame : 0) +
    (is_overtime ? PRIORITY_WEIGHTS.overtime : 0) +
    (has_standout_performance ? PRIORITY_WEIGHTS.standoutPerformance : 0) +
    (is_conference_game ? PRIORITY_WEIGHTS.conferenceGame : 0);

  // Generate human-readable signal reasons
  const signal_reasons: string[] = [];

  if (is_close_game) {
    signal_reasons.push(`Close game (${margin}-goal margin)`);
  }

  if (is_overtime) {
    signal_reasons.push('Extra period(s) played');
  }

  if (standoutFieldPlayers.length > 0) {
    if (standoutFieldPlayers.length === 1) {
      const player = standoutFieldPlayers[0];
      const stats: string[] = [];
      if (player.goals >= thresholds.standoutGoals) stats.push(`${player.goals} goals`);
      if (player.assists >= thresholds.standoutAssists) stats.push(`${player.assists} assists`);
      if (player.steals >= thresholds.standoutSteals) stats.push(`${player.steals} steals`);
      signal_reasons.push(`Standout performance: ${player.name} (${stats.join(', ')})`);
    } else {
      signal_reasons.push(`${standoutFieldPlayers.length} standout field player performances`);
    }
  }

  if (standoutGoalkeepers.length > 0) {
    if (standoutGoalkeepers.length === 1) {
      const gk = standoutGoalkeepers[0];
      signal_reasons.push(`Standout goalkeeper: ${gk.name} (${gk.saves} saves)`);
    } else {
      signal_reasons.push(`${standoutGoalkeepers.length} standout goalkeeper performances`);
    }
  }

  if (is_conference_game) {
    signal_reasons.push('Conference game');
  }

  // If no signals, add a default reason
  if (signal_reasons.length === 0) {
    signal_reasons.push('No major story signals detected');
  }

  // Determine tier based on priority score
  const tier = determineTier(priority_score);

  return {
    is_close_game,
    is_overtime,
    has_standout_performance,
    is_conference_game,
    margin,
    standout_count,
    priority_score,
    signal_reasons,
    tier,
  };
}
