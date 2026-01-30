---
id: T-003-03
title: Narrative Synthesis
story: S-003
status: pending
priority: 2
complexity: M
type: implementation
depends_on:
  - T-003-01
  - T-003-02
---

## Objective

Implement a BAML function that synthesizes narrative observations from triggers, context, and box score data. This is where the "publicist" aspect emerges — helping the SID see story angles they might pursue.

## Implementation Details

Create a function `SynthesizeNarratives` that takes:
- Parsed `BoxScore`
- Detected triggers
- Gathered context (player notes, team storylines)
- Optional: target audience (fans, donors, recruits, media)

And returns narrative observations:
- Story angles framed for the specified audience
- Connections between data and provided context
- Suggestions for which angle to lead with and why

The output is not finished content — it's thinking-partner output that helps the SID decide what story to tell. Think "here are three angles you could pursue" not "here's your game recap."

## Quality Bar

A good narrative observation:
- Connects specific data points to gathered context
- Explains why this matters to the audience
- Suggests a frame or hook, not just states facts
- Acknowledges what it doesn't know

Example: "Jordan's 18-point career high in front of her family ties together the 'Springfield kid makes good' angle you mentioned. For local media, this is the lead. For recruiting, it's proof that freshmen get real opportunities here."

## Acceptance Criteria

Given a box score, triggers, and sample context, the function produces observations an SID would find valuable. Observations are audience-aware when an audience is specified. The output helps with narrative decision-making, not just data summarization.
