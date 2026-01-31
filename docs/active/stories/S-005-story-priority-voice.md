---
id: S-005
title: Story Priority and Institutional Voice
status: ready
priority: 2
depends_on:
  - S-003
---

## Context

The specialist pipeline (S-003) produces triggers, context interviews, and narrative angles. But when an SID has five games on a single night, every game gets treated equally — same depth of analysis, same effort in the prompt. The system lacks a sense of "what matters tonight" and doesn't reflect the specific voice of the athletic department producing the content.

This story addresses two gaps: helping SIDs see which games deserve attention before writing starts, and injecting institutional voice so outputs feel like they came from this program, not a generic sports AI.

## Problem: Everything Looks the Same

Current behavior produces high-quality analysis for every game regardless of newsworthiness. A blowout loss and a buzzer-beater overtime win both receive equal treatment. This creates two issues.

First, the SID has to manually triage which games deserve deeper coverage. The tool doesn't surface "tonight's top story" — it just hands back a stack of equal-weight analyses. Second, the resulting narratives sound generic. They're competent sports writing, but they don't carry the voice of a specific program with its own traditions, motifs, and communication style.

## Proposed Solution: Story Signals + Voice Layer

### Part 1: Story Signals

Add a lightweight ranking pass that runs before narrative synthesis. For each game, extract simple boolean or numeric signals:

- **Close game** — margin ≤ 5 points (basketball), ≤ 2 runs (baseball/softball)
- **Overtime or extra innings** — game extended
- **Standout performance** — one or more players crossed notable thresholds
- **Streak context** — win streak continues, loss streak snapped, etc.
- **Conference game** — higher stakes
- **Upset potential** — lower seed or unexpected outcome (optional, requires seeding data)

These signals aren't prose — they're flags attached to each game's metadata. A simple scoring formula aggregates them:

```
priority_score = (close_game × 2) + (overtime × 3) + (standout × 2) + (conference × 1)
```

The ranking feeds into the story prompt as context. High-priority games get instructions to emphasize momentum and key moments. Lower-priority games get guidance to keep it short and factual.

### Part 2: Voice Profiles

Voice configuration lives in markdown files that SIDs fill out once per program. The template at `profiles/TEMPLATE.md` asks 10 questions across four categories:

**Program Identity (Q1-3)** — One-sentence description, 3-5 personality words (gritty, joyful, underdog), and tones to avoid.

**Audience & Values (Q4-6)** — Who reads your content, what narratives resonate, what counts as a "big deal" at your level.

**Storytelling Preferences (Q7-9)** — Player story archetypes, rivalry context, signature phrases and traditions.

**Practical Guidelines (Q10)** — Terminology preferences, things to never say.

This file-based approach has advantages over interview-gathered configuration. SIDs can edit profiles offline, share them across their department, and version control them. The format is human-readable markdown with blockquote answers, so profiles double as documentation of the program's voice.

To use: copy `profiles/TEMPLATE.md` to `profiles/{school}-{sport}.md`, fill it out, and the system reads it as context for narrative synthesis.

## How It Changes the Experience

### Before (current state)

The SID pastes five box scores. The system returns five detailed analyses with multiple narrative angles each. The SID has to figure out which game leads, which deserves deep coverage, and which should be a quick recap. The voice is competent but generic.

### After (with this feature)

The system returns a ranked list showing tonight's priority order with reasons. The top game gets the full narrative treatment with angles, talking points, and audience framings. Games ranked lower get abbreviated analyses. All outputs carry the department's voice — campaign references, brand phrases, and tone matching what they'd actually publish.

The SID can reorder if they disagree, but the default ranking usually gets it right because it's based on the same signals SIDs use intuitively: close games, big performances, overtime drama.

## Implementation Approach

### Story Signals (data-first, simple rules)

Build a `ComputeStorySignals` function that takes a `BoxScore` and returns a `StorySignals` object with boolean flags and a computed priority score. This runs before `DetectTriggers` and its output flows into the trigger detection and narrative synthesis prompts as context.

The scoring weights should be tunable per-sport and possibly per-institution. Start with sensible defaults.

### Voice Profiles (file-based, prompt-injected)

Voice profiles live at `profiles/{school}-{sport}.md`. The profile template asks structured questions about program identity, audience, storytelling preferences, and practical guidelines. SIDs fill these out once and update them as needed.

At synthesis time, the system reads the profile markdown and injects it as context. The LLM receives both the box score data/triggers AND the voice profile, then generates narratives that match the program's personality and audience.

Profile format is plain markdown with blockquotes for answers. Implementation can either parse the `> [answer]` sections into structured data or pass the whole document as context — the latter is simpler and preserves nuance.

### UI Considerations (for later)

When the UI exists, the priority ranking should be visible and reorderable. Drag-and-drop or simple up/down buttons let SIDs override the system's judgment. Even if they never touch it, seeing the ranking builds trust.

## Acceptance Criteria

**Story Signals**
- Given multiple box scores, the system produces a ranked list by priority
- Each ranking includes reason codes (close game, standout performance, etc.)
- Priority context flows into narrative prompts, producing visibly different depth

**Voice Profiles**
- Template exists at `profiles/TEMPLATE.md` with 10 structured questions
- Profile content flows into narrative synthesis as context
- Outputs for the same game differ based on voice profile settings
- Profiles are human-readable markdown that SIDs can edit directly

## Open Questions

**Signal calibration** — What's the right weighting for each signal? Should it vary by sport? We'll need to test with real game data and SID feedback.

**Voice override per-game** — Should SIDs be able to specify "this game is special, treat it as high-priority regardless of signals"? Probably yes, but need to design the interaction.

**Historical context for signals** — Some signals like "career high" or "win streak" require historical data we may not have. How do we handle gaps gracefully?

**Tone enforcement** — How strongly should the voice profile constrain outputs? Light suggestions or firm guardrails?

**Profile parsing** — Should we parse blockquote answers into structured types, or pass the whole markdown as context? The latter is simpler and preserves nuance, but structured parsing enables validation and tooling.

## Relationship to Existing Work

This builds directly on S-003's pipeline. `DetectTriggers` already identifies standout performances — Story Signals extends this to game-level priority. `SynthesizeNarratives` already frames angles for audiences — Voice Injection adds institutional style to those framings.

The data pipeline (S-004) provides real game data to test signal calibration. Once we have a year of box scores, we can evaluate whether the ranking matches SID intuition.
