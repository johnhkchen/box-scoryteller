/**
 * Voice Profile Loading
 *
 * Loads voice profile markdown files that configure institutional voice for narrative
 * synthesis. Voice profiles live at `profiles/{school}-{sport}.md` and contain
 * structured questions about program identity, audience, storytelling preferences,
 * and practical guidelines.
 *
 * This module implements the simple approach: return raw markdown that the LLM can
 * interpret directly. This preserves nuance and requires no parsing logic.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '../..');

/**
 * Result of loading a voice profile
 */
export interface VoiceProfileResult {
  /**
   * Raw markdown content of the voice profile
   * This can be injected directly into narrative synthesis prompts
   */
  content: string;

  /**
   * Path to the loaded profile file
   */
  path: string;

  /**
   * Whether this is the default template (not a filled-out profile)
   */
  isTemplate: boolean;
}

/**
 * Error thrown when a voice profile cannot be loaded
 */
export class VoiceProfileError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'VoiceProfileError';
  }
}

/**
 * Load a voice profile markdown file
 *
 * Voice profiles configure institutional voice for narrative synthesis. They contain
 * structured questions about program identity, audience, storytelling preferences,
 * and terminology that help the LLM generate content matching the program's style.
 *
 * @param profilePath - Path to the profile file, relative to project root or absolute.
 *                     Examples: 'profiles/marin-wbkb.md', 'profiles/TEMPLATE.md'
 * @param options - Loading options
 * @param options.fallbackToTemplate - If true and profile doesn't exist, return template instead
 * @returns VoiceProfileResult with the markdown content and metadata
 * @throws VoiceProfileError if the file doesn't exist and no fallback is configured
 *
 * @example
 * ```typescript
 * // Load a specific program's profile
 * const profile = loadVoiceProfile('profiles/marin-wbkb.md');
 * console.log(profile.content); // Full markdown content
 *
 * // Load with fallback to template
 * const profile = loadVoiceProfile('profiles/nonexistent.md', { fallbackToTemplate: true });
 * console.log(profile.isTemplate); // true
 * ```
 */
export function loadVoiceProfile(
  profilePath: string,
  options: { fallbackToTemplate?: boolean } = {}
): VoiceProfileResult {
  const { fallbackToTemplate = false } = options;

  // Resolve the path (handle both absolute and relative paths)
  const resolvedPath = profilePath.startsWith('/')
    ? profilePath
    : join(PROJECT_ROOT, profilePath);

  // Try to load the requested profile
  if (existsSync(resolvedPath)) {
    try {
      const content = readFileSync(resolvedPath, 'utf-8');
      const isTemplate = resolvedPath.includes('TEMPLATE.md');

      return {
        content,
        path: resolvedPath,
        isTemplate,
      };
    } catch (error) {
      throw new VoiceProfileError(
        `Failed to read voice profile at ${resolvedPath}`,
        resolvedPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  // Profile doesn't exist - try fallback to template if configured
  if (fallbackToTemplate) {
    const templatePath = join(PROJECT_ROOT, 'profiles', 'TEMPLATE.md');

    if (existsSync(templatePath)) {
      try {
        const content = readFileSync(templatePath, 'utf-8');

        return {
          content,
          path: templatePath,
          isTemplate: true,
        };
      } catch (error) {
        throw new VoiceProfileError(
          `Failed to read template profile at ${templatePath}`,
          templatePath,
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  // No profile found and no fallback
  throw new VoiceProfileError(
    `Voice profile not found at ${resolvedPath}${fallbackToTemplate ? ' and template fallback failed' : ''}`,
    resolvedPath
  );
}

/**
 * Check if a voice profile exists at the given path
 *
 * @param profilePath - Path to check, relative to project root or absolute
 * @returns true if the profile file exists
 *
 * @example
 * ```typescript
 * if (voiceProfileExists('profiles/marin-wbkb.md')) {
 *   const profile = loadVoiceProfile('profiles/marin-wbkb.md');
 * }
 * ```
 */
export function voiceProfileExists(profilePath: string): boolean {
  const resolvedPath = profilePath.startsWith('/')
    ? profilePath
    : join(PROJECT_ROOT, profilePath);

  return existsSync(resolvedPath);
}

/**
 * Get the default voice profile template content
 *
 * This is a convenience function that always returns the template,
 * which can be useful for showing SIDs what questions to answer.
 *
 * @returns VoiceProfileResult for the template
 * @throws VoiceProfileError if the template doesn't exist
 */
export function getVoiceProfileTemplate(): VoiceProfileResult {
  return loadVoiceProfile('profiles/TEMPLATE.md');
}
