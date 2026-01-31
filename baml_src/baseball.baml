// Baseball Box Score Types
// These types represent the structured data extracted from raw baseball box score text/HTML

class BaseballBatterStats {
  name string
  position string?
  at_bats int
  runs int
  hits int
  rbi int
  walks int
  strikeouts int
  left_on_base int?
  batting_average float?
  doubles int?
  triples int?
  home_runs int?
  stolen_bases int?
  hit_by_pitch int?
  sacrifice_flies int?
  sacrifice_bunts int?
}

class BaseballPitcherStats {
  name string
  innings_pitched float @description("Innings pitched, e.g. 5.1 means 5 and 1/3 innings")
  hits_allowed int
  runs_allowed int
  earned_runs int
  walks int
  strikeouts int
  home_runs_allowed int?
  pitches int?
  strikes int?
  batters_faced int?
  decision string? @description("W, L, S, H, or null if no decision")
  record string? @description("Pitcher's season record after this game, e.g. '3-1'")
  era float?
}

class BaseballTeamStats {
  team_name string
  runs int
  hits int
  errors int
  left_on_base int?
  batters BaseballBatterStats[]
  pitchers BaseballPitcherStats[]
  doubles int?
  triples int?
  home_runs int?
  stolen_bases int?
  caught_stealing int?
  double_plays int?
  team_batting_average float?
}

class BaseballGameMetadata {
  date string?
  venue string?
  home_team string
  away_team string
  home_score int
  away_score int
  innings int @description("Total innings played, typically 9 but can be more for extras or less for mercy rule")
  attendance int?
  duration string? @description("Game duration, e.g. '2:30'")
  game_type string? @description("Regular season, conference, tournament, doubleheader game 1/2, etc.")
  weather string?
  umpires string[]?
}

class BaseballBoxScore {
  metadata BaseballGameMetadata
  home_team BaseballTeamStats
  away_team BaseballTeamStats
  inning_scores int[][]? @description("[team_index][inning] scores - team 0 is away, team 1 is home")
}

// Parse raw baseball box score HTML/text into structured data
function ParseBaseballBoxScore(raw_text: string) -> BaseballBoxScore {
  client CustomSonnet4
  prompt #"
    Parse the following baseball box score into structured data. Extract all batter statistics,
    pitcher statistics, team totals, and game metadata.

    Important guidelines:
    - If a statistic is not provided, use 0 for numeric fields
    - For innings pitched, convert to decimal: 5.1 means 5 and 1/3, 5.2 means 5 and 2/3
    - Identify decisions (W, L, S for save, H for hold) from pitcher records if indicated
    - Parse pitcher records like "(W, 3-1)" to extract decision and season record
    - Parse any date, venue, attendance, duration, or game type information if present
    - Handle common abbreviations: AB, R, H, RBI, BB, SO/K, LOB, IP, ER, HR, 2B, 3B, SB, CS
    - The inning_scores array should have away team at index 0, home team at index 1

    Box Score Text/HTML:
    {{ raw_text }}

    {{ ctx.output_format }}
  "#
}

class BaseballGameRecap {
  headline string @description("Compelling headline, under 80 characters")
  subheadline string @description("Supporting detail, under 120 characters")
  lead_paragraph string @description("Opening paragraph with key story angle, 2-3 sentences")
  body_paragraphs string[] @description("Main content paragraphs covering game flow and standout performances")
  key_stats string[] @description("3-5 notable statistics to highlight")
  player_of_the_game string @description("Name and brief justification")
}

// Generate a game recap from parsed baseball box score data
function GenerateBaseballRecap(box_score: BaseballBoxScore) -> BaseballGameRecap {
  client CustomSonnet4
  prompt #"
    Generate an engaging game recap from this baseball box score data. Write in the style of a
    sports information director creating content for the team website.

    Guidelines:
    - Lead with the most compelling narrative (pitching gem, offensive explosion, comeback, etc.)
    - Use active voice and vivid language
    - Include specific statistics that support the narrative
    - Mention standout performers by name with their key stats
    - For pitchers, note innings pitched, strikeouts, and runs allowed
    - For hitters, note hits, RBIs, and any extra-base hits or key moments
    - Keep the tone professional but engaging
    - The headline should grab attention

    Game Data:
    {{ box_score }}

    {{ ctx.output_format }}
  "#
}

// Baseball Trigger Detection
// These types represent narrative hooks detected in baseball box score data

class BaseballTrigger {
  category TriggerCategory
  description string @description("What was detected that makes this interesting")
  player_name string? @description("Player involved, if trigger is player-specific")
  key_stats map<string, string> @description("The specific statistics that triggered this")
  follow_up_question string @description("A question that would surface narrative context for this trigger")
  salience_score float @description("0-1 confidence score for how interesting/relevant this trigger is")
}

class BaseballTriggerList {
  triggers BaseballTrigger[] @description("Ranked list of engagement triggers, ordered by salience")
}

// Detect engagement triggers from baseball box score data
function DetectBaseballTriggers(box_score: BaseballBoxScore) -> BaseballTriggerList {
  client CustomSonnet4
  prompt #"
    You are a baseball analyst identifying narrative hooks in box score data. Analyze the game
    and detect statistical patterns that suggest story potential — moments that would make an SID
    think "there's something here worth exploring."

    Your goal is to surface 3-8 high-quality triggers ranked by how interesting they are. Each trigger
    should point to something worth asking follow-up questions about.

    ## Tone Guidelines: Celebrate Positives, Stay Neutral on Negatives

    **Focus on what went RIGHT.** Highlight standout performances, impressive stats, and positive
    contributions. These are the stories players, coaches, and fans want to read about.

    **Never criticize individual players.** A pitcher who gave up runs might have been facing a hot
    lineup, pitching through fatigue, or dealing with bad luck on batted balls. You don't have enough
    context to attribute blame, so don't.

    **Frame negatives at the team level, if at all.** If the team struck out 15 times, that's a team
    observation worth exploring — perhaps the opponent had exceptional pitching, or conditions were
    difficult.

    ## Domain Knowledge: What Makes Baseball Stats Notable

    **Pitching dominance:**
    - Complete game or 7+ innings is a workhorse performance
    - 10+ strikeouts is exceptional
    - Shutout or 1-run game over 6+ innings is excellent
    - Quality start: 6+ IP with 3 or fewer earned runs
    - Low pitch count efficiency (under 15 pitches per inning)

    **Batting performances:**
    - 3+ hits in a game is a multi-hit game
    - 4+ hits is exceptional
    - 3+ RBIs is a big offensive day
    - Home run is always notable, multi-HR game is rare
    - Extra-base hits (doubles, triples) show power
    - Perfect day at the plate (3+ AB, no outs)

    **Key situations:**
    - Clutch hitting with runners in scoring position
    - Going the other way or hitting to all fields
    - Successful sacrifice situations
    - Stolen bases, especially multiple

    **Team patterns:**
    - Big inning (4+ runs in a single inning)
    - Balanced attack (multiple players with multi-hit games)
    - Strong defense (double plays, no errors)
    - Bullpen performance in high-leverage situations

    ## Game Data

    {{ box_score }}

    {{ ctx.output_format }}
  "#
}

// Test baseball parsing
test parse_baseball_boxscore {
  functions [ParseBaseballBoxScore]
  args {
    raw_text #"
      Baseball - January 30, 2026
      Santa Rosa at Marin
      Final Score: Santa Rosa 9, Marin 0
      Location: Kentfield
      Duration: 2:30

      Line Score:
               1  2  3  4  5  6  7  8  9   R  H  E
      Santa Rosa  0  0  0  0  0  4  3  1  1   9 12  1
      Marin       0  0  0  0  0  0  0  0  0   0  2  1

      Santa Rosa Batting:
      Cooper Wood cf - 5 AB, 1 R, 2 H, 0 RBI, 0 BB, 1 SO
      Trevor Schlafer 2b - 5 AB, 2 R, 2 H, 1 RBI, 0 BB, 0 SO
      Brett Neidlinger ss - 4 AB, 2 R, 1 H, 1 RBI, 0 BB, 0 SO
      Jaden Woods dh - 4 AB, 1 R, 0 H, 0 RBI, 1 BB, 0 SO
      Devon Toney lf - 4 AB, 1 R, 1 H, 1 RBI, 0 BB, 0 SO
      Vero Poueu 1b - 5 AB, 0 R, 2 H, 1 RBI, 0 BB, 3 SO
      Team Totals: 39 AB, 9 R, 12 H, 7 RBI, 3 BB, 5 SO

      Marin Batting:
      Adrian Ruiz cf - 4 AB, 0 R, 0 H, 0 RBI, 0 BB, 2 SO
      Patrick Kozielec dh - 3 AB, 0 R, 1 H, 0 RBI, 1 BB, 1 SO
      Gilbert Roth c - 4 AB, 0 R, 0 H, 0 RBI, 0 BB, 2 SO
      Aiden Romero 3b - 4 AB, 0 R, 1 H, 0 RBI, 0 BB, 2 SO
      Team Totals: 29 AB, 0 R, 2 H, 0 RBI, 1 BB, 12 SO, 4 LOB

      Santa Rosa Pitching:
      Wyatt Abramson - 3.0 IP, 1 H, 0 R, 0 ER, 0 BB, 4 SO
      Myles Standish (W, 1-0) - 5.0 IP, 1 H, 0 R, 0 ER, 1 BB, 6 SO
      Blake Bryson - 1.0 IP, 0 H, 0 R, 0 ER, 0 BB, 2 SO

      Marin Pitching:
      Anthony Del Prete (L, 0-1) - 5.1 IP, 4 H, 4 R, 3 ER, 2 BB, 3 SO
      Eli Fogelman - 0.1 IP, 2 H, 0 R, 0 ER, 0 BB, 0 SO
      Blake Tipper - 0.1 IP, 0 H, 0 R, 0 ER, 1 BB, 0 SO
      James Dole - 2.0 IP, 6 H, 4 R, 4 ER, 0 BB, 1 SO
      Tyler Hankerson - 1.0 IP, 2 H, 1 R, 1 ER, 0 BB, 1 SO
    "#
  }
}

// Test baseball trigger detection
test detect_baseball_triggers {
  functions [DetectBaseballTriggers]
  args {
    box_score {
      metadata {
        date "2026-01-30"
        venue "Kentfield"
        home_team "Marin"
        away_team "Santa Rosa"
        home_score 0
        away_score 9
        innings 9
        duration "2:30"
        game_type "regular season"
      }
      away_team {
        team_name "Santa Rosa"
        runs 9
        hits 12
        errors 1
        batters [
          {
            name "Cooper Wood"
            position "cf"
            at_bats 5
            runs 1
            hits 2
            rbi 0
            walks 0
            strikeouts 1
          }
          {
            name "Trevor Schlafer"
            position "2b"
            at_bats 5
            runs 2
            hits 2
            rbi 1
            walks 0
            strikeouts 0
          }
        ]
        pitchers [
          {
            name "Wyatt Abramson"
            innings_pitched 3.0
            hits_allowed 1
            runs_allowed 0
            earned_runs 0
            walks 0
            strikeouts 4
          }
          {
            name "Myles Standish"
            innings_pitched 5.0
            hits_allowed 1
            runs_allowed 0
            earned_runs 0
            walks 1
            strikeouts 6
            decision "W"
            record "1-0"
          }
        ]
      }
      home_team {
        team_name "Marin"
        runs 0
        hits 2
        errors 1
        batters [
          {
            name "Patrick Kozielec"
            position "dh"
            at_bats 3
            runs 0
            hits 1
            rbi 0
            walks 1
            strikeouts 1
          }
          {
            name "Aiden Romero"
            position "3b"
            at_bats 4
            runs 0
            hits 1
            rbi 0
            walks 0
            strikeouts 2
          }
        ]
        pitchers [
          {
            name "Anthony Del Prete"
            innings_pitched 5.1
            hits_allowed 4
            runs_allowed 4
            earned_runs 3
            walks 2
            strikeouts 3
            decision "L"
            record "0-1"
          }
        ]
      }
      inning_scores [[0,0,0,0,0,4,3,1,1], [0,0,0,0,0,0,0,0,0]]
    }
  }
}
