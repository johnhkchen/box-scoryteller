<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { computeStorySignals, BASKETBALL_PRESETS, PRIORITY_WEIGHTS, type BasketballPresetLevel } from '$lib/story-signals';
  import { generateRecap, type JobResponse } from '$lib/job-client';

  interface Game {
    id: number;
    filePath: string;
    contentHash: string;
    sport: string | null;
    gameDate: string | null;
    importedAt: string;
    parsed: boolean;
    boxScore: any;
    triggers: any[];
  }

  interface Stats {
    totalGames: number;
    parsedGames: number;
    gamesWithTriggers: number;
    sports: string[];
  }

  interface GameRecap {
    headline: string;
    subheadline: string;
    lead_paragraph: string;
    body_paragraphs: string[];
    key_stats: string[];
    player_of_the_game: string;
  }

  interface JobState {
    status: string;
    phase: string;
    message: string;
  }

  let games: Game[] = [];
  let stats: Stats = { totalGames: 0, parsedGames: 0, gamesWithTriggers: 0, sports: [] };
  let loading = true;
  let selectedDemo: 'pipeline' | 'signals' | 'triggers' | 'cache' = 'pipeline';
  let expandedGameId: number | null = null;
  let recaps: Map<number, GameRecap> = new Map();
  let jobStates: Map<number, JobState> = new Map();
  let generatingRecap: Set<number> = new Set();
  let selectedLevel: BasketballPresetLevel = 'college';
  let selectedTriggerGameId: number | null = null;

  // Labels for competition level dropdown
  const levelLabels: Record<BasketballPresetLevel, string> = {
    pro: 'Pro (NBA/WNBA)',
    college: 'College (NCAA D1)',
    highSchool: 'High School',
    youth: 'Youth/Rec'
  };

  // Get current thresholds based on selected level
  $: currentThresholds = BASKETBALL_PRESETS[selectedLevel];

  onMount(async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      games = data.games;
      stats = data.stats;

      // Default to first game with triggers
      const firstGameWithTriggers = games.find(g => g.parsed && g.triggers && g.triggers.length > 0);
      selectedTriggerGameId = firstGameWithTriggers?.id || null;
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      loading = false;
    }
  });

  // Compute story signals for top games using selected level
  $: topGames = games
    .filter(g => g.parsed && g.boxScore)
    .map(g => ({
      game: g,
      signals: computeStorySignals(g.boxScore, selectedLevel)
    }))
    .sort((a, b) => b.signals.priority_score - a.signals.priority_score)
    .slice(0, 5);

  // Pipeline stats
  $: pipelineStats = {
    raw: stats.totalGames,
    parsed: stats.parsedGames,
    triggers: stats.gamesWithTriggers,
    parseRate: stats.totalGames > 0 ? (stats.parsedGames / stats.totalGames * 100).toFixed(1) : '0',
    triggerRate: stats.parsedGames > 0 ? (stats.gamesWithTriggers / stats.parsedGames * 100).toFixed(1) : '0'
  };

  // Games with triggers for the dropdown
  $: gamesWithTriggers = games.filter(g => g.parsed && g.triggers && g.triggers.length > 0);

  // Currently selected game for trigger display
  $: selectedTriggerGame = gamesWithTriggers.find(g => g.id === selectedTriggerGameId) || null;

  // Trigger category breakdown
  $: triggerBreakdown = games
    .filter(g => g.triggers)
    .flatMap(g => g.triggers)
    .reduce((acc, trigger) => {
      acc[trigger.category] = (acc[trigger.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Navigate to triggers tab with a specific game selected
  function viewTriggersForGame(gameId: number) {
    selectedTriggerGameId = gameId;
    selectedDemo = 'triggers';
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatScore(boxScore: any): string {
    if (!boxScore?.metadata) return 'N/A';
    const { home_team, away_team, home_score, away_score } = boxScore.metadata;
    return `${home_team} ${home_score}, ${away_team} ${away_score}`;
  }

  async function toggleGameExpansion(gameId: number, boxScore: any) {
    if (expandedGameId === gameId) {
      expandedGameId = null;
      return;
    }

    expandedGameId = gameId;

    // If we don't have a recap yet, generate it
    if (!recaps.has(gameId) && !generatingRecap.has(gameId)) {
      generatingRecap = new Set([...generatingRecap, gameId]);

      // Set initial job state
      jobStates = new Map([...jobStates, [gameId, {
        status: 'pending',
        phase: 'queued',
        message: 'Starting...'
      }]]);

      try {
        const result = await generateRecap<GameRecap>(boxScore, {
          interval: 1000,
          timeout: 120000,
          onStatusChange: (job: JobResponse) => {
            // Update job state for display
            jobStates = new Map([...jobStates, [gameId, {
              status: job.status,
              phase: job.phase,
              message: job.phaseMessage
            }]]);
          }
        });

        recaps = new Map([...recaps, [gameId, result.recap]]);
      } catch (error) {
        console.error('Failed to generate recap:', error);
        jobStates = new Map([...jobStates, [gameId, {
          status: 'failed',
          phase: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }]]);
      } finally {
        generatingRecap = new Set([...generatingRecap].filter(id => id !== gameId));
      }
    }
  }
</script>

<main>
  <header>
    <h1>Box Scoryteller</h1>
    <p class="tagline">An interviewer-publicist tool that helps sports information directors surface narratives from box score data</p>
  </header>

  {#if loading}
    <div class="loading">Loading system data...</div>
  {:else}
    <!-- System Overview -->
    <section class="overview">
      <h2>System Overview</h2>
      <p>Box Scoryteller implements a multi-stage pipeline that transforms raw box scores into prioritized narrative opportunities. The system combines rule-based analysis with LLM-powered narrative detection to help SIDs identify which games deserve deeper coverage.</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{stats.totalGames}</div>
          <div class="stat-label">Raw Box Scores</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{stats.parsedGames}</div>
          <div class="stat-label">Parsed Games</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{stats.gamesWithTriggers}</div>
          <div class="stat-label">With Triggers</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{stats.sports.join(', ') || 'None'}</div>
          <div class="stat-label">Sports</div>
        </div>
      </div>
    </section>

    <!-- Demo Tabs -->
    <section class="demos">
      <h2>Pipeline Components</h2>
      <div class="tab-nav">
        <button class:active={selectedDemo === 'pipeline'} on:click={() => selectedDemo = 'pipeline'}>
          Data Pipeline
        </button>
        <button class:active={selectedDemo === 'signals'} on:click={() => selectedDemo = 'signals'}>
          Story Signals
        </button>
        <button class:active={selectedDemo === 'triggers'} on:click={() => selectedDemo = 'triggers'}>
          Narrative Triggers
        </button>
        <button class:active={selectedDemo === 'cache'} on:click={() => selectedDemo = 'cache'}>
          Cache System
        </button>
      </div>

      <div class="tab-content">
        {#if selectedDemo === 'pipeline'}
          <div class="demo-section">
            <h3>Data Pipeline Architecture</h3>
            <p>The system processes box scores through five stages, with SQLite caching to avoid redundant LLM calls. Each stage transforms the data and adds value for SIDs.</p>

            <div class="pipeline-flow">
              <div class="pipeline-stage">
                <div class="stage-number">1</div>
                <div class="stage-content">
                  <strong>Raw Collection</strong>
                  <p>Fetch HTML box scores from athletics.marin.edu</p>
                  <div class="metric">{pipelineStats.raw} files</div>
                </div>
              </div>
              <div class="pipeline-arrow">→</div>
              <div class="pipeline-stage">
                <div class="stage-number">2</div>
                <div class="stage-content">
                  <strong>Parsing (LLM)</strong>
                  <p>Convert raw text to structured BoxScore using Claude</p>
                  <div class="metric">{pipelineStats.parsed} parsed ({pipelineStats.parseRate}%)</div>
                </div>
              </div>
              <div class="pipeline-arrow">→</div>
              <div class="pipeline-stage">
                <div class="stage-number">3</div>
                <div class="stage-content">
                  <strong>Validation</strong>
                  <p>Check data consistency and normalize percentages</p>
                  <div class="metric">Auto-validated</div>
                </div>
              </div>
              <div class="pipeline-arrow">→</div>
              <div class="pipeline-stage">
                <div class="stage-number">4</div>
                <div class="stage-content">
                  <strong>Story Signals</strong>
                  <p>Rule-based prioritization (no LLM calls)</p>
                  <div class="metric">Instant scoring</div>
                </div>
              </div>
              <div class="pipeline-arrow">→</div>
              <div class="pipeline-stage">
                <div class="stage-number">5</div>
                <div class="stage-content">
                  <strong>Trigger Detection (LLM)</strong>
                  <p>Identify narrative hooks and follow-up questions</p>
                  <div class="metric">{pipelineStats.triggers} analyzed ({pipelineStats.triggerRate}%)</div>
                </div>
              </div>
            </div>

            <div class="code-block">
              <strong>CLI Usage:</strong>
              <pre>
# Fetch raw box scores
npx tsx tools/fetch-boxscores.ts --sport wbkb --season 2023-24

# Parse and detect triggers (with caching)
npx tsx tools/process-boxscores.ts --all

# Analyze story signals
npx tsx tools/analyze-story-signals.ts</pre>
            </div>
          </div>
        {/if}

        {#if selectedDemo === 'signals'}
          <div class="demo-section">
            <h3>Story Signals: Rule-Based Prioritization</h3>
            <p>Story signals use deterministic rules to compute a priority score for each game. This runs instantly without LLM calls, making it suitable for real-time triage of dozens of games.</p>

            <div class="level-selector">
              <label for="competition-level">Competition Level:</label>
              <select id="competition-level" bind:value={selectedLevel}>
                {#each Object.entries(levelLabels) as [level, label]}
                  <option value={level}>{label}</option>
                {/each}
              </select>
            </div>

            <div class="signals-config">
              <div class="config-section">
                <h4>Standout Thresholds ({levelLabels[selectedLevel]})</h4>
                <ul>
                  <li>Close game: ≤{currentThresholds.closeGameMargin} point margin</li>
                  <li>Standout points: ≥{currentThresholds.standoutPoints} points</li>
                  <li>Standout rebounds: ≥{currentThresholds.standoutRebounds} rebounds</li>
                  <li>Standout assists: ≥{currentThresholds.standoutAssists} assists</li>
                </ul>
              </div>
              <div class="config-section">
                <h4>Priority Weights</h4>
                <ul>
                  <li>Close game: +{PRIORITY_WEIGHTS.closeGame} points</li>
                  <li>Overtime: +{PRIORITY_WEIGHTS.overtime} points</li>
                  <li>Standout performance: +{PRIORITY_WEIGHTS.standoutPerformance} points</li>
                  <li>Conference game: +{PRIORITY_WEIGHTS.conferenceGame} point</li>
                </ul>
              </div>
            </div>

            <h4>Top Priority Games</h4>
            {#if topGames.length > 0}
              <div class="games-list">
                {#each topGames as { game, signals }}
                  <div class="game-card" class:expanded={expandedGameId === game.id}>
                    <button
                      class="game-card-header"
                      on:click={() => toggleGameExpansion(game.id, game.boxScore)}
                    >
                      <div class="game-header-content">
                        <div class="game-header">
                          <span class="priority-badge" class:high={signals.priority_score >= 5}>
                            Score: {signals.priority_score}
                          </span>
                          <span class="game-date">{formatDate(game.gameDate)}</span>
                        </div>
                        <div class="game-score">{formatScore(game.boxScore)}</div>
                        <div class="signal-reasons">
                          {#each signals.signal_reasons as reason}
                            <span class="signal-tag">{reason}</span>
                          {/each}
                        </div>
                      </div>
                      <div class="expand-icon">
                        {expandedGameId === game.id ? '−' : '+'}
                      </div>
                    </button>

                    {#if expandedGameId === game.id}
                      <div class="game-details">
                        {#if generatingRecap.has(game.id)}
                          {@const jobState = jobStates.get(game.id)}
                          <div class="recap-loading">
                            <div class="spinner"></div>
                            <p class="job-status">{jobState?.message || 'Starting...'}</p>
                            <p class="job-phase">{jobState?.phase || 'queued'}</p>
                          </div>
                        {:else if jobStates.get(game.id)?.status === 'failed'}
                          {@const jobState = jobStates.get(game.id)}
                          <div class="recap-error">
                            <p class="error-message">Failed to generate recap</p>
                            <p class="error-details">{jobState?.message}</p>
                            <button class="retry-button" on:click={() => {
                              jobStates.delete(game.id);
                              jobStates = jobStates;
                              toggleGameExpansion(game.id, game.boxScore);
                            }}>Retry</button>
                          </div>
                        {:else if recaps.has(game.id)}
                          {@const recap = recaps.get(game.id)}
                          <div class="recap">
                            <div class="recap-top-stats">
                              <div class="recap-section key-stats-top">
                                <strong>Key Stats</strong>
                                <ul>
                                  {#each recap.key_stats as stat}
                                    <li>{stat}</li>
                                  {/each}
                                </ul>
                              </div>

                              <div class="recap-section potg-top">
                                <strong>Player of the Game</strong>
                                <p>{recap.player_of_the_game}</p>
                              </div>
                            </div>

                            <div class="recap-headline">
                              <h5>{recap.headline}</h5>
                              <p class="recap-subheadline">{recap.subheadline}</p>
                            </div>

                            <div class="recap-lead">
                              {recap.lead_paragraph}
                            </div>

                            {#each recap.body_paragraphs as paragraph}
                              <p class="recap-body">{paragraph}</p>
                            {/each}

                            {#if game.triggers && game.triggers.length > 0}
                              <button
                                class="view-triggers-link"
                                on:click={() => viewTriggersForGame(game.id)}
                              >
                                View {game.triggers.length} Narrative Triggers →
                              </button>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="muted">No parsed games available for signal analysis.</p>
            {/if}
          </div>
        {/if}

        {#if selectedDemo === 'triggers'}
          <div class="demo-section">
            <h3>Narrative Triggers: LLM-Detected Story Hooks</h3>
            <p>After priority ranking, the system uses Claude to identify specific narrative angles within each game. Triggers include statistical extremes, clutch moments, unexpected performances, anomalies, and trends.</p>

            <div class="trigger-stats">
              <h4>Trigger Category Breakdown</h4>
              <div class="category-grid">
                {#each Object.entries(triggerBreakdown) as [category, count]}
                  <div class="category-card">
                    <div class="category-count">{count}</div>
                    <div class="category-label">{category.replace(/_/g, ' ')}</div>
                  </div>
                {/each}
              </div>
            </div>

            {#if gamesWithTriggers.length > 0}
              <div class="game-selector">
                <label for="trigger-game-select">Select Game:</label>
                <select
                  id="trigger-game-select"
                  bind:value={selectedTriggerGameId}
                >
                  {#each gamesWithTriggers as game}
                    <option value={game.id}>
                      {formatDate(game.gameDate)} — {formatScore(game.boxScore)} ({game.triggers.length} triggers)
                    </option>
                  {/each}
                </select>
              </div>

              {#if selectedTriggerGame && selectedTriggerGame.triggers}
                <div class="triggers-list">
                  {#each selectedTriggerGame.triggers as trigger}
                    <div class="trigger-card">
                      <div class="trigger-header">
                        <span class="trigger-category">{trigger.category}</span>
                        <span class="trigger-salience">Salience: {(trigger.salience_score * 100).toFixed(0)}%</span>
                      </div>
                      <p class="trigger-description">{trigger.description}</p>
                      {#if trigger.player_name}
                        <p class="trigger-player"><strong>Player:</strong> {trigger.player_name}</p>
                      {/if}
                      {#if trigger.follow_up_question}
                        <p class="trigger-question"><strong>Follow-up:</strong> {trigger.follow_up_question}</p>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/if}
            {:else}
              <p class="muted">No games with triggers available.</p>
            {/if}
          </div>
        {/if}

        {#if selectedDemo === 'cache'}
          <div class="demo-section">
            <h3>SQLite Cache System</h3>
            <p>The cache system stores raw inputs and LLM results to avoid redundant API calls. Each stage of the pipeline is cached independently, enabling fast iteration and cost control.</p>

            <div class="cache-tables">
              <div class="table-card">
                <h4>raw_inputs</h4>
                <p>Stores original box score text with content hashing</p>
                <div class="table-stat">{stats.totalGames} records</div>
              </div>
              <div class="table-card">
                <h4>parsed_boxscores</h4>
                <p>Structured BoxScore objects from BAML ParseBoxScore</p>
                <div class="table-stat">{stats.parsedGames} records</div>
              </div>
              <div class="table-card">
                <h4>triggers</h4>
                <p>Narrative hooks detected by DetectTriggers function</p>
                <div class="table-stat">{stats.gamesWithTriggers} records</div>
              </div>
              <div class="table-card">
                <h4>interviews</h4>
                <p>Context interview questions (future: S-003)</p>
                <div class="table-stat">0 records (pending)</div>
              </div>
              <div class="table-card">
                <h4>narratives</h4>
                <p>Final synthesized game recaps (future: S-003)</p>
                <div class="table-stat">0 records (pending)</div>
              </div>
            </div>

            <div class="code-block">
              <strong>Cache API Example:</strong>
              <pre>
import &#123; Cache &#125; from '$lib/cache';
import &#123; parseBoxScoreCached &#125; from '$lib/cached-pipeline';

const cache = new Cache();

// Parse with automatic caching
const boxScore = await parseBoxScoreCached(cache, rawText, hash);

// Force refresh to bypass cache
const fresh = await parseBoxScoreCached(cache, rawText, hash, true);</pre>
            </div>
          </div>
        {/if}
      </div>
    </section>

    <!-- Quick Links -->
    <section class="quick-links">
      <h2>Tools & Documentation</h2>
      <div class="links-grid">
        <a href="/data" class="link-card">
          <strong>Data Viewer</strong>
          <p>Browse all games with box scores and triggers</p>
        </a>
        <a href="https://github.com/your-repo/box-scoryteller" class="link-card">
          <strong>GitHub Repository</strong>
          <p>Source code and documentation</p>
        </a>
        <div class="link-card info">
          <strong>Data Source</strong>
          <p>College of Marin Athletics<br/>2023-24 basketball season</p>
        </div>
        <div class="link-card info">
          <strong>Tech Stack</strong>
          <p>SvelteKit, BAML, Claude, SQLite</p>
        </div>
      </div>
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
  }

  header {
    text-align: center;
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 2px solid #e0e0e0;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
    color: #1a1a1a;
  }

  .tagline {
    font-size: 1.1rem;
    color: #666;
    max-width: 700px;
    margin: 0 auto;
  }

  h2 {
    font-size: 1.75rem;
    margin: 2rem 0 1rem;
    color: #1a1a1a;
  }

  h3 {
    font-size: 1.3rem;
    margin: 1.5rem 0 0.75rem;
    color: #333;
  }

  h4 {
    font-size: 1.1rem;
    margin: 1.25rem 0 0.5rem;
    color: #444;
  }

  section {
    margin-bottom: 3rem;
  }

  .loading {
    text-align: center;
    padding: 3rem;
    color: #666;
    font-size: 1.1rem;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem;
    border-radius: 8px;
    text-align: center;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
  }

  /* Tabs */
  .tab-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid #e0e0e0;
  }

  .tab-nav button {
    background: none;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    transition: all 0.2s;
    color: #666;
  }

  .tab-nav button:hover {
    color: #333;
    background: #f5f5f5;
  }

  .tab-nav button.active {
    color: #667eea;
    border-bottom-color: #667eea;
  }

  .tab-content {
    background: #f9f9f9;
    padding: 2rem;
    border-radius: 8px;
    min-height: 400px;
  }

  .demo-section p {
    color: #555;
    margin-bottom: 1rem;
  }

  /* Pipeline Flow */
  .pipeline-flow {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 1rem 0;
    margin: 1.5rem 0;
  }

  .pipeline-stage {
    background: white;
    border: 2px solid #667eea;
    border-radius: 8px;
    padding: 1rem;
    min-width: 180px;
    flex-shrink: 0;
  }

  .stage-number {
    display: inline-block;
    background: #667eea;
    color: white;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    text-align: center;
    line-height: 28px;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .stage-content strong {
    display: block;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .stage-content p {
    font-size: 0.85rem;
    color: #666;
    margin: 0.25rem 0;
  }

  .metric {
    font-size: 0.9rem;
    color: #667eea;
    font-weight: 600;
    margin-top: 0.5rem;
  }

  .pipeline-arrow {
    font-size: 1.5rem;
    color: #667eea;
    font-weight: bold;
    flex-shrink: 0;
  }

  /* Level Selector */
  .level-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    background: white;
    border-radius: 8px;
    border: 2px solid #667eea;
  }

  .level-selector label {
    font-weight: 600;
    color: #333;
  }

  .level-selector select {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .level-selector select:hover {
    border-color: #667eea;
  }

  .level-selector select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  /* Signals Config */
  .signals-config {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin: 1.5rem 0;
  }

  .config-section h4 {
    margin-top: 0;
    color: #667eea;
  }

  .config-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .config-section li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .config-section li:last-child {
    border-bottom: none;
  }

  /* Games List */
  .games-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .game-card {
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .game-card.expanded {
    border-color: #667eea;
  }

  .game-card-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .game-card-header:hover {
    background: #f9f9f9;
  }

  .game-header-content {
    flex: 1;
  }

  .expand-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #667eea;
    color: white;
    border-radius: 50%;
    font-size: 1.5rem;
    font-weight: bold;
    flex-shrink: 0;
    margin-left: 1rem;
  }

  .game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .priority-badge {
    background: #fbbf24;
    color: #78350f;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .priority-badge.high {
    background: #ef4444;
    color: white;
  }

  .game-date {
    color: #666;
    font-size: 0.9rem;
  }

  .game-score {
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: #333;
  }

  .signal-reasons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .signal-tag {
    background: #e0e7ff;
    color: #4c1d95;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.85rem;
  }

  /* Game Details */
  .game-details {
    padding: 1.5rem;
    background: #f9f9f9;
    border-top: 1px solid #e0e0e0;
  }

  .recap-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #666;
  }

  .job-status {
    margin: 0.5rem 0 0.25rem;
    font-weight: 500;
    color: #333;
  }

  .job-phase {
    margin: 0;
    font-size: 0.85rem;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .recap-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #666;
    text-align: center;
  }

  .error-message {
    color: #ef4444;
    font-weight: 600;
    margin: 0 0 0.5rem;
  }

  .error-details {
    color: #666;
    font-size: 0.9rem;
    margin: 0 0 1rem;
    max-width: 400px;
  }

  .retry-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .retry-button:hover {
    background: #5a67d8;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .recap {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .recap-headline h5 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    color: #1a1a1a;
    line-height: 1.3;
  }

  .recap-subheadline {
    margin: 0;
    font-size: 1.1rem;
    color: #666;
    font-style: italic;
  }

  .recap-lead {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #333;
    font-weight: 500;
    padding: 1rem;
    background: white;
    border-left: 4px solid #667eea;
    border-radius: 4px;
  }

  .recap-body {
    line-height: 1.7;
    color: #444;
    margin: 0.5rem 0;
  }

  .recap-top-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e0e0e0;
  }

  .key-stats-top,
  .potg-top {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }

  .key-stats-top strong,
  .potg-top strong {
    color: rgba(255, 255, 255, 0.9);
  }

  .key-stats-top ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .key-stats-top li {
    padding: 0.25rem 0;
    color: white;
    font-size: 0.95rem;
  }

  .key-stats-top li::before {
    content: "•";
    color: rgba(255, 255, 255, 0.7);
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }

  .potg-top p {
    color: white;
    margin: 0;
  }

  .recap-sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }

  .recap-section {
    background: white;
    padding: 1rem;
    border-radius: 6px;
  }

  .recap-section strong {
    display: block;
    color: #667eea;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .recap-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .recap-section li {
    padding: 0.25rem 0;
    color: #555;
    font-size: 0.95rem;
  }

  .recap-section li::before {
    content: "•";
    color: #667eea;
    font-weight: bold;
    display: inline-block;
    width: 1em;
    margin-left: -1em;
  }

  .recap-section p {
    margin: 0;
    color: #555;
    font-size: 0.95rem;
  }

  /* Triggers */
  .trigger-stats {
    margin: 1.5rem 0;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
  }

  .category-card {
    background: white;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    border: 2px solid #e0e0e0;
  }

  .category-count {
    font-size: 2rem;
    font-weight: bold;
    color: #667eea;
  }

  .category-label {
    font-size: 0.85rem;
    color: #666;
    text-transform: capitalize;
  }

  .triggers-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  .trigger-card {
    background: white;
    border-left: 4px solid #667eea;
    padding: 1rem;
    border-radius: 4px;
  }

  .trigger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .trigger-category {
    background: #667eea;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .trigger-salience {
    color: #666;
    font-size: 0.85rem;
  }

  .trigger-description {
    margin: 0.5rem 0;
    color: #333;
  }

  .trigger-player,
  .trigger-question {
    font-size: 0.9rem;
    color: #666;
    margin: 0.25rem 0;
  }

  /* Game Selector */
  .game-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    background: white;
    border-radius: 8px;
    border: 2px solid #667eea;
  }

  .game-selector label {
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  .game-selector select {
    flex: 1;
    padding: 0.5rem 1rem;
    font-size: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .game-selector select:hover {
    border-color: #667eea;
  }

  .game-selector select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  /* View Triggers Link */
  .view-triggers-link {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.75rem 1.25rem;
    background: #f0f0ff;
    color: #667eea;
    border: 2px solid #667eea;
    border-radius: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .view-triggers-link:hover {
    background: #667eea;
    color: white;
  }

  /* Cache */
  .cache-tables {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 1.5rem 0;
  }

  .table-card {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    padding: 1.25rem;
  }

  .table-card h4 {
    margin: 0 0 0.5rem;
    color: #667eea;
    font-family: monospace;
  }

  .table-card p {
    font-size: 0.85rem;
    color: #666;
    margin: 0.5rem 0;
  }

  .table-stat {
    font-weight: 600;
    color: #333;
    margin-top: 0.75rem;
  }

  /* Code Blocks */
  .code-block {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1.5rem;
    border-radius: 6px;
    margin: 1.5rem 0;
  }

  .code-block strong {
    color: #4ec9b0;
    display: block;
    margin-bottom: 0.5rem;
  }

  .code-block pre {
    margin: 0;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    overflow-x: auto;
  }

  /* Quick Links */
  .links-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .link-card {
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 1.5rem;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
  }

  .link-card:not(.info):hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .link-card strong {
    display: block;
    color: #667eea;
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }

  .link-card p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }

  .link-card.info {
    cursor: default;
  }

  .muted {
    color: #999;
    font-style: italic;
  }

  @media (max-width: 768px) {
    .pipeline-flow {
      flex-direction: column;
    }

    .pipeline-arrow {
      transform: rotate(90deg);
    }

    .signals-config {
      grid-template-columns: 1fr;
    }

    .tab-nav {
      overflow-x: auto;
    }

    .recap-sidebar {
      grid-template-columns: 1fr;
    }

    .recap-headline h5 {
      font-size: 1.25rem;
    }
  }
</style>
