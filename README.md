# Ralph Svelte Chassis

A template project for SvelteKit applications, extracted from the Solar-Sim project. This chassis provides a reusable foundation for building web applications with the Ralph workflow.

## Prerequisites

- [just](https://github.com/casey/just) - Command runner
- [Bun](https://bun.sh) - Runtime and package manager
- [Claude Code](https://claude.ai/code) - AI coding assistant
- [Ralph](https://github.com/snarktank/ralph) - Autonomous loop runner (optional, for `just ralph`)

---

## Quick Start

1.  **Clone this template** (or use it to initialize a new repo).
2.  **Install dependencies**:
    ```bash
    bun install
    ```
3.  **Start development**:
    ```bash
    bun run dev
    ```

## Included Capabilities

-   **SvelteKit**: Full stack framework.
-   **Leaflet**: Geolocation and map UI components (in `src/lib/components/MapPicker.svelte`).
-   **Geo Utilities**: Tools for coordinate parsing and timezone lookup.
-   **Ralph Workflow Support**: `task-graph.yaml` and `docs/` structure for agentic coding.

## Project Structure

```
.
├── README.md                     # This file
├── task-graph.yaml               # DAG of implementation tasks (template)
│
├── docs/                         # Documentation structure
│   ├── specification.md          # Project specification
│   ├── happy_path.md             # Core use cases
│   └── active/                   # Active work tracking
│
├── src/                          # Source code
│   ├── lib/                      # Reusable components and libraries
│   └── routes/                   # App routes (currently empty landing page)
```

## Using this Template

1.  Rename `package.json` details to match your new project.
2.  Clear or update `docs/` content to reflect your new project's goals.
3.  Build your application in `src/routes`.
