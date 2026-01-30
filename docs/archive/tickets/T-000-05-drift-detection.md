---
id: T-002-02
title: Drift Detection
story: S-002
status: ready
priority: 3
complexity: S
type: task
depends_on: [T-002-01]
---

## Objective

Implement drift detection to verify that `task-graph.yaml` matches the state of the filesystem.

## Context

Even with automation, it's possible for the graph and filesystem to drift if `dag-refresh` isn't run. `just dag-status` should warn if there are discrepancies (e.g., a file exists but isn't in the graph, or a node in the graph points to a missing file).

## Acceptance Criteria

- [ ] `just dag-status` checks for consistency
- [ ] Warnings are displayed for orphaned nodes
- [ ] Warnings are displayed for untracked markdown files in active directories
