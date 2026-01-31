/**
 * Baseball Box Score HTML Parser
 *
 * Extracts relevant box score data from the College of Marin athletics HTML pages.
 * Converts the messy HTML into clean, structured text that can be parsed by the LLM.
 */

/**
 * Extract clean box score text from HTML
 * This preprocessing step reduces the input size significantly for LLM parsing.
 */
export function extractBaseballBoxScoreText(html: string): string {
  const lines: string[] = [];

  // Extract game title from og:title meta tag
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  if (titleMatch) {
    lines.push(`Game: ${titleMatch[1]}`);
    lines.push('');
  }

  // Extract team names from team-name spans (first two unique)
  const teamNameMatches = html.matchAll(/<span class="team-name[^"]*">([^<]+)<\/span>/g);
  const teamNames: string[] = [];
  for (const match of teamNameMatches) {
    const name = match[1].trim();
    if (name && !teamNames.includes(name)) {
      teamNames.push(name);
    }
    if (teamNames.length >= 2) break;
  }

  // Also try anchor tags for team names
  if (teamNames.length < 2) {
    const anchorMatches = html.matchAll(/<a[^>]*class="team-name[^"]*"[^>]*>[\s\n]*([^<]+?)[\s\n]*<\/a>/g);
    for (const match of anchorMatches) {
      const name = match[1].trim();
      if (name && !teamNames.includes(name)) {
        teamNames.push(name);
      }
      if (teamNames.length >= 2) break;
    }
  }

  // Extract team scores
  const scoreMatches = [...html.matchAll(/<div class="team-score">(\d+)<\/div>/g)];
  const scores = scoreMatches.map(m => m[1]);

  if (teamNames.length >= 2 && scores.length >= 2) {
    lines.push(`${teamNames[0]} (Visitor): ${scores[0]}`);
    lines.push(`${teamNames[1]} (Home): ${scores[1]}`);
  } else if (scores.length >= 2) {
    lines.push(`Final Score: ${scores[0]} - ${scores[1]}`);
  }
  lines.push('');

  // Extract line score
  const lineScoreSection = html.match(/<div class="linescore">([\s\S]*?)<\/table>/);
  if (lineScoreSection) {
    lines.push('Line Score:');

    // Extract team rows from line score
    const teamRowMatches = [...lineScoreSection[1].matchAll(/<th[^>]*class="name[^"]*"[^>]*>([^<]+)<\/th>([\s\S]*?)(?=<\/tr>)/g)];

    for (const row of teamRowMatches) {
      const teamName = row[1].trim();
      const scoreSection = row[2];

      // Get inning scores
      const inningScores = [...scoreSection.matchAll(/<td class="score">(\d*)<\/td>/g)].map(m => m[1] || '0');

      // Get totals (R, H, E)
      const totals = [...scoreSection.matchAll(/<td class="score total">(\d+)<\/td>/g)].map(m => m[1]);

      const inningStr = inningScores.join(' ');
      const totalsStr = totals.length >= 3 ? `  R:${totals[0]} H:${totals[1]} E:${totals[2]}` : '';

      lines.push(`  ${teamName}: ${inningStr}${totalsStr}`);
    }
    lines.push('');
  }

  // Extract batting tables - look for Batters sections
  const battersSections = [...html.matchAll(/<caption class="caption"><h2>[\s\S]*?(?:<span class="team-name[^"]*">|<a[^>]*class="team-name[^"]*"[^>]*>[\s\n]*)([^<]+?)(?:<\/span>|[\s\n]*<\/a>)[\s\S]*?Batters[\s\S]*?<\/caption>([\s\S]*?)<\/table>/g)];

  for (const match of battersSections) {
    const teamName = match[1].trim();
    const tableContent = match[2];

    lines.push(`${teamName} Batting:`);
    lines.push('Player                   AB  R  H RBI BB SO LOB');

    // Extract player rows
    const playerRows = [...tableContent.matchAll(/<th[^>]*class="row-head[^"]*"[^>]*>([\s\S]*?)<\/th>([\s\S]*?)(?=<\/tr>)/g)];

    for (const row of playerRows) {
      let playerCell = row[1];
      const statsSection = row[2];

      // Extract player name from span or anchor
      const nameMatch = playerCell.match(/class="player-name[^"]*"[^>]*>([^<]+)</) ||
                        playerCell.match(/>([^<]+)<\/span>\s*<span>/) ||
                        playerCell.match(/>([^<]+)<\/a>/);

      let playerName = nameMatch ? nameMatch[1].trim() : '';

      // Extract position
      const posMatch = playerCell.match(/<span>(\w+)<\/span>/);
      const position = posMatch ? posMatch[1] : '';

      // Skip empty rows or totals
      if (!playerName || playerName.toLowerCase().includes('totals')) continue;

      // Extract stats
      const stats = [...statsSection.matchAll(/<td>(\d*)<\/td>/g)].map(m => m[1] || '0');

      if (stats.length >= 6) {
        const [ab, r, h, rbi, bb, so, lob = '0'] = stats;
        const playerDisplay = `${playerName} ${position}`.slice(0, 24).padEnd(24);
        lines.push(`${playerDisplay} ${ab.padStart(2)}  ${r.padStart(1)}  ${h.padStart(1)}  ${rbi.padStart(2)}  ${bb.padStart(1)}  ${so.padStart(1)}  ${(lob || '0').padStart(2)}`);
      }
    }

    // Extract team totals
    const totalsMatch = tableContent.match(/<tfoot>[\s\S]*?<td>(\d+)<\/td>\s*<td>(\d+)<\/td>\s*<td>(\d+)<\/td>\s*<td>(\d+)<\/td>\s*<td>(\d+)<\/td>\s*<td>(\d+)<\/td>\s*<td>(\d+)<\/td>/);
    if (totalsMatch) {
      lines.push(`${'Team Totals'.padEnd(24)} ${totalsMatch[1].padStart(2)}  ${totalsMatch[2].padStart(1)}  ${totalsMatch[3].padStart(1)}  ${totalsMatch[4].padStart(2)}  ${totalsMatch[5].padStart(1)}  ${totalsMatch[6].padStart(1)}  ${totalsMatch[7].padStart(2)}`);
    }

    lines.push('');
  }

  // Extract pitching tables - look for Pitchers sections
  const pitchersSections = [...html.matchAll(/<caption class="caption"><h2>[\s\S]*?(?:<span class="team-name[^"]*">|<a[^>]*class="team-name[^"]*"[^>]*>[\s\n]*)([^<]+?)(?:<\/span>|[\s\n]*<\/a>)[\s\S]*?Pitchers[\s\S]*?<\/caption>([\s\S]*?)<\/table>/g)];

  for (const match of pitchersSections) {
    const teamName = match[1].trim();
    const tableContent = match[2];

    lines.push(`${teamName} Pitching:`);
    lines.push('Pitcher                  IP   H   R  ER  BB  SO');

    // Extract pitcher rows
    const pitcherRows = [...tableContent.matchAll(/<th[^>]*class="row-head[^"]*"[^>]*>([\s\S]*?)<\/th>([\s\S]*?)(?=<\/tr>)/g)];

    for (const row of pitcherRows) {
      let pitcherCell = row[1];
      const statsSection = row[2];

      // Extract pitcher name from span or anchor
      const nameMatch = pitcherCell.match(/class="player-name[^"]*"[^>]*>([^<]+)</) ||
                        pitcherCell.match(/>([^<]+)<\/a>/);

      let pitcherName = nameMatch ? nameMatch[1].trim() : '';

      // Extract decision (W, L, S) if present
      const decisionMatch = pitcherCell.match(/\((W|L|S|H)[^)]*\)/);
      const decision = decisionMatch ? ` ${decisionMatch[0]}` : '';

      // Skip empty rows or totals
      if (!pitcherName || pitcherName.toLowerCase().includes('totals')) continue;

      // Extract stats
      const stats = [...statsSection.matchAll(/<td>([\d.]*)<\/td>/g)].map(m => m[1] || '0');

      if (stats.length >= 6) {
        const [ip, h, r, er, bb, so] = stats;
        const pitcherDisplay = `${pitcherName}${decision}`.slice(0, 24).padEnd(24);
        lines.push(`${pitcherDisplay} ${ip.padStart(4)}  ${h.padStart(2)}  ${r.padStart(2)}  ${er.padStart(2)}  ${bb.padStart(2)}  ${so.padStart(2)}`);
      }
    }

    lines.push('');
  }

  // Extract any additional game info
  const attendanceMatch = html.match(/Attendance:\s*(\d+)/i);
  if (attendanceMatch) {
    lines.push(`Attendance: ${attendanceMatch[1]}`);
  }

  const durationMatch = html.match(/Time:\s*([\d:]+)/i) || html.match(/Game:\s*([\d:]+)/i);
  if (durationMatch) {
    lines.push(`Duration: ${durationMatch[1]}`);
  }

  // Extract date from URL or title
  const dateMatch = html.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    lines.push(`Date: ${dateMatch[0]}`);
  }

  return lines.join('\n');
}
