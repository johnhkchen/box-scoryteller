/**
 * BAML ESM Compatibility Wrapper
 *
 * This file wraps the CommonJS @boundaryml/baml module
 * and exports it as ESM for use in Vite's SSR.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Import the CommonJS module
const baml = require('@boundaryml/baml');

// Import native module directly to get HttpRequest
const native = require('@boundaryml/baml/native');

// Re-export all named exports
export const {
  BamlRuntime,
  FunctionResult,
  FunctionResultStream,
  Image,
  Audio,
  Pdf,
  Video,
  invoke_runtime_cli,
  ClientRegistry,
  Collector,
  FunctionLog,
  LlmCall,
  LlmStreamCall,
  Usage,
  StreamTiming,
  Timing,
  TraceStats,
  BamlStream,
  BamlCtxManager,
  ThrowIfVersionMismatch,
  toBamlError,
  BamlAbortError,
  BamlClientHttpError,
  BamlValidationError,
  BamlClientFinishReasonError,
} = baml;

// HTTPRequest is undefined in the package but HttpRequest works
// The BAML generated code expects HTTPRequest, so alias it
export const HTTPRequest = native.HttpRequest;

// Also export the default
export default baml;
