# Test Fixtures

This directory contains curated test fixtures extracted from real box score data. Each fixture demonstrates interesting narrative patterns detected by the trigger detection system and serves as test data for prompt development.

## What's a Fixture?

A fixture is a JSON file containing:

- **Box score data**: Complete game statistics including player performances, team totals, and game metadata
- **Detected triggers**: Narrative hooks identified by the DetectTriggers function, ranked by salience
- **Semantic tags**: Derived categories describing what makes this game interesting (double-double, clutch-moment, bench-impact, etc.)
- **Metadata**: Source file reference, creation timestamp, and human-readable notes

## Fixture Format

```json
{
  "metadata": {
    "fixture_id": "statistical-extreme-11-11-2023-ohlone-marin",
    "tags": ["double-double", "statistical-extreme", "anomaly", "unexpected-performance"],
    "notes": "Marin won blowout game. Isobel Crosswhite dominated with an exceptional 30-point, 24-rebound double-double...",
    "source_file": "/path/to/processed/2023-11-11_wbkb_hit3.json",
    "trigger_count": 6,
    "top_triggers": [
      {
        "category": "STATISTICAL_EXTREME",
        "description": "Isobel Crosswhite dominated with an exceptional 30-point, 24-rebound double-double on elite efficiency...",
        "salience": 0.95
      }
    ],
    "created_at": "2026-01-30T22:10:53.749Z"
  },
  "box_score": { ... },
  "triggers": { ... }
}
```

## Trigger Categories Covered

The fixture set demonstrates all major trigger categories detected by the system:

- **STATISTICAL_EXTREME**: Exceptional individual performances like 30+ point games, triple-doubles, and dominant rebounding
- **CLUTCH_MOMENT**: Close finishes, overtime games, and clutch free throw performances
- **UNEXPECTED_PERFORMANCE**: Bench players starring, reserves with high-efficiency games
- **ANOMALY**: Guards with zero assists, players with more turnovers than assists, unusual stat lines
- **TREND**: Hot/cold shooting nights, balanced scoring, team-level patterns

## Using Fixtures

Fixtures are designed for systematic prompt testing and development:

```typescript
import fixture from './fixtures/statistical-extreme-11-11-2023-ohlone-marin.json';

// Test trigger detection against known results
const triggers = await b.DetectTriggers(fixture.box_score);
expect(triggers.triggers.length).toBeGreaterThan(0);

// Test narrative synthesis with context
const narratives = await b.SynthesizeNarratives(
  fixture.box_score,
  fixture.triggers,
  contextData,
  'Parents and families'
);

// Verify specific tags are detected
expect(fixture.metadata.tags).toContain('double-double');
```

## Managing Fixtures

Use the curator tool to discover and promote interesting games:

```bash
# Discover interesting games
npx tsx tools/curate-fixtures.ts --discover

# Auto-promote top 10 games
npx tsx tools/curate-fixtures.ts --discover --auto

# Manually promote a specific game
npx tsx tools/curate-fixtures.ts --promote inbox/processed/2023-11-01_mbkb_17et.json

# List existing fixtures
npx tsx tools/curate-fixtures.ts --list

# Show discovery statistics
npx tsx tools/curate-fixtures.ts --stats
```

## Current Fixtures

This directory contains 10 fixtures demonstrating diverse game scenarios:

- **2 anomaly fixtures**: Games with unusual statistical patterns requiring explanation
- **8 statistical extreme fixtures**: Games with exceptional individual performances
- **Mixed game types**: Close games, blowouts, defensive battles, high-scoring affairs
- **Various tags**: Covering double-doubles, clutch moments, bench impact, rebounding dominance, and more

Each fixture was automatically discovered based on trigger salience scoring (games scoring 0.6+ on a 0-1 scale) and promoted with semantic tags derived from the trigger categories.

## Tag Reference

Common tags found in fixtures:

- **statistical-extreme**: Exceptional individual or team performances
- **double-double**: Player with 10+ in two stat categories
- **triple-double**: Player with 10+ in three stat categories
- **high-scoring**: Games with 25+ point performances
- **clutch-moment**: Close finishes or pressure situations
- **clutch-free-throws**: Critical free throw performances
- **overtime**: Games that went to overtime
- **close-game**: Final margin of 5 points or less
- **bench-impact**: Significant contributions from reserves
- **unexpected-performance**: Surprising individual performances
- **anomaly**: Unusual or contradictory statistical patterns
- **rebounding**: Dominant glass work
- **playmaking**: Exceptional assist performance
- **hot-shooting**: High-efficiency shooting nights
- **cold-shooting**: Poor shooting performances
- **balanced-scoring**: Multiple players in double figures
- **turnover-heavy**: High turnover counts affecting game flow

## Refreshing Fixtures

To refresh the fixture set with newly processed games:

1. Process new box scores: `npx tsx tools/process-boxscores.ts --all`
2. Delete old fixtures: `rm inbox/fixtures/*.json`
3. Auto-discover and promote: `npx tsx tools/curate-fixtures.ts --discover --auto`

The curator will automatically skip games already promoted and discover new interesting candidates based on trigger salience.
