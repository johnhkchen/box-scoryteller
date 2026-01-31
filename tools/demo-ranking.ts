#!/usr/bin/env bun
/**
 * Demo: Multi-Game Priority Ranking
 *
 * This script demonstrates the priority ranking feature by taking multiple
 * box scores and showing how they get ranked and tiered for coverage.
 */

import { rankGamesForCoverage } from '../src/lib/story-signals.js';
import type { BoxScore } from '../baml_client/index.js';

// Create sample games with varying levels of priority

// High priority: Close overtime game with standout performance
const overtimeThrill: BoxScore = {
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

// Medium priority: Close game with standout
const closeGameWithStar: BoxScore = {
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

// Medium priority: Conference game with standout
const conferenceWin: BoxScore = {
  metadata: {
    home_team: 'Tech University',
    away_team: 'Institute College',
    home_score: 82,
    away_score: 68,
    is_overtime: false,
    periods: 4,
    game_type: 'Conference',
  },
  home_team: {
    team_name: 'Tech University',
    total_points: 82,
    field_goals_made: 30,
    field_goals_attempted: 58,
    field_goal_percentage: 51.7,
    three_pointers_made: 7,
    three_pointers_attempted: 18,
    three_point_percentage: 38.9,
    free_throws_made: 15,
    free_throws_attempted: 20,
    free_throw_percentage: 75.0,
    total_rebounds: 38,
    assists: 18,
    steals: 8,
    blocks: 5,
    turnovers: 10,
    fouls: 16,
    players: [
      {
        name: 'Alex Thompson',
        starter: true,
        minutes: 34,
        points: 28,
        rebounds: 6,
        assists: 4,
        steals: 3,
        blocks: 1,
        turnovers: 2,
        fouls: 2,
        field_goals_made: 11,
        field_goals_attempted: 19,
        three_pointers_made: 3,
        three_pointers_attempted: 7,
        free_throws_made: 3,
        free_throws_attempted: 4,
      },
    ],
  },
  away_team: {
    team_name: 'Institute College',
    total_points: 68,
    field_goals_made: 24,
    field_goals_attempted: 56,
    field_goal_percentage: 42.9,
    three_pointers_made: 4,
    three_pointers_attempted: 16,
    three_point_percentage: 25.0,
    free_throws_made: 16,
    free_throws_attempted: 22,
    free_throw_percentage: 72.7,
    total_rebounds: 30,
    assists: 12,
    steals: 5,
    blocks: 3,
    turnovers: 16,
    fouls: 18,
    players: [],
  },
};

// Low priority: Blowout with no special signals
const routineBlowout: BoxScore = {
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

// Low priority: Comfortable win
const comfortableWin: BoxScore = {
  metadata: {
    home_team: 'Metro State',
    away_team: 'City College',
    home_score: 77,
    away_score: 62,
    is_overtime: false,
    periods: 4,
  },
  home_team: {
    team_name: 'Metro State',
    total_points: 77,
    field_goals_made: 28,
    field_goals_attempted: 54,
    field_goal_percentage: 51.9,
    three_pointers_made: 6,
    three_pointers_attempted: 16,
    three_point_percentage: 37.5,
    free_throws_made: 15,
    free_throws_attempted: 20,
    free_throw_percentage: 75.0,
    total_rebounds: 36,
    assists: 16,
    steals: 7,
    blocks: 4,
    turnovers: 11,
    fouls: 17,
    players: [],
  },
  away_team: {
    team_name: 'City College',
    total_points: 62,
    field_goals_made: 22,
    field_goals_attempted: 52,
    field_goal_percentage: 42.3,
    three_pointers_made: 5,
    three_pointers_attempted: 18,
    three_point_percentage: 27.8,
    free_throws_made: 13,
    free_throws_attempted: 18,
    free_throw_percentage: 72.2,
    total_rebounds: 28,
    assists: 11,
    steals: 4,
    blocks: 2,
    turnovers: 15,
    fouls: 19,
    players: [],
  },
};

// Rank the games
const games = [overtimeThrill, closeGameWithStar, conferenceWin, routineBlowout, comfortableWin];
const ranking = rankGamesForCoverage(games);

// Display results
console.log('\n🏀 Multi-Game Priority Ranking Demo\n');
console.log('═'.repeat(80));
console.log(`\n📋 Tonight's Coverage: ${ranking.summary}\n`);
console.log('═'.repeat(80));

ranking.games.forEach((game, index) => {
  const homeTeam = game.box_score.metadata.home_team;
  const awayTeam = game.box_score.metadata.away_team;
  const homeScore = game.box_score.metadata.home_score;
  const awayScore = game.box_score.metadata.away_score;
  const tier = game.tier.toUpperCase();
  const score = game.signals.priority_score;

  console.log(`\n${index + 1}. ${homeTeam} ${homeScore}, ${awayTeam} ${awayScore}`);
  console.log(`   Tier: ${tier} (Score: ${score})`);
  console.log(`   Signals: ${game.signals.signal_reasons.join(', ')}`);
  console.log(`   Coverage: ${game.coverage_guidance}`);
});

console.log('\n' + '═'.repeat(80) + '\n');
