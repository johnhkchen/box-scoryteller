---
id: T-003-02
title: Context Interview
story: S-003
status: pending
priority: 2
complexity: M
type: implementation
depends_on:
  - T-002-03
---

## Objective

Implement BAML functions that generate interview questions to surface narrative context. This is the "interviewer" half of the interviewer-publicist dynamic.

## Implementation Details

Create two related functions:

**OnboardingInterview** takes minimal input (team name, sport) and generates questions to establish baseline context:
- What's the team's story this season?
- Any players with compelling arcs or backstories?
- Key rivalries or upcoming milestones?
- What does your fanbase care about most?

**GameInterview** takes a `BoxScore` plus existing context and generates game-specific follow-up questions:
- Questions triggered by statistical patterns ("Jordan's 18 points — is this a career high?")
- Questions about context the data can't show ("Was her family there?")
- Questions about coaching decisions ("Did Coach draw that play up?")

The questions should be specific and grounded in the data, not generic. "Tell me about this game" is bad. "Sarah's fourth quarter was huge — did Coach design plays for her, or did she take over on her own?" is good.

## Context Model

Define a type for representing gathered context:
- Player notes (backstories, roles, development arcs)
- Team storylines (season narrative, challenges, goals)
- Audience information (what different segments care about)

This context gets passed to subsequent functions and grows over time.

## Acceptance Criteria

Onboarding questions would plausibly surface useful context from an SID. Game-specific questions reference actual data from the box score. Questions feel like a knowledgeable colleague asking for background, not a generic interview template.
