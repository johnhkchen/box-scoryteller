import { describe, it, expect } from 'vitest';
import {
  computeStorySignals,
  rankGamesForCoverage,
  getThresholds,
  BASKETBALL_THRESHOLDS,
  BASKETBALL_PRESETS,
  PRIORITY_WEIGHTS,
  TIER_THRESHOLDS,
} from './story-signals.js';
import type { BoxScore } from '../../baml_client/index.js';

describe('computeStorySignals', () => {
  it('should detect a close overtime game with standout performance', () => {
    const closeOvertimeGame: BoxScore = {
      metadata: {
        home_team: 'State University',
        away_team: 'Rival College',
        home_score: 78,
        away_score: 74,
        is_overtime: true,
        periods: 5,
        game_type: 'Conference',
      },
      home_team: {
        team_name: 'State University',
        total_points: 78,
        field_goals_made: 25,
        field_goals_attempted: 51,
        field_goal_percentage: 49.0,
        three_pointers_made: 5,
        three_pointers_attempted: 13,
        three_point_percentage: 38.5,
        free_throws_made: 23,
        free_throws_attempted: 28,
        free_throw_percentage: 82.1,
        total_rebounds: 31,
        assists: 17,
        steals: 5,
        blocks: 7,
        turnovers: 13,
        fouls: 19,
        players: [
          {
            name: 'Sarah Chen',
            position: 'G',
            starter: true,
            minutes: 36,
            points: 30, // Standout points
            rebounds: 4,
            assists: 5,
            steals: 0,
            blocks: 1,
            turnovers: 2,
            fouls: 3,
            field_goals_made: 10,
            field_goals_attempted: 18,
            three_pointers_made: 2,
            three_pointers_attempted: 4,
            free_throws_made: 8,
            free_throws_attempted: 10,
          },
        ],
      },
      away_team: {
        team_name: 'Rival College',
        total_points: 74,
        field_goals_made: 28,
        field_goals_attempted: 61,
        field_goal_percentage: 45.9,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 12,
        free_throws_attempted: 16,
        free_throw_percentage: 75.0,
        total_rebounds: 42,
        assists: 16,
        steals: 4,
        blocks: 6,
        turnovers: 14,
        fouls: 20,
        players: [],
      },
    };

    const signals = computeStorySignals(closeOvertimeGame);

    expect(signals.is_close_game).toBe(true);
    expect(signals.is_overtime).toBe(true);
    expect(signals.has_standout_performance).toBe(true);
    expect(signals.is_conference_game).toBe(true);
    expect(signals.margin).toBe(4);
    expect(signals.standout_count).toBe(1);

    // Priority score should be: close(2) + overtime(3) + standout(2) + conference(1) = 8
    const expectedScore =
      PRIORITY_WEIGHTS.closeGame +
      PRIORITY_WEIGHTS.overtime +
      PRIORITY_WEIGHTS.standoutPerformance +
      PRIORITY_WEIGHTS.conferenceGame;
    expect(signals.priority_score).toBe(expectedScore);

    expect(signals.signal_reasons).toContain('Close game (4-point margin)');
    expect(signals.signal_reasons).toContain('Overtime game');
    expect(signals.signal_reasons.some((r) => r.includes('Standout performance'))).toBe(true);
    expect(signals.signal_reasons).toContain('Conference game');

    // Should include tier
    expect(signals.tier).toBe('high');
  });

  it('should return low priority for a blowout with no standouts', () => {
    const blowoutGame: BoxScore = {
      metadata: {
        home_team: 'Big University',
        away_team: 'Small College',
        home_score: 95,
        away_score: 55,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Big University',
        total_points: 95,
        field_goals_made: 35,
        field_goals_attempted: 60,
        field_goal_percentage: 58.3,
        three_pointers_made: 8,
        three_pointers_attempted: 20,
        three_point_percentage: 40.0,
        free_throws_made: 17,
        free_throws_attempted: 22,
        free_throw_percentage: 77.3,
        total_rebounds: 45,
        assists: 22,
        steals: 12,
        blocks: 5,
        turnovers: 8,
        fouls: 15,
        players: [
          {
            name: 'Balanced Player 1',
            starter: true,
            minutes: 24,
            points: 12,
            rebounds: 4,
            assists: 3,
            steals: 1,
            blocks: 0,
            turnovers: 1,
            fouls: 2,
            field_goals_made: 5,
            field_goals_attempted: 9,
            three_pointers_made: 1,
            three_pointers_attempted: 3,
            free_throws_made: 1,
            free_throws_attempted: 2,
          },
          {
            name: 'Balanced Player 2',
            starter: true,
            minutes: 22,
            points: 15,
            rebounds: 5,
            assists: 4,
            steals: 2,
            blocks: 1,
            turnovers: 0,
            fouls: 1,
            field_goals_made: 6,
            field_goals_attempted: 10,
            three_pointers_made: 2,
            three_pointers_attempted: 4,
            free_throws_made: 1,
            free_throws_attempted: 1,
          },
        ],
      },
      away_team: {
        team_name: 'Small College',
        total_points: 55,
        field_goals_made: 20,
        field_goals_attempted: 55,
        field_goal_percentage: 36.4,
        three_pointers_made: 3,
        three_pointers_attempted: 18,
        three_point_percentage: 16.7,
        free_throws_made: 12,
        free_throws_attempted: 18,
        free_throw_percentage: 66.7,
        total_rebounds: 28,
        assists: 10,
        steals: 4,
        blocks: 2,
        turnovers: 18,
        fouls: 20,
        players: [],
      },
    };

    const signals = computeStorySignals(blowoutGame);

    expect(signals.is_close_game).toBe(false);
    expect(signals.is_overtime).toBe(false);
    expect(signals.has_standout_performance).toBe(false);
    expect(signals.is_conference_game).toBe(false);
    expect(signals.margin).toBe(40);
    expect(signals.standout_count).toBe(0);
    expect(signals.priority_score).toBe(0);

    expect(signals.signal_reasons).toContain('No major story signals detected');
  });

  it('should detect multiple standout performances', () => {
    const multiStandoutGame: BoxScore = {
      metadata: {
        home_team: 'State University',
        away_team: 'Rival College',
        home_score: 87,
        away_score: 82,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'State University',
        total_points: 87,
        field_goals_made: 30,
        field_goals_attempted: 60,
        field_goal_percentage: 50.0,
        three_pointers_made: 10,
        three_pointers_attempted: 25,
        three_point_percentage: 40.0,
        free_throws_made: 18,
        free_throws_attempted: 22,
        free_throw_percentage: 81.8,
        total_rebounds: 38,
        assists: 20,
        steals: 8,
        blocks: 4,
        turnovers: 12,
        fouls: 18,
        players: [
          {
            name: 'Star Player 1',
            starter: true,
            minutes: 35,
            points: 28,
            rebounds: 5,
            assists: 4,
            steals: 2,
            blocks: 0,
            turnovers: 3,
            fouls: 2,
            field_goals_made: 10,
            field_goals_attempted: 18,
            three_pointers_made: 3,
            three_pointers_attempted: 7,
            free_throws_made: 5,
            free_throws_attempted: 6,
          },
          {
            name: 'Rebounder',
            starter: true,
            minutes: 32,
            points: 8,
            rebounds: 15, // Standout rebounds
            assists: 2,
            steals: 0,
            blocks: 2,
            turnovers: 1,
            fouls: 4,
            field_goals_made: 3,
            field_goals_attempted: 6,
            three_pointers_made: 0,
            three_pointers_attempted: 0,
            free_throws_made: 2,
            free_throws_attempted: 4,
          },
          {
            name: 'Playmaker',
            starter: true,
            minutes: 30,
            points: 12,
            rebounds: 3,
            assists: 10, // Standout assists
            steals: 3,
            blocks: 0,
            turnovers: 2,
            fouls: 3,
            field_goals_made: 5,
            field_goals_attempted: 9,
            three_pointers_made: 2,
            three_pointers_attempted: 4,
            free_throws_made: 0,
            free_throws_attempted: 0,
          },
        ],
      },
      away_team: {
        team_name: 'Rival College',
        total_points: 82,
        field_goals_made: 28,
        field_goals_attempted: 58,
        field_goal_percentage: 48.3,
        three_pointers_made: 8,
        three_pointers_attempted: 22,
        three_point_percentage: 36.4,
        free_throws_made: 18,
        free_throws_attempted: 24,
        free_throw_percentage: 75.0,
        total_rebounds: 32,
        assists: 16,
        steals: 6,
        blocks: 3,
        turnovers: 14,
        fouls: 20,
        players: [],
      },
    };

    const signals = computeStorySignals(multiStandoutGame);

    expect(signals.is_close_game).toBe(true);
    expect(signals.has_standout_performance).toBe(true);
    expect(signals.standout_count).toBe(3);

    expect(signals.signal_reasons.some((r) => r.includes('3 standout performances'))).toBe(true);
  });

  it('should handle edge case: exactly 5-point margin', () => {
    const edgeCase: BoxScore = {
      metadata: {
        home_team: 'Team A',
        away_team: 'Team B',
        home_score: 75,
        away_score: 70,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Team A',
        total_points: 75,
        field_goals_made: 28,
        field_goals_attempted: 55,
        field_goal_percentage: 50.9,
        three_pointers_made: 5,
        three_pointers_attempted: 15,
        three_point_percentage: 33.3,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 35,
        assists: 15,
        steals: 6,
        blocks: 3,
        turnovers: 12,
        fouls: 16,
        players: [],
      },
      away_team: {
        team_name: 'Team B',
        total_points: 70,
        field_goals_made: 26,
        field_goals_attempted: 58,
        field_goal_percentage: 44.8,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 12,
        free_throws_attempted: 16,
        free_throw_percentage: 75.0,
        total_rebounds: 32,
        assists: 14,
        steals: 5,
        blocks: 4,
        turnovers: 14,
        fouls: 18,
        players: [],
      },
    };

    const signals = computeStorySignals(edgeCase);

    expect(signals.is_close_game).toBe(true);
    expect(signals.margin).toBe(5);
  });
});

describe('rankGamesForCoverage', () => {
  it('should rank games by priority score in descending order', () => {
    // Create a high-priority game (OT thriller)
    const highPriorityGame: BoxScore = {
      metadata: {
        home_team: 'State University',
        away_team: 'Rival College',
        home_score: 78,
        away_score: 74,
        is_overtime: true,
        periods: 5,
        game_type: 'Conference',
      },
      home_team: {
        team_name: 'State University',
        total_points: 78,
        field_goals_made: 25,
        field_goals_attempted: 51,
        field_goal_percentage: 49.0,
        three_pointers_made: 5,
        three_pointers_attempted: 13,
        three_point_percentage: 38.5,
        free_throws_made: 23,
        free_throws_attempted: 28,
        free_throw_percentage: 82.1,
        total_rebounds: 31,
        assists: 17,
        steals: 5,
        blocks: 7,
        turnovers: 13,
        fouls: 19,
        players: [
          {
            name: 'Sarah Chen',
            starter: true,
            minutes: 36,
            points: 30,
            rebounds: 4,
            assists: 5,
            steals: 0,
            blocks: 1,
            turnovers: 2,
            fouls: 3,
            field_goals_made: 10,
            field_goals_attempted: 18,
            three_pointers_made: 2,
            three_pointers_attempted: 4,
            free_throws_made: 8,
            free_throws_attempted: 10,
          },
        ],
      },
      away_team: {
        team_name: 'Rival College',
        total_points: 74,
        field_goals_made: 28,
        field_goals_attempted: 61,
        field_goal_percentage: 45.9,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 12,
        free_throws_attempted: 16,
        free_throw_percentage: 75.0,
        total_rebounds: 42,
        assists: 16,
        steals: 4,
        blocks: 6,
        turnovers: 14,
        fouls: 20,
        players: [],
      },
    };

    // Create a medium-priority game (close game with standout)
    const mediumPriorityGame: BoxScore = {
      metadata: {
        home_team: 'College A',
        away_team: 'College B',
        home_score: 75,
        away_score: 72,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'College A',
        total_points: 75,
        field_goals_made: 28,
        field_goals_attempted: 55,
        field_goal_percentage: 50.9,
        three_pointers_made: 5,
        three_pointers_attempted: 15,
        three_point_percentage: 33.3,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 35,
        assists: 15,
        steals: 6,
        blocks: 3,
        turnovers: 12,
        fouls: 16,
        players: [
          {
            name: 'Jordan Mills',
            starter: true,
            minutes: 32,
            points: 26,
            rebounds: 7,
            assists: 5,
            steals: 2,
            blocks: 1,
            turnovers: 1,
            fouls: 2,
            field_goals_made: 10,
            field_goals_attempted: 16,
            three_pointers_made: 2,
            three_pointers_attempted: 5,
            free_throws_made: 4,
            free_throws_attempted: 5,
          },
        ],
      },
      away_team: {
        team_name: 'College B',
        total_points: 72,
        field_goals_made: 26,
        field_goals_attempted: 58,
        field_goal_percentage: 44.8,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 32,
        assists: 14,
        steals: 5,
        blocks: 4,
        turnovers: 14,
        fouls: 18,
        players: [],
      },
    };

    // Create a low-priority game (blowout)
    const lowPriorityGame: BoxScore = {
      metadata: {
        home_team: 'Big University',
        away_team: 'Small College',
        home_score: 95,
        away_score: 55,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Big University',
        total_points: 95,
        field_goals_made: 35,
        field_goals_attempted: 60,
        field_goal_percentage: 58.3,
        three_pointers_made: 8,
        three_pointers_attempted: 20,
        three_point_percentage: 40.0,
        free_throws_made: 17,
        free_throws_attempted: 22,
        free_throw_percentage: 77.3,
        total_rebounds: 45,
        assists: 22,
        steals: 12,
        blocks: 5,
        turnovers: 8,
        fouls: 15,
        players: [],
      },
      away_team: {
        team_name: 'Small College',
        total_points: 55,
        field_goals_made: 20,
        field_goals_attempted: 55,
        field_goal_percentage: 36.4,
        three_pointers_made: 3,
        three_pointers_attempted: 18,
        three_point_percentage: 16.7,
        free_throws_made: 12,
        free_throws_attempted: 18,
        free_throw_percentage: 66.7,
        total_rebounds: 28,
        assists: 10,
        steals: 4,
        blocks: 2,
        turnovers: 18,
        fouls: 20,
        players: [],
      },
    };

    const ranking = rankGamesForCoverage([
      lowPriorityGame,
      highPriorityGame,
      mediumPriorityGame,
    ]);

    // Games should be sorted by priority score
    expect(ranking.games).toHaveLength(3);
    expect(ranking.games[0].box_score.metadata.home_team).toBe('State University');
    expect(ranking.games[1].box_score.metadata.home_team).toBe('College A');
    expect(ranking.games[2].box_score.metadata.home_team).toBe('Big University');
  });

  it('should assign correct tiers based on priority scores', () => {
    // High tier game (score >= 5): OT + close + standout + conference = 8
    const highTierGame: BoxScore = {
      metadata: {
        home_team: 'Team High',
        away_team: 'Team Low',
        home_score: 78,
        away_score: 74,
        is_overtime: true,
        periods: 5,
        game_type: 'Conference',
      },
      home_team: {
        team_name: 'Team High',
        total_points: 78,
        field_goals_made: 25,
        field_goals_attempted: 51,
        field_goal_percentage: 49.0,
        three_pointers_made: 5,
        three_pointers_attempted: 13,
        three_point_percentage: 38.5,
        free_throws_made: 23,
        free_throws_attempted: 28,
        free_throw_percentage: 82.1,
        total_rebounds: 31,
        assists: 17,
        steals: 5,
        blocks: 7,
        turnovers: 13,
        fouls: 19,
        players: [
          {
            name: 'Star',
            starter: true,
            minutes: 36,
            points: 30,
            rebounds: 4,
            assists: 5,
            steals: 0,
            blocks: 1,
            turnovers: 2,
            fouls: 3,
            field_goals_made: 10,
            field_goals_attempted: 18,
            three_pointers_made: 2,
            three_pointers_attempted: 4,
            free_throws_made: 8,
            free_throws_attempted: 10,
          },
        ],
      },
      away_team: {
        team_name: 'Team Low',
        total_points: 74,
        field_goals_made: 28,
        field_goals_attempted: 61,
        field_goal_percentage: 45.9,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 12,
        free_throws_attempted: 16,
        free_throw_percentage: 75.0,
        total_rebounds: 42,
        assists: 16,
        steals: 4,
        blocks: 6,
        turnovers: 14,
        fouls: 20,
        players: [],
      },
    };

    // Medium tier game (score 2-4): close + standout = 4
    const mediumTierGame: BoxScore = {
      metadata: {
        home_team: 'Team Medium',
        away_team: 'Team Other',
        home_score: 75,
        away_score: 72,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Team Medium',
        total_points: 75,
        field_goals_made: 28,
        field_goals_attempted: 55,
        field_goal_percentage: 50.9,
        three_pointers_made: 5,
        three_pointers_attempted: 15,
        three_point_percentage: 33.3,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 35,
        assists: 15,
        steals: 6,
        blocks: 3,
        turnovers: 12,
        fouls: 16,
        players: [
          {
            name: 'Good Player',
            starter: true,
            minutes: 32,
            points: 26,
            rebounds: 7,
            assists: 5,
            steals: 2,
            blocks: 1,
            turnovers: 1,
            fouls: 2,
            field_goals_made: 10,
            field_goals_attempted: 16,
            three_pointers_made: 2,
            three_pointers_attempted: 5,
            free_throws_made: 4,
            free_throws_attempted: 5,
          },
        ],
      },
      away_team: {
        team_name: 'Team Other',
        total_points: 72,
        field_goals_made: 26,
        field_goals_attempted: 58,
        field_goal_percentage: 44.8,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 32,
        assists: 14,
        steals: 5,
        blocks: 4,
        turnovers: 14,
        fouls: 18,
        players: [],
      },
    };

    // Low tier game (score < 2): no signals = 0
    const lowTierGame: BoxScore = {
      metadata: {
        home_team: 'Blowout Winner',
        away_team: 'Blowout Loser',
        home_score: 95,
        away_score: 55,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Blowout Winner',
        total_points: 95,
        field_goals_made: 35,
        field_goals_attempted: 60,
        field_goal_percentage: 58.3,
        three_pointers_made: 8,
        three_pointers_attempted: 20,
        three_point_percentage: 40.0,
        free_throws_made: 17,
        free_throws_attempted: 22,
        free_throw_percentage: 77.3,
        total_rebounds: 45,
        assists: 22,
        steals: 12,
        blocks: 5,
        turnovers: 8,
        fouls: 15,
        players: [],
      },
      away_team: {
        team_name: 'Blowout Loser',
        total_points: 55,
        field_goals_made: 20,
        field_goals_attempted: 55,
        field_goal_percentage: 36.4,
        three_pointers_made: 3,
        three_pointers_attempted: 18,
        three_point_percentage: 16.7,
        free_throws_made: 12,
        free_throws_attempted: 18,
        free_throw_percentage: 66.7,
        total_rebounds: 28,
        assists: 10,
        steals: 4,
        blocks: 2,
        turnovers: 18,
        fouls: 20,
        players: [],
      },
    };

    const ranking = rankGamesForCoverage([highTierGame, mediumTierGame, lowTierGame]);

    expect(ranking.games[0].tier).toBe('high');
    expect(ranking.games[1].tier).toBe('medium');
    expect(ranking.games[2].tier).toBe('low');
  });

  it('should generate appropriate coverage guidance for each tier', () => {
    const games: BoxScore[] = [
      // High priority
      {
        metadata: {
          home_team: 'A',
          away_team: 'B',
          home_score: 78,
          away_score: 74,
          is_overtime: true,
          periods: 5,
        },
        home_team: {
          team_name: 'A',
          total_points: 78,
          field_goals_made: 25,
          field_goals_attempted: 51,
          field_goal_percentage: 49.0,
          three_pointers_made: 5,
          three_pointers_attempted: 13,
          three_point_percentage: 38.5,
          free_throws_made: 23,
          free_throws_attempted: 28,
          free_throw_percentage: 82.1,
          total_rebounds: 31,
          assists: 17,
          steals: 5,
          blocks: 7,
          turnovers: 13,
          fouls: 19,
          players: [
            {
              name: 'Player',
              starter: true,
              minutes: 36,
              points: 30,
              rebounds: 4,
              assists: 5,
              steals: 0,
              blocks: 1,
              turnovers: 2,
              fouls: 3,
              field_goals_made: 10,
              field_goals_attempted: 18,
              three_pointers_made: 2,
              three_pointers_attempted: 4,
              free_throws_made: 8,
              free_throws_attempted: 10,
            },
          ],
        },
        away_team: {
          team_name: 'B',
          total_points: 74,
          field_goals_made: 28,
          field_goals_attempted: 61,
          field_goal_percentage: 45.9,
          three_pointers_made: 6,
          three_pointers_attempted: 20,
          three_point_percentage: 30.0,
          free_throws_made: 12,
          free_throws_attempted: 16,
          free_throw_percentage: 75.0,
          total_rebounds: 42,
          assists: 16,
          steals: 4,
          blocks: 6,
          turnovers: 14,
          fouls: 20,
          players: [],
        },
      },
    ];

    const ranking = rankGamesForCoverage(games);

    expect(ranking.games[0].coverage_guidance).toContain('Emphasize');
    expect(ranking.games[0].coverage_guidance).toContain('deep coverage');
  });

  it('should generate a summary that describes the night', () => {
    const games: BoxScore[] = [
      // 1 high priority (OT game)
      {
        metadata: {
          home_team: 'Team 1',
          away_team: 'Team 2',
          home_score: 78,
          away_score: 74,
          is_overtime: true,
          periods: 5,
        },
        home_team: {
          team_name: 'Team 1',
          total_points: 78,
          field_goals_made: 25,
          field_goals_attempted: 51,
          field_goal_percentage: 49.0,
          three_pointers_made: 5,
          three_pointers_attempted: 13,
          three_point_percentage: 38.5,
          free_throws_made: 23,
          free_throws_attempted: 28,
          free_throw_percentage: 82.1,
          total_rebounds: 31,
          assists: 17,
          steals: 5,
          blocks: 7,
          turnovers: 13,
          fouls: 19,
          players: [
            {
              name: 'Player',
              starter: true,
              minutes: 36,
              points: 30,
              rebounds: 4,
              assists: 5,
              steals: 0,
              blocks: 1,
              turnovers: 2,
              fouls: 3,
              field_goals_made: 10,
              field_goals_attempted: 18,
              three_pointers_made: 2,
              three_pointers_attempted: 4,
              free_throws_made: 8,
              free_throws_attempted: 10,
            },
          ],
        },
        away_team: {
          team_name: 'Team 2',
          total_points: 74,
          field_goals_made: 28,
          field_goals_attempted: 61,
          field_goal_percentage: 45.9,
          three_pointers_made: 6,
          three_pointers_attempted: 20,
          three_point_percentage: 30.0,
          free_throws_made: 12,
          free_throws_attempted: 16,
          free_throw_percentage: 75.0,
          total_rebounds: 42,
          assists: 16,
          steals: 4,
          blocks: 6,
          turnovers: 14,
          fouls: 20,
          players: [],
        },
      },
      // 2 routine games (blowouts)
      {
        metadata: {
          home_team: 'Team 3',
          away_team: 'Team 4',
          home_score: 95,
          away_score: 55,
          is_overtime: false,
          periods: 4,
        },
        home_team: {
          team_name: 'Team 3',
          total_points: 95,
          field_goals_made: 35,
          field_goals_attempted: 60,
          field_goal_percentage: 58.3,
          three_pointers_made: 8,
          three_pointers_attempted: 20,
          three_point_percentage: 40.0,
          free_throws_made: 17,
          free_throws_attempted: 22,
          free_throw_percentage: 77.3,
          total_rebounds: 45,
          assists: 22,
          steals: 12,
          blocks: 5,
          turnovers: 8,
          fouls: 15,
          players: [],
        },
        away_team: {
          team_name: 'Team 4',
          total_points: 55,
          field_goals_made: 20,
          field_goals_attempted: 55,
          field_goal_percentage: 36.4,
          three_pointers_made: 3,
          three_pointers_attempted: 18,
          three_point_percentage: 16.7,
          free_throws_made: 12,
          free_throws_attempted: 18,
          free_throw_percentage: 66.7,
          total_rebounds: 28,
          assists: 10,
          steals: 4,
          blocks: 2,
          turnovers: 18,
          fouls: 20,
          players: [],
        },
      },
      {
        metadata: {
          home_team: 'Team 5',
          away_team: 'Team 6',
          home_score: 88,
          away_score: 52,
          is_overtime: false,
          periods: 4,
        },
        home_team: {
          team_name: 'Team 5',
          total_points: 88,
          field_goals_made: 32,
          field_goals_attempted: 58,
          field_goal_percentage: 55.2,
          three_pointers_made: 6,
          three_pointers_attempted: 18,
          three_point_percentage: 33.3,
          free_throws_made: 18,
          free_throws_attempted: 24,
          free_throw_percentage: 75.0,
          total_rebounds: 40,
          assists: 20,
          steals: 10,
          blocks: 6,
          turnovers: 10,
          fouls: 16,
          players: [],
        },
        away_team: {
          team_name: 'Team 6',
          total_points: 52,
          field_goals_made: 18,
          field_goals_attempted: 50,
          field_goal_percentage: 36.0,
          three_pointers_made: 4,
          three_pointers_attempted: 16,
          three_point_percentage: 25.0,
          free_throws_made: 12,
          free_throws_attempted: 16,
          free_throw_percentage: 75.0,
          total_rebounds: 26,
          assists: 8,
          steals: 4,
          blocks: 2,
          turnovers: 16,
          fouls: 20,
          players: [],
        },
      },
    ];

    const ranking = rankGamesForCoverage(games);

    expect(ranking.summary).toContain('1 high-priority game');
    expect(ranking.summary).toContain('OT thriller');
    expect(ranking.summary).toContain('2 routine games');
  });

  it('should be deterministic for the same inputs', () => {
    const games: BoxScore[] = [
      {
        metadata: {
          home_team: 'A',
          away_team: 'B',
          home_score: 78,
          away_score: 74,
          is_overtime: true,
          periods: 5,
        },
        home_team: {
          team_name: 'A',
          total_points: 78,
          field_goals_made: 25,
          field_goals_attempted: 51,
          field_goal_percentage: 49.0,
          three_pointers_made: 5,
          three_pointers_attempted: 13,
          three_point_percentage: 38.5,
          free_throws_made: 23,
          free_throws_attempted: 28,
          free_throw_percentage: 82.1,
          total_rebounds: 31,
          assists: 17,
          steals: 5,
          blocks: 7,
          turnovers: 13,
          fouls: 19,
          players: [],
        },
        away_team: {
          team_name: 'B',
          total_points: 74,
          field_goals_made: 28,
          field_goals_attempted: 61,
          field_goal_percentage: 45.9,
          three_pointers_made: 6,
          three_pointers_attempted: 20,
          three_point_percentage: 30.0,
          free_throws_made: 12,
          free_throws_attempted: 16,
          free_throw_percentage: 75.0,
          total_rebounds: 42,
          assists: 16,
          steals: 4,
          blocks: 6,
          turnovers: 14,
          fouls: 20,
          players: [],
        },
      },
    ];

    const ranking1 = rankGamesForCoverage(games);
    const ranking2 = rankGamesForCoverage(games);

    expect(ranking1.games[0].tier).toBe(ranking2.games[0].tier);
    expect(ranking1.games[0].signals.priority_score).toBe(
      ranking2.games[0].signals.priority_score
    );
    expect(ranking1.summary).toBe(ranking2.summary);
  });
});

describe('getThresholds', () => {
  it('should return preset thresholds for level names', () => {
    expect(getThresholds('pro')).toEqual(BASKETBALL_PRESETS.pro);
    expect(getThresholds('college')).toEqual(BASKETBALL_PRESETS.college);
    expect(getThresholds('highSchool')).toEqual(BASKETBALL_PRESETS.highSchool);
    expect(getThresholds('youth')).toEqual(BASKETBALL_PRESETS.youth);
  });

  it('should return custom thresholds when passed an object', () => {
    const custom = {
      closeGameMargin: 3,
      standoutPoints: 12,
      standoutRebounds: 5,
      standoutAssists: 3,
    };
    expect(getThresholds(custom)).toEqual(custom);
  });

  it('should default to college level', () => {
    expect(getThresholds()).toEqual(BASKETBALL_PRESETS.college);
  });
});

describe('preset level thresholds', () => {
  // A player with 18 points should be standout at high school level but not college
  const playerWith18Points: BoxScore = {
    metadata: {
      home_team: 'Home',
      away_team: 'Away',
      home_score: 65,
      away_score: 50,
      is_overtime: false,
      periods: 4,
    },
    home_team: {
      team_name: 'Home',
      total_points: 65,
      field_goals_made: 25,
      field_goals_attempted: 50,
      field_goal_percentage: 50.0,
      three_pointers_made: 5,
      three_pointers_attempted: 12,
      three_point_percentage: 41.7,
      free_throws_made: 10,
      free_throws_attempted: 14,
      free_throw_percentage: 71.4,
      total_rebounds: 30,
      assists: 12,
      steals: 5,
      blocks: 3,
      turnovers: 10,
      fouls: 15,
      players: [
        {
          name: 'Solid Player',
          starter: true,
          minutes: 28,
          points: 18,
          rebounds: 5,
          assists: 3,
          steals: 1,
          blocks: 0,
          turnovers: 2,
          fouls: 2,
          field_goals_made: 7,
          field_goals_attempted: 12,
          three_pointers_made: 2,
          three_pointers_attempted: 4,
          free_throws_made: 2,
          free_throws_attempted: 3,
        },
      ],
    },
    away_team: {
      team_name: 'Away',
      total_points: 50,
      field_goals_made: 20,
      field_goals_attempted: 48,
      field_goal_percentage: 41.7,
      three_pointers_made: 4,
      three_pointers_attempted: 14,
      three_point_percentage: 28.6,
      free_throws_made: 6,
      free_throws_attempted: 10,
      free_throw_percentage: 60.0,
      total_rebounds: 25,
      assists: 10,
      steals: 4,
      blocks: 2,
      turnovers: 12,
      fouls: 14,
      players: [],
    },
  };

  it('should not detect standout at pro level for 18 points', () => {
    const signals = computeStorySignals(playerWith18Points, 'pro');
    expect(signals.has_standout_performance).toBe(false);
    expect(signals.standout_count).toBe(0);
  });

  it('should not detect standout at college level for 18 points', () => {
    const signals = computeStorySignals(playerWith18Points, 'college');
    expect(signals.has_standout_performance).toBe(false);
    expect(signals.standout_count).toBe(0);
  });

  it('should detect standout at high school level for 18 points', () => {
    const signals = computeStorySignals(playerWith18Points, 'highSchool');
    expect(signals.has_standout_performance).toBe(true);
    expect(signals.standout_count).toBe(1);
  });

  it('should detect standout at youth level for 18 points', () => {
    const signals = computeStorySignals(playerWith18Points, 'youth');
    expect(signals.has_standout_performance).toBe(true);
    expect(signals.standout_count).toBe(1);
  });

  it('should work with custom thresholds', () => {
    const customThresholds = {
      closeGameMargin: 10,
      standoutPoints: 17, // Just under our player's 18
      standoutRebounds: 12,
      standoutAssists: 10,
    };
    const signals = computeStorySignals(playerWith18Points, customThresholds);
    expect(signals.has_standout_performance).toBe(true);
    expect(signals.standout_count).toBe(1);
  });

  it('should propagate preset level to rankGamesForCoverage', () => {
    const ranking = rankGamesForCoverage([playerWith18Points], 'highSchool');
    expect(ranking.games[0].signals.has_standout_performance).toBe(true);

    const collegeRanking = rankGamesForCoverage([playerWith18Points], 'college');
    expect(collegeRanking.games[0].signals.has_standout_performance).toBe(false);
  });
});

describe('priority tier calculation', () => {
  it('should assign high tier for score >= 5', () => {
    const highPriorityGame: BoxScore = {
      metadata: {
        home_team: 'Home',
        away_team: 'Away',
        home_score: 78,
        away_score: 76,
        is_overtime: true,
        periods: 5,
        game_type: 'conference',
      },
      home_team: {
        team_name: 'Home',
        total_points: 78,
        field_goals_made: 28,
        field_goals_attempted: 60,
        field_goal_percentage: 46.7,
        three_pointers_made: 6,
        three_pointers_attempted: 18,
        three_point_percentage: 33.3,
        free_throws_made: 16,
        free_throws_attempted: 20,
        free_throw_percentage: 80.0,
        total_rebounds: 35,
        assists: 18,
        steals: 7,
        blocks: 4,
        turnovers: 12,
        fouls: 18,
        players: [
          {
            name: 'Star Player',
            starter: true,
            minutes: 38,
            points: 28,
            rebounds: 8,
            assists: 10,
            steals: 3,
            blocks: 1,
            turnovers: 2,
            fouls: 3,
            field_goals_made: 10,
            field_goals_attempted: 18,
            three_pointers_made: 2,
            three_pointers_attempted: 5,
            free_throws_made: 6,
            free_throws_attempted: 7,
          },
        ],
      },
      away_team: {
        team_name: 'Away',
        total_points: 76,
        field_goals_made: 26,
        field_goals_attempted: 58,
        field_goal_percentage: 44.8,
        three_pointers_made: 8,
        three_pointers_attempted: 20,
        three_point_percentage: 40.0,
        free_throws_made: 16,
        free_throws_attempted: 20,
        free_throw_percentage: 80.0,
        total_rebounds: 32,
        assists: 14,
        steals: 5,
        blocks: 3,
        turnovers: 14,
        fouls: 20,
        players: [],
      },
    };

    const signals = computeStorySignals(highPriorityGame, 'college');

    // close=2 + overtime=3 + standout=2 + conference=1 = 8
    expect(signals.priority_score).toBe(8);
    expect(signals.tier).toBe('high');
  });

  it('should assign medium tier for score 2-4', () => {
    const mediumPriorityGame: BoxScore = {
      metadata: {
        home_team: 'Home',
        away_team: 'Away',
        home_score: 75,
        away_score: 72,
        is_overtime: false,
        periods: 4,
        game_type: 'regular',
      },
      home_team: {
        team_name: 'Home',
        total_points: 75,
        field_goals_made: 28,
        field_goals_attempted: 55,
        field_goal_percentage: 50.9,
        three_pointers_made: 5,
        three_pointers_attempted: 15,
        three_point_percentage: 33.3,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 35,
        assists: 15,
        steals: 6,
        blocks: 3,
        turnovers: 12,
        fouls: 16,
        players: [
          {
            name: 'Good Player',
            starter: true,
            minutes: 32,
            points: 22,
            rebounds: 7,
            assists: 5,
            steals: 2,
            blocks: 1,
            turnovers: 1,
            fouls: 2,
            field_goals_made: 10,
            field_goals_attempted: 16,
            three_pointers_made: 2,
            three_pointers_attempted: 5,
            free_throws_made: 0,
            free_throws_attempted: 0,
          },
        ],
      },
      away_team: {
        team_name: 'Away',
        total_points: 72,
        field_goals_made: 26,
        field_goals_attempted: 58,
        field_goal_percentage: 44.8,
        three_pointers_made: 6,
        three_pointers_attempted: 20,
        three_point_percentage: 30.0,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 32,
        assists: 14,
        steals: 5,
        blocks: 4,
        turnovers: 14,
        fouls: 18,
        players: [],
      },
    };

    const signals = computeStorySignals(mediumPriorityGame, 'college');

    // close=2 + standout=2 = 4
    expect(signals.priority_score).toBe(4);
    expect(signals.tier).toBe('medium');
  });

  it('should assign low tier for score < 2', () => {
    const lowPriorityGame: BoxScore = {
      metadata: {
        home_team: 'Home',
        away_team: 'Away',
        home_score: 95,
        away_score: 55,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Home',
        total_points: 95,
        field_goals_made: 35,
        field_goals_attempted: 60,
        field_goal_percentage: 58.3,
        three_pointers_made: 8,
        three_pointers_attempted: 20,
        three_point_percentage: 40.0,
        free_throws_made: 17,
        free_throws_attempted: 22,
        free_throw_percentage: 77.3,
        total_rebounds: 45,
        assists: 22,
        steals: 12,
        blocks: 5,
        turnovers: 8,
        fouls: 15,
        players: [],
      },
      away_team: {
        team_name: 'Away',
        total_points: 55,
        field_goals_made: 20,
        field_goals_attempted: 55,
        field_goal_percentage: 36.4,
        three_pointers_made: 3,
        three_pointers_attempted: 18,
        three_point_percentage: 16.7,
        free_throws_made: 12,
        free_throws_attempted: 18,
        free_throw_percentage: 66.7,
        total_rebounds: 28,
        assists: 10,
        steals: 4,
        blocks: 2,
        turnovers: 18,
        fouls: 20,
        players: [],
      },
    };

    const signals = computeStorySignals(lowPriorityGame, 'college');

    expect(signals.priority_score).toBe(0);
    expect(signals.tier).toBe('low');
  });

  it('should include tier in all computeStorySignals outputs', () => {
    const blowoutGame: BoxScore = {
      metadata: {
        home_team: 'Big',
        away_team: 'Small',
        home_score: 100,
        away_score: 50,
        is_overtime: false,
        periods: 4,
      },
      home_team: {
        team_name: 'Big',
        total_points: 100,
        field_goals_made: 38,
        field_goals_attempted: 65,
        field_goal_percentage: 58.5,
        three_pointers_made: 10,
        three_pointers_attempted: 22,
        three_point_percentage: 45.5,
        free_throws_made: 14,
        free_throws_attempted: 18,
        free_throw_percentage: 77.8,
        total_rebounds: 48,
        assists: 25,
        steals: 14,
        blocks: 6,
        turnovers: 8,
        fouls: 12,
        players: [],
      },
      away_team: {
        team_name: 'Small',
        total_points: 50,
        field_goals_made: 18,
        field_goals_attempted: 52,
        field_goal_percentage: 34.6,
        three_pointers_made: 2,
        three_pointers_attempted: 16,
        three_point_percentage: 12.5,
        free_throws_made: 12,
        free_throws_attempted: 18,
        free_throw_percentage: 66.7,
        total_rebounds: 24,
        assists: 8,
        steals: 3,
        blocks: 1,
        turnovers: 20,
        fouls: 18,
        players: [],
      },
    };

    const signals = computeStorySignals(blowoutGame);
    expect(signals).toHaveProperty('tier');
    expect(typeof signals.tier).toBe('string');
    expect(['high', 'medium', 'low']).toContain(signals.tier);
  });
});
