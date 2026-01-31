---
id: T-005-05
title: Priority-Aware Narrative Synthesis
story: S-005
status: complete
priority: 2
complexity: S
type: implementation
depends_on:
  - T-005-02
  - T-005-04
completed_at: "2026-01-30"
---

## Objective

Connect story priority to narrative synthesis so high-priority games receive deeper treatment and low-priority games get concise coverage. This closes the loop between ranking and output quality.

## Implementation Details

Modify `SynthesizeNarratives` to accept `StorySignals` and `coverage_guidance` from the priority ranking. The prompt adjusts its effort based on priority tier:

**High priority games:**
- Generate 3-4 narrative angles with full detail
- Emphasize momentum, key moments, and individual performances
- Include audience-specific framings for multiple segments
- Produce talking points and quotable hooks

**Medium priority games:**
- Generate 2-3 narrative angles with moderate detail
- Focus on the primary story and one secondary angle
- Include key stats and standout performers

**Low priority games:**
- Generate 1-2 brief angles
- Keep it factual and concise
- Focus on final score, key contributors, and what's next

The synthesis output should indicate which tier it was generated for, so SIDs understand why some analyses are deeper than others.

## Type Changes

Add to `NarrativeSynthesis`:

```
class NarrativeSynthesis {
  // ... existing fields
  priority_tier string @description("high, medium, or low — indicates depth of analysis")
  tier_rationale string @description("Why this game was ranked at this tier")
}
```

Update function signature:

```
function SynthesizeNarratives(
  box_score: BoxScore,
  triggers: TriggerList,
  context: NarrativeContext,
  voice: InstitutionalVoice?,
  signals: StorySignals?,
  coverage_guidance: string?,
  target_audience: string?,
  target_channel: string?
) -> NarrativeSynthesis
```

## Prompt Evolution

Add priority context to the synthesis prompt:

```
## Story Priority

This game is **{{ signals.tier or 'medium' }} priority**.

{% if signals %}
Reasons: {{ signals.signal_reasons | join(', ') }}
{% endif %}

Coverage guidance: {{ coverage_guidance or 'Standard coverage' }}

{% if signals.tier == 'high' %}
This is a high-priority story. Provide comprehensive analysis with multiple angles, audience framings, and talking points. Emphasize the key moments and standout performances that make this game newsworthy.
{% elif signals.tier == 'low' %}
This is a lower-priority game. Keep coverage concise and factual. Focus on the final score, key contributors, and what's next. One or two angles is sufficient.
{% else %}
Standard coverage. Provide solid analysis with 2-3 angles focusing on the primary story.
{% endif %}
```

## Acceptance Criteria

- High-priority games produce visibly more detailed analysis than low-priority games
- Output includes `priority_tier` and `tier_rationale` so SIDs understand the ranking
- Coverage guidance flows through to visible differences in output depth
- SIDs can still access full analysis for any game if needed (priority affects defaults, not limits)

## Implementation Summary

Completed on 2026-01-30. All acceptance criteria met.

### Changes Made

**BAML Types (baml_src/boxscore.baml):**
- Added `tier` field to `StorySignals` class (derived from priority_score)
- Added `priority_tier` and `tier_rationale` fields to `NarrativeSynthesis` class
- Updated `SynthesizeNarratives` function signature to accept `signals: StorySignals?` and `coverage_guidance: string?`
- Added priority context section to synthesis prompt with tier-specific instructions

**TypeScript Implementation (src/lib/story-signals.ts):**
- Updated `computeStorySignals` to compute and return tier based on priority score
- Tier thresholds: high >= 5, medium 2-4, low < 2

**Tests (src/lib/story-signals.test.ts):**
- Added tests verifying tier calculation across all priority levels
- Verified tier is included in all `StorySignals` outputs
- All 22 tests passing

**Demo (tools/demo-priority-synthesis.ts):**
- Created comprehensive demonstration showing priority-aware synthesis across high/medium/low tiers
- Shows visibly different depth of analysis based on priority signals

### How It Works

The synthesis prompt now receives story signals and coverage guidance. Based on the tier, it adjusts output depth:

**High priority (tier = 'high')**: Generates 3-4 detailed narrative angles with comprehensive analysis, audience framings, and talking points. Emphasizes clutch moments and individual performances.

**Medium priority (tier = 'medium')**: Generates 2-3 angles with moderate detail, focusing on the primary story and one secondary narrative.

**Low priority (tier = 'low')**: Generates 1-2 concise angles with factual coverage of final score, key contributors, and what's next.

The output includes the priority tier and rationale so SIDs understand why the game received the level of coverage it did.
