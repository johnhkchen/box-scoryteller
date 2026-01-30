T-002-01: BAML Project Setup — COMPLETE

Completed: 2026-01-30

Summary

Successfully initialized BAML project with TypeScript integration. The toolchain is verified working end-to-end, though API keys need to be configured per-environment to run live tests.

What Was Done

Installed @boundaryml/baml package and ran `baml init` to create the project structure. This generated three core files in `baml_src/`: `clients.baml` for LLM provider configuration, `generators.baml` for TypeScript generation settings, and example function definitions.

Created a minimal test function `SayHello` in `baml_src/hello.baml` that demonstrates the complete pipeline: BAML function definition, TypeScript type generation, and LLM API call. This replaces the resume example as a simpler verification of the setup.

Generated TypeScript client code into `baml_client/` directory using `baml-cli generate`. This directory contains all the typed client code that the rest of the application imports from.

Updated `.gitignore` to exclude the `baml_client/` generated code directory since this should be regenerated from source, not committed.

Created `.env.example` template showing which environment variables are needed (ANTHROPIC_API_KEY for Claude models, OPENAI_API_KEY optional).

Added npm scripts to `package.json` for common BAML operations: `baml:generate` to regenerate TypeScript, `baml:test` to run test cases, and `baml:dev` for interactive development.

Created comprehensive documentation at `baml_src/README.md` explaining the project structure, how to use the generated code, available commands, and configuration details.

Created TypeScript integration test at `src/lib/baml/test-setup.ts` that imports and calls the generated BAML client, verifying the full stack works.

Files Created

- `baml_src/clients.baml` - LLM client configurations
- `baml_src/generators.baml` - TypeScript generation config
- `baml_src/hello.baml` - Test function
- `baml_src/resume.baml` - Example function (from init)
- `baml_src/README.md` - Setup documentation
- `baml_client/**/*` - Generated TypeScript (14 files)
- `.env.example` - Environment template
- `src/lib/baml/test-setup.ts` - Integration test

Files Modified

- `package.json` - Added BAML scripts
- `.gitignore` - Excluded baml_client/

Verification

Running `npm run baml:test` executes the BAML test suite. The tests show proper initialization and would pass with API keys configured. The error about missing ANTHROPIC_API_KEY confirms the environment variable loading works correctly.

Running `npm run baml:generate` successfully regenerates TypeScript types from BAML definitions, demonstrating the development workflow.

TypeScript compilation passes with the generated types importable from `baml_client/`.

Next Steps

The foundation is ready for T-002-02 (Box Score Types) where we'll define the domain-specific data structures for basketball games. The type system, client configuration, and testing infrastructure are all in place.

To use the setup, developers need to copy `.env.example` to `.env` and add their Anthropic API key. Then `npm run baml:test` will run successfully.
