<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
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

  let games: Game[] = $state([]);
  let loading = $state(true);
  let selectedGameId: number | null = $state(null);
  let recap: GameRecap | null = $state(null);
  let jobState: JobState | null = $state(null);
  let generating = $state(false);
  let error: string | null = $state(null);
  let fromCache = $state(false);

  // Get selected game
  $effect(() => {
    // Check URL params for game hash on mount
    const hashParam = $page.url.searchParams.get('hash');
    if (hashParam && games.length > 0) {
      const game = games.find(g => g.contentHash === hashParam);
      if (game) {
        selectedGameId = game.id;
      }
    }
  });

  $effect(() => {
    // Check URL params for game date
    const dateParam = $page.url.searchParams.get('date');
    if (dateParam && games.length > 0) {
      const game = games.find(g => g.gameDate === dateParam);
      if (game) {
        selectedGameId = game.id;
      }
    }
  });

  onMount(async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      // Only include parsed games
      games = data.games.filter((g: Game) => g.parsed && g.boxScore);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load games';
    } finally {
      loading = false;
    }
  });

  // Currently selected game
  const selectedGame = $derived(games.find(g => g.id === selectedGameId) || null);

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatScore(boxScore: any): string {
    if (!boxScore?.metadata) return 'N/A';
    const { home_team, away_team, home_score, away_score } = boxScore.metadata;
    return `${away_team} ${away_score} @ ${home_team} ${home_score}`;
  }

  function formatSport(sport: string | null): string {
    if (!sport) return '';
    const sportNames: Record<string, string> = {
      'wbkb': "Women's Basketball",
      'mbkb': "Men's Basketball",
      'bsb': "Baseball",
      'wwaterpolo': "Women's Water Polo",
      'mwaterpolo': "Men's Water Polo"
    };
    return sportNames[sport] || sport;
  }

  async function loadRecap() {
    if (!selectedGame) return;

    recap = null;
    error = null;
    generating = true;
    fromCache = false;
    jobState = { status: 'pending', phase: 'queued', message: 'Starting...' };

    const startTime = Date.now();

    try {
      const result = await generateRecap<GameRecap>(selectedGame.boxScore, {
        interval: 1000,
        timeout: 120000,
        onStatusChange: (job: JobResponse) => {
          jobState = {
            status: job.status,
            phase: job.phase,
            message: job.phaseMessage
          };
        }
      });

      recap = result.recap;
      // If result came back very quickly (<500ms), it was likely cached
      fromCache = (Date.now() - startTime) < 500;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to generate recap';
      jobState = { status: 'failed', phase: 'error', message: error };
    } finally {
      generating = false;
    }
  }

  // Auto-load recap when game is selected
  $effect(() => {
    if (selectedGame && !recap && !generating) {
      loadRecap();
    }
  });

  // Reset recap when game changes
  function handleGameChange() {
    recap = null;
    error = null;
    jobState = null;
    fromCache = false;
  }
</script>

<svelte:head>
  <title>Game Recap | Box Scoryteller</title>
</svelte:head>

<main>
  <header>
    <h1>Game Recap Generator</h1>
    <p class="subtitle">Generate narrative recaps from box score data</p>
    <a href="/" class="back-link">← Back to Dashboard</a>
  </header>

  {#if loading}
    <div class="loading">Loading games...</div>
  {:else if games.length === 0}
    <div class="empty">No parsed games available. Run the processing pipeline first.</div>
  {:else}
    <section class="game-selector">
      <label for="game-select">Select a game:</label>
      <select
        id="game-select"
        bind:value={selectedGameId}
        onchange={handleGameChange}
      >
        <option value={null}>-- Select a game --</option>
        {#each games as game}
          <option value={game.id}>
            {formatDate(game.gameDate)} — {formatScore(game.boxScore)} ({formatSport(game.sport)})
          </option>
        {/each}
      </select>
    </section>

    {#if selectedGame}
      <section class="game-info">
        <div class="info-grid">
          <div class="info-card">
            <span class="info-label">Date</span>
            <span class="info-value">{selectedGame.boxScore.metadata.date || selectedGame.gameDate}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Venue</span>
            <span class="info-value">{selectedGame.boxScore.metadata.venue || 'Unknown'}</span>
          </div>
          <div class="info-card">
            <span class="info-label">Final Score</span>
            <span class="info-value score">
              {selectedGame.boxScore.metadata.away_team} {selectedGame.boxScore.metadata.away_score} -
              {selectedGame.boxScore.metadata.home_score} {selectedGame.boxScore.metadata.home_team}
            </span>
          </div>
          {#if selectedGame.triggers && selectedGame.triggers.length > 0}
            <div class="info-card">
              <span class="info-label">Triggers Detected</span>
              <span class="info-value">{selectedGame.triggers.length}</span>
            </div>
          {/if}
        </div>
      </section>

      <section class="recap-section">
        {#if generating}
          <div class="recap-loading">
            <div class="spinner"></div>
            <p class="job-status">{jobState?.message || 'Starting...'}</p>
            <p class="job-phase">{jobState?.phase || 'queued'}</p>
          </div>
        {:else if error}
          <div class="recap-error">
            <p class="error-message">Failed to generate recap</p>
            <p class="error-details">{error}</p>
            <button class="retry-button" onclick={loadRecap}>Retry</button>
          </div>
        {:else if recap}
          <div class="recap">
            {#if fromCache}
              <div class="cache-indicator">
                <span class="cache-badge">⚡ Loaded from cache</span>
                <span class="cache-hint">No LLM call required</span>
              </div>
            {/if}
            <div class="recap-top-stats">
              <div class="recap-card key-stats">
                <strong>Key Stats</strong>
                <ul>
                  {#each recap.key_stats as stat}
                    <li>{stat}</li>
                  {/each}
                </ul>
              </div>
              <div class="recap-card potg">
                <strong>Player of the Game</strong>
                <p>{recap.player_of_the_game}</p>
              </div>
            </div>

            <div class="recap-headline">
              <h2>{recap.headline}</h2>
              <p class="recap-subheadline">{recap.subheadline}</p>
            </div>

            <div class="recap-lead">
              {recap.lead_paragraph}
            </div>

            <div class="recap-body">
              {#each recap.body_paragraphs as paragraph}
                <p>{paragraph}</p>
              {/each}
            </div>
          </div>

          {#if selectedGame.triggers && selectedGame.triggers.length > 0}
            <div class="triggers-section">
              <h3>Narrative Triggers</h3>
              <div class="triggers-list">
                {#each selectedGame.triggers as trigger}
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
            </div>
          {/if}
        {:else}
          <div class="no-recap">
            <p>Select a game above to generate a recap.</p>
          </div>
        {/if}
      </section>
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
  }

  header {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e0e0e0;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    color: #1a1a1a;
  }

  .subtitle {
    margin: 0 0 1rem;
    color: #666;
  }

  .back-link {
    display: inline-block;
    color: #667eea;
    text-decoration: none;
    font-size: 0.9rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .loading, .empty, .no-recap {
    text-align: center;
    padding: 3rem;
    color: #666;
    background: #f9f9f9;
    border-radius: 8px;
  }

  /* Game Selector */
  .game-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
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
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
  }

  .game-selector select:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
  }

  /* Game Info */
  .game-info {
    margin-bottom: 2rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
  }

  .info-card {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
  }

  .info-label {
    display: block;
    font-size: 0.8rem;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.25rem;
  }

  .info-value {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
  }

  .info-value.score {
    font-family: monospace;
  }

  /* Recap Section */
  .recap-section {
    background: #f9f9f9;
    padding: 2rem;
    border-radius: 8px;
  }

  .recap-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #666;
  }

  .spinner {
    width: 48px;
    height: 48px;
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
    text-align: center;
    padding: 2rem;
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
  }

  .retry-button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s;
  }

  .retry-button:hover {
    background: #5a67d8;
  }

  /* Cache Indicator */
  .cache-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #ecfdf5;
    border: 1px solid #10b981;
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }

  .cache-badge {
    font-weight: 600;
    color: #059669;
    font-size: 0.9rem;
  }

  .cache-hint {
    color: #047857;
    font-size: 0.8rem;
  }

  /* Recap Content */
  .recap {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .recap-top-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .recap-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.25rem;
    border-radius: 8px;
  }

  .recap-card strong {
    display: block;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.9;
    margin-bottom: 0.5rem;
  }

  .recap-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .recap-card li {
    padding: 0.25rem 0;
    font-size: 0.95rem;
  }

  .recap-card p {
    margin: 0;
    font-size: 0.95rem;
  }

  .recap-headline {
    text-align: center;
    padding: 1rem 0;
  }

  .recap-headline h2 {
    margin: 0 0 0.5rem;
    font-size: 1.75rem;
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
    font-size: 1.1rem;
    line-height: 1.8;
    color: #333;
    font-weight: 500;
    padding: 1.25rem;
    background: white;
    border-left: 4px solid #667eea;
    border-radius: 4px;
  }

  .recap-body p {
    line-height: 1.8;
    color: #444;
    margin: 0.75rem 0;
  }

  /* Triggers Section */
  .triggers-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e0e0e0;
  }

  .triggers-section h3 {
    margin: 0 0 1rem;
    color: #333;
  }

  .triggers-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
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
    font-size: 0.75rem;
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

  @media (max-width: 600px) {
    .recap-top-stats {
      grid-template-columns: 1fr;
    }

    .game-selector {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
