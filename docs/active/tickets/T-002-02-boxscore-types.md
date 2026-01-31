---
id: T-002-02
title: Box Score Types
story: S-002
status: complete
priority: 1
complexity: S
type: implementation
depends_on:
  - T-002-01
---

## Objective

Define BAML types for basketball box score data. These types structure what the parser extracts and what downstream functions consume.

## Implementation Details

Create BAML class definitions for:

**GameMetadata** — date, home team, away team, venue, final score, overtime indicator, game type (regular season, conference, tournament)

**PlayerStats** — player name, team, position, starter flag, minutes played, points, rebounds (offensive/defensive/total), assists, steals, blocks, turnovers, fouls, field goals (made/attempted), three-pointers (made/attempted), free throws (made/attempted)

**TeamTotals** — aggregate stats matching player categories, plus team-level stats like fast break points, points in the paint, bench points

**BoxScore** — combines metadata, lists of player stats for each team, and team totals

Keep types focused on what we need for trigger detection and narrative analysis. We can expand later if needed, but start minimal.

## Considerations

Some box score formats include additional data (play-by-play, quarter scores, plus/minus). Defer these unless they're clearly needed for MVP triggers. The goal is parseable, not comprehensive.

## Acceptance Criteria

Types compile without error. They're expressive enough to represent the sample box scores we'll use for testing. Generated TypeScript provides good IDE autocomplete and type checking.
