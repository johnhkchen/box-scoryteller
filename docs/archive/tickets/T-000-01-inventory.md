---
id: T-001-01
title: Inventory & Cleanup Verification
story: S-001
status: ready
priority: 1
complexity: S
type: task
depends_on: []
---

## Objective

Verify that the codebase and documentation have been correctly scrubbed of "Solar-Sim" domain logic.

## Implementation Details

1.  **Code Inventory**:
    -   List contents of `src/lib/`.
    -   Verify NO `solar/`, `plants/`, `climate/` directories exist.
    -   Verify `src/lib/index.ts` is clean.

2.  **Docs Inventory**:
    -   List contents of `docs/`.
    -   Verify `docs/archive` does not contain legacy solar-sim history (or is empty).
    -   Verify `docs/specification.md` is generic or empty.

3.  **Output**:
    -   Create `docs/active/audit-report.md` with your findings.
