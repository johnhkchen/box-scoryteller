---
id: T-004-04
title: Fixture Extraction
story: S-004
status: complete
priority: 2
complexity: S
type: implementation
depends_on:
  - T-004-03
  - T-003-01
completed_at: "2026-01-30"
---

## Objective

Build tooling to promote interesting games from processed data into test fixtures. This creates a curated set of examples that demonstrate different trigger categories for prompt testing.

## Implementation Details

Create a fixture curator at `tools/curate-fixtures.ts` that:

- Scans processed data for games matching criteria
- Runs trigger detection to identify interesting games
- Allows manual promotion of games to fixtures
- Adds metadata tags to fixtures (e.g., "double-double", "comeback", "blowout")

The tool should support both automated discovery and manual curation. Automated discovery finds games with high trigger counts or specific trigger categories. Manual curation lets a developer flag a specific game they've found interesting.

## Fixture Format

Fixtures are BoxScore JSON files with additional metadata:

```json
{
  "fixture_id": "comeback-2025-01-15",
  "tags": ["comeback", "high-scoring", "overtime"],
  "notes": "State erased 15-point deficit in final quarter",
  "source_file": "inbox/processed/2025-01-15_state-vs-rival.json",
  "box_score": { ... }
}
```

## Target Fixtures

Aim for fixtures demonstrating each trigger category:

- Statistical extreme: 30+ point game, triple-double
- Clutch moment: Overtime game, close finish
- Unexpected performance: Bench player starring
- Anomaly: Guard with zero assists, unusual stat line
- Trend: Team shooting hot/cold

At least 10 fixtures covering this variety.

## Acceptance Criteria

The curator tool can search processed data by criteria. Fixtures include metadata explaining why they're interesting. The fixture set covers all trigger categories. Fixtures are committed to version control and usable in tests.

## Completion Summary

Built the fixture curator tool at `tools/curate-fixtures.ts` with the following capabilities:

**Auto-discovery**: Scans all processed box scores and scores them for interestingness based on trigger count and average salience. Supports filtering by minimum score threshold and specific trigger categories. Returns ranked candidates sorted by compelling narrative potential.

**Manual promotion**: Allows promoting specific games by file path, useful when a developer finds an interesting edge case or wants to ensure coverage of a particular pattern.

**Semantic tagging**: Automatically derives descriptive tags from trigger categories and descriptions. Tags include double-double, high-scoring, clutch-moment, bench-impact, anomaly, trend, and 12 other specific patterns. Tags make it easy to select fixtures for targeted testing.

**Metadata generation**: Each fixture includes a unique ID based on top trigger category, date, and team names to avoid collisions. Human-readable notes summarize the game outcome and most compelling trigger. Top 3 triggers with descriptions and salience scores for quick reference. Source file path for traceability back to processed data.

**Coverage achieved**: Generated 10 fixtures covering all trigger categories with 23 STATISTICAL_EXTREME triggers, 23 ANOMALY triggers, 14 UNEXPECTED_PERFORMANCE triggers, 2 CLUTCH_MOMENT triggers, and 2 TREND triggers across the fixture set. Fixtures demonstrate diverse game types including close games, blowouts, defensive battles, and high-scoring affairs. Tag distribution includes double-doubles, rebounding dominance, clutch free throws, bench impact, turnover-heavy performances, and shooting trends.

**Command-line interface**: Supports `--discover` to find interesting games with optional filters, `--promote` to manually create a fixture from a file, `--list` to view all existing fixtures, `--stats` to analyze trigger distribution across processed games, and `--auto` flag to automatically promote top 10 discovered games.

All fixtures are stored in `inbox/fixtures/` with complete box score data, trigger analysis, and semantic tags. The README at `inbox/fixtures/README.md` documents the format, usage patterns, and tag reference for test development.
