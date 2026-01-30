BAML Project Setup

This directory contains BAML definitions that generate type-safe TypeScript clients for LLM interactions. BAML handles prompt engineering, type validation, and API calls with compile-time safety.

Getting Started

First copy the example environment file and add your API keys:

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

The generated TypeScript client lives in `baml_client/` at the project root. This directory is auto-generated and should not be edited directly — always modify the BAML source files and regenerate.

Core Commands

Generate TypeScript from BAML definitions:
```bash
npm run baml:generate
```

Run BAML test cases:
```bash
npm run baml:test
```

Start interactive development mode with hot reloading:
```bash
npm run baml:dev
```

Project Structure

`clients.baml` defines the LLM clients we can use. The project includes pre-configured clients for Claude (CustomSonnet4, CustomOpus4, CustomHaiku) and OpenAI models. Each client specifies the provider, model, and API key source.

`generators.baml` configures the TypeScript code generation. Output goes to `../baml_client` relative to this directory, with async as the default mode.

`hello.baml` provides a minimal test function that verifies the end-to-end pipeline works. This demonstrates BAML function definition, type generation, and LLM calls.

`resume.baml` is the default example provided by BAML init. You can keep this as a reference or remove it later.

Using Generated Code

Import the generated client in TypeScript:

```typescript
import { b, type GreetingResponse } from './baml_client';

// Call a BAML function
const result: GreetingResponse = await b.SayHello('World');
console.log(result.message);
```

The `b` object provides async methods for all defined BAML functions. Types are automatically generated from your class definitions.

Testing the Setup

A TypeScript integration test exists at `src/lib/baml/test-setup.ts`. This verifies that the BAML pipeline works end-to-end including TypeScript imports and API calls.

Configuration

Environment variables are loaded automatically by BAML. The clients reference `env.ANTHROPIC_API_KEY` and `env.OPENAI_API_KEY` which pull from your `.env` file.

The generator is configured for TypeScript in async mode, matching the SvelteKit project structure. If you need sync methods, update `default_client_mode` in `generators.baml` and regenerate.

Next Steps

With the foundation working, you can now define domain-specific types (like box score structures) and implement the parsing functions described in T-002-02 and T-002-03.
