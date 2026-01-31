<script lang="ts">
  import { onMount } from 'svelte';

  interface BoxScore {
    metadata: {
      date: string | null;
      venue: string | null;
      home_team: string;
      away_team: string;
      home_score: number;
      away_score: number;
      is_overtime: boolean;
      periods: number;
    };
    home_team: {
      team_name: string;
      total_points: number;
      players: Array<{
        name: string;
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
        minutes: number;
        starter: boolean;
      }>;
    };
    away_team: {
      team_name: string;
      total_points: number;
      players: Array<{
        name: string;
        points: number;
        rebounds: number;
        assists: number;
        steals: number;
        blocks: number;
        minutes: number;
        starter: boolean;
      }>;
    };
  }

  interface Trigger {
    category: string;
    description: string;
    player_name: string | null;
    salience_score: number;
    follow_up_question: string;
  }

  interface Game {
    id: number;
    filePath: string;
    contentHash: string;
    sport: string | null;
    gameDate: string | null;
    importedAt: string;
    parsed: boolean;
    boxScore: BoxScore | null;
    triggers: Trigger[] | null;
  }

  interface Stats {
    totalGames: number;
    parsedGames: number;
    gamesWithTriggers: number;
    sports: string[];
  }

  let games: Game[] = $state([]);
  let stats: Stats | null = $state(null);
  let loading = $state(true);
  let error: string | null = $state(null);
  let selectedGame: Game | null = $state(null);
  let filterSport: string = $state('all');

  onMount(async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch data');
      const data = await res.json();
      games = data.games;
      stats = data.stats;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
    } finally {
      loading = false;
    }
  });

  const filteredGames = $derived(
    filterSport === 'all'
      ? games
      : games.filter(g => g.sport === filterSport)
  );

  function formatSport(sport: string | null): string {
    if (!sport) return 'Unknown';
    return sport === 'wbkb' ? "Women's Basketball" : sport === 'mbkb' ? "Men's Basketball" : sport;
  }

  function getScoreDisplay(game: Game): string {
    if (!game.boxScore) return 'Not parsed';
    const bs = game.boxScore;
    return `${bs.metadata.away_team} ${bs.metadata.away_score} - ${bs.metadata.home_score} ${bs.metadata.home_team}`;
  }
</script>

<svelte:head>
  <title>Box Score Data Viewer</title>
</svelte:head>

<main>
  <header>
    <h1>Box Score Data Viewer</h1>
    <p class="subtitle">College of Marin Basketball 2023-24 Season</p>
  </header>

  {#if loading}
    <div class="loading">Loading data...</div>
  {:else if error}
    <div class="error">Error: {error}</div>
  {:else}
    <section class="stats">
      <h2>Data Summary</h2>
      <div class="stat-grid">
        <div class="stat-card">
          <span class="stat-value">{stats?.totalGames}</span>
          <span class="stat-label">Total Games</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{stats?.parsedGames}</span>
          <span class="stat-label">Parsed</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{stats?.gamesWithTriggers}</span>
          <span class="stat-label">With Triggers</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{stats?.sports.length}</span>
          <span class="stat-label">Sports</span>
        </div>
      </div>
    </section>

    <section class="filters">
      <label>
        Filter by sport:
        <select bind:value={filterSport}>
          <option value="all">All Sports</option>
          <option value="wbkb">Women's Basketball</option>
          <option value="mbkb">Men's Basketball</option>
        </select>
      </label>
      <span class="count">Showing {filteredGames.length} games</span>
    </section>

    <section class="games-table">
      <h2>Games</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Sport</th>
            <th>Score</th>
            <th>Status</th>
            <th>Triggers</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredGames as game}
            <tr class:selected={selectedGame?.id === game.id}>
              <td>{game.gameDate || 'Unknown'}</td>
              <td>{formatSport(game.sport)}</td>
              <td class="score">{getScoreDisplay(game)}</td>
              <td>
                {#if game.parsed}
                  <span class="badge parsed">Parsed</span>
                {:else}
                  <span class="badge pending">Pending</span>
                {/if}
              </td>
              <td>
                {#if game.triggers}
                  <span class="badge triggers">{game.triggers.length} triggers</span>
                {:else}
                  <span class="badge none">-</span>
                {/if}
              </td>
              <td>
                <button onclick={() => selectedGame = selectedGame?.id === game.id ? null : game}>
                  {selectedGame?.id === game.id ? 'Hide' : 'View'}
                </button>
              </td>
            </tr>
            {#if selectedGame?.id === game.id && game.boxScore}
              <tr class="detail-row">
                <td colspan="6">
                  <div class="game-detail">
                    <div class="detail-section">
                      <h3>Game Info</h3>
                      <p><strong>Venue:</strong> {game.boxScore.metadata.venue || 'Unknown'}</p>
                      <p><strong>Date:</strong> {game.boxScore.metadata.date || game.gameDate}</p>
                      <p><strong>Final:</strong> {game.boxScore.metadata.away_team} {game.boxScore.metadata.away_score} - {game.boxScore.metadata.home_score} {game.boxScore.metadata.home_team}</p>
                    </div>

                    {#if game.triggers && game.triggers.length > 0}
                      <div class="detail-section">
                        <h3>Narrative Triggers</h3>
                        <ul class="triggers-list">
                          {#each game.triggers as trigger}
                            <li class="trigger-item">
                              <span class="trigger-category">{trigger.category}</span>
                              <span class="trigger-score">{(trigger.salience_score * 100).toFixed(0)}%</span>
                              <p class="trigger-desc">{trigger.description}</p>
                              {#if trigger.player_name}
                                <p class="trigger-player">Player: {trigger.player_name}</p>
                              {/if}
                              <p class="trigger-question"><em>Follow-up: {trigger.follow_up_question}</em></p>
                            </li>
                          {/each}
                        </ul>
                      </div>
                    {/if}

                    <div class="teams-grid">
                      <div class="team-section">
                        <h3>{game.boxScore.away_team.team_name} (Away)</h3>
                        <table class="player-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>MIN</th>
                              <th>PTS</th>
                              <th>REB</th>
                              <th>AST</th>
                              <th>STL</th>
                              <th>BLK</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each game.boxScore.away_team.players as player}
                              <tr class:starter={player.starter}>
                                <td>{player.name}{player.starter ? '*' : ''}</td>
                                <td>{player.minutes}</td>
                                <td>{player.points}</td>
                                <td>{player.rebounds}</td>
                                <td>{player.assists}</td>
                                <td>{player.steals}</td>
                                <td>{player.blocks}</td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>

                      <div class="team-section">
                        <h3>{game.boxScore.home_team.team_name} (Home)</h3>
                        <table class="player-table">
                          <thead>
                            <tr>
                              <th>Player</th>
                              <th>MIN</th>
                              <th>PTS</th>
                              <th>REB</th>
                              <th>AST</th>
                              <th>STL</th>
                              <th>BLK</th>
                            </tr>
                          </thead>
                          <tbody>
                            {#each game.boxScore.home_team.players as player}
                              <tr class:starter={player.starter}>
                                <td>{player.name}{player.starter ? '*' : ''}</td>
                                <td>{player.minutes}</td>
                                <td>{player.points}</td>
                                <td>{player.rebounds}</td>
                                <td>{player.assists}</td>
                                <td>{player.steals}</td>
                                <td>{player.blocks}</td>
                              </tr>
                            {/each}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
  }

  .subtitle {
    color: #666;
    margin: 0.5rem 0 0;
  }

  h2 {
    font-size: 1.25rem;
    margin: 1.5rem 0 1rem;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
  }

  .loading, .error {
    padding: 2rem;
    text-align: center;
  }

  .error {
    color: #c00;
    background: #fee;
    border-radius: 4px;
  }

  .stats {
    margin-bottom: 2rem;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }

  .stat-card {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 2rem;
    font-weight: bold;
    color: #333;
  }

  .stat-label {
    display: block;
    font-size: 0.875rem;
    color: #666;
  }

  .filters {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .filters select {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .count {
    color: #666;
    font-size: 0.875rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tr:hover {
    background: #fafafa;
  }

  tr.selected {
    background: #e8f4ff;
  }

  .score {
    font-family: monospace;
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .badge.parsed {
    background: #d4edda;
    color: #155724;
  }

  .badge.pending {
    background: #fff3cd;
    color: #856404;
  }

  .badge.triggers {
    background: #cce5ff;
    color: #004085;
  }

  .badge.none {
    background: #eee;
    color: #666;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
  }

  button:hover {
    background: #f5f5f5;
  }

  .detail-row td {
    padding: 0;
    background: #fafafa;
  }

  .game-detail {
    padding: 1.5rem;
  }

  .detail-section {
    margin-bottom: 1.5rem;
  }

  .detail-section h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
  }

  .detail-section p {
    margin: 0.25rem 0;
  }

  .triggers-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .trigger-item {
    padding: 1rem;
    margin-bottom: 0.5rem;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .trigger-category {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background: #6c757d;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .trigger-score {
    display: inline-block;
    margin-left: 0.5rem;
    font-weight: bold;
    color: #28a745;
  }

  .trigger-desc {
    margin: 0.5rem 0;
  }

  .trigger-player {
    margin: 0.25rem 0;
    font-size: 0.875rem;
    color: #666;
  }

  .trigger-question {
    margin: 0.5rem 0 0;
    font-size: 0.875rem;
    color: #666;
  }

  .teams-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 900px) {
    .teams-grid {
      grid-template-columns: 1fr;
    }
  }

  .team-section h3 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
  }

  .player-table {
    font-size: 0.875rem;
  }

  .player-table th, .player-table td {
    padding: 0.5rem;
  }

  .player-table .starter {
    font-weight: 500;
  }
</style>
