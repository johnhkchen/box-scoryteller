// Water Polo Box Score Types
// These types represent the structured data extracted from water polo box score HTML

class WaterPoloPlayerStats {
  name string
  number string?  // Jersey number (can include letters like "1A" for goalkeepers)
  shots int
  goals int
  assists int
  points int  // Usually goals + assists, but tracked separately
  exclusions int  // Regular exclusion fouls (20-second penalties)
  drawn_exclusions int  // Exclusions drawn against opponents (DEX)
  steals int
  field_blocks int?  // Blocked shots (FB)
  sprints string?  // Sprint wins, e.g. "2-1" (won-lost)
}

class WaterPoloGoalkeeperStats {
  name string
  number string?
  minutes string  // Playing time, e.g. "32:00"
  goals_allowed int
  saves int
}

class WaterPoloTeamStats {
  team_name string
  goals int
  shots int
  assists int
  points int
  exclusions int
  drawn_exclusions int
  steals int
  field_blocks int?
  sprints string?  // e.g. "4-0"
  players WaterPoloPlayerStats[]
  goalkeepers WaterPoloGoalkeeperStats[]
}

class WaterPoloGameMetadata {
  date string?
  venue string?
  home_team string
  away_team string
  home_score int
  away_score int
  periods int @description("Number of periods played, typically 4 for regulation")
  game_type string?  // regular season, conference, tournament, etc.
  attendance int?
}

class WaterPoloPeriodScores {
  away_scores int[]  // Score per period for away team
  home_scores int[]  // Score per period for home team
}

class WaterPoloBoxScore {
  metadata WaterPoloGameMetadata
  home_team WaterPoloTeamStats
  away_team WaterPoloTeamStats
  period_scores WaterPoloPeriodScores?
}

// Parse raw water polo box score HTML into structured data
function ParseWaterPoloBoxScore(raw_text: string) -> WaterPoloBoxScore {
  client CustomSonnet4
  prompt #"
    Parse the following water polo box score into structured data. Extract all player statistics,
    goalkeeper statistics, team totals, and game metadata.

    Important guidelines:
    - If a statistic is not provided, use 0 for numeric fields
    - Jersey numbers can include letters (e.g., "1A" for goalkeepers)
    - Sprint records are formatted as "wins-losses" (e.g., "2-1")
    - Minutes for goalkeepers are formatted as "MM:SS" (e.g., "32:00")
    - Points typically equal goals + assists but may be tracked separately
    - Exclusions (EX) are 20-second penalty fouls committed by the player
    - Drawn exclusions (DEX) are exclusion fouls the player drew against opponents
    - Field blocks (FB) are blocked shots
    - Extract period-by-period scoring if available (4 periods is standard)
    - Identify the home and away teams from the box score structure
    - Parse any date, venue, attendance, or game type information if present
    - Handle common abbreviations: G (goals), A (assists), SH (shots), STL (steals),
      EX (exclusions), DEX (drawn exclusions), FB (field blocks), S (saves), GA (goals allowed)

    Box Score HTML/Text:
    {{ raw_text }}

    {{ ctx.output_format }}
  "#
}

class WaterPoloGameRecap {
  headline string @description("Compelling headline, under 80 characters")
  subheadline string @description("Supporting detail, under 120 characters")
  lead_paragraph string @description("Opening paragraph with key story angle, 2-3 sentences")
  body_paragraphs string[] @description("Main content paragraphs covering game flow and standout performances")
  key_stats string[] @description("3-5 notable statistics to highlight")
  player_of_the_game string @description("Name and brief justification")
}

// Generate a game recap from parsed water polo box score data
function GenerateWaterPoloRecap(box_score: WaterPoloBoxScore) -> WaterPoloGameRecap {
  client CustomSonnet4
  prompt #"
    Generate an engaging game recap from this water polo box score data. Write in the style of a
    sports information director creating content for the team website.

    Guidelines:
    - Lead with the most compelling narrative (dominant win, close battle, individual standout, etc.)
    - Use active voice and vivid language appropriate for water polo
    - Include specific statistics that support the narrative
    - Mention standout performers by name with their key stats (goals, assists, steals)
    - For goalkeepers, note saves and goals allowed
    - Highlight any dominant periods or scoring runs
    - Note exclusion differential if significant (discipline vs drawing fouls)
    - Keep the tone professional but engaging
    - The headline should grab attention

    Game Data:
    {{ box_score }}

    {{ ctx.output_format }}
  "#
}

// Water Polo Trigger Detection
// These types represent narrative hooks detected in water polo box score data

class WaterPoloTrigger {
  category TriggerCategory
  description string @description("What was detected that makes this interesting")
  player_name string? @description("Player involved, if trigger is player-specific")
  key_stats map<string, string> @description("The specific statistics that triggered this")
  follow_up_question string @description("A question that would surface narrative context for this trigger")
  salience_score float @description("0-1 confidence score for how interesting/relevant this trigger is")
}

class WaterPoloTriggerList {
  triggers WaterPoloTrigger[] @description("Ranked list of engagement triggers, ordered by salience")
}

// Detect engagement triggers from water polo box score data
function DetectWaterPoloTriggers(box_score: WaterPoloBoxScore) -> WaterPoloTriggerList {
  client CustomSonnet4
  prompt #"
    You are a water polo analyst identifying narrative hooks in box score data. Analyze the game
    and detect statistical patterns that suggest story potential — moments that would make an SID
    think "there's something here worth exploring."

    Your goal is to surface 3-8 high-quality triggers ranked by how interesting they are. Each trigger
    should point to something worth asking follow-up questions about.

    ## Tone Guidelines: Celebrate Positives, Stay Neutral on Negatives

    **Focus on what went RIGHT.** Highlight standout performances, impressive stats, and positive
    contributions. These are the stories players, coaches, and fans want to read about.

    **Never criticize individual players.** A player with multiple exclusions might have been
    guarding the opponent's best scorer, playing aggressively as coached, or dealing with
    questionable officiating. You don't have enough context to attribute blame, so don't.

    **Frame negatives at the team level, if at all.** If the team had 15 exclusions, that's a team
    observation worth exploring — perhaps the opponent was particularly physical, or the referees
    called a tight game.

    ## Domain Knowledge: What Makes Water Polo Stats Notable

    **Scoring performances:**
    - 3 goals (hat trick) is a solid game
    - 4+ goals is a strong performance
    - 5+ goals is exceptional/dominant
    - High shot efficiency (goals/shots > 50%) shows accuracy
    - 2+ goals from a defender or goalkeeper is unusual

    **Playmaking:**
    - 2+ assists is notable in water polo (more goal-centric than basketball)
    - 3+ assists is excellent distribution
    - Goals + assists combined (points) shows overall offensive impact

    **Defensive impact:**
    - 3+ steals shows active, disruptive defense
    - 4+ steals is exceptional
    - Field blocks show shot-blocking ability
    - Drawing exclusions (DEX) creates power play opportunities

    **Goalkeeper performances:**
    - 10+ saves is a strong workload game
    - Save percentage above 60% is solid
    - Shutout period(s) shows dominance
    - Low goals allowed despite high shot volume shows excellence

    **Discipline and physicality:**
    - Playing without exclusions while drawing 2+ shows discipline
    - High DEX (drawn exclusions) creates offensive advantages
    - Sprint wins show speed and conditioning

    **Team patterns:**
    - Balanced scoring (3+ players with 2+ goals)
    - Dominant period (5+ goal differential in one period)
    - Shot efficiency differential
    - Exclusion differential (drawing more than committing)

    ## What to Look For

    Start by identifying clear positives — exceptional individual performances, impressive efficiency,
    or notable team patterns. Look for combinations that suggest a story, like a player scoring
    a hat trick while drawing multiple exclusions, or a goalkeeper keeping the team in a game.

    Focus on triggers that would make you want to know more. A 4-goal game is interesting, but
    becomes more compelling if you know it was against a nationally-ranked opponent or came in
    the player's first start.

    Rank triggers by salience, where higher scores mean more compelling narrative potential.

    ## Game Data

    {{ box_score }}

    {{ ctx.output_format }}
  "#
}

// Test water polo parsing
test parse_waterpolo_boxscore {
  functions [ParseWaterPoloBoxScore]
  args {
    raw_text #"
      Women's Water Polo - January 30, 2026
      CSUN vs Cal Lutheran
      Final Score: CSUN 13, Cal Lutheran 5
      Location: Samuelson Aquatics Center, Thousand Oaks, CA

      Team Score By Period:
                1   2   3   4   TOTAL
      CSUN      2   1   7   3    13
      CLU       1   0   2   2     5

      Team Statistics:
                     CSUN   CLU
      Shots           33    22
      Goals           13     5
      Assists          7     4
      Points          20     9
      Exclusions       9    13
      Steals          13    13
      Sprints        4-0   0-4

      CSUN Player Stats:
      #    Player              SH  G  A  PTS  EX  DEX  STL  FB  Sprint
      1A   Erika Staine         1  0  0    0   0    0    1   0    0-0
      2    Mira Dravucz         2  2  2    4   2    1    0   0    0-0
      3    Marjorie Krueger     1  1  1    2   2    0    0   0    0-0
      4    Sophia Cooper        4  3  1    4   0    0    2   0    0-0
      5    Raygan Carroll       0  0  0    0   0    0    0   0    0-0
      6    Ella Furuholmen      3  0  0    0   0    1    0   0    0-0
      7    Kianna Melvin        5  3  0    3   1    2    1   0    0-0
      TOTALS                   33 13  7   20   9    7   13   1    4-0

      CSUN Goalie Stats:
      #    Goalie          Minutes  GA  Saves
      1A   Erika Staine     32:00    5     6
      TOTALS                          5     6

      CLU Player Stats:
      #    Player              SH  G  A  PTS  EX  DEX  STL  FB  Sprint
      1A   Raquel, Sophie       0  0  0    0   0    0    1   0    0-0
      1    de Souza, Izzy       0  0  0    0   0    0    0   0    0-0
      2    Brandon, Jacqueline  1  0  0    0   3    0    2   0    0-0
      4    Geier, Hudson        4  2  0    2   2    1    2   0    0-0
      TOTALS                   22  5  4    9  13    5   13   0    0-4

      CLU Goalie Stats:
      #    Goalie              Minutes  GA  Saves
      1A   Raquel, Sophie       32:00   13    11
      TOTALS                            13    11
    "#
  }
}

// Test water polo trigger detection
test detect_waterpolo_triggers {
  functions [DetectWaterPoloTriggers]
  args {
    box_score {
      metadata {
        date "2026-01-30"
        venue "Samuelson Aquatics Center, Thousand Oaks, CA"
        home_team "Cal Lutheran"
        away_team "CSUN"
        home_score 5
        away_score 13
        periods 4
        game_type "regular season"
      }
      away_team {
        team_name "CSUN"
        goals 13
        shots 33
        assists 7
        points 20
        exclusions 9
        drawn_exclusions 7
        steals 13
        sprints "4-0"
        players [
          {
            name "Sophia Cooper"
            number "4"
            shots 4
            goals 3
            assists 1
            points 4
            exclusions 0
            drawn_exclusions 0
            steals 2
          }
          {
            name "Kianna Melvin"
            number "7"
            shots 5
            goals 3
            assists 0
            points 3
            exclusions 1
            drawn_exclusions 2
            steals 1
          }
          {
            name "Mira Dravucz"
            number "2"
            shots 2
            goals 2
            assists 2
            points 4
            exclusions 2
            drawn_exclusions 1
            steals 0
          }
        ]
        goalkeepers [
          {
            name "Erika Staine"
            number "1A"
            minutes "32:00"
            goals_allowed 5
            saves 6
          }
        ]
      }
      home_team {
        team_name "Cal Lutheran"
        goals 5
        shots 22
        assists 4
        points 9
        exclusions 13
        drawn_exclusions 5
        steals 13
        sprints "0-4"
        players [
          {
            name "Hudson Geier"
            number "4"
            shots 4
            goals 2
            assists 0
            points 2
            exclusions 2
            drawn_exclusions 1
            steals 2
          }
        ]
        goalkeepers [
          {
            name "Sophie Raquel"
            number "1A"
            minutes "32:00"
            goals_allowed 13
            saves 11
          }
        ]
      }
      period_scores {
        away_scores [2, 1, 7, 3]
        home_scores [1, 0, 2, 2]
      }
    }
  }
}
