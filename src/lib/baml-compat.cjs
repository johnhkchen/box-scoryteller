/**
 * BAML CommonJS Compatibility Shim
 *
 * This file re-exports the CommonJS @boundaryml/baml module
 * to make it compatible with ESM imports in Vite's SSR.
 */

// Import the entire CommonJS module
const baml = require('@boundaryml/baml');

// Re-export everything
module.exports = baml;
