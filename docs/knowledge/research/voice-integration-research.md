# Voice Integration Research Questions

> **Status**: Active Research
> **Created**: 2026-01-30

This document captures research questions for deepening the voice integration in Box Scoryteller's prompting pipeline. The current implementation passes raw voice profile markdown to the LLM with guidance instructions. These questions explore what's working, what's missing, and what experiments might improve voice fidelity.

---

## Questions About Current Implementation

### Q1: How effectively does the current approach transfer voice?

The current system passes the entire voice profile markdown to the LLM and includes instructions like "match the personality words in your tone." But we haven't measured voice transfer effectiveness. Research could involve generating multiple narrative syntheses with and without voice profiles, then evaluating whether outputs actually sound different, whether personality words appear or influence framing, and whether the difference is perceptible to humans.

**Experiment idea**: Generate 10 syntheses for the same game using the College of Marin profile, 10 without any profile, and 10 with a hypothetically different profile (say, a high-energy Division I program). Have a human evaluator (or another LLM acting as judge) assess which outputs feel distinct and whether they match the intended voice.

### Q2: What profile elements have the most impact?

The voice profile template has 10 questions across four categories. Not all answers may contribute equally to voice transfer. Personality words might be highly influential while terminology preferences barely register, or vice versa. Understanding which sections matter most could inform a lighter-weight profile format or better prompting strategies.

**Experiment idea**: Systematically ablate profile sections. Generate syntheses with full profile, then with each section removed individually, and measure output differences. Sections that don't measurably change output may be candidates for simplification.

### Q3: Does voice profile length affect quality?

Long prompts can dilute key information. The College of Marin example profile is about 85 lines of markdown. If the profile were condensed to the 10 most important sentences, would voice transfer improve, degrade, or stay the same? There may be an optimal profile length or structure.

---

## Questions About Voice Profile Design

### Q4: Are the right questions being asked?

The current 10-question template emerged from intuition about what makes programs distinct. But we haven't validated whether these questions capture what SIDs actually consider their "voice." Research could involve interviewing real SIDs about what makes their content feel like "theirs" and comparing those answers to the template categories.

**Related question**: Are there important voice dimensions the current template misses? For example: humor tolerance, formality level, use of statistics vs. narrative, sentence length preferences, or cultural references.

### Q5: How should profiles handle multi-audience situations?

The profile asks "Who reads your content?" and the system can accept a `target_audience` parameter. But the relationship between profile-level audience definition and per-call audience targeting is unclear. If the profile emphasizes "parents and local community" but a specific call targets "recruits," should the voice shift? How?

**Research direction**: Explore whether voice should be constant (program personality) with audience-specific framing, or whether voice itself should modulate by audience.

### Q6: Should voice profiles include examples?

The current template asks for descriptions ("gritty, family-oriented, resilient") but not examples of actual content the program has produced. Including sample tweets, recap paragraphs, or social posts might give the LLM concrete reference points. This is common in style transfer work.

**Experiment idea**: Create an "examples-enriched" profile format that includes 3-5 sample outputs from the program. Compare synthesis quality against description-only profiles.

---

## Questions About Prompt Architecture

### Q7: Should voice injection happen earlier in the pipeline?

Currently, voice only enters at the final `SynthesizeNarratives` stage. But earlier stages (trigger detection, context interview) might also benefit from voice awareness. For example, a "joyful, celebratory" program might want triggers weighted toward positive achievements, while a "defensive-minded, gritty" program might want triggers that highlight defensive stats and effort plays.

**Research direction**: Prototype voice-aware trigger detection and compare whether it surfaces different (better?) hooks.

### Q8: Would structured voice parameters work better than raw markdown?

The current approach passes raw markdown to preserve nuance. But this means the LLM must parse the Q&A format, interpret blockquotes as answers, and map concepts to output style. A more structured approach might extract key-value pairs like `personality: ["gritty", "family-oriented"]` and inject them more directly.

**Tradeoff exploration**: Structured parameters are easier to validate and reason about, but may lose nuance. Compare a structured injection approach against the current free-form approach.

### Q9: How should voice interact with priority tiers?

High-priority games get 3-4 detailed angles; low-priority games get 1-2 concise angles. Does voice expression scale with depth? A "flashy, energetic" voice might need more words to shine, while a "concise, no-nonsense" voice might fit low-priority coverage better. Research could explore whether voice-priority interactions need special handling.

---

## Questions About Evaluation and Feedback

### Q10: How do we measure voice fidelity?

Without metrics, we can't iterate systematically. Possible evaluation approaches include human preference rankings (does this sound like our program?), automated style metrics (vocabulary overlap with sample content, readability scores, sentiment alignment), or LLM-as-judge scoring against the profile.

**Research priority**: Establishing even a rough evaluation method would unlock systematic improvement.

### Q11: How do SIDs actually want to iterate on voice?

The current workflow loads a static markdown file. But SIDs may want to tune voice over time ("make it 10% less formal") or provide feedback on specific outputs ("this angle didn't sound like us"). Research could explore lightweight feedback mechanisms that adjust voice without requiring full profile edits.

---

## Questions About Scaling and Generalization

### Q12: Do voice profiles generalize across sports?

The example profile is for women's basketball. If the same program has men's basketball, baseball, and volleyball, do they share a voice? Should there be program-level voice with sport-specific overlays? Or does each sport at each school have its own voice?

### Q13: How do multi-school deployments work?

If Box Scoryteller serves multiple schools, each with distinct voice profiles, how do we ensure isolation (School A's voice never leaks into School B's content) while potentially learning shared patterns (community college programs might have commonalities)?

---

## Prioritized Next Steps

Based on these questions, the highest-value research directions are:

1. **Establish evaluation method (Q10)**: Without measurement, we're guessing. Even a simple human ranking protocol would help.

2. **Test voice transfer effectiveness (Q1)**: Before optimizing, confirm the current approach works at all. Generate comparative outputs and assess.

3. **Explore profile examples (Q6)**: Adding concrete examples to profiles is a low-risk enhancement that could significantly improve voice fidelity.

4. **Investigate earlier voice injection (Q7)**: This could unlock differentiated trigger detection, making the whole pipeline feel more voice-aligned.

---

## Related Files

- `profiles/TEMPLATE.md` - Current profile template
- `profiles/example-marin-wbkb.md` - Filled-out example profile
- `baml_src/boxscore.baml` - SynthesizeNarratives function (lines 769-926)
- `src/lib/voice-profile.ts` - Profile loading implementation
