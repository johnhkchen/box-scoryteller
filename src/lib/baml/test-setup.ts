/**
 * Simple test to verify BAML setup works end-to-end.
 *
 * This demonstrates that:
 * 1. BAML types are properly generated
 * 2. TypeScript can import and use the generated client
 * 3. The Claude API client is configured correctly
 * 4. The full pipeline from BAML definition -> TypeScript -> LLM call works
 */

import { b, type GreetingResponse } from '../../../baml_client';

export async function testBamlSetup(): Promise<void> {
  console.log('Testing BAML setup...');

  try {
    const result: GreetingResponse = await b.SayHello('Test User');

    console.log('✓ BAML setup working!');
    console.log('  Message:', result.message);
    console.log('  Timestamp:', result.timestamp);

    if (!result.message || !result.timestamp) {
      throw new Error('Response missing expected fields');
    }

    console.log('\n✓ All checks passed!');
  } catch (error) {
    console.error('✗ BAML setup test failed:', error);
    throw error;
  }
}

// Allow running this file directly for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  testBamlSetup().catch(console.error);
}
