---
id: T-005-03
title: Voice Profile Loading
story: S-005
status: complete
priority: 2
complexity: S
type: implementation
depends_on: []
completed: 2026-01-30
---

## Objective

Implement a function that loads and optionally parses voice profile markdown files. This enables the narrative synthesis prompt to receive program-specific voice configuration.

## Background

Voice profiles live at `profiles/{school}-{sport}.md` and follow the template at `profiles/TEMPLATE.md`. The template asks 10 questions across four categories: program identity, audience & values, storytelling preferences, and practical guidelines. SIDs fill these out once per program.

## Implementation Details

Create a `loadVoiceProfile` function that:

1. Takes a profile path (e.g., `profiles/marin-wbkb.md`)
2. Reads the markdown file
3. Returns the content for injection into prompts

Two approaches to consider:

**Simple approach (recommended to start):** Return the raw markdown. The LLM can interpret the questions and blockquote answers directly. This preserves nuance and requires no parsing logic.

**Structured approach (optional later):** Parse the blockquote answers into a typed `VoiceProfile` object. This enables validation, tooling, and more precise prompt construction.

```typescript
interface VoiceProfile {
  // Program Identity
  description: string;
  personality: string[];
  avoidTones: string[];

  // Audience & Values
  audiences: string[];
  resonantNarratives: string[];
  bigDeals: string[];

  // Storytelling Preferences
  playerStoryTypes: string[];
  rivalries: string[];
  signaturePhrases: string[];

  // Practical Guidelines
  terminology: string[];

  // Additional Context
  additionalContext?: string;

  // Raw markdown for fallback
  rawMarkdown: string;
}
```

For now, implement the simple approach. Add structured parsing only if downstream needs require it.

## File Location

The loader should live in `src/lib/` alongside other utility functions. It's pure TypeScript, not BAML — the voice profile is context that gets passed to BAML functions, not a BAML type itself.

## Acceptance Criteria

- Given a valid profile path, returns the markdown content
- Given a missing profile path, returns a sensible error or empty default
- Works with the existing template format (blockquotes for answers)
- Integrates cleanly with narrative synthesis (T-005-04)
