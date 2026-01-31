---
id: T-004-02
title: Data Source Integration
story: S-004
status: complete
priority: 2
complexity: M
type: implementation
depends_on:
  - T-004-01
completed_at: "2026-01-30"
---

## Objective

Implement a fetcher that can pull box score data from a basketball statistics source. This provides the raw material for testing the specialist prompts against real game data.

## Selected Source: College of Marin Athletics

We chose the College of Marin athletics site (`athletics.marin.edu`) because it's a real community college program with publicly accessible box scores. This gives us authentic data at the level of competition the tool targets — small school SIDs who don't have ESPN coverage.

The site provides box scores in both HTML and a print-friendly monospace format. We use the monospace template (`?tmpl=bbxml-monospace-template`) which produces cleaner output for parsing.

## Implementation

**Fetcher module** at `src/lib/fetcher.ts` provides functions to:
- Scrape the schedule page to find all games with box scores
- Fetch individual box scores using the monospace template
- Store raw HTML in `inbox/raw/` with date/sport/gamecode naming

**CLI tool** at `tools/fetch-boxscores.ts` allows command-line fetching:
```bash
npx tsx tools/fetch-boxscores.ts --sport wbkb --season 2023-24
npx tsx tools/fetch-boxscores.ts --sport mbkb --season 2023-24 --max 5
```

Rate limiting is built in with a 500ms delay between requests to avoid overwhelming the server.

## Data Format

Fetched files are HTML box scores in print format containing:
- Game metadata (date, venue, teams, final score)
- Per-player statistics (FG, 3PT, FT, REB, AST, STL, BLK, TO, PF, PTS, MIN)
- Team totals and shooting percentages
- Starters marked with asterisks

This format works well with our BAML ParseBoxScore function, which can extract structured data from the text.

## Acceptance Criteria

All criteria met:
- The fetcher retrieves box scores for entire seasons
- Files are stored with date and game identifiers
- Rate limiting prevents failures
- Both men's (mbkb) and women's (wbkb) basketball supported
