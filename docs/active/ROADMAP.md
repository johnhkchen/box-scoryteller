# Project Roadmap

> **Last Updated**: 2026-01-30

This document tracks project status and progress.

---

## Current Phase

**Phase: Story Priority and Voice** - Complete

All core features of the Box Scoryteller are now complete. The system can parse box scores, detect narrative triggers, interview for context, synthesize story angles with institutional voice, and prioritize games by story signals. High-priority games receive deep coverage while low-priority games get concise summaries.

### Completed Work

**S-001: Project Ideation & Specification** - Status: Complete

The specification at `docs/specification.md` defines the interviewer-publicist concept, the BAML pipeline approach, and scope boundaries. The happy path at `docs/happy_path.md` shows the target interaction pattern — the specialist interviews for context, analyzes data through that lens, and surfaces narrative angles.

Key decisions: Focus on the prompt pipeline first (BAML), defer UI to Lovable generation later. The specialist acts as a thinking partner, not a content generator. Basketball first, multi-sport architecture later.

**S-002: BAML Pipeline Foundation** - Status: Complete

Successfully set up BAML tooling, defined box score types, and implemented a parser that extracts structured data from raw box score text.

Tickets:
- T-002-01: BAML Project Setup ✓ Complete
- T-002-02: Box Score Types ✓ Complete
- T-002-03: Box Score Parser ✓ Complete

Deliverables: BAML project initialized with TypeScript integration. Type-safe client generation working. Comprehensive box score types defined including PlayerStats, TeamStats, GameMetadata, and BoxScore classes. ParseBoxScore function extracts structured data from raw text with proper handling of starters vs bench, common abbreviations, and percentage calculations. Tests demonstrate successful parsing of complete game data.

**S-003: Basketball Specialist Prompts** - Status: Complete

Built the complete specialist prompt pipeline including trigger detection, context interviewing, and narrative synthesis. This implements the core intelligence that analyzes patterns and surfaces story potential.

Tickets:
- T-003-01: Trigger Detection ✓ Complete
- T-003-02: Context Interview ✓ Complete
- T-003-03: Narrative Synthesis ✓ Complete

Deliverables: DetectTriggers function identifies statistical extremes, unexpected performances, anomalies, and team patterns with follow-up questions and salience scoring. Context interview system with OnboardingInterview for baseline context and GameInterview for data-grounded, context-aware questions. SynthesizeNarratives function connects data to story with specific statistics, context connections, audience framing, and acknowledged gaps. Full interviewer-publicist dynamic implemented.

**S-004: Box Score Data Pipeline** - Status: Complete

Built an ingestion pipeline that collects, normalizes, and curates basketball box score data. This provides realistic test data for the specialist prompts and validates the system against diverse game scenarios.

Tickets:
- T-004-01: Inbox Directory Structure ✓ Complete
- T-004-02: Data Source Integration ✓ Complete
- T-004-03: Box Score Normalization ✓ Complete
- T-004-04: Fixture Extraction ✓ Complete

Deliverables: Successfully fetched 56 box score files from College of Marin athletics covering the 2023-24 season. Implemented normalizer module that converts raw HTML box scores into validated canonical BoxScore JSON files stored in `inbox/processed/` with SQLite caching for efficiency. Built fixture curator at `tools/curate-fixtures.ts` that auto-discovers interesting games based on trigger salience, derives semantic tags from trigger categories, and creates curated test fixtures with metadata. Generated 10 fixtures covering all trigger categories including statistical extremes, clutch moments, unexpected performances, anomalies, and trends. Each fixture includes the original box score, detected triggers, semantic tags, and human-readable notes explaining why the game is interesting.

**S-005: Story Priority and Institutional Voice** - Status: Complete

Implemented complete priority-aware narrative synthesis with institutional voice. Story signals extract boolean flags and compute priority scores from box scores. Multi-game ranking produces prioritized lists with tiers (high/medium/low) and coverage guidance. Voice profiles load from markdown files and inject program personality into synthesis. Narrative synthesis now adjusts depth based on priority tier, with high-priority games receiving 3-4 detailed angles and low-priority games getting concise 1-2 angle summaries.

Tickets:
- T-005-01: Story Signals Extraction ✓ Complete
- T-005-02: Multi-Game Priority Ranking ✓ Complete
- T-005-03: Voice Profile Loading ✓ Complete
- T-005-04: Voice Profile Injection in Narrative Synthesis ✓ Complete
- T-005-05: Priority-Aware Narrative Synthesis ✓ Complete

Deliverables: `computeStorySignals` function in `src/lib/story-signals.ts` extracts signals (close game, overtime, standout performance, conference game) and computes priority score with tier classification. `rankGamesForCoverage` produces ranked lists with coverage guidance. Voice profile loading via `loadVoiceProfile` in `src/lib/voice-profile.ts` with template fallback and error handling. Updated `SynthesizeNarratives` BAML function to accept story signals, coverage guidance, and voice profile, with prompt logic that adjusts synthesis depth based on priority tier. Added `priority_tier` and `tier_rationale` fields to `NarrativeSynthesis` output type. Tests and demo script at `tools/demo-priority-synthesis.ts` demonstrate tier-based depth adjustment.

### Active Work

All stories complete. Project is ready for UI development or next phase of work.

### Upcoming Work

Potential next steps include UI development, additional sports support, or deployment infrastructure.

---

## Milestones

- **M1: Concept Defined** ✓ Complete. We know what we're building and why.
- **M2: Pipeline Foundation** ✓ Complete. BAML project with working box score parsing.
- **M3: Specialist Prompts** ✓ Complete. Trigger detection, interviewing, and narrative synthesis all working.

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
RALPH_ALLOW_MAIN=1 WORKTREE_STORY=S-003 just ralph
```

---

## Archived Work

Previous chassis preparation work has been archived to `docs/archive/` under S-000 prefix. This included chassis audit tasks and DAG upkeep automation work completed before the hackathon project began.
