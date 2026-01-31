# Box Scoryteller - Social Media & Sports Reporting UI

## Project Overview

Build a modern, sports-focused UI for Box Scoryteller - a tool that transforms basketball box scores into compelling narratives for sports information directors (SIDs), social media managers, and sports reporters.

The backend API is complete and returns rich data structures. Your job is to create a beautiful, functional frontend that feels like a professional sports media tool rather than a technical demo.

---

## Target Users

1. **Sports Information Directors (SIDs)** - University/college staff who write game recaps, manage social media, and handle media relations
2. **Social Media Managers** - Need quick, shareable content from game results
3. **Sports Reporters** - Looking for story angles and key statistics
4. **Athletic Department Staff** - Want to highlight student-athlete achievements

---

## Design Direction

### Visual Inspiration
- ESPN app game cards and recap pages
- The Athletic's clean, editorial design
- Twitter/X sports accounts (SportsCenter, team accounts)
- Modern sports betting apps (for data visualization)

### Design Principles
- **Bold typography** for headlines and scores
- **Team colors** as accent colors (configurable)
- **Card-based layouts** for game summaries
- **Dark mode support** (sports media is often consumed at night)
- **Mobile-first** (SIDs often work from games/press boxes on phones)

### Color Palette Suggestion
- Primary: Deep navy (#1a1a2e) or rich black (#0f0f0f)
- Accent: Vibrant orange (#ff6b35) or electric blue (#00d4ff)
- Success/wins: Green (#22c55e)
- Losses: Muted red (#ef4444)
- Background: Near-black (#121212) or warm gray (#1f1f1f)

---

## Core Data Structures

### Game/BoxScore
```typescript
interface BoxScore {
  metadata: {
    date: string;          // "2024-01-15"
    venue: string;
    home_team: string;     // "College of Marin"
    away_team: string;     // "Santa Rosa JC"
    home_score: number;    // 78
    away_score: number;    // 72
    is_overtime: boolean;
    periods: number;
    game_type: string;     // "conference" | "regular season" | "tournament"
  };
  home_team: TeamStats;
  away_team: TeamStats;
}

interface TeamStats {
  total_points: number;
  field_goals_made: number;
  field_goals_attempted: number;
  field_goal_percentage: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  three_point_percentage: number;
  free_throws_made: number;
  free_throws_attempted: number;
  free_throw_percentage: number;
  total_rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  players: PlayerStats[];
}

interface PlayerStats {
  name: string;
  position: string;
  is_starter: boolean;
  minutes_played: number;
  points: number;
  field_goals_made: number;
  field_goals_attempted: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  total_rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls: number;
}
```

### Story Signals (Priority Scoring)
```typescript
interface StorySignals {
  is_close_game: boolean;      // Margin <= 5 points
  is_overtime: boolean;
  has_standout_performance: boolean;
  is_conference_game: boolean;
  margin: number;
  standout_count: number;
  priority_score: number;      // 0-10+ weighted sum
  signal_reasons: string[];    // ["Close game (3-point margin)", "OT thriller"]
  tier: 'high' | 'medium' | 'low';
}
```

### Narrative Triggers
```typescript
interface Trigger {
  category: 'STATISTICAL_EXTREME' | 'CLUTCH_MOMENT' | 'UNEXPECTED_PERFORMANCE' | 'ANOMALY' | 'TREND';
  description: string;         // "Career-high 32 points on 12-15 shooting"
  player_name?: string;        // "Marcus Johnson"
  key_stats: Record<string, string>;  // { points: "32", fg_pct: "80%" }
  follow_up_question: string;  // "Is this a career high?"
  salience_score: number;      // 0-1 confidence
}
```

### Game Recap
```typescript
interface GameRecap {
  headline: string;            // "Johnson's Career Night Powers Mariners Past Rivals"
  subheadline: string;         // "Senior guard drops 32 in conference showdown"
  lead_paragraph: string;      // 2-3 sentence hook
  body_paragraphs: string[];   // Full game narrative
  key_stats: string[];         // ["32 points on 80% shooting", "15-2 run in 4th"]
  player_of_the_game: string;  // "Marcus Johnson - 32 pts, 8 ast, 0 TO"
}
```

---

## Page Designs

### 1. Dashboard / Game Feed

**Purpose**: At-a-glance view of all games, sorted by story priority.

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  BOX SCORYTELLER                              [Settings] [Dark]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  TONIGHT'S GAMES                           Filter: [All Sports]│
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ 🔥 HIGH PRIORITY                                         │  │
│  │                                                          │  │
│  │ ┌──────────────────────────────────────────────────────┐│  │
│  │ │ FINAL • OT                              Conference   ││  │
│  │ │                                                       ││  │
│  │ │   MARIN           78                                  ││  │
│  │ │   Santa Rosa      72                                  ││  │
│  │ │                                                       ││  │
│  │ │ ⚡ Close game • Overtime • Standout performance      ││  │
│  │ │                                                       ││  │
│  │ │ [View Recap]  [Story Angles]  [Social Post]          ││  │
│  │ └──────────────────────────────────────────────────────┘│  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ MEDIUM PRIORITY (2 games)                               │  │
│  │ [Collapsed game cards...]                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Large, bold scores with team names
- Priority tier badges with color coding (red/orange/gray)
- Signal tags showing why a game is newsworthy
- Quick action buttons for common workflows
- Collapsible sections for lower-priority games

---

### 2. Game Detail / Recap View

**Purpose**: Full game analysis with narrative, stats, and social content options.

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to Games                                               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              FINAL • OVERTIME • CONFERENCE               │ │
│  │                                                          │ │
│  │     COLLEGE OF MARIN                                     │ │
│  │            78                                            │ │
│  │                                                          │ │
│  │     SANTA ROSA JC                                        │ │
│  │            72                                            │ │
│  │                                                          │ │
│  │     January 15, 2024 • Marin Athletic Center             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐│
│  │ 🏆 PLAYER OF GAME   │  │ 📊 KEY STATS                     ││
│  │                     │  │                                  ││
│  │ Marcus Johnson      │  │ • 32 pts on 80% shooting         ││
│  │ 32 pts • 8 ast • 0 TO│  │ • 15-2 run in 4th quarter       ││
│  │                     │  │ • Team shot 52% from field       ││
│  │ [View Full Stats]   │  │ • Outrebounded opponent 42-35    ││
│  └─────────────────────┘  └──────────────────────────────────┘│
│                                                                │
│  ═══════════════════════════════════════════════════════════  │
│                                                                │
│  GAME RECAP                                                    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Johnson's Career Night Powers Mariners Past Rivals       │ │
│  │ Senior guard drops 32 in overtime conference showdown    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Marcus Johnson delivered the performance of his career...    │
│  [Full narrative text...]                                      │
│                                                                │
│  ═══════════════════════════════════════════════════════════  │
│                                                                │
│  STORY ANGLES                                 [Generate More]  │
│                                                                │
│  ┌────────────────────┐ ┌────────────────────┐                │
│  │ 🎯 Lead Story      │ │ 📱 Social Angle    │                │
│  │                    │ │                    │                │
│  │ "Senior Moment"    │ │ "Comeback Kids"    │                │
│  │ Johnson's 32-pt    │ │ Down 12, Marin     │                │
│  │ masterclass in     │ │ rallied with a     │                │
│  │ rivalry game...    │ │ 15-2 4th quarter   │                │
│  │                    │ │ run...             │                │
│  │ [Use This Angle]   │ │ [Use This Angle]   │                │
│  └────────────────────┘ └────────────────────┘                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Hero scoreboard with game context
- Prominent Player of the Game card with photo placeholder
- Key Stats as scannable bullet points
- Full narrative with professional headline/subheadline
- Story angle cards that can be selected/used

---

### 3. Social Media Composer

**Purpose**: Generate and preview social posts from game data.

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Create Social Post                            [X Close]       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Template:  [Twitter/X ▼]  [Instagram ▼]  [Facebook ▼]        │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  🏀 MARINERS WIN! 🏀                                    │ │
│  │                                                          │ │
│  │  Marcus Johnson dropped a career-high 32 points as       │ │
│  │  @marinbasketball outlasted Santa Rosa 78-72 in OT!      │ │
│  │                                                          │ │
│  │  🔥 32 PTS | 8 AST | 0 TO                               │ │
│  │  📊 80% FG | Career High                                │ │
│  │                                                          │ │
│  │  #MarinerPride #CCCAA #CaliforniaHoops                   │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Character count: 247/280                                      │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Quick Insert:                                           │  │
│  │ [Final Score] [Player Stats] [Key Stat] [Hashtags]      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  [Copy to Clipboard]  [Download as Image]  [Schedule Post]    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Platform selector with character limits
- Live preview with emoji support
- Quick-insert buttons for common elements
- Copy/download/schedule actions
- Optional: Image generator for graphic posts

---

### 4. Trigger Explorer / Story Finder

**Purpose**: Browse detected story hooks and follow-up questions.

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Story Triggers                            Game: [Marin vs SR]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Filter: [All] [Statistical] [Clutch] [Unexpected] [Trend]    │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ 🎯 STATISTICAL EXTREME                    Salience: 95%  │ │
│  │                                                          │ │
│  │ Marcus Johnson scored 32 points on 12-15 shooting        │ │
│  │ (80% FG), his highest-scoring game of the season.        │ │
│  │                                                          │ │
│  │ 📊 points: 32 | fg_pct: 80% | fg: 12-15                  │ │
│  │                                                          │ │
│  │ 💬 Follow-up: "Is this a career high? What was his       │ │
│  │    previous best?"                                       │ │
│  │                                                          │ │
│  │ [Build Story Around This] [Add to Post]                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ⚡ CLUTCH MOMENT                          Salience: 88%  │ │
│  │                                                          │ │
│  │ Marin went on a 15-2 run in the final 4 minutes of       │ │
│  │ regulation to force overtime after trailing by 12.       │ │
│  │                                                          │ │
│  │ 💬 Follow-up: "What adjustment did the team make?        │ │
│  │    Who sparked the run?"                                 │ │
│  │                                                          │ │
│  │ [Build Story Around This] [Add to Post]                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Category filter tabs
- Salience score as visual indicator (progress bar or percentage)
- Follow-up questions prominently displayed
- Action buttons to use triggers in content

---

### 5. Box Score / Stats View

**Purpose**: Traditional box score display with modern styling.

**Layout**:
```
┌────────────────────────────────────────────────────────────────┐
│  Box Score                                                     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  [Team Stats]  [Player Stats]  [Play-by-Play]                 │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ COLLEGE OF MARIN                                    78   │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │ Starters                                                 │ │
│  │ ────────────────────────────────────────────────────────│ │
│  │ Player          MIN  PTS  REB  AST  STL  BLK  TO   FG   │ │
│  │ ────────────────────────────────────────────────────────│ │
│  │ M. Johnson (G)   38   32    4    8    2    0   0  12-15 │ │
│  │ T. Williams (F)  35   18    9    3    1    2   2   7-12 │ │
│  │ ...                                                      │ │
│  │ ────────────────────────────────────────────────────────│ │
│  │ Bench                                                    │ │
│  │ ────────────────────────────────────────────────────────│ │
│  │ ...                                                      │ │
│  │ ────────────────────────────────────────────────────────│ │
│  │ TEAM TOTALS      200  78   42   18    7    4   9  28-54 │ │
│  │                              FG: 51.9% | 3P: 38.5%       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- Clean, data-dense table layout
- Highlight standout performances (bold, color)
- Team totals with shooting percentages
- Sortable columns
- Responsive: scrollable on mobile

---

## Component Library

### Game Card (Compact)
Used in dashboard/feed. Shows score, priority badge, signal tags.

### Game Card (Expanded)
Shows score + key stats + POTG + quick actions.

### Score Display
Large, bold team names and scores with win/loss styling.

### Priority Badge
Colored pill showing HIGH/MEDIUM/LOW with icon.

### Signal Tag
Small chip showing reason (e.g., "Close game", "OT", "Career high").

### Stat Grid
2-column layout for key stats with icons.

### Player Card
Photo placeholder + name + key stats.

### Trigger Card
Category badge + description + follow-up question + salience meter.

### Narrative Block
Headline + subheadline + body text with editorial styling.

### Social Preview
Platform-specific preview with character count.

---

## Interactions & Animations

1. **Card Expansion**: Smooth height animation when expanding game cards
2. **Loading States**: Skeleton loaders for LLM-generated content
3. **Progress Indicators**: Show recap generation phases (Validating → Generating → Parsing → Complete)
4. **Copy Feedback**: Toast notification when copying to clipboard
5. **Priority Sorting**: Animate reordering when filters change
6. **Hover States**: Subtle lift effect on interactive cards

---

## API Endpoints (Backend Ready)

```
GET  /api/data              → All games with box scores and triggers
POST /api/recap             → Submit recap generation job
GET  /api/jobs/[jobId]      → Poll job status and get results
```

### Example: Fetch all games
```javascript
const response = await fetch('/api/data');
const { games, stats } = await response.json();
// games: array of Game objects with boxScore and triggers
// stats: { totalGames, parsedGames, gamesWithTriggers, sports }
```

### Example: Generate recap
```javascript
// Submit job
const response = await fetch('/api/recap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ boxScore })
});
const { jobId } = await response.json();

// Poll for result
const result = await fetch(`/api/jobs/${jobId}`);
const { status, phase, recap } = await result.json();
// status: 'pending' | 'processing' | 'completed' | 'failed'
// phase: 'queued' | 'validating' | 'calling_llm' | 'parsing_response' | 'complete'
// recap: GameRecap object when complete
```

---

## Mobile Considerations

- **Touch targets**: Minimum 44px for buttons and interactive elements
- **Swipe actions**: Swipe left on game card for quick actions
- **Bottom sheet**: Full recap view slides up from bottom on mobile
- **Sticky header**: Score stays visible when scrolling through recap
- **Pull to refresh**: Reload game data on pull-down

---

## Accessibility

- **Color contrast**: Meet WCAG AA standards
- **Screen reader**: Semantic HTML with ARIA labels
- **Keyboard navigation**: Full keyboard support for all interactions
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Focus indicators**: Visible focus states on all interactive elements

---

## Implementation Notes

1. **Start with the Dashboard**: Build the game feed with priority sorting first
2. **Add Game Detail**: Expand cards to show full recap and stats
3. **Build Social Composer**: Add post generation as a modal
4. **Polish**: Add loading states, animations, dark mode
5. **Optimize**: Lazy load lower-priority games, cache API responses

The backend handles all the heavy LLM work. Focus on creating a fast, beautiful UI that surfaces the data effectively for sports media professionals.

---

## Sample Data for Testing

The system includes real game data from College of Marin basketball (2023-24 season). Games include:
- Conference matchups with close finishes
- Overtime thrillers
- Individual standout performances (30+ point games)
- Team statistical anomalies

Use the `/api/data` endpoint to fetch real examples for development.
