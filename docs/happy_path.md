# Box Scoryteller: Happy Path

> **Status**: Draft
> **Last Updated**: 2026-01-30

This document describes the target experience for Box Scoryteller. It follows Maria, a sports information director at a mid-sized university, as she uses the tool to surface narratives from a basketball box score. The focus is on the interviewer dynamic and context-building, not content generation.

---

## Scene: Building Context (First Session)

It's Maria's first time using Box Scoryteller. Before analyzing any games, the system wants to understand her program.

**Specialist**: "I'm going to help you find the stories in your game data. But first, I need to understand your program. Tell me about your team this season — what's the storyline?"

**Maria**: "We're rebuilding after losing three seniors to graduation. Young team, lots of freshmen getting minutes. The expectation was a down year, but we've been competitive."

**Specialist**: "Rebuilding seasons create great narratives — unexpected wins, breakout performances, 'ahead of schedule' storylines. Any players I should know about? Who's getting attention from fans or media?"

**Maria**: "Sarah Chen is our senior leader, only returning starter. She's been carrying a lot. And Jordan Mills is a freshman who's been getting more minutes lately — local kid, her family comes to every game."

**Specialist**: "Got it. So we have a 'lone senior carrying the torch' arc with Sarah, and a potential 'hometown hero emerges' storyline developing with Jordan. What about rivalries or big games on the schedule?"

**Maria**: "We play State next week — always a big one. And we're chasing a conference tournament berth, need to win 4 of our last 6."

The specialist now has context that transforms raw statistics into meaningful narratives. This context persists.

---

## Scene: Analyzing a Game (Later That Week)

Maria pastes a box score after a 78-74 win over a conference rival.

**Specialist**: "State 78, Rival 74. Let me look at this through what we discussed.

A few things jump out:

**Sarah Chen: 24 points, 12 in the fourth quarter, go-ahead basket with 34 seconds left.** This fits her 'carrying the load' role. The clutch performance reinforces her leadership narrative.

**Jordan Mills: 18 points off the bench on 7-of-9 shooting — her best game.** You mentioned she's been getting more minutes. Is this the breakout we were watching for?

**The team was out-rebounded 42-31 but still won.** For a rebuilding team, winning ugly shows maturity.

I have some questions:

1. Jordan's 18 points — is this a career high? Was her family there tonight?
2. Sarah's fourth quarter — did Coach draw plays for her, or did she take over on her own?
3. Any injuries or foul trouble that explain the rebounding gap?"

**Maria**: "Yes, career high for Jordan, and her whole family was there — parents, younger sister. Sarah just took over, Coach lets her cook when we need a bucket. No injuries, we just got beat on the glass by their bigs."

**Specialist**: "Perfect. So the story threads are:

**Lead angle for fans/social**: Sarah's clutch takeover seals it — she delivered when it mattered, senior leader stuff.

**Recruiting/local media angle**: Jordan's breakout in front of her family — Springfield kid having her moment.

**Program narrative angle**: Young team wins ugly on the road, showing the rebuild is ahead of schedule.

Which of these do you want to explore? Or is there something else in the data I should look at?"

---

## Scene: Digging Deeper

**Maria**: "Tell me more about Jordan's game. What made it special statistically?"

**Specialist**: "Looking at the details:

- 7-of-9 from the field (77.8%) — elite efficiency
- All 18 points came in the second and third quarters when starters were in foul trouble
- She played 22 minutes, her most this season
- No turnovers

The efficiency is notable. Most freshman bench players force shots when they get unexpected minutes. Jordan picked her spots. That suggests poise beyond her experience level.

Question for you: Has she been practicing with the starters more? Or did tonight's opportunity just click for her?"

**Maria**: "She's been running with the first team in practice for about two weeks. Coach wanted to see if she could handle it."

**Specialist**: "That's your story then. The promotion to first-team practice paid off. She was ready when her number got called. That's a coaching story as much as a player story — Coach saw something, gave her the chance to develop, and it showed up when it mattered.

Want me to frame some talking points around that angle?"

---

## Scene: Identifying What's Missing

**Maria**: "What about the rebounding issue? Should I be worried about that angle?"

**Specialist**: "The 42-31 rebounding gap is significant, but I don't see it as a negative story unless you frame it that way. Here's why:

- You won despite it, which shows offensive efficiency and defensive execution
- Their center had 14 rebounds — sometimes you just run into a dominant rebounder
- Your team shot 48% compared to their 41% — you won the possessions that mattered

If media asks about it, the frame is 'we found other ways to win.' If you're talking to donors, it's 'our guards outplayed theirs.'

The risk is if this becomes a pattern. Is rebounding a known weakness for this team?"

**Maria**: "Yeah, it's been an issue all season. We're undersized."

**Specialist**: "Good to know. I'll flag rebounding disparities in future games so we can track whether it's getting better or staying a problem. For tonight, it's a footnote, not the story."

---

## Key Elements of the Experience

**The interviewer surfaces context the data can't show.** Jordan's career high means more because the specialist knows about her family, her recent promotion to first-team practice, and the rebuilding season narrative.

**Statistical analysis is tied to program knowledge.** The rebounding gap is interpreted through understanding that it's a known weakness, not a one-game anomaly.

**The specialist asks questions, not just reports facts.** "Was her family there?" and "Has she been practicing with starters?" add meaning to the numbers.

**Multiple angles are offered, not a single output.** The SID chooses which narrative to pursue based on audience and channel.

**The system learns.** Future game analysis will remember the context built in this session.

---

## What We're Testing in the Pipeline

The BAML pipeline should demonstrate these capabilities:

1. **Parse box scores** into structured data reliably
2. **Identify statistical triggers** (career highs, clutch performances, anomalies)
3. **Generate contextual questions** that would surface relevant narrative information
4. **Synthesize observations** that connect data to provided context
5. **Frame multiple angles** for different audiences

The quality bar is: Would an SID find this conversation valuable? Does it surface insights they might have missed? Does it ask questions that prompt useful reflection?

---

## Not Yet Defined

The output format for "talking points" or "story angles" isn't specified. We need to experiment with what structure is most useful before committing. The current focus is proving the conversation dynamic works, not producing polished deliverables.
