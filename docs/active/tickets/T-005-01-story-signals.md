---
id: T-005-01
title: Story Signals Extraction
story: S-005
status: complete
priority: 2
complexity: S
type: implementation
depends_on:
  - T-003-01
completed_at: "2026-01-30"
---

## Objective

Implement a function that extracts simple boolean and numeric signals from a box score to enable game-level prioritization. This is a lightweight first pass that runs before deeper analysis.

## Implementation Details

Create a BAML function `ExtractStorySignals` that takes a `BoxScore` and returns a `StorySignals` object containing:

**Boolean flags:**
- `is_close_game` — margin ≤ 5 points for basketball (calibrate per-sport)
- `is_overtime` — already available in `GameMetadata.is_overtime`
- `has_standout_performance` — any player crossed notable thresholds (25+ points, 10+ rebounds, 8+ assists for basketball)
- `is_conference_game` — from `GameMetadata.game_type` if available
- `is_streak_relevant` — requires external context, may need placeholder

**Numeric values:**
- `margin` — point differential
- `standout_count` — number of players with notable performances
- `priority_score` — weighted sum of signals

The weighting formula starts simple:
```
priority_score = (is_close_game × 2) + (is_overtime × 3) + (has_standout_performance × 2) + (is_conference_game × 1)
```

This is rule-based, not LLM-based — the function should be deterministic. Use an LLM only if extracting nuanced signals like "blowout in which one quarter was competitive" becomes valuable later.

## Types to Define

```
class StorySignals {
  is_close_game bool
  is_overtime bool
  has_standout_performance bool
  is_conference_game bool
  margin int
  standout_count int
  priority_score float
  signal_reasons string[] @description("Human-readable reasons, e.g. 'Close game (4-point margin)'")
}
```

## Acceptance Criteria

- Given a close overtime game with a standout performer, returns appropriate flags and high priority score ✓
- Given a 20-point blowout with no individual standouts, returns low priority score ✓
- `signal_reasons` array provides human-readable explanations for the ranking ✓
- Function is deterministic — same input always produces same output ✓

## Implementation Summary

Implemented story signals extraction as a deterministic TypeScript function rather than an LLM-based BAML function since the logic is purely rule-based. The implementation includes:

**Core Module** (`src/lib/story-signals.ts`) provides `computeStorySignals` function that extracts boolean flags (close game, overtime, standout performance, conference game) and numeric values (margin, standout count, priority score) from box score data. Uses configurable thresholds for basketball with sensible defaults: 5-point margin for close games, 25+ points / 10+ rebounds / 8+ assists for standout performances.

**Type Definition** added `StorySignals` class to `baml_src/boxscore.baml` with all required fields. BAML client regenerated to provide TypeScript types.

**Priority Scoring** implements the weighted formula: `priority_score = (is_close_game × 2) + (is_overtime × 3) + (has_standout_performance × 2) + (is_conference_game × 1)`. Weights are exported as constants for easy tuning.

**Signal Reasons** generates human-readable explanations like "Close game (4-point margin)" and "Standout performance: Sarah Chen (30 points)". Multiple standout performances show count instead of individual details.

**Testing** comprehensive test suite in `src/lib/story-signals.test.ts` covers close overtime games, blowouts, multiple standouts, and edge cases. All tests passing.

**Demonstration Tool** (`tools/analyze-story-signals.ts`) shows story signals analysis on real fixture data, ranking games by priority with full signal breakdown and summary table. Successfully processes all 10 fixtures, correctly identifying the highest-priority game (close 4-point margin with 2 standout performances, score 4) and lowest-priority game (no signals, score 0).
