# Box Scoryteller Specification

> **Status**: Draft
> **Last Updated**: 2026-01-30

---

## Problem Statement

Sports information directors know their communities. They know which players have compelling backstories, which rivalries matter most, what angles resonate with donors versus recruits versus local media. But this institutional knowledge lives in their heads, disconnected from the raw statistics that arrive after every game.

The gap isn't generating content — any LLM can write a game recap. The gap is understanding what matters to *this* community, *this* season, *this* moment. A freshman's 15-point game might be unremarkable in isolation but extraordinary given that she's recovering from injury, her hometown is watching, and the team just lost three starters to graduation.

## Proposed Solution

Box Scoryteller is an interviewer-publicist that helps SIDs surface and refine narratives. Rather than generating content directly, it acts as a thinking partner that asks the right questions, identifies statistical patterns worth exploring, and helps the SID articulate what makes this game matter to their audience.

The system learns the SID's community context through conversation — who are the key players, what storylines are developing, what does the fanbase care about? It then applies this context when analyzing box scores, surfacing observations like "Jordan's 18 points continues the trend we discussed — she's averaged 15+ in her last four games since returning to the starting lineup."

The output shape is deliberately undefined. We're exploring what "good output" looks like before committing to specific formats. The initial focus is proving the prompt pipeline extracts meaningful insights and that the interviewer dynamic surfaces context an LLM couldn't know otherwise.

## Core Concepts

### The Interviewer Dynamic

The specialist doesn't just analyze — it interviews. Early in a session, it asks questions to build context: What's the team's story this season? Any players with compelling arcs? Rivalries or milestones on the horizon? This context persists and informs subsequent analysis.

The interviewer role serves two purposes. First, it surfaces information the SID might not think to mention — the act of being asked "what makes this player special?" prompts reflection. Second, it builds a context model that makes future analysis more relevant.

### Engagement Triggers as Conversation Starters

Triggers aren't just pattern detection — they're prompts for deeper conversation. When the system spots a statistical anomaly, it doesn't just report "Player X had a career high." It asks "I see Jordan scored 18 tonight, her highest this season. Is there a story there? You mentioned she's been working through something."

The trigger categories remain useful as a framework:

**Statistical patterns** — thresholds and extremes that might indicate a story (triple-doubles, career highs, unusual efficiency)

**Game dynamics** — clutch moments, comebacks, momentum shifts that create narrative tension

**Comparative context** — how this performance relates to season trends, opponent history, or player development arcs

**Anomalies** — statistical oddities that invite explanation (why did the point guard have zero assists?)

### Community Context Model

Over time, the system builds understanding of:

**Player narratives** — backstories, development arcs, fan favorites, players with media interest
**Team storylines** — season themes, challenges overcome, goals and milestones approaching
**Audience segments** — what donors care about vs. students vs. local media vs. recruiting targets
**Historical context** — rivalries, records, traditions that give events meaning

This context is gathered through conversation and persists across sessions.

## Technical Approach

### BAML Pipeline

We're using BAML (Basically A Made-up Language) for structured prompt engineering. BAML provides type-safe prompt definitions, structured output parsing, and testable prompt functions. This lets us iterate rapidly on the prompt logic without building application infrastructure.

The pipeline stages are:

1. **Parse** — Extract structured data from raw box score text
2. **Contextualize** — Merge box score data with persisted community context
3. **Analyze** — Identify triggers and generate observations
4. **Interview** — Formulate questions that surface additional context
5. **Synthesize** — Produce insights that combine data with gathered context

Each stage is a BAML function with defined inputs, outputs, and test cases.

### Exploration Phase

The current phase is exploratory. We're answering questions like:

- What structured outputs are useful? (Triggers? Narratives? Questions?)
- What context does the SID need to provide for analysis to be valuable?
- How should the interviewer dynamic flow? (Upfront questions? Inline? Both?)
- What does "good" look like for different audience segments?

We'll run the BAML pipeline against sample box scores, iterate on prompts, and gather feedback before committing to application architecture.

### Future UI via Lovable

Once we understand the output shape and interaction patterns, we'll generate a UI using Lovable. The UI will wrap the proven BAML pipeline rather than the other way around. This keeps focus on the core value (narrative extraction) rather than premature interface work.

## Scope Boundaries

### Current Phase: Pipeline Exploration

The immediate work is:
- Set up BAML project structure with TypeScript
- Define box score parsing functions for basketball
- Implement trigger detection with structured output
- Build the interviewer prompt that gathers context
- Create test fixtures with sample box scores and expected outputs
- Iterate on prompt quality through testing

### Not Yet In Scope

- Web interface (deferred to Lovable generation)
- Persistent storage (use files/memory during exploration)
- Multiple sports (basketball first, patterns will generalize)
- Production deployment (local development only)
- Authentication, multi-user, or any SaaS concerns

### Out of Scope

- Real-time game coverage
- Video or image generation
- Direct social media integration
- External data APIs (historical records, player databases)

## Open Questions

**Output structure**: What should the analysis output look like? A flat list of observations? Hierarchical by category? Ranked by engagement potential? We need to experiment.

**Context persistence**: How much context should persist between sessions? All of it? Just the community model? Should context decay or require refresh?

**Interview depth**: How many questions is too many? When does the interviewer become annoying rather than helpful? What's the right balance between gathering context and providing value?

**Specialist boundaries**: Is "basketball specialist" the right granularity, or do we need separate specialists for different analysis tasks (trigger detection vs. narrative synthesis vs. interview)?

---

## Appendix: Example Engagement Triggers (Basketball)

These triggers serve as conversation starters, not just pattern flags:

| Category | Trigger | Follow-up Question |
|----------|---------|-------------------|
| Statistical Extreme | Triple-double | "That's rare at any level. Is [player] known for all-around play, or is this a breakout?" |
| Statistical Extreme | 30-point game | "Big scoring night. Was this expected, or did something click tonight?" |
| Clutch Moment | Game-winner | "Walk me through the final possession. Who drew it up? Was [player] the intended target?" |
| Unexpected | Bench explosion | "18 off the bench is huge. What's [player]'s story? Why aren't they starting?" |
| Anomaly | Star with 0 assists | "[Player] usually distributes. Was the defense taking that away, or was something off?" |
| Trend | Third straight 15+ game | "This is becoming a pattern. What changed for [player] recently?" |
