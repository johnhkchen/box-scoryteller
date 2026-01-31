---
id: T-005-02
title: Multi-Game Priority Ranking
story: S-005
status: pending
priority: 2
complexity: S
type: implementation
depends_on:
  - T-005-01
---

## Objective

Implement a function that takes multiple games with their story signals and produces a ranked list with priority tiers. This helps SIDs see "what matters tonight" before any deep analysis begins.

## Implementation Details

Create a function `RankGamesForCoverage` that takes an array of `BoxScore` objects (each with computed `StorySignals`) and returns a `PriorityRanking` with games sorted by priority score and grouped into tiers.

**Tier logic:**
- **High priority** — score ≥ 5 (overtime + close game, or multiple strong signals)
- **Medium priority** — score 2-4 (one or two signals present)
- **Low priority** — score ≤ 1 (routine games, blowouts)

The ranking includes context that flows into downstream prompts. High-priority games receive instructions to emphasize momentum, key moments, and player performances. Low-priority games get guidance to keep coverage concise and factual.

## Types to Define

```
class RankedGame {
  box_score BoxScore
  signals StorySignals
  tier string @description("high, medium, or low")
  coverage_guidance string @description("Instructions for narrative synthesis, e.g. 'Emphasize clutch moments and individual performances'")
}

class PriorityRanking {
  games RankedGame[]
  summary string @description("Tonight's coverage at a glance, e.g. '1 high-priority game (OT thriller), 2 routine wins'")
}
```

## Acceptance Criteria

- Given 5 games with varying signals, returns them sorted by priority score
- Each game includes a tier assignment and coverage guidance
- Summary provides a human-readable overview of the night's priorities
- Ranking is deterministic given the same inputs
