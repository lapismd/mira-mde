# Architecture and Boundaries

Mira is a pnpm monorepo of independently buildable public products. Supported
entry points are defined in [Public packages and entry points](packages.md), and
dependency direction flows from the composable editor toward plugins, the
batteries-included editor, and thin framework adapters.

## Requirements

| ID            | Requirement                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-001 | Packages MUST preserve their documented public entrypoints unless a breaking change is explicitly authorized.                                                  |
| MIRA-ARCH-002 | Portable packages MUST NOT depend on Lapis vault, workspace, route, sidebar, metadata-worker, settings-persistence, or plugin-registry services.               |
| MIRA-ARCH-003 | Extensions MUST integrate through Mira callbacks, resolvers, adapters, commands, renderer hooks, and CodeMirror extensions rather than application singletons. |
| MIRA-ARCH-004 | Every workspace package MUST expose deterministic check, test where applicable, and build behavior compatible with root orchestration.                         |
| MIRA-ARCH-005 | Storybook MUST be the only repository application used for browsable documentation, demos, component examples, and interaction scenarios.                      |

## Package boundary

The six-package public graph separates installation products from implementation
modules. `@lapismd/mira` owns the portable runtime and supported advanced
subpaths; plugins, the default editor, and adapters depend only on those public
entry points. Private placeholder adapters and source under `src/internal` are
never shipped as independent products.

The portable controller, extension SDK, CodeMirror layers, preview renderer,
tables, UI primitives, theme, and composable Svelte surface are implemented in
the single `packages/mira` workspace. Its internal source layout may remain
modular, but downstream workspaces resolve it only through the supported
`@lapismd/mira` export map.

The root Storybook may compose every package for documentation and acceptance,
but package source must not import Storybook-owned catalog data. Packages used
directly by Storybook stories, including `@lapismd/mira/ui`, are explicit root
workspace dependencies so clean Vite builds do not rely on transitive package
resolution.

Storybook's palette addon and manager color-mode control are host-only tooling.
They update the preview document's public theme attribute and shadcn-compatible
mode classes; runtime packages remain unaware of Storybook. Fixed appearance
stories apply their variants through public editor props and story-local page
wrappers so rendering a Canvas cannot replace the Docs page's global selection.

The former `apps/demo` and `apps/docs` workspaces are retired. The root package
owns Storybook development, static builds, and browser acceptance. The
`packages` directory contains exactly six public products; unimplemented Vue
and Solid placeholders remain private under `internal/adapters`.

Root quality gates compose the specification, catalog, package, Storybook, and
browser checks. In particular, `storybook:check` validates catalog metadata and
CSS-token coverage before building the static host and running compare-only
visual validation. `build-storybook` first builds every workspace package so
the static host and canonical container capture do not depend on stale local
`dist` output. Its explicit 4 GB Node heap ceiling fits within the pinned
capture profile while accommodating the complete catalog bundle.

The root owns the Vitest 4 Storybook project and its Chromium browser provider;
package-local Vitest configurations continue to own pure unit tests. The
consolidated Mira workspace owns the former subsystem suites so package test
commands cannot inherit the root Storybook browser project. The Playwright
configuration is split by
responsibility: the default config belongs to the
installed Visual Delta suite, while `playwright.storybook.config.ts` owns the
focused Storybook acceptance tests. Visual Delta reuses its prewarmed, validated
static server during both update and comparison runs so a second process cannot
race the canonical capture host. Baseline URLs are written directly into each
story's `parameters.visualDelta` metadata by the add-on; no parallel path mapper
or preview-time fallback is maintained.

The canonical Docker runner stages a clean workspace without
`storybook-static` or affected-state cache. `pnpm test:visual` therefore uses
the add-on's affected preflight: the missing cache requires a full-suite
fallback, builds Storybook inside the pinned environment, and then performs a
read-only comparison of every indexed story. The add-on's direct `test --all`
path is not used because it assumes an already-staged static build.
