---
id: T-005-04
title: Voice Profile Injection in Narrative Synthesis
story: S-005
status: complete
priority: 2
complexity: M
type: implementation
depends_on:
  - T-005-03
  - T-003-03
completed_at: "2026-01-30"
---

## Objective

Modify the narrative synthesis prompt to accept and use voice profile content. Outputs should reflect the program's personality, audience priorities, terminology preferences, and storytelling style.

## Implementation Details

Extend `SynthesizeNarratives` to accept an optional `voice_profile` string parameter containing the raw markdown from a voice profile file. The prompt should instruct the LLM to:

**Match program personality** — If the profile says "gritty, blue-collar, underdog," the tone should reflect that. If it says "joyful, family-oriented," different vibe entirely.

**Respect audience priorities** — The profile specifies who reads the content (alumni, recruits, community). Frame narratives for those audiences.

**Use signature phrases appropriately** — If the profile mentions "Mariner Pride" or "Defend the Den," look for natural opportunities to incorporate them. Don't force it.

**Avoid specified tones** — If the profile says "never sound arrogant" or "avoid corporate speak," honor those constraints.

**Apply terminology preferences** — Use the names and terms the program prefers. Avoid the ones they've flagged.

## Prompt Evolution

Add a new section to the synthesis prompt:

```
## Voice Profile

The following voice profile describes this program's personality, audience, and communication preferences. Your narrative angles should match this voice.

{{ voice_profile }}

Key guidance:
- Match the personality words in your tone and word choice
- Frame angles for the audiences described
- Look for natural opportunities to use signature phrases (don't force them)
- Avoid the tones and terms flagged as inappropriate
- Your output should sound like it came from this specific program
```

## Function Signature Update

```baml
function SynthesizeNarratives(
  box_score: BoxScore,
  triggers: TriggerList,
  context: NarrativeContext,
  voice_profile: string?,       // Raw markdown from profile file
  target_audience: string?,
  target_channel: string?
) -> NarrativeSynthesis
```

The `voice_profile` parameter is optional. When not provided, the function produces generic but competent output. When provided, output should visibly reflect the profile's guidance.

## Integration Notes

The caller is responsible for loading the profile using the function from T-005-03 and passing it as a string. The BAML function doesn't know about file paths — it just receives content.

## Acceptance Criteria

- Given a voice profile emphasizing "gritty, underdog," outputs have noticeably different tone than profiles emphasizing "joyful, dominant"
- Signature phrases from profiles appear naturally in outputs when contextually appropriate
- Avoided tones and terms are actually avoided
- Terminology preferences are respected
- Profile guidance doesn't override factual accuracy — it shapes framing, not content
