---
id: T-002-01
title: BAML Project Setup
story: S-002
status: complete
priority: 1
complexity: S
type: setup
depends_on: []
---

## Objective

Initialize a BAML project with TypeScript integration and verify the toolchain works. This is prerequisite work before defining domain types or prompts.

## Implementation Details

Install BAML CLI and initialize the project structure. Configure TypeScript generation so we can import BAML-defined types and functions. Create a minimal test function (e.g., "echo" or "hello world") to verify the end-to-end flow works: define a BAML function, generate TypeScript, call it, and get a result.

Set up the testing infrastructure so `baml test` runs and reports results. Configure the Claude API client (via environment variables) since that's what the prompts will use.

## Files to Create

The BAML project structure should include a `baml_src/` directory for BAML definitions, generated TypeScript in a location that integrates with the existing project, and test configuration.

## Acceptance Criteria

`baml test` runs successfully against a trivial test case. TypeScript can import and call the generated function. The setup is documented well enough that future tickets can build on it without rediscovering configuration details.
