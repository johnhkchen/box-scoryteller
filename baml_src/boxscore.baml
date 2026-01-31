// Box Score Types for Basketball
// These types represent the structured data extracted from raw box score text

class PlayerStats {
  name string
  position string?
  starter bool
  minutes int
  points int
  rebounds int
  offensive_rebounds int?
  defensive_rebounds int?
  assists int
  steals int
  blocks int
  turnovers int
  fouls int
  field_goals_made int
  field_goals_attempted int
  three_pointers_made int
  three_pointers_attempted int
  free_throws_made int
  free_throws_attempted int
}

class TeamStats {
  team_name string
  total_points int
  field_goals_made int
  field_goals_attempted int
  field_goal_percentage float
  three_pointers_made int
  three_pointers_attempted int
  three_point_percentage float
  free_throws_made int
  free_throws_attempted int
  free_throw_percentage float
  total_rebounds int
  offensive_rebounds int?
  defensive_rebounds int?
  assists int
  steals int
  blocks int
  turnovers int
  fouls int
  players PlayerStats[]
}

class GameMetadata {
  date string?
  venue string?
  home_team string
  away_team string
  home_score int
  away_score int
  is_overtime bool
  periods int
  game_type string?  // regular season, conference, tournament, etc.
}

class BoxScore {
  metadata GameMetadata
  home_team TeamStats
  away_team TeamStats
  quarter_scores int[][]?  // [team][quarter] scores if available
}

// Parse raw box score text into structured data
function ParseBoxScore(raw_text: string) -> BoxScore {
  client CustomSonnet4
  prompt #"
    Parse the following box score into structured data. Extract all player statistics,
    team totals, and game metadata.

    Important guidelines:
    - If a statistic is not provided, use 0 for numeric fields
    - For percentages, calculate from made/attempted if not given directly
    - Identify starters vs bench players if indicated
    - Parse any date, venue, or game type information if present
    - Handle common abbreviations: PTS, REB, AST, STL, BLK, TO, PF, FG, 3PT, FT, MIN

    Box Score Text:
    {{ raw_text }}

    {{ ctx.output_format }}
  "#
}

class GameRecap {
  headline string @description("Compelling headline, under 80 characters")
  subheadline string @description("Supporting detail, under 120 characters")
  lead_paragraph string @description("Opening paragraph with key story angle, 2-3 sentences")
  body_paragraphs string[] @description("Main content paragraphs covering game flow and standout performances")
  key_stats string[] @description("3-5 notable statistics to highlight")
  player_of_the_game string @description("Name and brief justification")
}

// Generate a game recap from parsed box score data
function GenerateRecap(box_score: BoxScore) -> GameRecap {
  client CustomSonnet4
  prompt #"
    Generate an engaging game recap from this box score data. Write in the style of a
    sports information director creating content for the team website.

    Guidelines:
    - Lead with the most compelling narrative (comeback, blowout, individual performance, etc.)
    - Use active voice and vivid language
    - Include specific statistics that support the narrative
    - Mention standout performers by name with their key stats
    - Keep the tone professional but engaging
    - The headline should grab attention
    - Body paragraphs should flow naturally, covering game progression

    Game Data:
    {{ box_score }}

    {{ ctx.output_format }}
  "#
}

// Combined function: fetch, parse, and generate recap
function BoxScoreToRecap(raw_text: string) -> GameRecap {
  client CustomSonnet4
  prompt #"
    You are a sports content specialist. Given raw box score data, create an engaging
    game recap suitable for a team website or press release.

    First, analyze the box score to identify:
    1. The final score and which team won
    2. Standout individual performances (high scorers, double-doubles, efficiency)
    3. Key game dynamics (close game, blowout, comeback, overtime)
    4. Notable statistical trends (rebounding advantage, turnover differential, shooting)

    Then write a compelling recap that tells the story of the game.

    Raw Box Score:
    {{ raw_text }}

    {{ ctx.output_format }}
  "#
}

// Trigger Detection Types
// These types represent narrative hooks detected in box score data

enum TriggerCategory {
  STATISTICAL_EXTREME
  CLUTCH_MOMENT
  UNEXPECTED_PERFORMANCE
  ANOMALY
  TREND
}

class Trigger {
  category TriggerCategory
  description string @description("What was detected that makes this interesting")
  player_name string? @description("Player involved, if trigger is player-specific")
  key_stats map<string, string> @description("The specific statistics that triggered this, e.g. {'points': '30', 'fg_pct': '65%'}")
  follow_up_question string @description("A question that would surface narrative context for this trigger")
  salience_score float @description("0-1 confidence score for how interesting/relevant this trigger is")
}

class TriggerList {
  triggers Trigger[] @description("Ranked list of engagement triggers, ordered by salience")
}

// Detect engagement triggers from box score data
function DetectTriggers(box_score: BoxScore) -> TriggerList {
  client CustomSonnet4
  prompt #"
    You are a basketball analyst identifying narrative hooks in box score data. Analyze the game
    and detect statistical patterns that suggest story potential — moments that would make an SID
    think "there's something here worth exploring."

    Your goal is to surface 3-8 high-quality triggers ranked by how interesting they are. Each trigger
    should point to something worth asking follow-up questions about.

    ## Tone Guidelines: Celebrate Positives, Stay Neutral on Negatives

    **Focus on what went RIGHT.** Highlight standout performances, impressive stats, and positive
    contributions. These are the stories players, coaches, and fans want to read about.

    **Never criticize individual players.** Poor individual stats rarely tell the whole story — a
    player with high turnovers might be running a complex offense, facing elite defenders, or playing
    through injury. A cold shooting night could be bad luck, defensive scheming, or fatigue. You don't
    have enough context to attribute blame, so don't.

    **Frame negatives at the team level, if at all.** If the team had 20 turnovers, that's a team
    observation worth exploring — perhaps the opponent's defense was exceptional, or the pace was
    unusually fast. Don't single out individual turnover counts as problems.

    **Avoid speculation and attribution.** Describe what happened, not why. "Team X dominated the
    boards with a +15 rebounding margin" is factual. "Player Y couldn't handle the pressure" is
    speculation you can't support from a box score.

    ## Domain Knowledge: What Makes Stats Notable

    **High-scoring games:**
    - 25+ points is a strong game
    - 30+ points is exceptional
    - 20+ on high efficiency (60%+ FG, 10+ FGA) is noteworthy

    **Rebounding:**
    - 10+ rebounds is a double-double threshold
    - 12+ is impressive for guards/forwards
    - 15+ is dominant
    - Extreme gaps between teams (10+ differential) suggest physical dominance

    **Assists:**
    - 8+ assists is excellent
    - 10+ is exceptional for a point guard
    - 5+ for a non-guard is unusual

    **Efficiency patterns:**
    - 60%+ FG on 10+ attempts is hot shooting
    - 50%+ from 3PT on 5+ attempts is excellent
    - 90%+ FT on 8+ attempts shows clutch execution

    **Clean performance:**
    - Zero turnovers on 25+ minutes with high usage
    - 5+ assists with zero turnovers for a guard

    **Defensive impact:**
    - 3+ steals is active defense
    - 4+ blocks for a big, 2+ for a guard/forward is notable

    **Bench production:**
    - Bench player outscoring all starters
    - Reserve with 15+ points on limited minutes

    **Versatility:**
    - Big with 5+ assists shows playmaking range
    - Guard with 10+ rebounds shows effort and positioning

    **Team patterns:**
    - Balanced scoring (4+ players in double figures)
    - Rebounding dominance (15+ rebound differential)
    - Free throw margin (getting to the line more often)

    ## What to Look For

    Start by identifying clear positives — exceptional individual performances, impressive efficiency,
    or notable team patterns. Look for combinations that suggest a story, like a bench player having
    a breakout night or a team winning the rebounding battle decisively.

    Focus on triggers that would make you want to know more. A 30-point game is interesting, but
    becomes more compelling if you know it was a senior's last home game or came after sitting two
    games injured. Your follow-up questions should dig for that context.

    Rank triggers by salience, where higher scores mean more compelling narrative potential. A triple-double
    rates higher than a solid 15-point game. An overtime game with clutch free throws beats a blowout.

    ## Game Data

    {{ box_score }}

    {{ ctx.output_format }}
  "#
}

// Test parsing and combined recap function
test parse_boxscore {
  functions [ParseBoxScore, BoxScoreToRecap]
  args {
    raw_text #"
      Women's Basketball - January 28, 2026
      State University 78, Rival College 74
      Memorial Arena

      STATE UNIVERSITY (78)
      Starters:
      Sarah Chen G 36 MIN 24 PTS 3-8 FG 2-4 3PT 16-18 FT 4 REB 5 AST 0 STL 1 BLK 2 TO 3 PF
      Maya Johnson G 34 MIN 12 PTS 5-11 FG 1-3 3PT 1-2 FT 2 REB 6 AST 2 STL 0 BLK 3 TO 2 PF
      Kira Thompson F 32 MIN 8 PTS 4-9 FG 0-0 3PT 0-0 FT 7 REB 2 AST 1 STL 2 BLK 1 TO 4 PF
      Destiny Brown F 28 MIN 6 PTS 2-5 FG 0-1 3PT 2-2 FT 8 REB 1 AST 0 STL 1 BLK 2 TO 2 PF
      Aaliyah Williams C 24 MIN 10 PTS 4-6 FG 0-0 3PT 2-4 FT 5 REB 0 AST 0 STL 3 BLK 4 TO 5 PF

      Bench:
      Jordan Mills G 22 MIN 18 PTS 7-9 FG 2-3 3PT 2-2 FT 3 REB 2 AST 1 STL 0 BLK 0 TO 1 PF
      Tiffany Adams F 14 MIN 0 PTS 0-2 FG 0-1 3PT 0-0 FT 2 REB 0 AST 0 STL 0 BLK 1 TO 2 PF
      Grace Liu G 10 MIN 0 PTS 0-1 FG 0-1 3PT 0-0 FT 0 REB 1 AST 1 STL 0 BLK 0 TO 0 PF

      Team Totals: 78 PTS 25-51 FG (49.0%) 5-13 3PT (38.5%) 23-28 FT (82.1%) 31 REB 17 AST 5 STL 7 BLK 13 TO 19 PF

      RIVAL COLLEGE (74)
      Starters:
      Jessica Martinez G 38 MIN 22 PTS 8-16 FG 3-7 3PT 3-4 FT 3 REB 4 AST 2 STL 0 BLK 2 TO 2 PF
      Brittany Davis G 36 MIN 18 PTS 7-14 FG 2-5 3PT 2-2 FT 4 REB 5 AST 1 STL 0 BLK 3 TO 3 PF
      Morgan Thomas F 34 MIN 14 PTS 5-10 FG 1-2 3PT 3-4 FT 14 REB 2 AST 0 STL 2 BLK 2 TO 4 PF
      Ashley Green F 30 MIN 8 PTS 3-7 FG 0-2 3PT 2-2 FT 9 REB 1 AST 1 STL 1 BLK 3 TO 3 PF
      Lauren White C 26 MIN 6 PTS 2-4 FG 0-0 3PT 2-4 FT 8 REB 0 AST 0 STL 3 BLK 1 TO 4 PF

      Bench:
      Samantha Hill G 18 MIN 4 PTS 2-6 FG 0-2 3PT 0-0 FT 2 REB 3 AST 0 STL 0 BLK 2 TO 2 PF
      Emily Clark F 12 MIN 2 PTS 1-3 FG 0-1 3PT 0-0 FT 2 REB 0 AST 0 STL 0 BLK 0 TO 1 PF
      Nicole Brown G 6 MIN 0 PTS 0-1 FG 0-1 3PT 0-0 FT 0 REB 1 AST 0 STL 0 BLK 1 TO 1 PF

      Team Totals: 74 PTS 28-61 FG (45.9%) 6-20 3PT (30.0%) 12-16 FT (75.0%) 42 REB 16 AST 4 STL 6 BLK 14 TO 20 PF

      Score by Quarter:
      State: 18 - 16 - 22 - 22 = 78
      Rival: 20 - 18 - 20 - 16 = 74
    "#
  }
}

// Test trigger detection with the same box score
test detect_triggers {
  functions [DetectTriggers]
  args {
    box_score {
      metadata {
        date "2026-01-28"
        venue "Memorial Arena"
        home_team "State University"
        away_team "Rival College"
        home_score 78
        away_score 74
        is_overtime false
        periods 4
        game_type "regular season"
      }
      home_team {
        team_name "State University"
        total_points 78
        field_goals_made 25
        field_goals_attempted 51
        field_goal_percentage 49.0
        three_pointers_made 5
        three_pointers_attempted 13
        three_point_percentage 38.5
        free_throws_made 23
        free_throws_attempted 28
        free_throw_percentage 82.1
        total_rebounds 31
        assists 17
        steals 5
        blocks 7
        turnovers 13
        fouls 19
        players [
          {
            name "Sarah Chen"
            position "G"
            starter true
            minutes 36
            points 24
            rebounds 4
            assists 5
            steals 0
            blocks 1
            turnovers 2
            fouls 3
            field_goals_made 3
            field_goals_attempted 8
            three_pointers_made 2
            three_pointers_attempted 4
            free_throws_made 16
            free_throws_attempted 18
          }
          {
            name "Jordan Mills"
            position "G"
            starter false
            minutes 22
            points 18
            rebounds 3
            assists 2
            steals 1
            blocks 0
            turnovers 0
            fouls 1
            field_goals_made 7
            field_goals_attempted 9
            three_pointers_made 2
            three_pointers_attempted 3
            free_throws_made 2
            free_throws_attempted 2
          }
        ]
      }
      away_team {
        team_name "Rival College"
        total_points 74
        field_goals_made 28
        field_goals_attempted 61
        field_goal_percentage 45.9
        three_pointers_made 6
        three_pointers_attempted 20
        three_point_percentage 30.0
        free_throws_made 12
        free_throws_attempted 16
        free_throw_percentage 75.0
        total_rebounds 42
        assists 16
        steals 4
        blocks 6
        turnovers 14
        fouls 20
        players [
          {
            name "Morgan Thomas"
            position "F"
            starter true
            minutes 34
            points 14
            rebounds 14
            assists 2
            steals 0
            blocks 2
            turnovers 2
            fouls 4
            field_goals_made 5
            field_goals_attempted 10
            three_pointers_made 1
            three_pointers_attempted 2
            free_throws_made 3
            free_throws_attempted 4
          }
        ]
      }
    }
  }
}

// Context Interview Types
// These types represent the narrative context gathered through the interview process

class PlayerNote {
  player_name string
  role string? @description("Role on team: starter, bench spark, team captain, etc.")
  backstory string? @description("Personal story, journey to the team, challenges overcome")
  current_arc string? @description("What's happening for them this season: breakout year, senior farewell, injury comeback, etc.")
  development_focus string? @description("Skills they're working on, coaching emphasis")
}

class TeamContext {
  season_narrative string? @description("Overall story of the season: rebuilding, championship push, underdog run")
  current_record string? @description("Win-loss record and conference standing if known")
  key_challenges string? @description("Injuries, schedule difficulty, youth/inexperience, etc.")
  goals string? @description("What the team is working toward this season")
  coaching_philosophy string? @description("Coach's approach, system, what they emphasize")
}

class AudienceSegment {
  segment_name string @description("Who this audience is: parents, alumni, recruits, local media, etc.")
  interests string[] @description("What this segment cares most about")
  preferred_framing string? @description("How to angle stories for this audience")
}

class NarrativeContext {
  team_name string
  sport string
  players PlayerNote[] @description("Notes on individual players")
  team TeamContext @description("Overall team context and storylines")
  audience AudienceSegment[] @description("Different audience segments and what they care about")
  rivalries string[]? @description("Key rival teams and why they matter")
  upcoming_milestones string[]? @description("Important upcoming games or achievements")
}

// Question Types

class InterviewQuestion {
  question string @description("The actual question to ask")
  rationale string @description("Why this question matters - what context it surfaces")
  category string @description("Type of question: player_arc, team_story, audience_insight, game_specific, etc.")
}

class QuestionSet {
  questions InterviewQuestion[] @description("List of interview questions")
  note string? @description("Optional context about this question set")
}

// Generate onboarding questions to establish baseline context
function OnboardingInterview(team_name: string, sport: string) -> QuestionSet {
  client CustomSonnet4
  prompt #"
    You are helping a Sports Information Director build a context base for {{ team_name }}'s {{ sport }} program.
    This is the initial onboarding interview that establishes baseline narrative context before diving into
    specific games.

    Your role is to ask questions that surface the kind of context that makes game coverage compelling — the
    backstories, arcs, and audience priorities that turn statistics into stories.

    Generate 8-12 onboarding questions that would help gather foundational context. Questions should be:

    **Specific and grounded**: Ask about concrete things ("Any seniors having a standout final season?")
    rather than generic prompts ("Tell me about your team").

    **Context-seeking**: Focus on the "why behind the numbers" — backstories, development arcs, team chemistry,
    coaching philosophy, audience priorities.

    **Actionable**: Each answer should give the SID something they can weave into game coverage or pull quotes.

    ## Question Categories to Cover

    **Team narrative**: What's the story of this season? Rebuilding? Championship push? Exceeding expectations?
    What challenges have they faced? Any major roster changes or injuries affecting the season?

    **Player arcs**: Who are the key players and what are their stories? Any seniors with compelling farewell
    narratives? Freshmen making unexpected impact? Players returning from injury? Breakout performers?

    **Coaching approach**: What does the coaching staff emphasize? Fast-paced offense? Defensive grind?
    Player development focus? Any notable strategic shifts this season?

    **Audience priorities**: Who consumes this team's content? Parents of players? Alumni? Local media?
    High school recruits? What does each segment care most about?

    **Context hooks**: Key rivalries and why they matter. Upcoming milestone games. School or program
    traditions. Community connections.

    Each question should include a rationale explaining what narrative context it surfaces and why that
    matters for compelling game coverage.

    Team: {{ team_name }}
    Sport: {{ sport }}

    {{ ctx.output_format }}
  "#
}

// Generate game-specific follow-up questions based on box score and existing context
function GameInterview(box_score: BoxScore, context: NarrativeContext) -> QuestionSet {
  client CustomSonnet4
  prompt #"
    You are helping a Sports Information Director develop game coverage. You have the box score data
    and existing narrative context. Your job is to generate targeted follow-up questions that surface
    the stories behind the statistics.

    This is where the "interviewer" role shines — taking what the data shows and asking questions that
    reveal what the data can't show: emotions, decisions, backstory, impact.

    Generate 5-10 game-specific questions that are:

    **Data-grounded**: Reference specific performances from the box score ("Sarah's 16-18 from the free
    throw line was clutch — was she specifically targeting trips to the line, or did the game flow that way?")

    **Context-aware**: Connect to known player arcs or team storylines from the existing context ("Jordan
    came off the bench and dropped 18 on 78% shooting — is this part of her breakout season you mentioned,
    or was this game special?")

    **Story-revealing**: Ask about things the stats can't show — coaching decisions, player emotions,
    family presence, turning points, strategic adjustments.

    ## Question Types to Include

    **Performance questions**: Dig into statistical standouts. Career high? Coming off an injury?
    Specific game plan targeting this matchup? ("Maya's 14 rebounds despite the loss — was she on a
    mission tonight, or is this who she's been all season?")

    **Decision questions**: Ask about coaching choices that shaped outcomes. Substitution patterns,
    defensive schemes, timeout timing. ("Coach went to the bench early — what did she see that prompted
    the change?")

    **Moment questions**: Identify inflection points and ask what happened. Fourth-quarter run, scoring
    drought, defensive stand. ("The team went on an 8-0 run in the third — what shifted?")

    **Context questions**: Surface elements only humans know. Family in attendance, senior night emotions,
    rivalry intensity, pregame adjustments. ("This was a rivalry game — did that amp up intensity, or
    did Coach emphasize staying composed?")

    **Arc questions**: Connect this game to larger narratives from the existing context. ("You mentioned
    this is Kira's first season back from knee surgery — how is she feeling about her mobility tonight?")

    Avoid generic questions like "How do you feel about the win?" or "Tell me about this game." Every
    question should be specific to this box score and this context.

    ## Game Data

    {{ box_score }}

    ## Existing Context

    {{ context }}

    {{ ctx.output_format }}
  "#
}

// Test onboarding interview
test onboarding_interview {
  functions [OnboardingInterview]
  args {
    team_name "College of Marin Mariners"
    sport "Women's Basketball"
  }
}

// Test game-specific interview with context
test game_interview {
  functions [GameInterview]
  args {
    box_score {
      metadata {
        date "2026-01-28"
        venue "Memorial Arena"
        home_team "State University"
        away_team "Rival College"
        home_score 78
        away_score 74
        is_overtime false
        periods 4
        game_type "regular season"
      }
      home_team {
        team_name "State University"
        total_points 78
        field_goals_made 25
        field_goals_attempted 51
        field_goal_percentage 49.0
        three_pointers_made 5
        three_pointers_attempted 13
        three_point_percentage 38.5
        free_throws_made 23
        free_throws_attempted 28
        free_throw_percentage 82.1
        total_rebounds 31
        assists 17
        steals 5
        blocks 7
        turnovers 13
        fouls 19
        players [
          {
            name "Sarah Chen"
            position "G"
            starter true
            minutes 36
            points 24
            rebounds 4
            assists 5
            steals 0
            blocks 1
            turnovers 2
            fouls 3
            field_goals_made 3
            field_goals_attempted 8
            three_pointers_made 2
            three_pointers_attempted 4
            free_throws_made 16
            free_throws_attempted 18
          }
          {
            name "Jordan Mills"
            position "G"
            starter false
            minutes 22
            points 18
            rebounds 3
            assists 2
            steals 1
            blocks 0
            turnovers 0
            fouls 1
            field_goals_made 7
            field_goals_attempted 9
            three_pointers_made 2
            three_pointers_attempted 3
            free_throws_made 2
            free_throws_attempted 2
          }
        ]
      }
      away_team {
        team_name "Rival College"
        total_points 74
        field_goals_made 28
        field_goals_attempted 61
        field_goal_percentage 45.9
        three_pointers_made 6
        three_pointers_attempted 20
        three_point_percentage 30.0
        free_throws_made 12
        free_throws_attempted 16
        free_throw_percentage 75.0
        total_rebounds 42
        assists 16
        steals 4
        blocks 6
        turnovers 14
        fouls 20
        players [
          {
            name "Morgan Thomas"
            position "F"
            starter true
            minutes 34
            points 14
            rebounds 14
            assists 2
            steals 0
            blocks 2
            turnovers 2
            fouls 4
            field_goals_made 5
            field_goals_attempted 10
            three_pointers_made 1
            three_pointers_attempted 2
            free_throws_made 3
            free_throws_attempted 4
          }
        ]
      }
    }
    context {
      team_name "State University"
      sport "Women's Basketball"
      players [
        {
          player_name "Sarah Chen"
          role "Starting guard, team captain"
          backstory "Transfer from junior college, first year with the team"
          current_arc "Adjusting to higher level of competition, emerging as team leader"
          development_focus "Decision-making under pressure, reducing turnovers"
        }
        {
          player_name "Jordan Mills"
          role "Sixth player, bench spark"
          backstory "Local product, grew up 10 minutes from campus"
          current_arc "Breakout sophomore season, earning more minutes"
          development_focus "Consistency, proving she can start if needed"
        }
      ]
      team {
        season_narrative "Rebuilding year with young roster, exceeding early expectations"
        current_record "12-8 overall, 4-3 in conference"
        key_challenges "Depth issues, several key injuries mid-season"
        goals "Make conference tournament, gain experience for next season"
        coaching_philosophy "Fast-paced offense, aggressive defense, develop young players"
      }
      audience [
        {
          segment_name "Parents and families"
          interests ["Player development", "Playing time", "Team culture"]
        }
        {
          segment_name "Alumni"
          interests ["Wins and losses", "Program trajectory", "Notable performances"]
        }
      ]
      rivalries ["Rival College - geographic rivalry, always competitive"]
      upcoming_milestones ["Senior night in two weeks", "Conference tournament in March"]
    }
  }
}

// Narrative Synthesis Types
// These types represent the synthesized story angles and observations

class NarrativeAngle {
  title string @description("Brief title for this story angle, e.g. 'Local Hero Delivers' or 'Free Throw Clinic Seals Win'")
  hook string @description("The compelling hook or frame for this angle — what makes it interesting")
  data_support string @description("Specific statistics or data points that support this narrative")
  context_connection string @description("How this connects to gathered context about players, team, or season")
  audience_relevance string @description("Why this matters to the target audience, if specified")
  confidence string @description("What we know vs. what we're inferring — acknowledging gaps")
  priority_rationale string? @description("Why lead with this angle vs. others, if this is the top suggestion")
}

class NarrativeSynthesis {
  angles NarrativeAngle[] @description("Story angles ranked by strength, typically 2-4 angles")
  lead_recommendation string @description("Which angle to lead with and why")
  missing_context string? @description("What additional context would strengthen these narratives")
  audience_note string? @description("Specific guidance for target audience if one was specified")
  priority_tier string @description("high, medium, or low — indicates depth of analysis")
  tier_rationale string @description("Why this game was ranked at this tier")
}

// Synthesize narrative observations from triggers, context, and box score data
function SynthesizeNarratives(
  box_score: BoxScore,
  triggers: TriggerList,
  context: NarrativeContext,
  voice_profile: string?,
  signals: StorySignals?,
  coverage_guidance: string?,
  target_audience: string?,
  target_channel: string?
) -> NarrativeSynthesis {
  client CustomSonnet4
  prompt #"
    You are a narrative consultant helping a Sports Information Director see story angles in game data.
    Your role is the "publicist" side of the interviewer-publicist dynamic — taking what you know from
    triggers, context, and statistics to suggest compelling narratives the SID might pursue.

    You are NOT writing finished content. You're being a thinking partner who says "here are three angles
    you could take, and here's why each one matters." The SID will make the final call and write the story.

    {% if voice_profile %}
    ## Voice Profile

    The following voice profile describes this program's personality, audience, and communication preferences.
    Your narrative angles should match this voice and reflect the program's unique identity.

    {{ voice_profile }}

    **Key Voice Guidance:**
    - Match the personality words in your tone and word choice throughout your analysis
    - Frame angles for the audiences described in the profile
    - Look for natural opportunities to connect narratives to signature phrases or traditions (don't force them)
    - Avoid the tones and terms flagged as inappropriate in the profile
    - Respect terminology preferences and program naming conventions
    - Your output should sound like it came from this specific program, not a generic sports AI

    When you identify story angles, consider which ones best align with what this program values and how
    they communicate. If the profile emphasizes "gritty, underdog" personality, angles celebrating resilience
    and hard work should be prioritized. If it emphasizes "joyful, family-oriented," angles highlighting team
    chemistry and community connection should lead.
    {% endif %}

    {% if signals %}
    ## Story Priority

    This game is **{{ signals.tier or 'medium' }} priority**.

    {% if signals.signal_reasons %}
    Reasons: {{ signals.signal_reasons | join(', ') }}
    {% endif %}

    Coverage guidance: {{ coverage_guidance or 'Standard coverage' }}

    {% if signals.tier == 'high' %}
    **This is a high-priority story.** Provide comprehensive analysis with multiple angles, audience framings, and talking points. Emphasize the key moments and standout performances that make this game newsworthy. Generate 3-4 detailed narrative angles with full context connections, audience relevance, and concrete recommendations.
    {% elif signals.tier == 'low' %}
    **This is a lower-priority game.** Keep coverage concise and factual. Focus on the final score, key contributors, and what's next. One or two angles is sufficient — provide the essential story without extensive narrative development.
    {% else %}
    **Standard coverage.** Provide solid analysis with 2-3 angles focusing on the primary story and one or two secondary narratives. Strike a balance between depth and conciseness.
    {% endif %}

    In your output, include the priority_tier ({{ signals.tier or 'medium' }}) and explain why this game was ranked at this level based on the signals detected.
    {% endif %}

    ## Your Task

    Analyze the box score, detected triggers, and gathered context to synthesize 2-4 narrative angles
    that connect data to story. Each angle should:

    **Ground in specific data**: Point to exact statistics that support the narrative. Don't just say
    "great performance" — say "24 points on 16-18 free throw shooting, team-high in clutch fourth quarter."

    **Connect to context**: Weave in what you know about player arcs, team storylines, and audience
    priorities. If Jordan Mills scored 18 off the bench and you know she's in a breakout sophomore season
    from a local background, that connection is the narrative gold.

    {% if voice_profile %}
    **Reflect program voice**: Let the program's personality shape how you frame angles. Use the language,
    values, and storytelling preferences from the voice profile. Connect to traditions and what this specific
    program cares about.
    {% endif %}

    **Frame for audience**: If a target audience is specified, explicitly explain why this angle matters
    to them. Parents care about development and playing time. Alumni care about wins and program trajectory.
    Recruits care about opportunity and team culture. Local media cares about hometown stories.

    **Acknowledge gaps**: Be honest about what you're inferring vs. what you know. "This looks like a
    career high, but I don't have historical stats to confirm" or "The comeback in the fourth quarter
    suggests a turning point, but I don't know what adjustments coach made."

    ## Quality Bar for Angles

    A strong narrative angle has a clear hook, specific data support, context connection, and audience
    relevance. Avoid generic observations like "team played well" or "good win." Instead offer angles
    like:

    "Jordan's 18-point bench explosion ties directly to her breakout sophomore year narrative. For
    parents and families, this is proof that hard work and development time pay off. For recruits,
    it's evidence that non-starters get real opportunities. Lead with this if emphasizing player
    development."

    "Sarah Chen's 16-18 free throw performance kept the team alive down the stretch. Given her arc
    as a transfer adjusting to higher competition, this shows she's comfortable in pressure moments.
    For alumni worried about program competitiveness, this is evidence the roster is gelling. For
    local media, frame it as 'clutch gene emerging in new captain.'"

    ## Ranking and Lead Recommendation

    Rank angles by strength — what's most compelling given the data and context you have. Your lead
    recommendation should explain the tradeoffs: "Lead with Jordan's local hero story if the primary
    audience is community and recruits. Lead with Sarah's clutch free throws if the audience is alumni
    focused on winning."

    {% if voice_profile %}
    When recommending a lead angle, explicitly consider which angle best matches the program's voice and
    values as described in the profile.
    {% endif %}

    ## What You're Given

    **Box Score**: Game statistics including final score, player performances, team totals.

    **Triggers**: Detected patterns and statistical hooks identified by trigger detection.

    **Context**: What you know about players, team storylines, coaching philosophy, audience segments,
    rivalries, and upcoming milestones.

    {% if voice_profile %}
    **Voice Profile**: The program's personality, audience priorities, storytelling preferences, and
    communication guidelines.
    {% endif %}

    **Target Audience**: {{ target_audience or "general" }} — If specific, frame angles with
    their interests in mind. If general, provide angles that work across multiple segments.

    **Target Channel**: {{ target_channel or "not specified" }}

    ## Game Data

    {{ box_score }}

    ## Detected Triggers

    {{ triggers }}

    ## Narrative Context

    {{ context }}

    ## Output Format

    Provide 2-4 story angles ranked by strength, with your lead recommendation and any missing context
    that would strengthen the narratives. Remember: you're helping the SID see possibilities, not
    dictating the story.

    {{ ctx.output_format }}
  "#
}

// Story Signals Types
// These types represent simple signals extracted from box scores for game-level prioritization

class StorySignals {
  is_close_game bool
  is_overtime bool
  has_standout_performance bool
  is_conference_game bool
  margin int
  standout_count int
  priority_score float
  signal_reasons string[] @description("Human-readable reasons, e.g. 'Close game (4-point margin)'")
  tier string @description("high, medium, or low — derived from priority_score")
}

// Priority Ranking Types
// These types represent the multi-game ranking used to prioritize coverage

class RankedGame {
  box_score BoxScore
  signals StorySignals
  tier string @description("high, medium, or low")
  coverage_guidance string @description("Instructions for narrative synthesis, e.g. 'Emphasize clutch moments and individual performances'")
}

class PriorityRanking {
  games RankedGame[]
  summary string @description("Tonight's coverage at a glance, e.g. '1 high-priority game (OT thriller), 2 routine wins'")
}

// Test narrative synthesis
test narrative_synthesis {
  functions [SynthesizeNarratives]
  args {
    voice_profile null
    signals {
      is_close_game true
      is_overtime false
      has_standout_performance true
      is_conference_game false
      margin 4
      standout_count 2
      priority_score 4.0
      signal_reasons ["Close game (4-point margin)", "2 standout performances"]
      tier "medium"
    }
    coverage_guidance "Cover key performances and game outcome. Focus on standout moments and statistics without extensive narrative development."
    target_channel null
    box_score {
      metadata {
        date "2026-01-28"
        venue "Memorial Arena"
        home_team "State University"
        away_team "Rival College"
        home_score 78
        away_score 74
        is_overtime false
        periods 4
        game_type "regular season"
      }
      home_team {
        team_name "State University"
        total_points 78
        field_goals_made 25
        field_goals_attempted 51
        field_goal_percentage 49.0
        three_pointers_made 5
        three_pointers_attempted 13
        three_point_percentage 38.5
        free_throws_made 23
        free_throws_attempted 28
        free_throw_percentage 82.1
        total_rebounds 31
        assists 17
        steals 5
        blocks 7
        turnovers 13
        fouls 19
        players [
          {
            name "Sarah Chen"
            position "G"
            starter true
            minutes 36
            points 24
            rebounds 4
            assists 5
            steals 0
            blocks 1
            turnovers 2
            fouls 3
            field_goals_made 3
            field_goals_attempted 8
            three_pointers_made 2
            three_pointers_attempted 4
            free_throws_made 16
            free_throws_attempted 18
          }
          {
            name "Jordan Mills"
            position "G"
            starter false
            minutes 22
            points 18
            rebounds 3
            assists 2
            steals 1
            blocks 0
            turnovers 0
            fouls 1
            field_goals_made 7
            field_goals_attempted 9
            three_pointers_made 2
            three_pointers_attempted 3
            free_throws_made 2
            free_throws_attempted 2
          }
        ]
      }
      away_team {
        team_name "Rival College"
        total_points 74
        field_goals_made 28
        field_goals_attempted 61
        field_goal_percentage 45.9
        three_pointers_made 6
        three_pointers_attempted 20
        three_point_percentage 30.0
        free_throws_made 12
        free_throws_attempted 16
        free_throw_percentage 75.0
        total_rebounds 42
        assists 16
        steals 4
        blocks 6
        turnovers 14
        fouls 20
        players [
          {
            name "Morgan Thomas"
            position "F"
            starter true
            minutes 34
            points 14
            rebounds 14
            assists 2
            steals 0
            blocks 2
            turnovers 2
            fouls 4
            field_goals_made 5
            field_goals_attempted 10
            three_pointers_made 1
            three_pointers_attempted 2
            free_throws_made 3
            free_throws_attempted 4
          }
        ]
      }
    }
    triggers {
      triggers [
        {
          category CLUTCH_MOMENT
          description "Sarah Chen went 16-18 from the free throw line, providing crucial points in a close game"
          player_name "Sarah Chen"
          key_stats {"free_throws": "16-18", "free_throw_pct": "88.9%", "points": "24"}
          follow_up_question "Were the free throws concentrated in key moments, particularly the fourth quarter?"
          salience_score 0.9
        }
        {
          category UNEXPECTED_PERFORMANCE
          description "Jordan Mills scored 18 points off the bench on 7-9 shooting (77.8%), providing a spark"
          player_name "Jordan Mills"
          key_stats {"points": "18", "field_goals": "7-9", "fg_pct": "77.8%", "minutes": "22"}
          follow_up_question "Was this a planned featured role for Jordan, or did she seize an opportunity when it came?"
          salience_score 0.85
        }
        {
          category ANOMALY
          description "Despite being outrebounded 42-31, State University won by controlling the free throw battle 23-12"
          key_stats {"state_ft": "23-28", "rival_ft": "12-16", "rebound_differential": "-11"}
          follow_up_question "Was getting to the line part of the game plan, or did it happen organically?"
          salience_score 0.75
        }
      ]
    }
    context {
      team_name "State University"
      sport "Women's Basketball"
      players [
        {
          player_name "Sarah Chen"
          role "Starting guard, team captain"
          backstory "Transfer from junior college, first year with the team"
          current_arc "Adjusting to higher level of competition, emerging as team leader"
          development_focus "Decision-making under pressure, reducing turnovers"
        }
        {
          player_name "Jordan Mills"
          role "Sixth player, bench spark"
          backstory "Local product, grew up 10 minutes from campus"
          current_arc "Breakout sophomore season, earning more minutes"
          development_focus "Consistency, proving she can start if needed"
        }
      ]
      team {
        season_narrative "Rebuilding year with young roster, exceeding early expectations"
        current_record "12-8 overall, 4-3 in conference"
        key_challenges "Depth issues, several key injuries mid-season"
        goals "Make conference tournament, gain experience for next season"
        coaching_philosophy "Fast-paced offense, aggressive defense, develop young players"
      }
      audience [
        {
          segment_name "Parents and families"
          interests ["Player development", "Playing time", "Team culture"]
        }
        {
          segment_name "Alumni"
          interests ["Wins and losses", "Program trajectory", "Notable performances"]
        }
        {
          segment_name "Recruits"
          interests ["Playing time opportunities", "Player development", "Team success"]
        }
      ]
      rivalries ["Rival College - geographic rivalry, always competitive"]
      upcoming_milestones ["Senior night in two weeks", "Conference tournament in March"]
    }
    target_audience "Parents and families"
  }
}

// Test narrative synthesis with voice profile
test narrative_synthesis_with_voice {
  functions [SynthesizeNarratives]
  args {
    signals {
      is_close_game true
      is_overtime false
      has_standout_performance true
      is_conference_game true
      margin 4
      standout_count 2
      priority_score 6.0
      signal_reasons ["Close game (4-point margin)", "2 standout performances", "Conference game"]
      tier "high"
    }
    coverage_guidance "Emphasize clutch moments, individual performances, and game flow. This is a featured story that deserves deep coverage with quotes, context, and narrative arc."
    voice_profile #"
# Voice Profile: College of Marin Mariners Women's Basketball

## Program Identity

### 1. Who are you?
> We're a community college program in Marin County that develops local talent and gives student-athletes a second chance to succeed both on the court and in the classroom.

### 2. What's your program's personality?
> Gritty, family-oriented, resilient, community-connected, blue-collar

### 3. What do you never want to sound like?
> Never arrogant, never elitist, never dismissive of community college athletics. Avoid sounding corporate or overly polished — we're real people doing real work.

## Audience & Values

### 4. Who reads your content?
> Local community members, parents of players, prospective student-athletes looking for a fresh start, four-year coaches scouting transfer talent, and our small but dedicated alumni network.

### 5. What does your fanbase care about most?
> Local kids making good, second-chance stories, players earning four-year scholarships, academic achievement alongside athletic success, and team chemistry that shows these young women support each other through challenges.

### 6. What makes a "big deal" for your program?
> Conference wins, players earning scholarships to four-year schools, academic honors, beating our cross-bay rivals, and seeing graduates succeed beyond basketball.

## Storytelling Preferences

### 7. What player stories do you love to tell?
> Players who faced setbacks in high school and found their footing here, student-athletes balancing full course loads with practice and games, local Marin County kids staying close to home, and players who overcome personal challenges to succeed on the court.

### 8. What's your rivalry situation?
> Our biggest rival is Diablo Valley College — it's a cross-bay matchup that always brings intensity. City College of San Francisco is another key rivalry with deep history.

### 9. Any signature phrases or traditions?
> "Mariner Pride" is our rallying cry. We also emphasize "Family First" — this team takes care of each other on and off the court. The phrase "Built Different" captures how our program develops players who might not have had opportunities elsewhere.

## Practical Guidelines

### 10. Any names or terms to always use (or avoid)?
> We are the Mariners, not "Marin." Always say "College of Marin" or "COM," never "junior college" or "JC" — we're a community college.
    "#
    target_channel null
    target_audience "Local community and parents"
    box_score {
      metadata {
        date "2026-01-28"
        venue "Memorial Arena"
        home_team "College of Marin"
        away_team "Diablo Valley College"
        home_score 78
        away_score 74
        is_overtime false
        periods 4
        game_type "conference"
      }
      home_team {
        team_name "College of Marin"
        total_points 78
        field_goals_made 25
        field_goals_attempted 51
        field_goal_percentage 49.0
        three_pointers_made 5
        three_pointers_attempted 13
        three_point_percentage 38.5
        free_throws_made 23
        free_throws_attempted 28
        free_throw_percentage 82.1
        total_rebounds 31
        assists 17
        steals 5
        blocks 7
        turnovers 13
        fouls 19
        players [
          {
            name "Sarah Chen"
            position "G"
            starter true
            minutes 36
            points 24
            rebounds 4
            assists 5
            steals 0
            blocks 1
            turnovers 2
            fouls 3
            field_goals_made 3
            field_goals_attempted 8
            three_pointers_made 2
            three_pointers_attempted 4
            free_throws_made 16
            free_throws_attempted 18
          }
          {
            name "Jordan Mills"
            position "G"
            starter false
            minutes 22
            points 18
            rebounds 3
            assists 2
            steals 1
            blocks 0
            turnovers 0
            fouls 1
            field_goals_made 7
            field_goals_attempted 9
            three_pointers_made 2
            three_pointers_attempted 3
            free_throws_made 2
            free_throws_attempted 2
          }
        ]
      }
      away_team {
        team_name "Diablo Valley College"
        total_points 74
        field_goals_made 28
        field_goals_attempted 61
        field_goal_percentage 45.9
        three_pointers_made 6
        three_pointers_attempted 20
        three_point_percentage 30.0
        free_throws_made 12
        free_throws_attempted 16
        free_throw_percentage 75.0
        total_rebounds 42
        assists 16
        steals 4
        blocks 6
        turnovers 14
        fouls 20
        players [
          {
            name "Morgan Thomas"
            position "F"
            starter true
            minutes 34
            points 14
            rebounds 14
            assists 2
            steals 0
            blocks 2
            turnovers 2
            fouls 4
            field_goals_made 5
            field_goals_attempted 10
            three_pointers_made 1
            three_pointers_attempted 2
            free_throws_made 3
            free_throws_attempted 4
          }
        ]
      }
    }
    triggers {
      triggers [
        {
          category CLUTCH_MOMENT
          description "Sarah Chen went 16-18 from the free throw line in a tight conference rivalry game"
          player_name "Sarah Chen"
          key_stats {"free_throws": "16-18", "free_throw_pct": "88.9%", "points": "24"}
          follow_up_question "Were the free throws concentrated in key moments, particularly the fourth quarter?"
          salience_score 0.9
        }
        {
          category UNEXPECTED_PERFORMANCE
          description "Jordan Mills came off the bench and scored 18 points on 7-9 shooting against our biggest rival"
          player_name "Jordan Mills"
          key_stats {"points": "18", "field_goals": "7-9", "fg_pct": "77.8%", "minutes": "22"}
          follow_up_question "Was Jordan's performance part of her growth arc this season?"
          salience_score 0.85
        }
        {
          category ANOMALY
          description "College of Marin won despite being outrebounded 42-31 by controlling the free throw battle"
          key_stats {"com_ft": "23-28", "dvc_ft": "12-16", "rebound_differential": "-11"}
          follow_up_question "Was getting to the line part of the game plan against DVC's size?"
          salience_score 0.75
        }
      ]
    }
    context {
      team_name "College of Marin Mariners"
      sport "Women's Basketball"
      players [
        {
          player_name "Sarah Chen"
          role "Starting guard, team leader"
          backstory "Local Marin County player who chose to stay close to home"
          current_arc "First year as team leader, learning to handle pressure moments"
          development_focus "Clutch free throw shooting and decision-making"
        }
        {
          player_name "Jordan Mills"
          role "Sixth player, energizer off the bench"
          backstory "Transfer student who found her confidence at COM after struggling in high school"
          current_arc "Breakout season showing she's earned a starting role"
          development_focus "Consistency and proving she belongs on a four-year roster"
        }
      ]
      team {
        season_narrative "Young rebuilding team exceeding expectations with gritty, family-first approach"
        current_record "12-8 overall, 5-3 in conference"
        key_challenges "Lack of size and depth, but compensating with effort and team chemistry"
        goals "Make conference playoffs, develop players for four-year opportunities"
        coaching_philosophy "Emphasize development, team culture, and effort over wins"
      }
      audience [
        {
          segment_name "Local community"
          interests ["Local kids succeeding", "Underdog stories", "Team effort"]
        }
        {
          segment_name "Parents"
          interests ["Player development", "Academic success", "Playing time"]
        }
        {
          segment_name "Four-year scouts"
          interests ["Transfer potential", "Work ethic", "Coachability"]
        }
      ]
      rivalries ["Diablo Valley College - cross-bay rivalry, always competitive and physical"]
      upcoming_milestones ["Conference tournament in three weeks", "Several players have four-year visits scheduled"]
    }
  }
}
