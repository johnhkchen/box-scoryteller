#!/usr/bin/env tsx
/**
 * Demonstration of Priority-Aware Narrative Synthesis
 *
 * Shows how story priority connects to narrative synthesis depth.
 * High-priority games get comprehensive coverage, low-priority games
 * get concise summaries.
 */

import { b } from '../src/lib/baml-wrapper.server.js';
import { computeStorySignals } from '../src/lib/story-signals.js';
import type { BoxScore, NarrativeContext, TriggerList } from '../../baml_client/index.js';

// Sample box scores representing different priority levels
const highPriorityGame: BoxScore = {
  metadata: {
    date: '2026-01-30',
    venue: 'Home Arena',
    home_team: 'Eagles',
    away_team: 'Rivals',
    home_score: 78,
    away_score: 76,
    is_overtime: true,
    periods: 5,
    game_type: 'conference',
  },
  home_team: {
    team_name: 'Eagles',
    total_points: 78,
    field_goals_made: 28,
    field_goals_attempted: 62,
    field_goal_percentage: 45.2,
    three_pointers_made: 6,
    three_pointers_attempted: 18,
    three_point_percentage: 33.3,
    free_throws_made: 16,
    free_throws_attempted: 20,
    free_throw_percentage: 80.0,
    total_rebounds: 38,
    assists: 18,
    steals: 7,
    blocks: 4,
    turnovers: 12,
    fouls: 18,
    players: [
      {
        name: 'Alex Martinez',
        position: 'G',
        starter: true,
        minutes: 42,
        points: 28,
        rebounds: 6,
        assists: 8,
        steals: 3,
        blocks: 0,
        turnovers: 3,
        fouls: 2,
        field_goals_made: 10,
        field_goals_attempted: 21,
        three_pointers_made: 3,
        three_pointers_attempted: 8,
        free_throws_made: 5,
        free_throws_attempted: 6,
      },
    ],
  },
  away_team: {
    team_name: 'Rivals',
    total_points: 76,
    field_goals_made: 26,
    field_goals_attempted: 58,
    field_goal_percentage: 44.8,
    three_pointers_made: 8,
    three_pointers_attempted: 20,
    three_point_percentage: 40.0,
    free_throws_made: 16,
    free_throws_attempted: 22,
    free_throw_percentage: 72.7,
    total_rebounds: 36,
    assists: 14,
    steals: 5,
    blocks: 3,
    turnovers: 14,
    fouls: 20,
    players: [],
  },
};

const mediumPriorityGame: BoxScore = {
  metadata: {
    date: '2026-01-30',
    venue: 'Away Arena',
    home_team: 'Opponents',
    away_team: 'Eagles',
    home_score: 72,
    away_score: 78,
    is_overtime: false,
    periods: 4,
    game_type: 'regular season',
  },
  home_team: {
    team_name: 'Opponents',
    total_points: 72,
    field_goals_made: 26,
    field_goals_attempted: 58,
    field_goal_percentage: 44.8,
    three_pointers_made: 6,
    three_pointers_attempted: 18,
    three_point_percentage: 33.3,
    free_throws_made: 14,
    free_throws_attempted: 18,
    free_throw_percentage: 77.8,
    total_rebounds: 34,
    assists: 16,
    steals: 6,
    blocks: 3,
    turnovers: 13,
    fouls: 18,
    players: [],
  },
  away_team: {
    team_name: 'Eagles',
    total_points: 78,
    field_goals_made: 28,
    field_goals_attempted: 56,
    field_goal_percentage: 50.0,
    three_pointers_made: 8,
    three_pointers_attempted: 20,
    three_point_percentage: 40.0,
    free_throws_made: 14,
    free_throws_attempted: 16,
    free_throw_percentage: 87.5,
    total_rebounds: 38,
    assists: 20,
    steals: 8,
    blocks: 5,
    turnovers: 10,
    fouls: 16,
    players: [
      {
        name: 'Jordan Lee',
        position: 'F',
        starter: true,
        minutes: 32,
        points: 22,
        rebounds: 11,
        assists: 3,
        steals: 2,
        blocks: 1,
        turnovers: 2,
        fouls: 3,
        field_goals_made: 9,
        field_goals_attempted: 16,
        three_pointers_made: 2,
        three_pointers_attempted: 5,
        free_throws_made: 2,
        free_throws_attempted: 2,
      },
    ],
  },
};

const lowPriorityGame: BoxScore = {
  metadata: {
    date: '2026-01-30',
    venue: 'Home Arena',
    home_team: 'Eagles',
    away_team: 'Cellar Dwellers',
    home_score: 92,
    away_score: 64,
    is_overtime: false,
    periods: 4,
    game_type: 'regular season',
  },
  home_team: {
    team_name: 'Eagles',
    total_points: 92,
    field_goals_made: 34,
    field_goals_attempted: 64,
    field_goal_percentage: 53.1,
    three_pointers_made: 10,
    three_pointers_attempted: 24,
    three_point_percentage: 41.7,
    free_throws_made: 14,
    free_throws_attempted: 18,
    free_throw_percentage: 77.8,
    total_rebounds: 42,
    assists: 24,
    steals: 12,
    blocks: 6,
    turnovers: 8,
    fouls: 14,
    players: [],
  },
  away_team: {
    team_name: 'Cellar Dwellers',
    total_points: 64,
    field_goals_made: 22,
    field_goals_attempted: 58,
    field_goal_percentage: 37.9,
    three_pointers_made: 4,
    three_pointers_attempted: 18,
    three_point_percentage: 22.2,
    free_throws_made: 16,
    free_throws_attempted: 22,
    free_throw_percentage: 72.7,
    total_rebounds: 28,
    assists: 10,
    steals: 4,
    blocks: 2,
    turnovers: 18,
    fouls: 20,
    players: [],
  },
};

// Sample context
const sampleContext: NarrativeContext = {
  team_name: 'Eagles',
  sport: 'Basketball',
  players: [
    {
      player_name: 'Alex Martinez',
      role: 'Starting point guard, team captain',
      backstory: 'Senior leader in final season',
      current_arc: 'Chasing program scoring record',
      development_focus: 'Clutch performance in big games',
    },
    {
      player_name: 'Jordan Lee',
      role: 'Starting forward',
      backstory: 'Transfer student from Division I',
      current_arc: 'Emerging as consistent double-double threat',
      development_focus: 'Defensive intensity and rebounding',
    },
  ],
  team: {
    season_narrative: 'Championship contender with veteran leadership',
    current_record: '18-4 overall, 8-2 in conference',
    key_challenges: 'Depth at guard position',
    goals: 'Win conference championship and make tournament run',
    coaching_philosophy: 'Defensive intensity and ball movement on offense',
  },
  audience: [
    {
      segment_name: 'Alumni',
      interests: ['Championship pursuit', 'Program milestones', 'Player achievements'],
    },
    {
      segment_name: 'Recruits',
      interests: ['Team success', 'Playing style', 'Development opportunities'],
    },
  ],
  rivalries: ['Rivals - historic conference rivalry'],
  upcoming_milestones: ['Senior night in two weeks', 'Conference tournament next month'],
};

// Sample triggers for demonstration
const highPriorityTriggers: TriggerList = {
  triggers: [
    {
      category: 'CLUTCH_MOMENT',
      description: 'Alex Martinez scored 8 points in overtime to seal the victory',
      player_name: 'Alex Martinez',
      key_stats: { overtime_points: '8', total_points: '28' },
      follow_up_question: 'What was the team's mindset entering overtime?',
      salience_score: 0.95,
    },
    {
      category: 'STATISTICAL_EXTREME',
      description: 'Alex Martinez 28 points with 8 assists in 42 minutes - complete game',
      player_name: 'Alex Martinez',
      key_stats: { points: '28', assists: '8', minutes: '42' },
      follow_up_question: "How close is Alex to the program's all-time scoring record?",
      salience_score: 0.9,
    },
  ],
};

const mediumPriorityTriggers: TriggerList = {
  triggers: [
    {
      category: 'STATISTICAL_EXTREME',
      description: 'Jordan Lee double-double: 22 points, 11 rebounds',
      player_name: 'Jordan Lee',
      key_stats: { points: '22', rebounds: '11' },
      follow_up_question: 'How many double-doubles has Jordan recorded this season?',
      salience_score: 0.75,
    },
  ],
};

const lowPriorityTriggers: TriggerList = {
  triggers: [
    {
      category: 'TREND',
      description: 'Team shot 53% from the field in dominant win',
      key_stats: { fg_pct: '53.1%', margin: '28' },
      follow_up_question: 'Is this balanced scoring typical for this team?',
      salience_score: 0.5,
    },
  ],
};

async function demonstratePriorityAwareSynthesis() {
  console.log('='.repeat(80));
  console.log('Priority-Aware Narrative Synthesis Demo');
  console.log('='.repeat(80));
  console.log();

  const scenarios = [
    {
      name: 'HIGH PRIORITY: Overtime Conference Thriller',
      game: highPriorityGame,
      triggers: highPriorityTriggers,
    },
    {
      name: 'MEDIUM PRIORITY: Road Win with Standout Performance',
      game: mediumPriorityGame,
      triggers: mediumPriorityTriggers,
    },
    {
      name: 'LOW PRIORITY: Routine Blowout Victory',
      game: lowPriorityGame,
      triggers: lowPriorityTriggers,
    },
  ];

  for (const scenario of scenarios) {
    console.log('\n' + '-'.repeat(80));
    console.log(`SCENARIO: ${scenario.name}`);
    console.log('-'.repeat(80));

    // Compute story signals
    const signals = computeStorySignals(scenario.game, 'college');

    console.log('\nStory Signals:');
    console.log(`  Priority Score: ${signals.priority_score}`);
    console.log(`  Tier: ${signals.tier.toUpperCase()}`);
    console.log(`  Reasons: ${signals.signal_reasons.join('; ')}`);
    console.log();

    // Generate coverage guidance based on tier
    const guidanceMap = {
      high: 'Emphasize clutch moments, individual performances, and game flow. This is a featured story that deserves deep coverage with quotes, context, and narrative arc.',
      medium:
        'Cover key performances and game outcome. Focus on standout moments and statistics without extensive narrative development.',
      low: 'Keep coverage concise and factual. Report final score, top performers, and basic game summary.',
    };
    const coverage_guidance =
      guidanceMap[signals.tier as keyof typeof guidanceMap] || guidanceMap.medium;

    console.log('Generating narrative synthesis...\n');

    try {
      const synthesis = await b.SynthesizeNarratives(
        scenario.game,
        scenario.triggers,
        sampleContext,
        null, // voice_profile
        signals,
        coverage_guidance,
        null, // target_audience
        null // target_channel
      );

      console.log(`Priority Tier: ${synthesis.priority_tier}`);
      console.log(`Tier Rationale: ${synthesis.tier_rationale}`);
      console.log();

      console.log(`Number of Angles Generated: ${synthesis.angles.length}`);
      console.log();

      synthesis.angles.forEach((angle, index) => {
        console.log(`Angle ${index + 1}: ${angle.title}`);
        console.log(`  Hook: ${angle.hook}`);
        console.log(`  Data: ${angle.data_support}`);
        if (angle.context_connection) {
          console.log(`  Context: ${angle.context_connection.substring(0, 100)}...`);
        }
        console.log();
      });

      console.log(`Lead Recommendation: ${synthesis.lead_recommendation}`);
      console.log();
    } catch (error) {
      console.error('Error generating synthesis:', error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Demo Complete');
  console.log('='.repeat(80));
  console.log();
  console.log('Key Observations:');
  console.log('- High-priority games receive 3-4 detailed angles with comprehensive analysis');
  console.log('- Medium-priority games receive 2-3 angles with moderate detail');
  console.log('- Low-priority games receive 1-2 concise angles focused on essentials');
  console.log('- Coverage depth adjusts automatically based on story signals');
  console.log();
}

demonstratePriorityAwareSynthesis().catch(console.error);
