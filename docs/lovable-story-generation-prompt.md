# Story Generation System for Lovable

This document captures the prompt architecture and patterns from Box Scoryteller that transform raw game statistics into compelling narratives. Use this as a guide to implement similar story generation quality in a Lovable project.

---

## Core Philosophy

The system acts as an **interviewer-publicist** — not a content generator. It surfaces story angles and asks clarifying questions rather than writing finished content directly. This approach works because:

1. Box scores lack context that only humans know (player backstories, coaching decisions, family in attendance)
2. Different audiences care about different angles (parents want development stories, alumni want wins, recruits want opportunity)
3. The same statistics can support multiple narratives depending on institutional voice and priorities

---

## The Three-Stage Pipeline

### Stage 1: Trigger Detection (What's interesting?)

Analyze game data to identify statistical patterns that suggest story potential. This is where you surface "hooks" worth exploring.

**Trigger Categories:**

| Category | Description | Examples |
|----------|-------------|----------|
| STATISTICAL_EXTREME | Thresholds that indicate exceptional performance | 30+ points, triple-double, 60%+ FG on 10+ attempts |
| CLUTCH_MOMENT | Pressure situations with notable execution | 90%+ FT in close game, game-winner, OT performances |
| UNEXPECTED_PERFORMANCE | Results that break from expected patterns | Bench player outscoring starters, guard with 10+ rebounds |
| ANOMALY | Oddities that invite explanation | Zero turnovers on high usage, winning despite rebounding deficit |
| TREND | Patterns across the game or season | Balanced scoring (4+ in double figures), rebounding dominance |

**Domain Knowledge to Embed:**

For basketball specifically, teach the model what "notable" means at different levels:

```
College Level:
- 20+ points is a strong game, 25+ is exceptional
- 10+ rebounds hits double-double threshold
- 7+ assists is excellent for guards
- 60%+ FG on 10+ attempts = hot shooting
- 50%+ from 3PT on 5+ attempts = excellent range
- Zero turnovers on 25+ minutes with high usage = clean game
```

**Key Instruction: Stay Positive**

Include this guidance in trigger detection prompts:

> Focus on what went RIGHT. Highlight standout performances, impressive stats, and positive contributions.
>
> Never criticize individual players. Poor stats rarely tell the whole story — a player with high turnovers might be running complex offense, facing elite defenders, or playing through injury. You don't have enough context to attribute blame.
>
> Frame negatives at the team level, if at all. "The team had difficulty protecting the ball" rather than "Player X turned it over too much."
>
> Describe what happened, not why. Avoid speculation and attribution.

**Output Structure for Triggers:**

```typescript
interface Trigger {
  category: 'STATISTICAL_EXTREME' | 'CLUTCH_MOMENT' | 'UNEXPECTED_PERFORMANCE' | 'ANOMALY' | 'TREND';
  description: string;        // What was detected
  player_name?: string;       // Who was involved
  key_stats: Record<string, string>;  // Specific numbers
  follow_up_question: string; // What an interviewer would ask
  salience_score: number;     // 0-1, how interesting is this?
}
```

---

### Stage 2: Priority Ranking (What matters most tonight?)

Before deep analysis, use deterministic rules to classify game priority. This prevents wasting analysis depth on routine games.

**Signal Detection (rule-based, no LLM needed):**

```typescript
const signals = {
  is_close_game: margin <= 5,
  is_overtime: game.is_overtime,
  has_standout_performance: anyPlayerMeetsThresholds(game),
  is_conference_game: game.type.includes('conference'),
};

// Weighted scoring
const priority_score =
  (signals.is_close_game ? 2 : 0) +
  (signals.is_overtime ? 3 : 0) +
  (signals.has_standout_performance ? 2 : 0) +
  (signals.is_conference_game ? 1 : 0);

// Tier classification
const tier = priority_score >= 5 ? 'high'
           : priority_score >= 2 ? 'medium'
           : 'low';
```

**Coverage Guidance by Tier:**

| Tier | Score | Coverage Approach |
|------|-------|-------------------|
| High | 5+ | 3-4 detailed narrative angles, full context connections, multiple audience framings |
| Medium | 2-4 | 2-3 solid angles, moderate detail, primary story + one secondary |
| Low | 0-1 | 1-2 concise angles, essential facts, final score and key contributors |

---

### Stage 3: Narrative Synthesis (How do we frame this?)

This is the core prompt that transforms triggers and context into story angles.

**Synthesis Prompt Template:**

```
You are a narrative consultant helping a sports content creator see story angles in game data.
Your role is the "publicist" side of the interviewer-publicist dynamic — taking what you know
from triggers, context, and statistics to suggest compelling narratives.

You are NOT writing finished content. You're being a thinking partner who says "here are three
angles you could take, and here's why each one matters." The writer makes the final call.

## Voice Profile (if provided)

{voice_profile_content}

When voice profile is present:
- Match the personality words in your tone
- Frame angles for the audiences described
- Connect to traditions and signature phrases naturally (don't force)
- Avoid tones flagged as inappropriate
- Respect terminology preferences

## Story Priority

This game is **{tier}** priority.
Reasons: {signal_reasons}
Coverage guidance: {coverage_guidance}

{tier_specific_instructions}

## Your Task

Analyze the game data, detected triggers, and gathered context to synthesize 2-4 narrative
angles that connect data to story. Each angle should:

**Ground in specific data**: Point to exact statistics that support the narrative. Don't just
say "great performance" — say "24 points on 16-18 free throw shooting, team-high in clutch fourth quarter."

**Connect to context**: Weave in what you know about player arcs, team storylines, and audience
priorities. If Jordan scored 18 off the bench and you know she's in a breakout sophomore season
from a local background, that connection is the narrative gold.

**Frame for audience**: If a target audience is specified, explicitly explain why this angle
matters to them. Parents care about development. Alumni care about wins. Recruits care about opportunity.

**Acknowledge gaps**: Be honest about what you're inferring vs. what you know. "This looks like
a career high, but I don't have historical stats to confirm" or "The comeback suggests a turning
point, but I don't know what adjustments coach made."

## Quality Bar for Angles

A strong narrative angle has a clear hook, specific data support, context connection, and
audience relevance. Avoid generic observations like "team played well" or "good win."

Good example:
> "Jordan's 18-point bench explosion ties directly to her breakout sophomore year narrative. For
> parents and families, this is proof that hard work and development time pay off. For recruits,
> it's evidence that non-starters get real opportunities. Lead with this if emphasizing player
> development."

## Ranking and Lead Recommendation

Rank angles by strength — what's most compelling given the data and context. Your lead
recommendation should explain the tradeoffs:
> "Lead with Jordan's local hero story if the primary audience is community and recruits.
> Lead with Sarah's clutch free throws if the audience is alumni focused on winning."

## Game Data

{game_statistics}

## Detected Triggers

{triggers}

## Narrative Context

{context}

## Target Audience: {target_audience or "general"}
## Target Channel: {target_channel or "not specified"}
```

**Output Structure:**

```typescript
interface NarrativeSynthesis {
  angles: NarrativeAngle[];         // 2-4 story angles ranked by strength
  lead_recommendation: string;       // Which angle to lead with and why
  missing_context?: string;          // What additional info would strengthen narratives
  audience_note?: string;            // Specific guidance for target audience
  priority_tier: string;             // "high", "medium", or "low"
  tier_rationale: string;            // Why this tier
}

interface NarrativeAngle {
  title: string;                     // Brief angle name
  hook: string;                      // The compelling frame
  data_support: string;              // Specific statistics supporting narrative
  context_connection: string;        // How it connects to player/team storylines
  audience_relevance: string;        // Why this matters to target audience
  confidence: string;                // What we know vs. inferring
  priority_rationale?: string;       // Why lead with this angle
}
```

---

## Voice Profile System

Allow users to customize the narrative voice through a profile that captures institutional identity.

**Voice Profile Template (10 sections):**

```markdown
# Voice Profile: [Program Name]

## Program Identity

### 1. Who are you?
> [One sentence describing what makes this program distinctive]

### 2. What's your program's personality?
> [3-5 personality words: gritty, joyful, underdog, family-oriented, blue-collar, etc.]

### 3. What do you never want to sound like?
> [Tones to avoid: arrogant, corporate, overly casual, generic, etc.]

## Audience & Values

### 4. Who reads your content?
> [Primary audiences: alumni, recruits, local community, parents, donors, etc.]

### 5. What does your fanbase care about most?
> [Resonant narratives: local kids making good, comeback stories, team chemistry, etc.]

### 6. What makes a "big deal" for your program?
> [Key achievements: conference wins, beating rivals, player milestones, academic honors, etc.]

## Storytelling Preferences

### 7. What player stories do you love to tell?
> [Compelling arcs: walk-ons earning scholarships, overcoming adversity, local recruits, etc.]

### 8. What's your rivalry situation?
> [Key rivals and what those games mean]

### 9. Any signature phrases or traditions?
> [Slogans, mottos, crowd chants to naturally incorporate]

## Practical Guidelines

### 10. Any names or terms to always use (or avoid)?
> [Terminology preferences: "We're the Mariners, not Marin" or "Never say junior college"]
```

**How to Use Voice Profile in Prompts:**

When a voice profile is provided, inject it into the synthesis prompt and add instructions:

> The following voice profile describes this program's personality and preferences.
> Your narrative angles should match this voice and reflect the program's unique identity.
>
> - Match personality words in your tone throughout
> - Frame angles for the audiences described
> - Look for natural opportunities to connect to traditions (don't force them)
> - Avoid tones flagged as inappropriate
> - Respect terminology preferences
> - Your output should sound like it came from this specific program, not generic sports AI

---

## Context Gathering (The Interview Phase)

Before synthesis, gather context that the LLM can't know from statistics alone.

**Onboarding Questions (for initial setup):**

Generate 8-12 questions covering:

1. **Team narrative**: What's the story of this season? Rebuilding? Championship push?
2. **Player arcs**: Key players and their stories. Seniors? Freshmen breaking out? Injury comebacks?
3. **Coaching approach**: Philosophy? System? Strategic shifts this season?
4. **Audience priorities**: Who reads content? What does each segment care about?
5. **Context hooks**: Rivalries, milestones, traditions, community connections

**Game-Specific Questions (after analyzing each game):**

Generate 5-10 targeted follow-up questions that are:

- **Data-grounded**: "Sarah's 16-18 from the free throw line was clutch — was she specifically targeting trips to the line?"
- **Context-aware**: "Jordan came off the bench and dropped 18 — is this part of her breakout season, or was tonight special?"
- **Story-revealing**: Ask about coaching decisions, player emotions, family presence, turning points

Question types to include:
- Performance questions (dig into statistical standouts)
- Decision questions (coaching choices that shaped outcomes)
- Moment questions (inflection points, runs, droughts)
- Context questions (elements only humans know)
- Arc questions (connect to larger narratives)

---

## Implementation Notes for Lovable

### Simplest Implementation

For a basic recap feature, use a single prompt that combines trigger detection and narrative generation:

```
You are a sports content specialist. Given game statistics, create an engaging recap.

First, identify:
1. The final result and winner
2. Standout individual performances (high scorers, efficiency, double-doubles)
3. Key game dynamics (close game, blowout, comeback, overtime)
4. Notable statistical trends (rebounding advantage, shooting percentage, turnovers)

Then write a compelling recap that tells the story of the game.

Guidelines:
- Lead with the most compelling narrative
- Use active voice and vivid language
- Include specific statistics that support the narrative
- Mention standout performers by name with their key stats
- Keep the tone professional but engaging
```

### Full Implementation

For the complete Box Scoryteller experience:

1. **Parse game data** into structured format
2. **Detect triggers** with follow-up questions and salience scores
3. **Calculate priority** using rule-based signals
4. **Gather context** through onboarding and game-specific questions
5. **Store voice profile** for the program
6. **Synthesize narratives** combining all inputs with tier-appropriate depth

### Key Patterns to Preserve

1. **Celebrate positives, stay neutral on negatives** — Never attribute blame, frame team-level observations
2. **Be specific with data** — "24 points on 16-18 FT" not "great performance"
3. **Connect to context** — Statistics + backstory = compelling narrative
4. **Acknowledge uncertainty** — "This looks like X, but I don't have Y to confirm"
5. **Rank by salience** — Not all triggers are equally interesting
6. **Adjust depth by priority** — High-priority games get full treatment, routine games get facts
7. **Frame for audience** — Same stats, different angles for different readers
8. **Sound like the program** — Voice profile makes generic AI feel institutional

---

## Example Flow

**Input**: Raw game statistics showing:
- Final score: Home 78, Away 74 (4-point margin)
- Player A: 24 points, 16-18 FT
- Player B (bench): 18 points on 7-9 FG
- Home team outrebounded 42-31 but won

**Trigger Detection Output**:
1. CLUTCH_MOMENT: Player A's 16-18 FT in close game (salience: 0.9)
2. UNEXPECTED_PERFORMANCE: Player B's 18 off bench on 78% shooting (salience: 0.85)
3. ANOMALY: Won despite -11 rebound differential (salience: 0.75)

**Priority Calculation**:
- Close game (+2), standout performance (+2), conference game (+1) = 5 = HIGH tier

**Context Gathered**:
- Player A is first-year team leader, transfer adjusting to higher competition
- Player B is local product in breakout sophomore season
- Team is rebuilding, exceeding expectations

**Narrative Synthesis Output**:

```
Angles (ranked by strength):

1. "Player A's Leadership in the Clutch"
   Hook: Captain delivers when it matters
   Data: 24 points, 16-18 FT, team-high in fourth quarter
   Context: First-year leader earning captain's role through pressure moments
   Audience: Shows parents their kids play for someone who steps up

2. "Player B's Breakout Moment"
   Hook: Local kid has her night in front of family
   Data: Career-high 18 points, 7-9 shooting, season-high 22 minutes
   Context: Aligns with breakout sophomore season narrative
   Audience: Community sees program develops overlooked talent

3. "Winning Ugly as a Rebuilding Team"
   Hook: Young roster defeats disadvantages with efficiency
   Data: Out-rebounded 42-31 but won through superior shooting
   Context: Rebuild narrative; exceeding expectations through execution
   Audience: Donors see maturity; recruits see opportunity

Lead recommendation: Player A's clutch takeover is the marquee angle for local media
and community. Lead with leadership story. Use Player B's breakout as human interest
that reaches families and recruits.
```

---

## Summary

The quality of Box Scoryteller's story generation comes from:

1. **Structured trigger detection** with domain knowledge about what's notable
2. **Priority-aware depth** that doesn't over-analyze routine games
3. **Context integration** that connects stats to human stories
4. **Voice customization** that makes output feel institutional, not generic
5. **Audience awareness** that frames the same data differently for different readers
6. **Positive framing** that celebrates achievements without criticizing individuals
7. **Acknowledged uncertainty** that builds trust by admitting gaps

Copy these patterns and prompts to recreate the quality in your Lovable project.
