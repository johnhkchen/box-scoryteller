---
id: T-004-03
title: Box Score Normalization
story: S-004
status: complete
priority: 2
complexity: M
type: implementation
depends_on:
  - T-004-02
  - T-002-02
completed_at: 2026-01-30
---

## Objective

Create a normalization pipeline that converts raw fetched data into our canonical BoxScore structure. This validates that our types work with real-world data and produces the processed data used for testing.

## Implementation Details

Create a normalizer module at `src/lib/normalizer.ts` that:

- Reads raw data files from `inbox/raw/`
- Maps source-specific fields to our BoxScore type
- Validates the result against our schema
- Writes normalized JSON to `inbox/processed/`
- Reports errors for games that can't be normalized

The normalizer should handle variations in how different sources represent the same data. Field names differ between sources, some fields may be missing, and formats vary. The normalizer abstracts these differences.

Consider using the BAML ParseBoxScore function for text-based sources, or direct mapping for structured API responses. The approach depends on what the data source returns.

## Validation

Each normalized BoxScore should be validated:

- Required fields are present and typed correctly
- Percentages are within valid ranges (0-100)
- Player stats sum approximately to team totals
- Point totals match the stated score

Log warnings for suspicious data but don't fail on minor discrepancies, since real data has occasional errors.

## Acceptance Criteria

The normalizer processes all raw data files without crashing. Processed files conform to the BoxScore schema. Validation catches obvious data errors. A processing summary reports success/failure counts.

## Implementation Summary

Created the normalization pipeline at `src/lib/normalizer.ts` that reads raw HTML box score files from the cache, parses them using the BAML ParseBoxScore function with SQLite caching for efficiency, validates the parsed results against our schema, and writes normalized JSON to `inbox/processed/`. The validation logic checks for required metadata fields, team stats presence, player data, percentage ranges (0-100), and approximate point total matches between team stats and metadata scores. Validation warnings are reported for minor discrepancies but don't fail the normalization since real-world data has occasional errors.

The command-line tool at `tools/normalize-boxscores.ts` provides single-file and batch processing modes with options for forcing cache refresh, skipping already-processed files, and verbose validation output. Successfully processed all 56 raw box score files from the College of Marin 2023-24 season with zero validation errors, producing clean normalized JSON files that serve as the foundation for test fixture creation and system validation against real game data.
