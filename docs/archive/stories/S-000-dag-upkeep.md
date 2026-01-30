---
id: S-000-dag
title: "[ARCHIVED] DAG Upkeep & Automation"
status: complete
priority: 2
archived: true
---

## Objective

Reduce the manual toil required to maintain `task-graph.yaml` by establishing a discipline of "DAG Upkeep" and identifying automation opportunities.

## Context

Currently, the `task-graph.yaml` is the source of truth for the Ralph workflow, but it is manually synchronized with markdown files in `docs/active`. This decoupling leads to drift, where stories or tickets exist in docs but not in the graph (or vice versa).

## Acceptance Criteria

- [ ] `stories` key in `task-graph.yaml` is populated with all active stories
- [ ] Drift between `docs/active/stories` and `task-graph.yaml` is resolved
- [ ] A clear process (or script) is identified for future updates
