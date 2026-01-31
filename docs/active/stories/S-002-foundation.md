---
id: S-002
title: BAML Pipeline Foundation
status: complete
priority: 1
depends_on:
  - S-001
---

## Objective

Set up the BAML project structure and prove we can parse box scores into structured data. This establishes the foundation for the prompt pipeline without building any UI.

## Context

BAML gives us type-safe prompt engineering with testable functions. We need to get the tooling working, define our data types, and verify we can reliably extract structured information from raw box score text. This is the prerequisite for building the interviewer/analyst prompts.

## Deliverables

A working BAML project with TypeScript integration. Type definitions for basketball box scores covering game metadata, player stats, and team totals. A parsing function that extracts structured data from raw box score text. Sample fixtures and tests proving the parsing works.

## Tickets

**T-002-01: BAML Project Setup** initializes the BAML project, configures TypeScript integration, and verifies the toolchain works end-to-end with a simple test function.

**T-002-02: Box Score Types** defines the BAML types for basketball game data — enough structure to support trigger detection and narrative analysis.

**T-002-03: Box Score Parser** implements a BAML function that takes raw box score text and returns structured data, with tests against sample fixtures.

## Acceptance Criteria

Running `baml test` succeeds. The parser correctly extracts player stats, team totals, and game metadata from sample box scores. Types are well-defined enough to support the trigger detection work in S-003.
