---
id: T-003-01
title: Trigger Detection
story: S-003
status: complete
priority: 2
complexity: M
type: implementation
depends_on:
  - T-002-03
completed_at: "2026-01-30"
---

## Objective

Implement a BAML function that analyzes parsed box score data and identifies engagement triggers — statistical patterns that suggest story potential.

## Implementation Details

Create a BAML function `DetectTriggers` that accepts a `BoxScore` and returns a list of triggers. Each trigger should include:

- Category (statistical extreme, clutch moment, unexpected performance, anomaly, trend)
- Description of what was detected
- The data that triggered it (player name, stat values)
- A follow-up question that would surface narrative context
- Confidence/salience score for ranking

The prompt should encode basketball domain knowledge:
- What constitutes a notable scoring game (20+? 25+? 30+?)
- What makes a rebounding or assist total impressive
- What shooting percentages suggest hot/cold nights
- What combinations are unusual (high points, zero assists for a guard)

Start with a focused set of triggers rather than trying to catch everything. We can expand as we learn what's useful.

## Initial Trigger Set

**Statistical extremes**: High-scoring game (25+), double-double, triple-double, high-efficiency shooting (60%+ on 10+ FGA), zero turnovers on high usage

**Performance patterns**: Bench player outscoring starters, freshman leading the team, player with unusually high/low stat in one category

**Anomalies**: Guard with zero assists, big with high assist total, large free throw disparity, extreme rebounding gap

## Acceptance Criteria

Given a box score with clear trigger conditions (e.g., a 30-point game), the function identifies them. Triggers include actionable follow-up questions. Output is ranked by relevance. Tests verify detection across trigger categories.

## Implementation Summary

Implemented the `DetectTriggers` BAML function in `baml_src/boxscore.baml` with complete type definitions and comprehensive basketball domain knowledge encoded in the prompt. The function analyzes parsed box score data and returns a ranked list of engagement triggers.

### Key Components

**Type Definitions**: Created `TriggerCategory` enum with five categories (STATISTICAL_EXTREME, CLUTCH_MOMENT, UNEXPECTED_PERFORMANCE, ANOMALY, TREND), `Trigger` class with all required fields including category, description, player name, key statistics map, follow-up question, and salience score, and `TriggerList` wrapper class for the function output.

**Domain Knowledge Encoding**: The prompt includes detailed thresholds for notable performances across scoring (25+ strong, 30+ exceptional), rebounding (10+ double-double, 15+ dominant), assists (8+ excellent, 10+ exceptional), shooting efficiency (60%+ FG hot, 50%+ 3PT excellent), clean performance patterns (zero turnovers with high usage), and defensive impact (3+ steals, 4+ blocks). It also covers bench production patterns, statistical anomalies (guard with zero assists, big with high assists), and team-level patterns (free throw disparities, rebounding gaps, balanced vs isolated scoring).

**Testing**: Added comprehensive test case `detect_triggers` using the same sample game from the parsing tests. The test successfully identifies six high-quality triggers including exceptional free throw performance (Sarah Chen's 16/18 FT), efficient bench production (Jordan Mills' 18 points on 77.8% shooting), team-level disparities (massive FT attempt gap), double-doubles, unusual scoring distributions, and strategic mismatches. All triggers include appropriate categories, clear descriptions, specific statistics, thoughtful follow-up questions, and salience scores ranging from 0.68 to 0.95.

### Test Results

The function correctly detected the bench player outscoring starters, the unusual free throw reliance by the top scorer, the rebounding dominance despite the loss, and the free throw attempt disparity that could indicate either aggressive play or officiating concerns. Each trigger includes an actionable follow-up question that would help an SID dig into the narrative context behind the numbers.

Location: `baml_src/boxscore.baml:143-286`
