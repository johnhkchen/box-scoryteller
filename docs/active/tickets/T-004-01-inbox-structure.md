---
id: T-004-01
title: Inbox Directory Structure
story: S-004
status: complete
priority: 2
complexity: S
type: implementation
depends_on: []
completed_at: "2026-01-30"
---

## Objective

Set up the directory structure for box score data ingestion. This establishes conventions for raw data, processed data, and test fixtures that the rest of the pipeline will use.

## Implementation Details

Create the following directory structure:

```
inbox/
  raw/           # Unprocessed data from sources
  processed/     # Normalized BoxScore JSON files
  fixtures/      # Hand-picked test data
  README.md      # Documents the structure and conventions
```

Update `.gitignore` to exclude large data files while tracking the directory structure and fixtures. Raw and processed data shouldn't be committed, but fixtures should be versioned since tests depend on them.

Create a README in the inbox directory explaining the data flow and file naming conventions. Files should be named with date and teams for easy discovery, like `2025-01-15_state-vs-rival.json`.

## Acceptance Criteria

The directory structure exists with placeholder `.gitkeep` files. The gitignore correctly excludes raw and processed data but includes fixtures. The README documents the conventions clearly enough that a developer can understand the data flow.
