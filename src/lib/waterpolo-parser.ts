/**
 * Water Polo Box Score HTML Parser
 *
 * Extracts relevant box score data from SIDEARM Sports water polo HTML pages.
 * Converts the HTML into clean, structured text that can be parsed by the LLM.
 */

/**
 * Extract clean box score text from water polo HTML
 * This preprocessing step reduces the input size significantly for LLM parsing.
 */
export function extractWaterPoloBoxScoreText(html: string): string {
  const lines: string[] = [];

  // Extract game title from og:title or title tag
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/) ||
                     html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    lines.push(`Game: ${titleMatch[1].trim()}`);
    lines.push('');
  }

  // Extract team names and scores from the scoreboard section
  // Look for team names in various formats
  const teamScoreSection = html.match(/class="score\s+(?:winner|loser)"[^>]*>\s*(\d+)\s*<\/span>/g);
  const scores: string[] = [];
  if (teamScoreSection) {
    for (const match of teamScoreSection) {
      const scoreMatch = match.match(/>\s*(\d+)\s*</);
      if (scoreMatch) scores.push(scoreMatch[1]);
    }
  }

  // Try to extract team names from headings or captions
  const awayTeamMatch = html.match(/id="away-team"[^>]*>([^<]+)</);
  const homeTeamMatch = html.match(/id="home-team"[^>]*>([^<]+)</);

  const awayTeam = awayTeamMatch ? awayTeamMatch[1].trim() : 'Away';
  const homeTeam = homeTeamMatch ? homeTeamMatch[1].trim() : 'Home';

  if (scores.length >= 2) {
    lines.push(`${awayTeam}: ${scores[0]}`);
    lines.push(`${homeTeam}: ${scores[1]}`);
    lines.push('');
  }

  // Extract period scores from "Team Score By Period" table
  const periodScoreSection = html.match(/<caption>Team Score By Period<\/caption>([\s\S]*?)<\/table>/);
  if (periodScoreSection) {
    lines.push('Score By Period:');

    // Extract period headers
    const headerMatches = [...periodScoreSection[1].matchAll(/<th[^>]*>(\d+|TOTAL|F)<\/th>/g)];
    const periods = headerMatches.map(m => m[1]).filter(p => p !== 'TOTAL' && p !== 'F');

    lines.push(`${'Team'.padEnd(20)} ${periods.map(p => p.padStart(3)).join(' ')}  Total`);

    // Extract team rows
    const rowMatches = [...periodScoreSection[1].matchAll(/<tr>\s*<td[^>]*class="(?:winner|loser)"[^>]*>([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/g)];

    for (const row of rowMatches) {
      // Get team name
      const teamNameMatch = row[1].match(/>([^<]+)</);
      const teamName = teamNameMatch ? teamNameMatch[1].trim() : 'Team';

      // Get period scores
      const periodScores = [...row[2].matchAll(/<td[^>]*>(\d+)\s*<\/td>/g)].map(m => m[1]);
      const total = periodScores.pop() || '0'; // Last one is usually the total

      lines.push(`${teamName.padEnd(20)} ${periodScores.map(s => s.padStart(3)).join(' ')}  ${total.padStart(3)}`);
    }
    lines.push('');
  }

  // Extract team statistics summary
  const teamStatsSection = html.match(/<caption>Team Statistics<\/caption>([\s\S]*?)<\/table>/);
  if (teamStatsSection) {
    lines.push('Team Statistics:');
    lines.push(`${'Statistic'.padEnd(20)} ${awayTeam.padStart(8)} ${homeTeam.padStart(8)}`);

    const statRows = [...teamStatsSection[1].matchAll(/<tr>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/g)];

    for (const row of statRows) {
      const statName = row[1].trim();
      const awayVal = row[2].trim();
      const homeVal = row[3].trim();
      lines.push(`${statName.padEnd(20)} ${awayVal.padStart(8)} ${homeVal.padStart(8)}`);
    }
    lines.push('');
  }

  // Extract player stats tables
  const playerStatsSections = [...html.matchAll(/<caption>([^<]+)\s*-\s*Player Stats<\/caption>([\s\S]*?)<\/table>/g)];

  for (const match of playerStatsSections) {
    const teamName = match[1].trim();
    const tableContent = match[2];

    lines.push(`${teamName} Player Stats:`);
    lines.push('#    Player                   SH   G   A  PTS  EX DEX STL  FB Sprint');

    // Extract player rows from tbody - handle both <th> and <td> for player names
    // Pattern: <tr> containing jersey number td, then player name (th or td), then stats tds
    const playerRows = [...tableContent.matchAll(/<tr[^>]*>\s*<td[^>]*>([^<]*)<\/td>\s*(?:<th[^>]*>([\s\S]*?)<\/th>|<td[^>]*>([\s\S]*?)<\/td>)([\s\S]*?)<\/tr>/g)];

    for (const row of playerRows) {
      const number = row[1].trim() || '-';

      // Player name could be in group 2 (th) or group 3 (td)
      const nameCell = row[2] || row[3] || '';

      // Extract player name - could be in anchor tag, plain text, or with span
      let playerName = '';

      // Try anchor tag first (CLU format)
      const anchorMatch = nameCell.match(/<a[^>]*>([^<]+)<\/a>/);
      if (anchorMatch) {
        playerName = anchorMatch[1].trim();
      } else {
        // Try getting text before any span (CSUN format has name then "- 2G, 2A" span)
        const textMatch = nameCell.match(/^\s*([A-Za-z][A-Za-z\s,.'()-]+?)(?:\s*<span|$)/);
        if (textMatch) {
          playerName = textMatch[1].trim();
        } else {
          // Fallback: strip all tags and get first line
          playerName = nameCell.replace(/<[^>]+>/g, ' ').trim().split('\n')[0].trim();
        }
      }

      // Skip empty names, totals row, or summary spans
      if (!playerName || playerName.toLowerCase().includes('total') || playerName.startsWith('-')) continue;

      // Extract stats from remaining td elements
      const statsSection = row[4] || '';
      const stats = [...statsSection.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1].trim());

      if (stats.length >= 9) {
        const [sh, g, a, pts, ex, dex, stl, fb, sprint] = stats;
        lines.push(
          `${number.padEnd(4)} ${playerName.slice(0, 24).padEnd(24)} ` +
          `${sh.padStart(2)}  ${g.padStart(2)}  ${a.padStart(2)}  ${pts.padStart(3)}  ` +
          `${ex.padStart(2)}  ${dex.padStart(2)}  ${stl.padStart(2)}  ${fb.padStart(2)} ${sprint.padStart(5)}`
        );
      }
    }

    // Extract totals from tfoot
    const totalsMatch = tableContent.match(/<tfoot>[\s\S]*?<tr>([\s\S]*?)<\/tr>[\s\S]*?<\/tfoot>/);
    if (totalsMatch) {
      const totalStats = [...totalsMatch[1].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1].trim());
      if (totalStats.length >= 9) {
        const [sh, g, a, pts, ex, dex, stl, fb, sprint] = totalStats.slice(-9);
        lines.push(
          `${''.padEnd(4)} ${'TOTALS'.padEnd(24)} ` +
          `${sh.padStart(2)}  ${g.padStart(2)}  ${a.padStart(2)}  ${pts.padStart(3)}  ` +
          `${ex.padStart(2)}  ${dex.padStart(2)}  ${stl.padStart(2)}  ${fb.padStart(2)} ${sprint.padStart(5)}`
        );
      }
    }

    lines.push('');
  }

  // Extract goalkeeper stats tables
  const goalieStatsSections = [...html.matchAll(/<caption>([^<]+)\s*-\s*Goalie Statistics<\/caption>([\s\S]*?)<\/table>/g)];

  for (const match of goalieStatsSections) {
    const teamName = match[1].trim();
    const tableContent = match[2];

    lines.push(`${teamName} Goalie Stats:`);
    lines.push('#    Goalie                   Minutes   GA  Saves');

    // Extract goalkeeper rows from tbody
    const goalieRows = [...tableContent.matchAll(/<tr>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/g)];

    for (const row of goalieRows) {
      const number = row[1].trim() || '-';

      // Extract goalie name
      let goalieName = '';
      const nameMatch = row[2].match(/>([^<]+)</);
      if (nameMatch) {
        goalieName = nameMatch[1].trim();
      } else {
        goalieName = row[2].replace(/<[^>]+>/g, '').trim().split('\n')[0].trim();
      }

      // Skip totals row
      if (goalieName.toLowerCase().includes('total')) continue;

      // Extract stats
      const stats = [...row[3].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1].trim());

      if (stats.length >= 3) {
        const [minutes, ga, saves] = stats;
        lines.push(
          `${number.padEnd(4)} ${goalieName.slice(0, 24).padEnd(24)} ` +
          `${minutes.padStart(7)}  ${ga.padStart(3)}  ${saves.padStart(5)}`
        );
      }
    }

    // Extract totals from tfoot
    const totalsMatch = tableContent.match(/<tfoot>[\s\S]*?<tr>([\s\S]*?)<\/tr>[\s\S]*?<\/tfoot>/);
    if (totalsMatch) {
      const totalStats = [...totalsMatch[1].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1].trim());
      if (totalStats.length >= 2) {
        const ga = totalStats[totalStats.length - 2];
        const saves = totalStats[totalStats.length - 1];
        lines.push(
          `${''.padEnd(4)} ${'TOTALS'.padEnd(24)} ${''.padStart(7)}  ${ga.padStart(3)}  ${saves.padStart(5)}`
        );
      }
    }

    lines.push('');
  }

  // Extract venue/location if available
  const venueMatch = html.match(/Samuelson Aquatics Center|[A-Z][a-z]+ (?:Aquatics|Natatorium|Pool)[^<]*/);
  if (venueMatch) {
    lines.push(`Venue: ${venueMatch[0]}`);
  }

  // Extract date from title or URL
  const dateMatch = html.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/) ||
                    html.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    lines.push(`Date: ${dateMatch[0]}`);
  }

  return lines.join('\n');
}

/**
 * Alternative extraction that preserves more raw HTML structure
 * for cases where the formatted extraction misses data
 */
export function extractWaterPoloBoxScoreRaw(html: string): string {
  const lines: string[] = [];

  // Remove script and style tags
  let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Extract all tables with their captions
  const tables = [...cleaned.matchAll(/<caption[^>]*>([^<]+)<\/caption>([\s\S]*?)<\/table>/g)];

  for (const table of tables) {
    const caption = table[1].trim();
    const content = table[2];

    // Skip navigation/non-data tables
    if (caption.toLowerCase().includes('navigation')) continue;

    lines.push(`=== ${caption} ===`);

    // Extract all text content from cells
    const cells = [...content.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)];
    const rowData: string[] = [];

    for (const cell of cells) {
      let text = cell[1].replace(/<[^>]+>/g, ' ').trim();
      text = text.replace(/\s+/g, ' ');
      if (text) rowData.push(text);
    }

    lines.push(rowData.join(' | '));
    lines.push('');
  }

  return lines.join('\n');
}
