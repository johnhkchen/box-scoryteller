#!/usr/bin/env bun
/**
 * Demo: Voice Profile Loading
 *
 * This script demonstrates the voice profile loading feature by showing how
 * to load profile files, handle missing files, and use fallback to template.
 */

import {
  loadVoiceProfile,
  voiceProfileExists,
  getVoiceProfileTemplate,
  VoiceProfileError,
} from '../src/lib/voice-profile.js';

console.log('\n🎤 Voice Profile Loading Demo\n');
console.log('═'.repeat(80));

// Demo 1: Load the template
console.log('\n1️⃣  Loading the default template');
console.log('─'.repeat(80));

try {
  const template = getVoiceProfileTemplate();
  console.log(`✓ Loaded template from: ${template.path}`);
  console.log(`  Is template: ${template.isTemplate}`);
  console.log(`  Content preview (first 200 chars):`);
  console.log(`  ${template.content.substring(0, 200).replace(/\n/g, '\n  ')}...`);
} catch (error) {
  console.error(`✗ Failed to load template:`, error);
}

// Demo 2: Check if a profile exists
console.log('\n\n2️⃣  Checking if profiles exist');
console.log('─'.repeat(80));

const profilesToCheck = [
  'profiles/TEMPLATE.md',
  'profiles/marin-wbkb.md',
  'profiles/nonexistent.md',
];

profilesToCheck.forEach((path) => {
  const exists = voiceProfileExists(path);
  console.log(`  ${exists ? '✓' : '✗'} ${path} ${exists ? 'exists' : 'not found'}`);
});

// Demo 3: Try loading a non-existent profile without fallback
console.log('\n\n3️⃣  Loading non-existent profile (without fallback)');
console.log('─'.repeat(80));

try {
  loadVoiceProfile('profiles/nonexistent.md');
  console.log('  ✗ Unexpected success');
} catch (error) {
  if (error instanceof VoiceProfileError) {
    console.log(`  ✓ Correctly threw VoiceProfileError`);
    console.log(`  Message: ${error.message}`);
    console.log(`  Path: ${error.path}`);
  } else {
    console.log(`  ✗ Unexpected error type:`, error);
  }
}

// Demo 4: Try loading a non-existent profile with fallback to template
console.log('\n\n4️⃣  Loading non-existent profile (with fallback)');
console.log('─'.repeat(80));

try {
  const fallbackResult = loadVoiceProfile('profiles/nonexistent.md', {
    fallbackToTemplate: true,
  });
  console.log(`  ✓ Successfully fell back to template`);
  console.log(`  Path: ${fallbackResult.path}`);
  console.log(`  Is template: ${fallbackResult.isTemplate}`);
} catch (error) {
  console.error(`  ✗ Failed with fallback:`, error);
}

// Demo 5: Show how this would integrate with narrative synthesis
console.log('\n\n5️⃣  Integration example with narrative synthesis');
console.log('─'.repeat(80));

const profilePath = 'profiles/marin-wbkb.md';
const exists = voiceProfileExists(profilePath);

if (exists) {
  console.log(`  ✓ Program profile found at ${profilePath}`);
  console.log(`    → Would inject profile content into narrative synthesis prompt`);
} else {
  console.log(`  ℹ️  No program profile found at ${profilePath}`);
  console.log(`    → Would use fallback template or generic voice`);
  console.log(`\n  Example with fallback:`);

  try {
    const profile = loadVoiceProfile(profilePath, { fallbackToTemplate: true });
    console.log(`    ✓ Loaded fallback from: ${profile.path}`);
    console.log(`      This profile can be passed to narrative synthesis as context`);
  } catch (error) {
    console.error(`    ✗ Failed to load fallback:`, error);
  }
}

console.log('\n' + '═'.repeat(80));
console.log('\n💡 Next Steps:');
console.log('   • Copy profiles/TEMPLATE.md to profiles/{school}-{sport}.md');
console.log('   • Fill in the questions with program-specific answers');
console.log('   • Pass the profile content to narrative synthesis prompts');
console.log('   • Outputs will reflect your program\'s voice and priorities\n');
