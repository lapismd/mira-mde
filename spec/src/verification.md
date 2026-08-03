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
| MIRA-CSS-011                                                                                            | Computed callout, task-state, and floating-surface theme assertions       | Implemented by theme token repair     |
| MIRA-CSS-012                                                                                            | Cataloged indentation tokens and continuation-widget browser geometry     | Implemented by indentation repair     |
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
complete set passed strict compare-only validation. The repository-wide visual
pass threshold is fixed at `0.064%`. The threshold-hardening slice reviewed and
regenerated the nine affected appearance/configuration baselines, corrected the
three stale theme metadata URLs to their canonical nested-import identities, and
then passed the complete strict compare-only suite at that threshold.
Renamed Mira Editor identities replaced the orphaned Default UI paths during
the same mutation step.

The focused indentation coverage slice raises the catalog to 132 indexed
stories. The 122 prior stories remain baseline-covered; the ten new list,
continuation, nested-quote, active-prefix, and indent-width stories are
`visual-pending` without baseline metadata until a separate authorized review.
Their Storybook play functions require every regression target to remain inside
the initial editor viewport, and focused Chromium acceptance owns the browser
geometry assertions.

The continuation-alignment repair records an inactive-widget regression where
the parent bullet content began at `130.24px` while ordinary continuation text
collapsed to `115.24px`; revealing the raw two-space prefix moved that content
to `132.03px`. The repair is complete when default source and live-preview
continuations align with their parent content within `1.5px`, caret movement
does not change that column, and eight-space preformatted list content retains
two non-zero indent segments. Before the code-block follow-up, that preformatted
line rendered as a `67.20px` indentation widget followed by a text-only inline
code chip, leaving the line without reading-mode block chrome. The repaired
source and live-preview line use one continuous block surface with the same
background, approximately `2px` border, `4px` radius, and `16px` block padding
as reading mode while keeping the authored indentation editable. The
full-height guide follow-up additionally
requires each enabled wrapped-line guide pseudo-element to match its CodeMirror
line box within `2px`. Live-preview acceptance also requires inactive dash and
asterisk markers to expose the styled-bullet hook and non-zero rendered bullet,
then reveal the authored marker when the caret enters its prefix. Implementation
is complete: focused Chromium acceptance passes all 13 indentation cases
(including the unchanged expected failure for
the unrelated blockquote whitespace row), the caret-geometry case passes 16
repeated runs, and wrapped-row plus full-height-guide coverage passes 8 repeated
runs per case. Direct browser inspection measured the source and live-preview
guide at `67.203px` against a `67.203px` wrapped line box. The same inspection
measured inactive dash and asterisk live-preview bullets at approximately
`4.9px` square with the same `rgb(99, 101, 111)` fill and token-resolved size as
their reading-mode bullets. The focused unit suite passes 13 tests, the Mira
package check, test, and build gates pass, and `pnpm spec:check`,
`pnpm catalog:check`, and `pnpm check:all` pass.
The catalog and static-build portions of the final `pnpm storybook:check` pass.
Its compare-only visual stage exits non-green with 19 review-required snapshot
deltas (13 in the repaired indentation and list surfaces, plus 6 shared
editor-surface snapshots); no visual baselines were created or refreshed for
this repair.

The add-on's Docker stage excludes both `storybook-static` and its affected
cache. The `test:visual` gate therefore uses the affected preflight to build in
the pinned stage and deterministically fall back to the full catalog; the direct
`test --all` route would otherwise select zero stories before waiting on a
missing static host. The ten UI-primitive stories and two focused Markdown
outline variants are now baseline-covered. Stories retain `visual-pending`
until human acceptance is recorded separately; this review state does not mean
their committed baseline or deterministic comparison is missing.

The Visual Delta suite is reviewed at `0.0.3`. This release routes Storybook's
Diff Browser action through the same canonical capture runner used by the CLI,
so a host-local browser cannot be mislabeled as the Linux/ARM64 baseline target.
The published tarball includes source files but omits its source-build tsconfig,
and its compare-only artifact scan includes newly generated `.turbo` manifests
as though they were Visual Delta sidecars. Mira therefore applies a narrow pnpm
patch that uses the shipped `dist` worker unless the tsconfig exists and excludes
Turbo's disposable build cache from capture staging and artifact validation.
Remove the patch when an upstream release includes both guards. The upgrade is
compare-only and does not authorize baseline image changes.

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
