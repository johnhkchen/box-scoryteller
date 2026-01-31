---
id: T-003-02
title: Context Interview
story: S-003
status: complete
priority: 2
complexity: M
type: implementation
depends_on:
  - T-002-03
completed_at: "2026-01-30"
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

## Implementation Summary

Implemented the context interview functionality in `baml_src/boxscore.baml` with complete type definitions for narrative context and two interview functions that generate targeted questions for sports information directors.

### Context Model Types

Created a rich type system for representing gathered narrative context. The `PlayerNote` class captures individual player information including role on the team, personal backstory, current season arc, and development focus areas. The `TeamContext` class holds season-level information like the overall narrative, win-loss record, challenges faced, goals, and coaching philosophy. The `AudienceSegment` class defines different audience groups with their specific interests and preferred framing. These all compose into `NarrativeContext`, which serves as the growing knowledge base that gets enriched over time and informs downstream functions.

### Interview Functions

The `OnboardingInterview` function takes minimal input of team name and sport, then generates foundational questions to establish baseline context. The prompt guides the LLM to ask specific, actionable questions across key categories including team narrative, player arcs, coaching approach, audience priorities, and context hooks like rivalries and milestones. Questions are designed to surface the "why behind the numbers" rather than asking generic prompts.

The `GameInterview` function takes a parsed `BoxScore` and existing `NarrativeContext`, then generates game-specific follow-up questions that connect data to story. The prompt instructs the LLM to be data-grounded by referencing specific performances from the box score, context-aware by tying to known player arcs from existing context, and story-revealing by asking about elements statistics can't show like emotions, decisions, and turning points. Question types include performance questions that dig into statistical standouts, decision questions about coaching choices, moment questions about inflection points, context questions that surface human elements, and arc questions that connect the game to larger narratives.

### Question Output Structure

Defined `InterviewQuestion` class with three fields: the actual question text, rationale explaining what context it surfaces and why it matters, and a category label for question type. Questions are returned in a `QuestionSet` wrapper that includes an optional note field for additional context about the question set.

### Testing

Added two comprehensive test cases. The `onboarding_interview` test verifies the onboarding function generates appropriate baseline questions for "College of Marin Mariners Women's Basketball" covering team story, player arcs, coaching philosophy, audience segments, and contextual hooks. The `game_interview` test uses the same sample game from previous tests with rich narrative context about Sarah Chen's transfer background and Jordan Mills' breakout sophomore season. The test successfully generates targeted questions that reference specific box score data (Sarah's 16-18 FT shooting, Jordan's efficient 18 points off the bench) while connecting to known player narratives from the context.

Both tests passed successfully with the OnboardingInterview taking 26 seconds and GameInterview taking 21.82 seconds, demonstrating that the functions produce well-structured questions that would help an SID gather compelling narrative context.

Location: `baml_src/boxscore.baml:413-577`
