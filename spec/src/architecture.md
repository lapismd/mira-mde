# Architecture and Boundaries

Mira is a pnpm monorepo of independently buildable packages. Package entrypoints
remain stable and dependency direction flows from contracts and controller code
toward rendering, UI, plugins, and thin framework adapters.

## Requirements

| ID            | Requirement                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-001 | Packages MUST preserve their documented public entrypoints unless a breaking change is explicitly authorized.                                                  |
| MIRA-ARCH-002 | Portable packages MUST NOT depend on Lapis vault, workspace, route, sidebar, metadata-worker, settings-persistence, or plugin-registry services.               |
| MIRA-ARCH-003 | Extensions MUST integrate through Mira callbacks, resolvers, adapters, commands, renderer hooks, and CodeMirror extensions rather than application singletons. |
| MIRA-ARCH-004 | Every workspace package MUST expose deterministic check, test where applicable, and build behavior compatible with root orchestration.                         |
| MIRA-ARCH-005 | Storybook MUST be the only repository application used for browsable documentation, demos, component examples, and interaction scenarios.                      |

## Package groups

- Controller and contracts: `core`, `extensions`, and `codemirror`.
- Markdown behavior: `codemirror-markdown`, `codemirror-rich`,
  `codemirror-tables`, and `preview`.
- Presentation: `ui`, `theme-obsidian`, `svelte`, and `default-ui`.
- Plugins: `plugin-ai` and `plugin-mermaid`.
- Adapters: `react` and `vanilla`; reserved adapters must remain thin.

The root Storybook may compose every package for documentation and acceptance,
but package source must not import Storybook-owned catalog data.
