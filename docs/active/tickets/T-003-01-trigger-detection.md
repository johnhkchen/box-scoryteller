---
id: T-003-01
title: Trigger Detection
story: S-003
status: pending
priority: 2
complexity: M
type: implementation
depends_on:
  - T-002-03
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
