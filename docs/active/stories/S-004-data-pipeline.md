---
id: S-004
title: Box Score Data Pipeline
status: ready
priority: 2
depends_on: []
---

## Objective

Build an ingestion pipeline that collects and stores a year's worth of basketball box score data for testing and development. This provides realistic test data for the specialist prompts and ensures the parsing and analysis functions work across diverse game scenarios.

## Context

The specialist prompts need to be tested against real game data, not just hand-crafted examples. A year's worth of box scores provides seasonal variety including conference play, tournament games, and different team matchups. This data also reveals edge cases in the parser that synthetic examples miss.

The pipeline should be simple and focused: fetch data, normalize it, store it for use by tests and development. We're not building a production data system, just a development resource.

## Deliverables

An inbox directory structure for raw and processed box score data. A fetcher that can pull box score data from a source API or scrape it from public sites. A normalization step that converts various formats into our canonical BoxScore structure. Storage as JSON files organized by date/team for easy browsing and test fixture creation.

## Tickets

**T-004-01: Inbox Directory Structure** sets up the directory layout and gitignore rules for data storage. Raw data goes in `inbox/raw/`, processed data in `inbox/processed/`, and test fixtures extracted from real data go in `inbox/fixtures/`.

**T-004-02: Data Source Integration** implements fetching from a basketball stats source. The NCAA provides public box scores, and several APIs offer college basketball data. Research the best source and implement a fetcher.

**T-004-03: Box Score Normalization** creates a pipeline step that takes raw fetched data and converts it to our BoxScore type. This validates the parser against real-world data formats.

**T-004-04: Fixture Extraction** builds tooling to promote interesting games from processed data into test fixtures. An SID or developer should be able to flag games with compelling patterns for use in prompt testing.

## Acceptance Criteria

The inbox contains at least one season's worth of box score data covering multiple teams. Processed data validates against the BoxScore schema. The pipeline can be re-run to refresh data. At least 10 hand-picked fixtures exist demonstrating different trigger categories.

## Open Questions

Which data source provides the best coverage and easiest access? ESPN, NCAA, or sports-reference all have different tradeoffs. The first ticket should include a brief research spike to evaluate options.
