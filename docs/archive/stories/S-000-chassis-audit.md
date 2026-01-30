---
id: S-000-audit
title: "[ARCHIVED] Chassis Audit (The Gauntlet)"
status: complete
priority: 1
archived: true
---

## Objective

Smoke test the Ralph Svelte Chassis and its multi-agent workflow. The agent must verify that the codebase is clean, the toolchain is functional, and that it has write access to the project.

## Context

We have just converted `solar-sim` into `ralph-svelte-chassis-template`. This story serves as the "Gauntlet" to prove that an autonomous agent can successfully navigate the new structure.

## Acceptance Criteria

- [ ] `src/lib` inventory confirms no solar-sim debris
- [ ] `docs` inventory confirms no legacy specs
- [ ] `bun run check` passes
- [ ] `just dag-status` runs without error
- [ ] `README.md` contains the agent's verification signature
