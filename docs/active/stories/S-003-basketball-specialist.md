---
id: S-003
title: Basketball Specialist Prompts
status: pending
priority: 2
depends_on:
  - S-002
---

## Objective

Build the BAML functions that power the basketball specialist's analysis and interviewing capabilities. This is the core prompt engineering work that determines whether the tool provides value.

## Context

The specialist needs to do three things well: detect interesting patterns in box score data (triggers), ask questions that surface narrative context, and synthesize observations that connect data to context. Each of these is a distinct BAML function that we'll iterate on.

## Deliverables

A trigger detection function that identifies statistical patterns worth exploring — career highs, clutch performances, anomalies, trends. An interviewer function that generates contextual questions given a box score and existing context. A synthesis function that produces narrative observations connecting data to gathered context.

## Tickets

**T-003-01: Trigger Detection** implements a BAML function that takes parsed box score data and returns a ranked list of engagement triggers with explanations.

**T-003-02: Context Interview** implements a BAML function that generates questions to surface narrative context — both initial onboarding questions and game-specific follow-ups.

**T-003-03: Narrative Synthesis** implements a BAML function that takes triggers, context, and box score data to produce narrative observations framed for different audiences.

## Acceptance Criteria

Given a sample box score with notable events, trigger detection surfaces appropriate patterns. Generated interview questions are specific and would plausibly surface useful context. Narrative synthesis produces observations that an SID would find valuable. All functions have tests demonstrating quality.

## Open Questions

What's the right output structure for triggers? For narrative observations? We'll discover this through iteration — the acceptance criteria is "useful," not a specific format.
