# Project Roadmap

> **Last Updated**: 2026-01-29

This document tracks project status and progress.

---

## Current Phase

**Phase: Ideation** - S-001 (Project Ideation & Specification)

We are in the design phase, figuring out what we're building. No implementation should happen until the design is clear.

### Active Work

**S-001: Project Ideation & Specification** - Status: Ready

The immediate focus is defining the project concept, understanding constraints, and documenting what we intend to build. This includes exploring possibilities, researching technical options, and converging on a specific idea with a clear specification and user journey.

Once S-001 is complete, we'll have a specification document that describes the project, a happy path showing the core user experience, and enough technical clarity to begin implementation.

### Future Work

**S-002: Technical Foundation** - Status: Pending S-001

After the design is finalized, S-002 will establish the technical foundation needed to implement the specification. The exact scope will be determined based on what S-001 defines.

---

## Milestones

- **M1: Concept Defined** - We know what we're building and why
- **M2: Foundation Ready** - Technical infrastructure is in place
- **M3: MVP Complete** - Core user journey works end-to-end

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
RALPH_ALLOW_MAIN=1 WORKTREE_STORY=S-001 just ralph
```

**Refresh DAG from tickets**:
```bash
just dag-refresh
```

See `docs/knowledge/playbook/ralph-loop.md` for detailed ralph loop instructions.

---

## Archived Work

Previous chassis preparation work has been archived to `docs/archive/` under S-000 prefix. This included chassis audit tasks and DAG upkeep automation work completed before the hackathon project began.
