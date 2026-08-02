# Verification

This matrix is both requirement traceability and the implementation progress
artifact. The Storybook-only host, six-package public architecture, and
authorized baseline regeneration migrations are complete.

| Requirements                                                                                            | Evidence                                                                  | Status                                |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| MIRA-ARCH-001, MIRA-ARCH-002, MIRA-ARCH-003, MIRA-ARCH-004                                              | Package exports, package checks/tests/builds, boundary review             | Implemented                           |
| MIRA-ARCH-005                                                                                           | Storybook-only host migration and root script checks                      | Implemented by catalog-host slice     |
| MIRA-ARCH-006, MIRA-ARCH-007, MIRA-ARCH-008, MIRA-ARCH-009, MIRA-ARCH-010, MIRA-ARCH-011, MIRA-ARCH-012 | Package manifests, boundary checker, pack fixtures, and catalog migration | Implemented by six-package migration  |
| MIRA-ARCH-013                                                                                           | Theme stylesheet exports and tarball resolution checks                    | Implemented by extensible theme slice |
| MIRA-MD-001, MIRA-MD-002, MIRA-MD-003, MIRA-MD-004, MIRA-MD-005, MIRA-MD-006                            | Package unit tests, Layout Showcase, Storybook browser acceptance         | Implemented                           |
| MIRA-MD-007                                                                                             | Comprehensive fixture plus focused Storybook fixtures                     | Implemented; catalog checker enforced |
| MIRA-MD-008, MIRA-MD-009                                                                                | Enforced Storybook accessibility and icon-bearing editor controls         | Implemented                           |
| MIRA-MD-010                                                                                             | Focused outline story plus Storybook browser navigation acceptance        | Implemented                           |
| MIRA-UI-001, MIRA-UI-002, MIRA-UI-003, MIRA-UI-004, MIRA-UI-005                                         | Mira Editor, React, and Vanilla tests/builds                              | Implemented                           |
| MIRA-UI-006, MIRA-UI-007, MIRA-UI-008                                                                   | Storybook browser project and UI primitive `play` interactions            | Implemented                           |
| MIRA-UI-009                                                                                             | Svelte package checks and focused outline browser acceptance              | Implemented                           |
| MIRA-UI-010                                                                                             | Cross-framework appearance contract tests                                 | Implemented by extensible theme slice |
| MIRA-CSS-001, MIRA-CSS-002                                                                              | Package stylesheet exports, no-Tailwind package checks                    | Implemented                           |
| MIRA-CSS-003, MIRA-CSS-004, MIRA-CSS-005, MIRA-CSS-006                                                  | Public surface/token registry and catalog checker                         | Implemented by catalog/token slice    |
| MIRA-CSS-007, MIRA-CSS-008, MIRA-CSS-009, MIRA-CSS-010                                                  | Theme CSS contracts, component tests, and portaled-overlay stories        | Implemented by extensible theme slice |
| MIRA-AI-001, MIRA-AI-002, MIRA-AI-003                                                                   | `packages/mira-plugin-ai` unit tests                                      | Implemented                           |
| MIRA-AI-004                                                                                             | Deterministic AI story interaction                                        | Implemented                           |
| MIRA-MERMAID-001, MIRA-MERMAID-002, MIRA-MERMAID-003, MIRA-MERMAID-004                                  | Mermaid package tests and existing Storybook stories                      | Implemented                           |
| MIRA-MERMAID-005                                                                                        | Expanded Mermaid story interaction matrix                                 | Implemented                           |
| MIRA-CAT-001                                                                                            | Raw spec mirrors, link rewriting, one-to-one checker tests                | Implemented by catalog-host slice     |
| MIRA-CAT-002                                                                                            | Catalog descriptions and governing-spec links                             | Implemented by catalog/token slice    |
| MIRA-CAT-003, MIRA-CAT-004                                                                              | Storybook fixture consolidation and comprehensive demo stories            | Implemented by catalog-host slice     |
| MIRA-CAT-005                                                                                            | Vitest Storybook browser project and interaction tests                    | Implemented                           |
| MIRA-CAT-006                                                                                            | Addon-owned Visual Delta suite and authorized regenerated baselines       | Implemented by visual baseline slice  |
| MIRA-CAT-007                                                                                            | Catalog coverage checker and ten focused UI `play` assertions             | Implemented                           |
| MIRA-CAT-008                                                                                            | Focused outline story and comprehensive outline control                   | Implemented                           |
| MIRA-CAT-009                                                                                            | Theme globals, fixed appearance stories, and browser assertions           | Implemented by extensible theme slice |
| MIRA-GOV-001, MIRA-GOV-002, MIRA-GOV-003, MIRA-GOV-004, MIRA-GOV-005, MIRA-GOV-006, MIRA-GOV-007        | `pnpm spec:check`, checker tests, pull-request workflow                   | Implemented by governance slice       |
| MIRA-GOV-008                                                                                            | Package-boundary checker and tarball leak tests                           | Implemented                           |

## Validation tiers

- Specification-only: `pnpm spec:check`.
- Package change: affected package `check`, `test`, and `build` where exported
  code, styles, or wrappers change.
- Catalog change: Storybook browser tests and `pnpm build-storybook`.
- Interaction/geometry change: Storybook browser tests plus focused Playwright.
- Visual change: compare-only validation first; baseline mutation requires a
  separate approved review step through the installed Visual Delta suite.

The 2026-08-02 canonical-host migration included an authorized full baseline
regeneration because the addon's capture implementation and density supersede
the repository's older custom 3x harness. Static Storybook builds also compile
workspace packages first so the pinned clean capture environment cannot inherit
local build output, and use the documented 4 GB heap ceiling required by the
complete catalog. Visual runs reuse the addon's prewarmed static server in CI
and locally. All 122 indexed stories have committed baselines and explicit
`parameters.visualDelta` metadata. The extensible-theme slice regenerated its
eight new appearance identities and the affected Callouts preview in the
canonical nested-import layout; the four Mira/Obsidian light/dark captures have
distinct hashes. Representative high-risk surfaces were spot-reviewed, and the
complete set passed strict compare-only validation.
Renamed Mira Editor identities replaced the orphaned Default UI paths during
the same mutation step.

The add-on's Docker stage excludes both `storybook-static` and its affected
cache. The `test:visual` gate therefore uses the affected preflight to build in
the pinned stage and deterministically fall back to the full catalog; the direct
`test --all` route would otherwise select zero stories before waiting on a
missing static host. The ten UI-primitive stories and two focused Markdown
outline variants are now baseline-covered. Stories retain `visual-pending`
until human acceptance is recorded separately; this review state does not mean
their committed baseline or deterministic comparison is missing.

The UI primitive review also verifies that portaled dropdown and context menus
use the Lapis-compatible 14/20 interface type scale with leading semantic action
icons, and that a dialog's footer close action cannot inherit the absolute
positioning reserved for its icon-only close control. The exported Popover
family provides the shared floating-surface contract mirrored by CodeMirror's
coordinate-aware slash-command adapter.

Every tested package owns an explicit Vitest configuration. The consolidated
`@lapismd/mira` suite now covers 45 files and 195 controller, extension,
CodeMirror, preview, table, UI, and Svelte tests without inheriting the root-only
Storybook browser project. The batteries-included editor, AI, Mermaid, React,
and Vanilla downstream workspaces also pass their focused check, test, and build
gates against the public Mira entrypoints.

The portable parity audit recorded 59 present features, six consumer-adapter
boundaries, six Lapis-only behaviors, and no remaining portable P0-P2 gaps at
the time it was retired. This is historical evidence, not a waiver from current
tests or the requirements above.
