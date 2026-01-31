/**
 * BAML Client Wrapper for Server-Side Use
 *
 * This wrapper ensures BAML client is only imported on the server side
 * and handles CommonJS interop issues with Vite.
 */

import { b } from '../../baml_client/index.js';

export { b };
