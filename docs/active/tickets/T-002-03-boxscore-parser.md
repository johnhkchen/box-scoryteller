---
id: T-002-03
title: Box Score Parser
story: S-002
status: complete
priority: 1
complexity: M
type: implementation
depends_on:
  - T-002-02
---

## Objective

Implement a BAML function that takes raw box score text and returns structured BoxScore data. This is the entry point for the pipeline — everything else depends on reliable parsing.

## Implementation Details

Create a BAML function `ParseBoxScore` that accepts a string (the raw box score text) and returns a `BoxScore` object. The prompt should instruct the LLM to:

1. Identify the teams, date, venue, and final score
2. Extract player statistics for each team
3. Calculate or extract team totals
4. Handle common variations in box score formatting

Create sample fixtures representing realistic box score formats:
- Standard NCAA-style box scores
- ESPN/sports website formats
- Minimal formats (just player stats, no frills)

Write tests that verify the parser extracts correct data from each fixture.

## Error Handling

The parser should handle gracefully:
- Missing optional fields (venue, overtime, some stat categories)
- Ambiguous player names
- Inconsistent formatting

When data is uncertain, the parser should note the uncertainty rather than hallucinate values.

## Acceptance Criteria

The parser correctly extracts all required fields from the sample fixtures. Test cases pass demonstrating accurate extraction. Edge cases (overtime games, incomplete data) are handled without crashes.
