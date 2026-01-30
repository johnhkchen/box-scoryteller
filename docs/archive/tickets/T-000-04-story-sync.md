---
id: T-002-01
title: Automate Story Sync
story: S-002
status: complete
priority: 2
complexity: S
type: task
depends_on: []
completed_at: "2026-01-30T01:26:16.279Z"
---

## Objective

Automate the synchronization of stories from the `docs/active/stories` directory to `task-graph.yaml`.

## Context

Currently, adding a new story requires manually adding an entry to the `stories` list in `task-graph.yaml`. This is error-prone and toil-heavy. The `dag.ts` script should be updated to scan story files and populate this list, just as it does for tickets.

## Acceptance Criteria

- [ ] `just dag-refresh` scans `docs/active/stories/*.md`
- [ ] `task-graph.yaml` stories list is automatically updated
- [ ] Deleted story files are removed from the graph
