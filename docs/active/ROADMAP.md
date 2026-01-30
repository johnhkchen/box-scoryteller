# Project Roadmap

> **Last Updated**: 2026-01-30

This document tracks project status and progress.

---

## Current Phase

**Phase: Foundation** - S-002 (BAML Pipeline Foundation)

We've defined what we're building: an interviewer-publicist tool that helps sports information directors surface narratives from box score data. The concept, specification, and target user experience are documented. Now we're setting up the BAML pipeline to prove the core prompt engineering works.

### Completed Work

**S-001: Project Ideation & Specification** - Status: Complete

The specification at `docs/specification.md` defines the interviewer-publicist concept, the BAML pipeline approach, and scope boundaries. The happy path at `docs/happy_path.md` shows the target interaction pattern — the specialist interviews for context, analyzes data through that lens, and surfaces narrative angles.

Key decisions: Focus on the prompt pipeline first (BAML), defer UI to Lovable generation later. The specialist acts as a thinking partner, not a content generator. Basketball first, multi-sport architecture later.

### Active Work

**S-002: BAML Pipeline Foundation** - Status: In Progress

Set up BAML tooling, define box score types, and implement a parser that extracts structured data from raw box score text. This is prerequisite work for the specialist prompts.

Tickets:
- T-002-01: BAML Project Setup ✓ Complete
- T-002-02: Box Score Types (ready for work)
- T-002-03: Box Score Parser (pending T-002-02)

Progress: BAML project initialized with TypeScript integration working. The toolchain generates type-safe clients from BAML definitions, and the test infrastructure is in place. API clients are configured for Claude models (Sonnet 4, Opus 4, Haiku). Documentation and example tests demonstrate the full pipeline. Ready to define domain-specific box score types.

### Upcoming Work

**S-003: Basketball Specialist Prompts** - Status: Pending S-002

Build the trigger detection, context interviewing, and narrative synthesis functions. This is the core value — proving the prompts produce useful output.

---

## Milestones

- **M1: Concept Defined** - Complete. We know what we're building and why.
- **M2: Pipeline Foundation** - BAML project with working box score parsing.
- **M3: Specialist Prompts** - Trigger detection, interviewing, and synthesis working.

---

## Quick Reference

**Check status**:
```bash
just dag-status
```

**Get next task**:
```bash
just prompt
```

**Run autonomous loop**:
```bash
RALPH_ALLOW_MAIN=1 WORKTREE_STORY=S-002 just ralph
```

---

## Archived Work

Previous chassis preparation work has been archived to `docs/archive/` under S-000 prefix. This included chassis audit tasks and DAG upkeep automation work completed before the hackathon project began.
