/**
 * Box Score to Recap Pipeline
 *
 * Fetches box score data from a URL or raw text and generates a game recap.
 */

import { b } from '../../baml_client';

export interface RecapResult {
  headline: string;
  subheadline: string;
  lead_paragraph: string;
  body_paragraphs: string[];
  key_stats: string[];
  player_of_the_game: string;
}

/**
 * Fetch content from a URL and extract text
 */
async function fetchBoxScoreText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Basic HTML to text conversion - strip tags, decode entities
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  return text;
}

/**
 * Generate a recap from raw box score text
 */
export async function generateRecapFromText(rawText: string): Promise<RecapResult> {
  const recap = await b.BoxScoreToRecap(rawText);
  return recap;
}

/**
 * Generate a recap from a URL containing box score data
 */
export async function generateRecapFromUrl(url: string): Promise<RecapResult> {
  const text = await fetchBoxScoreText(url);
  return generateRecapFromText(text);
}

/**
 * Parse box score and then generate recap (two-step pipeline)
 */
export async function parseAndGenerateRecap(rawText: string): Promise<{
  boxScore: Awaited<ReturnType<typeof b.ParseBoxScore>>;
  recap: RecapResult;
}> {
  const boxScore = await b.ParseBoxScore(rawText);
  const recap = await b.GenerateRecap(boxScore);
  return { boxScore, recap };
}

/**
 * Parse water polo box score and then generate recap (two-step pipeline)
 */
export async function parseAndGenerateWaterPoloRecap(rawText: string): Promise<{
  boxScore: Awaited<ReturnType<typeof b.ParseWaterPoloBoxScore>>;
  recap: RecapResult;
}> {
  const boxScore = await b.ParseWaterPoloBoxScore(rawText);
  const recap = await b.GenerateWaterPoloRecap(boxScore);
  return { boxScore, recap };
}

// CLI interface when run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv[2];

  if (!input) {
    console.log('Usage: npx tsx src/lib/recap.ts <url-or-text>');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx src/lib/recap.ts "https://example.com/boxscore"');
    console.log('  npx tsx src/lib/recap.ts "State 78, Rival 74..."');
    process.exit(1);
  }

  const isUrl = input.startsWith('http://') || input.startsWith('https://');

  console.log(isUrl ? `Fetching box score from: ${input}` : 'Processing box score text...');
  console.log('');

  const recap = isUrl
    ? await generateRecapFromUrl(input)
    : await generateRecapFromText(input);

  console.log('='.repeat(60));
  console.log('HEADLINE:', recap.headline);
  console.log('='.repeat(60));
  console.log('');
  console.log('SUBHEAD:', recap.subheadline);
  console.log('');
  console.log('LEAD:');
  console.log(recap.lead_paragraph);
  console.log('');
  console.log('BODY:');
  recap.body_paragraphs.forEach((p, i) => {
    console.log(p);
    console.log('');
  });
  console.log('KEY STATS:');
  recap.key_stats.forEach(stat => console.log(`  • ${stat}`));
  console.log('');
  console.log('PLAYER OF THE GAME:', recap.player_of_the_game);
}
