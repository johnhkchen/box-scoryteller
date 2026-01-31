/**
 * Tests for voice profile loading
 */

import { describe, it, expect } from 'vitest';
import {
  loadVoiceProfile,
  voiceProfileExists,
  getVoiceProfileTemplate,
  VoiceProfileError,
} from './voice-profile.js';

describe('loadVoiceProfile', () => {
  it('should load the template profile', () => {
    const result = loadVoiceProfile('profiles/TEMPLATE.md');

    expect(result).toBeDefined();
    expect(result.content).toContain('Voice Profile Template');
    expect(result.content).toContain('Program Identity');
    expect(result.content).toContain('Who are you?');
    expect(result.path).toContain('TEMPLATE.md');
    expect(result.isTemplate).toBe(true);
  });

  it('should throw VoiceProfileError when profile does not exist', () => {
    expect(() => {
      loadVoiceProfile('profiles/nonexistent.md');
    }).toThrow(VoiceProfileError);
  });

  it('should fall back to template when profile does not exist and fallback is enabled', () => {
    const result = loadVoiceProfile('profiles/nonexistent.md', {
      fallbackToTemplate: true,
    });

    expect(result).toBeDefined();
    expect(result.content).toContain('Voice Profile Template');
    expect(result.isTemplate).toBe(true);
  });

  it('should return correct metadata for template', () => {
    const result = loadVoiceProfile('profiles/TEMPLATE.md');

    expect(result.path).toMatch(/profiles[\/\\]TEMPLATE\.md$/);
    expect(result.isTemplate).toBe(true);
  });
});

describe('voiceProfileExists', () => {
  it('should return true for existing template', () => {
    expect(voiceProfileExists('profiles/TEMPLATE.md')).toBe(true);
  });

  it('should return false for non-existent profile', () => {
    expect(voiceProfileExists('profiles/nonexistent.md')).toBe(false);
  });
});

describe('getVoiceProfileTemplate', () => {
  it('should return the template profile', () => {
    const result = getVoiceProfileTemplate();

    expect(result).toBeDefined();
    expect(result.content).toContain('Voice Profile Template');
    expect(result.isTemplate).toBe(true);
  });
});
