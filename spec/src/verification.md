# Verification

This matrix is both requirement traceability and the implementation progress
artifact. The Storybook-only host, six-package public architecture, and
authorized baseline regeneration migrations are complete.

| Requirements                                                                                            | Evidence                                                                                                               | Status                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-001, MIRA-ARCH-002, MIRA-ARCH-003, MIRA-ARCH-004                                              | Package exports, package checks/tests/builds, boundary review                                                          | Implemented                                                                                        |
| MIRA-ARCH-005                                                                                           | Storybook-only host migration and root script checks                                                                   | Implemented by catalog-host slice                                                                  |
| MIRA-ARCH-006, MIRA-ARCH-007, MIRA-ARCH-008, MIRA-ARCH-009, MIRA-ARCH-010, MIRA-ARCH-011, MIRA-ARCH-012 | Package manifests, boundary checker, pack fixtures, and catalog migration                                              | Implemented by six-package migration                                                               |
| MIRA-ARCH-013                                                                                           | Theme stylesheet exports and tarball resolution checks                                                                 | Implemented by extensible theme slice                                                              |
| MIRA-ARCH-014                                                                                           | Mira Editor build output and package-version synchronization test                                                      | Implemented by About dialog slice                                                                  |
| MIRA-ARCH-015                                                                                           | Public handle, adapter, and declarative-toolbar contract tests                                                         | Implemented by adapter slice                                                                       |
| MIRA-ARCH-016                                                                                           | Shared public graph, registry planner, tarball manifest, and release tests                                             | Implemented                                                                                        |
| MIRA-ARCH-017                                                                                           | Public block-control and action-placement contract tests                                                               | Implemented by core and adapter slices                                                             |
| MIRA-ARCH-018                                                                                           | Extension export, type, package-build, and migration contract tests                                                    | Implemented by doodle-divider core slice                                                           |
| MIRA-ARCH-019                                                                                           | Root manifest link, lockfile importer, package-boundary and pack checks                                                | Implemented by sibling Visual Delta wiring                                                         |
| MIRA-ARCH-020                                                                                           | Root-only Storybook tool boundary and sibling resolution checks                                                        | Implemented by sibling Visual Delta wiring                                                         |
| MIRA-MD-001, MIRA-MD-002, MIRA-MD-003, MIRA-MD-004, MIRA-MD-005, MIRA-MD-006                            | Package unit tests, Layout Showcase, Storybook browser acceptance                                                      | Implemented; hidden heading-formatting geometry regression covered in a real linked consumer story |
| MIRA-MD-007                                                                                             | Comprehensive fixture plus focused Storybook fixtures                                                                  | Implemented; catalog checker enforced                                                              |
| MIRA-MD-008, MIRA-MD-009                                                                                | Enforced Storybook accessibility and icon-bearing editor controls                                                      | Implemented                                                                                        |
| MIRA-MD-010                                                                                             | Focused outline story plus Storybook browser navigation acceptance                                                     | Implemented                                                                                        |
| MIRA-MD-011                                                                                             | Computed typography parity across source, live preview, and reading                                                    | Implemented by typography repair                                                                   |
| MIRA-MD-012                                                                                             | Nested blockquote task source and checkbox browser assertions                                                          | Implemented by quoted-task repair                                                                  |
| MIRA-MD-013                                                                                             | Task-state registry tests and focused picker interaction/geometry checks                                               | Implemented by task-picker slice                                                                   |
| MIRA-MD-014                                                                                             | Core action-engine syntax, selection, transaction, and readonly tests                                                  | Implemented by action-engine slice                                                                 |
| MIRA-MD-015                                                                                             | Source-table Storybook computed typography and row-geometry assertions                                                 | Implemented by table parity slice                                                                  |
| MIRA-UI-001, MIRA-UI-002, MIRA-UI-003, MIRA-UI-004, MIRA-UI-005                                         | Mira Editor, React, and Vanilla tests/builds                                                                           | Implemented                                                                                        |
| MIRA-UI-006, MIRA-UI-007, MIRA-UI-008                                                                   | Storybook browser project and UI primitive `play` interactions                                                         | Implemented                                                                                        |
| MIRA-UI-009                                                                                             | Svelte package checks and focused outline browser acceptance                                                           | Implemented                                                                                        |
| MIRA-UI-010                                                                                             | Cross-framework appearance contract tests                                                                              | Implemented by extensible theme slice                                                              |
| MIRA-UI-011                                                                                             | Version-sync unit test and toolbar About dialog Storybook interaction                                                  | Implemented by About dialog slice                                                                  |
| MIRA-UI-012                                                                                             | Core action-engine tests and focused source/live-preview toolbar stories                                               | Implemented by toolbar-action slice                                                                |
| MIRA-UI-013                                                                                             | Selection-toolbar unit, contract, and focused Storybook interactions                                                   | Implemented by selection-toolbar slice                                                             |
| MIRA-UI-014                                                                                             | Block classification, conversion, framework, and Storybook interactions                                                | Implemented by contextual block-toolbar slice                                                      |
| MIRA-CSS-001, MIRA-CSS-002                                                                              | Package stylesheet exports, no-Tailwind package checks                                                                 | Implemented                                                                                        |
| MIRA-CSS-003, MIRA-CSS-004, MIRA-CSS-005, MIRA-CSS-006                                                  | Public surface/token registry and catalog checker                                                                      | Implemented by catalog/token slice                                                                 |
| MIRA-CSS-007, MIRA-CSS-008, MIRA-CSS-009, MIRA-CSS-010                                                  | Theme CSS contracts, component tests, and portaled-overlay stories                                                     | Implemented by extensible theme slice                                                              |
| MIRA-CSS-011                                                                                            | Computed callout, task-state, and floating-surface theme assertions                                                    | Implemented by theme token repair                                                                  |
| MIRA-CSS-012                                                                                            | Cataloged indentation tokens and continuation-widget browser geometry                                                  | Implemented by indentation repair                                                                  |
| MIRA-CSS-013                                                                                            | Computed task-delimiter colors in source and live-preview edit states                                                  | Implemented by quoted-task repair                                                                  |
| MIRA-CSS-014                                                                                            | Task picker hover/focus visibility, portaled icon reuse, and line geometry                                             | Implemented by task-picker slice                                                                   |
| MIRA-CSS-015                                                                                            | Light/dark logo crop geometry in focused theme story interactions                                                      | Implemented by About dialog slice                                                                  |
| MIRA-CSS-016                                                                                            | Shipped source-table selector and focused computed-style acceptance                                                    | Implemented by table parity slice                                                                  |
| MIRA-AI-001, MIRA-AI-002, MIRA-AI-003                                                                   | `packages/mira-plugin-ai` unit tests                                                                                   | Implemented                                                                                        |
| MIRA-AI-004                                                                                             | Deterministic AI story interaction                                                                                     | Implemented                                                                                        |
| MIRA-MERMAID-001, MIRA-MERMAID-002, MIRA-MERMAID-003, MIRA-MERMAID-004                                  | Mermaid package tests and existing Storybook stories                                                                   | Implemented                                                                                        |
| MIRA-MERMAID-005                                                                                        | Expanded Mermaid story interaction matrix                                                                              | Implemented                                                                                        |
| MIRA-CAT-001                                                                                            | Raw spec mirrors, link rewriting, one-to-one checker tests                                                             | Implemented by catalog-host slice                                                                  |
| MIRA-CAT-002                                                                                            | Catalog descriptions and governing-spec links                                                                          | Implemented by catalog/token slice                                                                 |
| MIRA-CAT-003, MIRA-CAT-004                                                                              | Storybook fixture consolidation and comprehensive demo stories                                                         | Implemented by catalog-host slice                                                                  |
| MIRA-CAT-005                                                                                            | Vitest Storybook browser project and interaction tests                                                                 | Implemented                                                                                        |
| MIRA-CAT-006                                                                                            | Addon-owned Visual Delta suite and authorized regenerated baselines                                                    | Implemented by visual baseline slice                                                               |
| MIRA-CAT-007                                                                                            | Catalog coverage checker and ten focused UI `play` assertions                                                          | Implemented                                                                                        |
| MIRA-CAT-008                                                                                            | Focused outline story and comprehensive outline control                                                                | Implemented                                                                                        |
| MIRA-CAT-009                                                                                            | Theme globals, fixed appearance stories, and browser assertions                                                        | Implemented by extensible theme slice                                                              |
| MIRA-CAT-010                                                                                            | Visual Delta host formatter configuration and source mutation regression                                               | Implemented                                                                                        |
| MIRA-CAT-011                                                                                            | Comprehensive all-plugin audit and contextual-toolbar Storybook assertions                                             | Implemented by comprehensive plugin audit                                                          |
| MIRA-GOV-001, MIRA-GOV-002, MIRA-GOV-003, MIRA-GOV-004, MIRA-GOV-005, MIRA-GOV-006, MIRA-GOV-007        | configured shared validation, shared regression tests, `pnpm spec:check`, pull-request workflow                        | Implemented by governance slice                                                                    |
| MIRA-GOV-008                                                                                            | Package-boundary checker and tarball leak tests                                                                        | Implemented                                                                                        |
| MIRA-GOV-009, MIRA-GOV-010, MIRA-GOV-011                                                                | Changeset intent gate, protected release workflow, and post-publish checks                                             | Implemented; external environment setup pending                                                    |
| MIRA-GOV-013                                                                                            | `AGENTS.md` sibling-link policy and portable manifest boundary                                                         | Implemented                                                                                        |
| MIRA-MD-016                                                                                             | Live-preview table source-reveal typography and geometry interaction                                                   | Implemented by table fallback slice                                                                |
| MIRA-CSS-017                                                                                            | Shared raw-table source/live selector and computed-style acceptance                                                    | Implemented by table fallback slice                                                                |
| MIRA-MD-017                                                                                             | Editable list-highlight catalog, mutation, and surface-boundary acceptance                                             | Implemented by list-highlight slice                                                                |
| MIRA-MD-018                                                                                             | Comprehensive reading grid/callout structure and live-preview gap geometry                                             | Implemented by comprehensive repair                                                                |
| MIRA-CSS-018                                                                                            | Layout-stable marker trigger and portaled highlight picker acceptance                                                  | Implemented by list-highlight slice                                                                |
| MIRA-CSS-019                                                                                            | Consecutive live-preview callout painted-gap and zero-margin acceptance                                                | Implemented by comprehensive repair                                                                |
| MIRA-MD-019, MIRA-CSS-020                                                                               | Grid-table keymap, serialization, selection, and computed typography                                                   | Implemented by grid-table parity                                                                   |
| MIRA-MD-020                                                                                             | Block metadata, safe conversion, undo, selection, and geometry tests                                                   | Implemented by contextual block toolbar core                                                       |
| MIRA-MD-021, MIRA-CSS-021                                                                               | Seed lifecycle, SVG determinism, logical-block, and Storybook acceptance                                               | Implemented: 299 Mira, 146 Storybook, 44 E2E                                                       |
| MIRA-MD-022, MIRA-CSS-022, MIRA-CAT-012                                                                 | Live Preview divider reroll, stable replacement-widget family picker, and layout acceptance                            | Implemented by divider-control slice                                                               |
| MIRA-MD-023                                                                                             | Lapis icon, breakpoint, and narrow-row Storybook assertions                                                            | Implemented by frontmatter icon alignment                                                          |
| MIRA-UI-015, MIRA-CSS-023, MIRA-CAT-013                                                                 | Narrow toolbar overflow, touch CSS, and keyboard/browser interactions                                                  | Implemented by responsive-toolbar slice                                                            |
| MIRA-UI-016                                                                                             | Portable icon component test plus Lapis File Properties story assertion                                                | Implemented by frontmatter icon alignment                                                          |
| MIRA-UI-017                                                                                             | Sole-authority CSS plus Lapis responsive geometry assertions                                                           | Implemented by responsive frontmatter alignment                                                    |
| MIRA-ARCH-021                                                                                           | Public preview package build and portable icon component test                                                          | Implemented by frontmatter icon alignment                                                          |
| MIRA-UI-014, MIRA-CSS-024                                                                               | Combined block/task trigger clearance, sizing, and click interactions                                                  | Implemented by contextual-control clearance                                                        |
| MIRA-CSS-025                                                                                            | Reading/live blockquote/embed accent and border geometry assertions                                                    | Implemented by blockquote accent repair                                                            |
| MIRA-CSS-026                                                                                            | Line-number font, numeral, color, and column-alignment assertions                                                      | Implemented by line-number gutter typography                                                       |
| MIRA-CSS-027                                                                                            | Theme-contract tests plus computed H1-H6 reading/editor Storybook styles                                               | Implemented; 305 Mira tests and 5 stories pass                                                     |
| MIRA-CSS-028                                                                                            | Shipped CSS plus Lapis breakpoint/no-overflow assertions                                                               | Implemented by responsive frontmatter alignment                                                    |
| MIRA-MD-024                                                                                             | Portable preview component collapse/expand interaction plus linked Lapis acceptance                                    | Implemented by frontmatter disclosure repair                                                       |
| MIRA-ARCH-022                                                                                           | Public preview package build plus portable frontmatter disclosure interaction                                          | Implemented by frontmatter disclosure repair                                                       |
| MIRA-MD-025, MIRA-CSS-029                                                                               | Owner-document portal, lazy preview, full sticky collision, focus, and linked Lapis cross-pane hit testing             | Implemented by internal-link overlay repair                                                        |
| MIRA-ARCH-023                                                                                           | Public preview package build plus linked Lapis split-pane acceptance                                                   | Implemented by internal-link overlay repair                                                        |
| MIRA-MD-026, MIRA-CSS-030                                                                               | Editable-preview activation, offsets, persistence lifecycle, error retention, scroll ownership, and hover-card pinning | Implemented by editable-preview slice                                                              |
| MIRA-ARCH-024                                                                                           | Public adapter and preview exports, package tests, Storybook interaction, and linked Lapis persistence acceptance      | Implemented by editable-preview slice                                                              |
| MIRA-MD-027, MIRA-CSS-031, MIRA-ARCH-025                                                                | Minimal padded card paint, two-pixel editing border, focus/hover pinning, and persistence-safe outside-click dismissal | Implemented by editable-preview card alignment                                                     |
| MIRA-MD-028, MIRA-CSS-032, MIRA-ARCH-026                                                                | Portaled internal-link previews retain inherited trigger theme and color-mode attributes                               | Implemented by effective-appearance propagation                                                    |
| MIRA-MD-029, MIRA-ARCH-027                                                                              | Captioned adapter-backed image embeds avoid duplicate nested image alternatives                                        | Implemented by embed accessibility repair                                                          |
| MIRA-MD-030, MIRA-ARCH-028                                                                              | Default and base-free composition tests plus public package type and build verification                                | Implemented by portable composition control                                                        |
| MIRA-MD-031, MIRA-ARCH-029                                                                              | Pipe-table Enter regression preserves the active column without a runtime binding error                                | Implemented by table Enter repair                                                                  |
| MIRA-UI-018, MIRA-CSS-033, MIRA-ARCH-030, MIRA-MD-032, MIRA-CAT-014, MIRA-GOV-012                       | Public shell unit tests, internal adoption, catalog contract, package checks/build, and linked Design Core acceptance  | Implemented by generic CodeMirror shell slice                                                      |
| MIRA-MD-033, MIRA-ARCH-031, MIRA-CSS-034, MIRA-CAT-015                                                  | Search-panel structure and query tests, focused catalog interaction, package build, and linked Lapis acceptance        | Implemented by compact Find and Replace slice                                                      |
| MIRA-MD-034, MIRA-ARCH-032, MIRA-CSS-035                                                                | Block-toolbar portal geometry and CodeMirror teardown regression coverage                                              | Implemented                                                                                        |
| MIRA-CSS-036                                                                                            | Obsidian palette contract assertion plus linked Roles Source story axe coverage                                        | Implemented                                                                                        |
| MIRA-MD-035, MIRA-CSS-037, MIRA-ARCH-034                                                                | Mira UI source contract rejects unscoped generic popover-content paint and stacking selectors                          | Implemented by popover ownership repair                                                            |
| MIRA-MD-036                                                                                             | Pipe- and grid-table keyboard focus enters the inline editor; linked Lapis authoring acceptance                        | Implemented by table keyboard-focus repair                                                          |
| MIRA-ARCH-033                                                                                           | Public Mira package build plus linked Roles Source story axe coverage                                                  | Implemented                                                                                        |

The selective-release slice defines the exact six-package graph once, configures
independent Changesets versions and package-owned changelogs, and uses
pre-1.0-compatible public dependency ranges. Nineteen focused release tests cover
intent, stable version planning, local-behind rejection, artifact integrity,
safe reruns, provenance, version synchronization, and package tags. A live
read-only npm plan selects the six unpublished `0.0.1` packages in dependency
order and marks the run as bootstrap-only; preparation produces six verified
tarballs, while a local publish attempt stops at the approved-CI guard.
`actionlint` validates both CI workflows. Final repository validation passes
`pnpm spec:check`, `pnpm catalog:check`, `pnpm packages:pack`, `pnpm check:all`,
`pnpm build-storybook`, and all 44 `pnpm test:e2e` browser tests against a fresh
Storybook host. No package was published and no visual baseline was created or
refreshed. Activating the pipeline still requires the external public
repository, protected `npm-bootstrap` and `npm-production` environments, the
one-time token, and six npm trusted-publisher registrations described in
`RELEASING.md`; repository implementation is not evidence that those external
controls are configured.

The context-aware toolbar action slice adds one shared CodeMirror engine for
ten action identifiers and exposes it through the Mira, Mira Editor, React, and
Vanilla handles. Core coverage verifies compatible delimiter removal,
word/whitespace behavior, nested syntax, link targets, multiline normalization,
selection direction, one-step undo and redo, focus and scroll stability, and
readonly rejection. Framework suites verify smart dispatch, accessible default
items, feature filtering, standalone template fallback, and source/reading
availability. Two `skip-visual` Storybook interactions exercise first-click and
repeat-click results for headings, all four inline formats, links, blockquotes,
and all three list types in both Source and Live Preview through the public
handle harness; the focused Chromium project passes both stories.

The selection-toolbar slice exports the optional `selectionToolbarExtension`
from Mira's portable extension entrypoint and the lower-level CodeMirror
factory from `/codemirror`. Its default link, bold, italic, and strikethrough
buttons preserve the active selection and delegate to the same Markdown action
engine; consumers can reorder the five supported inline actions, override
labels, and prefer above or below placement. Each square action target has a
`999px` circular radius and exposes exact enclosing syntax through
`aria-pressed`; activating a pressed action unwraps that syntax while retaining
the selected text. The pill combines its token border with a lower inset edge
so its complete outline remains visible above the light-theme shadow. The
extension is absent from readonly and reading surfaces, hides for collapsed or
blurred selections, and supports Tab entry, arrow-key navigation, and Escape
return to the editor. The Mira suite passes 259 tests, while the focused
Storybook Chromium run passes the default and active-formatting visual stories
and both source/live-preview action stories. Live browser inspection measures
the centered pill at `139.94px` by `40px`, with a `1px` token border, `999px`
radius, `8px` selection gap, and less than `0.001px` selection-center delta. The
dedicated stories remain `visual-pending`; no visual baseline was created or
refreshed.

The contextual block-toolbar slice extends the existing first-row drag gutter
and block-range model without changing its default geometry. The opt-in trigger
uses authored block semantics, the anchored menu performs content-preserving
single-block conversions in one transaction, and explicit custom placements
work through Svelte, React, and Vanilla. Core tests cover classification,
custom tasks, every safe structural conversion, rich-block exclusions,
keyboard/focus behavior, readonly and multi-selection gating, undo, and portal
cleanup. Focused Source, Live Preview, and open-menu Storybook interactions all
pass. Live browser inspection measures a `24px` circular trigger, an `18px`
page-wide post-gutter allowance, less than `0.01px` wrapped first-row delta,
and a zero-width `16px` collapse control contained by that allowance. Heading
and ordinary block line boxes retain the same content column. The
body-level themed menu remains fully inside the viewport with an `8px` edge
gap in light and dark modes. All three stories remain `visual-pending`; no
visual baseline was created or refreshed.

Final validation passes `pnpm spec:check`, `pnpm catalog:check`, the affected
Mira, Mira Editor, React, and Vanilla check/test/build gates, `pnpm
build-storybook`, `pnpm packages:pack`, and `pnpm check:all`. The focused
Storybook Chromium project passes the Source, Live Preview, and deterministic
open-menu stories. The full Storybook browser suite passes 42 of 44 cases; its
two remaining failures are the unrelated indentation assertions for inactive
list-marker classes and caret-state preformatted indentation.

The compare-only Visual Delta fallback captures all 137 browser cases in 3.9
minutes without mutating repository files. Its strict policy reports seven
missing baselines: the three new `visual-pending` block-toolbar stories plus
four pre-existing pending stories. It also reports the unrelated established
`Demo/Comprehensive/Playground` and grid-table Source-mode mismatches. The other
130 result records pass policy, and no baseline or approval state is created or
updated.

The source-table parity slice ports Lapis's `cm-table` source treatment through
Mira's existing monospace token and verifies five padded pipe-table rows against
ordinary prose in Source and the editable Live Preview fallback. The focused
Tables Storybook project passes all three stories; live Storybook inspection
resolves the revealed Live Preview rows to Source Code Pro with `white-space:
pre` and stable 379.29-379.31 px widths while prose remains Inter. Canonical
single-story Visual Delta captures pass and report the expected review deltas:
5,127 pixels for `markdown-tables--source-mode` and 7,419 pixels for
`markdown-tables--live-preview`. Compare-only mode does not update either
approved baseline.

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
stories. All 132 are now baseline-covered. The ten new list, continuation,
nested-quote, active-prefix, and indent-width stories have canonical
Linux/ARM64 Chromium PNGs and explicit baseline metadata, while remaining
`visual-pending` until human review. Their Storybook play functions require
every regression target to remain inside the initial editor viewport, and
focused Chromium acceptance owns the browser geometry assertions.

The 2026-08-05 Visual Delta source-format audit traced the repository's
31-file Prettier failure to 30 TypeScript CSF files whose review tags had been
rewritten as compact four-status arrays, plus the independently formatted
`.visual-delta/config.json`. The story changes contained no semantic or
baseline-wiring delta. Mira now opts the linked Visual Delta host into its
shell-free Prettier formatter contract so candidate CSF source is formatted
with the exact story path before a single physical write. Addon and downstream
formatter tests pass, as do `pnpm spec:check`, `pnpm catalog:check`,
`pnpm check:all`, and the static Storybook build. The unrelated project-config
JSON formatting is outside this story-source repair.

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

The nested-quote whitespace follow-up reproduced a live-preview block widget
inheriting CodeMirror's `white-space: break-spaces`: its outer quote measured
`341.17px` high against `194.17px` in reading mode, the paragraph-to-list gap
expanded from `16px` to `53px`, and the nested list expanded from `23.09px` to
`65.09px`. The repair resets rendered block widgets to normal whitespace,
keeps explicit paragraph and code whitespace rules intact, restores the nested
quote to the focused live-preview fixture, and verifies its internal spacing
against the reading surface without updating visual baselines. After the
Storybook restart, live preview measured `194.17px` high with `normal`
whitespace, `0px` top/list insets, a `16px` paragraph-to-list gap, and a
`23.09px` nested list, matching the reading-mode measurements. All 14 focused
Chromium indentation cases pass, including the intentionally retained expected
failure marker for the unrelated whitespace-only CodeMirror row.
The source and live-preview nested-list stories now consume the same
`nestedListsAndQuotesMarkdown` fixture, so the indented blockquote section is
present in both modes and both play assertions require every shared target to
remain visible in the initial editor viewport. The first quote group uses the
unordered parent's continuation indent and is asserted beneath that list item
in reading mode; the final quote group remains attached to its ordered parent.

The aligned fixture exposed a parser-precedence mismatch in its final section:
Lezer retained the `3.` list marker as a lazy continuation of the preceding
nested quote and consequently classified the four-space child quote as a
`CodeBlock`, while reading mode produced `OrderedList > ListItem > Blockquote`.
Mira now ends the lazy quote leaf when an unquoted list marker drops an active
blockquote context. The editor syntax tree therefore matches reading mode,
keeps genuine eight-space list code unchanged, renders the child as a
`Blockquote` widget by default, renders that widget from the syntax node rather
than its list indentation, and no longer applies indented-code chrome to that
content. Source-position mapping retains the authored range for widget edits.
Focused unit and Chromium acceptance cover the exact fixture without creating
or refreshing visual baselines.

The reading-only indentation follow-up keeps the first quote group as a direct
child of its unordered parent. When that parent already owns a nested list, a
reading-mode quote pseudo-element continues the existing list guide through the
quote's top and bottom spacing without changing live-preview widget geometry.
Painted-pixel inspection exposed a `2.97px` horizontal displacement that the
original browser assertion missed: both pseudo-elements reported `-1.5ch`, but
the quote segment's positioned containing block began after the tokenized `3px`
blockquote border. The repair subtracts that computed border thickness from the
quote segment inset, and Chromium acceptance compares the actual painted
coordinates rather than the two declared offsets.
The live-preview edit-state follow-up restores Lapis's active-line contract:
the line-owned outer blockquote border remains in the rendered column while a
nested marker pseudo-border becomes transparent and the authored quote markers
become visible. First-depth quote prefixes no longer create a second border.
Browser acceptance measures the rendered parent border before entering source,
then asserts that every editable child row retains that column and that the
displaced active nested border is not painted.
The complete focused Chromium indentation suite passes all 20 cases, including
the retained expected-failure marker for the unrelated whitespace-only
CodeMirror row. The parser and widget unit suite passes all 218 package tests;
the package check and build, canonical spec check, and catalog check also pass.
No visual baselines were created or refreshed for this repair. The full
`pnpm check:all` gate remains blocked at its initial Prettier check by 31
pre-existing Storybook and Visual Delta configuration files outside this
repair; none of this repair's files appear in that failure list.

The list-control alignment follow-up reproduced two independent geometry
errors in the nested list fixture. Reading mode used a range union across every
wrapped text row, placing four controls about `10.5px` below their first-row
markers while the single-line parent appeared correct. Live preview centered
controls on the first row but retained an `8px` inline gap between the control
hitbox and the marker. The repair uses the first rendered range rectangle in
reading mode and removes the stale live-preview translation. Focused Chromium
acceptance measures every foldable ordered and unordered row and exercises the
collapse/expand interaction without changing visual baselines.

The editor-typography follow-up reproduced ordinary source and live-preview
Markdown at `Source Code Pro`, while the same reading-mode prose used the
consumer-overridable `Inter`/system sans stack. The CodeMirror editor shell
already selected the sans token, but its descendant scroller explicitly reset
all editable content to `--mira-font-mono`. The repaired scroller now consumes
the public sans token with a Mira fallback, while the existing code-specific
hooks retain `--font-monospace`. Direct browser inspection resolves source,
live-preview, and reading prose to the same `Inter`/system sans stack and the
indented code block to `Source Code Pro`. All 18 focused Chromium indentation
cases pass, including the retained expected-failure marker for the unrelated
whitespace-only CodeMirror row; the 215-test package suite, package check and
build, and canonical spec gate also pass. No visual baselines were created or
refreshed for this repair.

The nested-task edit follow-up reproduced the opening `[` of the authored
`- [ ]` marker as a zero-width `.cm-formatting-hidden` span after entering the
quoted checklist line. The task range parser accepted indentation followed by
a list marker but did not account for intervening blockquote prefixes, so the
task-specific source reveal and checkbox replacement paths were both skipped.
The repaired parser separates optional quote prefixes from the list marker,
and the shared Markdown decoration layer gives `[value]` a stable
`.cm-formatting-task` hook in both editor modes. Direct browser inspection
measures the complete live-preview `[ ]` delimiter at `14.17px` and source at
`14.16px`; both resolve to muted `rgb(105, 115, 134)` while their task content
remains `rgb(29, 29, 32)`. Moving the caret into the task content restores the
interactive checkbox. All 19 focused Chromium indentation cases pass,
including the retained expected-failure marker for the unrelated
whitespace-only CodeMirror row; all 218 package tests, the package check and
build, and the canonical spec gate also pass. No visual baselines were created
or refreshed for this repair.

The editable task-picker slice centralizes Mira's 22 shipped standard and
custom checkbox states and mounts one shared Popover-backed control in both
live-preview task widgets and editable preview checkboxes. The icon-only
trigger remains absolutely positioned and hidden until its task line is
hovered or focused. Its pointer hit area overlaps the checkbox edge to prevent
a dead hover gap, while the visible hover treatment remains at least `3px`
clear of the checkbox. Selecting a state closes the portaled menu, replaces
only the one-character authored marker, and immediately restores the matching
shipped task artwork without changing checkbox, text-column, or line-height
geometry. Read-only reading mode and raw source mode retain their existing
contracts. The shared registry and CodeMirror mutation tests pass within all
221 Mira package tests; package check and build, canonical spec and catalog
checks, root lint/test/build, and three focused Chromium cases pass. The
Chromium coverage includes the original hover-to-trigger movement, all 22 menu
options, custom-state selection, geometry stability, surface boundaries, and
the Comprehensive Live Preview fixture. No visual baseline was created or
refreshed. The aggregate `pnpm check:all` command remains blocked at its
initial Prettier step by an unrelated `.visual-delta/config.json` formatting
change outside this slice; none of this slice's files appears in that failure.

The editable list-highlight picker slice mounts one shared Popover-backed
control in live preview and editable preview while leaving raw source and
read-only reading markers passive. Its catalog consumes all resolved defaults
and extension contributions, excludes disabled markers, preserves custom marker
renderers, and adds a clear action. Focused Chromium acceptance verifies eight
options for the custom story (seven resolved markers plus clear), exact `&` to
`?` source replacement, separator-aware clearing, unchanged marker/content/line
geometry between highlight types, and the surface boundaries. Trigger and
option buttons remain transparent with no shadow at rest; browser inspection
resolves the open ghost state to a neutral background and a 1 px inset border
while retaining the configured marker color. The five focused Lists Storybook
interactions, two focused Playwright cases, all 249 Mira package tests, package
check and build, canonical spec and catalog checks, and `pnpm check:all` pass.
The compare-only Visual Delta capture also completes its browser case and
reports the expected pending change of 3,795 pixels (1 percent) against the
pre-picker reference. Strict comparison therefore exits non-zero; no visual
baseline was created or refreshed for this slice.

The list-highlight spacing follow-up replaces inherited marker margins with a
fixed padded slot. Browser geometry resolves to zero inline margins, a 1.4 px
bullet-to-border gap, and the same 16.5 px trigger footprint for text and icon
markers. Three focused Chromium cases verify compact post-marker spacing,
shared content columns, first-row centering, a background spanning the full
height of a wrapped CodeMirror line, unchanged source mutation geometry, and
the existing reading/source boundaries. Passive reading markers retain compact
padding after the parsed marker. Fresh compare-only Visual Delta captures pass
both browser cases and report the expected pending changes of 3,549 reading
pixels and 3,655 live-preview pixels (1 percent each). Strict comparison exits
non-zero; no visual baseline is refreshed by this follow-up.

The consecutive-highlight follow-up implements MIRA-MD-017 and MIRA-CSS-018
with adjacent-line end padding in Live Preview and an adjacent reading-panel
inset. The focused catalog fixture now includes an initially visible `?`
highlight that wraps in both stories. Browser geometry measures a 4.0 px gap
between all three adjacent Live Preview panels and a 3.2 px gap between all
three Reading panels, while CodeMirror line margins remain zero. The live
panel's start inset leaves more than 1 px after the rendered bullet, and the
final Reading panel leaves more than 1 px before the following plain item while
preserving its content column. The focused Chromium acceptance also verifies
that the wrapped background spans the full line height and its marker remains
centered on the first visual row. Visual
Delta compare-only runs pass both browser cases and report the expected pending
changes of 31,855 Reading pixels (5 percent) and 29,313 Live Preview pixels
(5 percent), including the newly visible wrapped example. Strict comparison
therefore exits non-zero; no visual baseline is created or refreshed by this
follow-up.

The Reading marker-column follow-up reproduces the final plain bullet 6.2 px to
the right of its highlighted siblings. The highlighted background layering
selector had overridden their absolute `list-bullet` boxes with zero-width
relative boxes while the plain row retained the shipped 1.4ch marker box. The
selector now excludes structural list controls. Direct browser inspection
measures identical 12.36 px absolute marker boxes with a 0 px center offset, and
focused Chromium acceptance requires highlighted and ordinary sibling marker
centers and widths to remain within 0.5 px. The three focused Playwright cases,
five Lists Storybook interactions, all 249 Mira package tests, package check and
build, canonical spec checks, and `pnpm check:all` pass. Live Preview geometry
is unchanged. The compare-only Visual Delta browser case passes and reports the
expected pending Reading change of 31,933 pixels (5 percent); strict comparison
therefore exits non-zero, and no visual baseline is created or refreshed.

The comprehensive rendering repair implements MIRA-MD-018 and MIRA-CSS-019. The shared fixture
had lost the column padding required by the Adobe grid-table grammar, so its
malformed table consumed the later one-line callouts as literal paragraphs in
Reading mode. A formatter-safe grid now produces the expected six table rows
and preserves all 16 rendered callouts, including the 12 colored gallery
variants. Consecutive Live Preview callouts use a transparent painted top edge
for a 5.9 px visual gap while every callout and CodeMirror widget margin stays
at zero. The two focused Chromium cases, canonical spec and catalog checks,
Mira package check, test, and build, and `pnpm check:all` pass. No visual
baseline is created or refreshed by this repair.

The grid-table source parity slice implements MIRA-MD-019 and MIRA-CSS-020.
Before the repair, Tab on the `Table Headings` row inserted four leading spaces,
reclassified it as an indented list line, and left grid rows without the table
line hooks that provide monospaced typography. Mira now composes Lapis's
grid-table keymap and line-decoration contract alongside the existing pipe-table
extension: Tab serializes the complete aligned grid and selects the next cell,
while Shift-Tab and Enter retain the grid navigation commands. All 19 authored
rows carry `cm-table`, `cm-formatting-table`, and `cm-formatting-grid-table` in
Source mode and after Live Preview's source reveal, resolving to the shared
monospaced, preformatted line style. The 251-test Mira suite, three Grid Tables
Storybook interactions, two focused Chromium keyboard/typography cases,
canonical spec and catalog checks, package build/publint, and `pnpm check:all`
pass. No visual baseline is created or refreshed by this slice.

The add-on's Docker stage does not trust authored `storybook-static` output,
but it transports the affected cache and preview graph and may restore a
checksum-verified canonical static build. The `test:visual` gate therefore uses
the affected preflight to reuse valid passing evidence and falls back to the
full catalog only when the graph or cache is unreliable. The ten UI-primitive
stories and two focused Markdown outline variants are now baseline-covered.
Stories retain `visual-pending` until human acceptance is recorded separately;
this review state does not mean their committed baseline or deterministic
comparison is missing.

The Visual Delta suite is resolved from the sibling checkout through the
private root's `link:../storybook-addon-visual-delta` development dependency.
It retains the canonical capture runner used by both Storybook's Diff Browser
action and the CLI, so a host-local browser cannot be mislabeled as the
Linux/ARM64 baseline target. The package retains the `0.0.4` guards that build a source worker only when
`tsconfig.node-build.json` exists, use its executable shipped `dist` worker
otherwise, and exclude `.turbo` from both clean-workspace staging and post-run
artifact inventory. The package carries focused regression tests for both
behaviors, so Mira consumes upstream without its former `0.0.3` pnpm patch.
Version `0.0.5` replaces the physical-path-sensitive,
repeated-story version 2 affected cache with compact logical version 3 state,
enables affected planning when the host option is omitted, and guardedly
revalidates eligible version 2 passes. It also caches verified canonical static
builds, calculates exact scopes without traversing the full catalog, avoids
duplicate host and Docker planning/build passes, reuses valid actual targets
independently, and collects expected strict-policy failures without restarting
the Playwright worker for every story. Mira declares its established
`nested-import` baseline path mode on root visual CLI scripts rather than
inheriting the release's flat `story-id` default. The upgrade remains
compare-only and does not authorize baseline image changes.

For linked-source operation, the add-on additionally recreates
workspace-local pnpm links in every
fresh canonical staging directory even after its dependency volume is warm. It
staged the external Visual Delta checkout at the consumer's resolved `link:`
target with a separate Linux dependency volume, so canonical capture neither
skipped package-local links nor imported macOS `node_modules`. Focused runner
tests cover both the warm relink command and isolated linked-source staging. The
staged copy was disposable and writable so pnpm could materialize the shipped CLI
bin without mutating the host checkout. A content-only fingerprint of the
linked manifest, lockfile, and source entered the canonical static-build key,
preventing a source edit from restoring stale output. The sibling checkout
remains the local integration source, while published releases remain
independently validated by the add-on repository.

Linked-source validation passes all 17 strict doctor checks, including a fresh
Storybook build and the full Linux/ARM64 runner probe, with no warnings or
errors. A fresh canonical Chromium run selects the exact ten Indentation
stories and all ten Playwright captures pass; strict policy initially exited
non-zero because those `visual-pending` stories intentionally had no approved
baselines. The subsequently authorized create-missing action forwarded Mira's
resolved nested-import baseline identity, selected only those ten missing
captures, wrote all ten exact PNGs, and passed an updates-disabled replay before
applying their story metadata. The existing 122 baselines were neither captured
nor rewritten, and the new stories remain pending human review. A second
fresh-workspace run recreates package-local links in `1.2s`, restores the
verified canonical Storybook build, and passes its selected continuation story.
The linked add-on itself passes `pnpm spec:check`, type checking, its complete
unit suite, and its Node build.

Earlier registry-upgrade validation resolved the unpatched published tarball
and verified the
packaging guards, cache-v3 migration, canonical build cache, single-pass
orchestration, and deferred policy-failure coverage in its shipped source before
installation. The authoritative downstream doctor rebuild passes 16 checks with
no warnings or errors, and its full canonical-runner probe passes. The affected
dry-run plans all 132 stories in `2.30s`; the full-suite selection is the
expected one-time conservative result of changing the root manifest. A focused
heading comparison passes after a `119.29s` cold canonical build, passes in
`11.08s` while restoring that verified build, and then passes in `2.93s` by
reusing its canonical actual. The migrated version 3 affected state is
path-independent, records two passing target fingerprints, and is `705151`
bytes. One intervening actual-reuse attempt reached the same `3.14s` fast path
but returned a transient macOS `ENOTEMPTY` while removing its temporary staging
directory; the immediate repeat passed without a downstream patch. The
dependency update also passes `pnpm spec:check`, `pnpm catalog:check`, and
`pnpm check:all`; no visual baseline is created or refreshed by the upgrade.

An earlier published-release restoration resolved
`@lapismd/storybook-addon-visual-delta@0.0.6` from pnpm's registry store rather
than the sibling checkout, and the lockfile records the published tarball's
integrity. The upstream strict doctor rebuild passes 16 checks with no warnings
or errors and inventories all 132 visual files. Its compare-only affected
dry-run selects all 132 stories because the root manifest changed, without
running captures, changing review status, or mutating a baseline. The migration
passes `pnpm spec:check`, `pnpm catalog:check`, and `pnpm check:all` against the
published package. The current workspace intentionally restores the sibling
link so local Storybook and compare-only tooling exercise local add-on source
without adding Visual Delta to any public Mira package.

The Storybook patch refresh aligns `storybook`, addon-a11y, addon-docs,
addon-themes, addon-vitest, and svelte-vite at `10.5.6`, while retaining the
independent MCP, Svelte CSF, icons, and third-party addon versions. Acceptance
passes `pnpm spec:check`, `pnpm catalog:check`, `pnpm check:all`, the complete
Storybook `10.5.6` static build, and all 27 focused Playwright browser tests,
including the unchanged expected-failure contract. The Vitest Storybook
project now reaches all 132 stories: 130 pass, while the two continuation
paragraph stories expose their existing no-scroll acceptance defect because a
target ending at `672.14px` exceeds the story's `640px` editor viewport. A
`10.5.3` control workspace cannot reach those assertions because that version
fails during Storybook/Vitest module setup; the continuation story source is
unchanged by this dependency slice. The compare-only visual runner captures all
132 stories, then correctly fails its artifact-safety guard after Playwright
modifies `stories/demo/source-chromium.png` in the protected baseline tree. The
generated mutation was restored byte-for-byte from the parent revision, so the
upgrade creates or refreshes no visual baseline.

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

The About dialog slice trims the combined light/dark logo from `1536x1024` and
`2159766` bytes to `960x337` and `148896` bytes while retaining the two source
variants. The root README selects derived left/light and right/dark crops for
GitHub's active color mode; Mira Editor ships the optimized combined sheet and
exports a manifest-synchronized version constant.
The toolbar overflow opens one accessible, theme-aware dialog whose bounded
viewport exposes the asset's left half in light mode and right half in dark
mode. Focused explicit-light, explicit-dark, and system-mode logo assertions
pass within the 14 Storybook theme and comprehensive tests. Direct Chromium
inspection measured a `240px` viewport and `480px` image, with a zero light
offset and exact `-240px` dark translation. The package
check, 22 unit tests, build/publint, six-package tarball consumer validation,
canonical spec and catalog gates, `pnpm check:all`, and the static Storybook
build pass. No visual baseline was created or refreshed.

The comprehensive all-plugin audit implements MIRA-CAT-011. Catalog discovery
finds both public first-party plugin packages, AI and Mermaid, and requires the
demo to import them alongside the selection toolbar and doodle-divider opt-ins.
Both the batteries-included and composable editor shells expose the contextual
block toolbar; editable views expose the selection toolbar, while a deterministic
local AI adapter exercises the plugin without credentials or network access.
Validation passes the canonical specification and catalog gates, all 146
Storybook tests, both focused Chromium acceptance tests, `pnpm check:all`, the
static Storybook build, and direct static-runtime smoke checks for both editor
shells. The full browser suite passes 43 of 45 tests; its two failures are the
pre-existing indentation cases for inactive unordered markers and the
preformatted continuation caret state. Compare-only Visual Delta captures all
six comprehensive stories successfully and reports the expected approved-image
differences of 1–3 percent after enabling the new UI. It creates or refreshes no
baseline and does not change story review status.

The divider authoring-control slice implements MIRA-MD-022, MIRA-CSS-022, and
MIRA-CAT-012. Writable Live Preview widgets expose a compact family picker and
refresh control directly before the existing source-edit button; Source,
Reading, readonly, bare-rule, and invalid-drawing surfaces remain unchanged.
The 301-test Mira suite covers deterministic family selection, rerolling to a
different family, custom seed factories, one-step undo, caret and scroll
preservation, menu keyboard/focus behavior, outside dismissal, and opt-out and
readonly boundaries. All 146 Storybook interactions and the focused Chromium
geometry/authoring acceptance pass, as do `pnpm spec:check`, `pnpm check:all`,
the Mira package build with publint, and the static Storybook build. Direct
Chromium inspection verifies the controls and radio menu in both the focused
divider story and Comprehensive Live Preview. Compare-only Visual Delta reports
the new pending divider story as missing its intentionally uncreated baseline
and retains the known 26,404-pixel Comprehensive difference; it creates or
refreshes no baseline and changes no review status.

The responsive main-toolbar slice implements MIRA-UI-015, MIRA-CSS-023, and
MIRA-CAT-013. Its shipped CSS keeps the toolbar in one native horizontal scroll
row, hides standards and WebKit scrollbar chrome, contains horizontal
overscroll, enables touch panning and momentum, and expands coarse-pointer hit
targets to 44 CSS pixels without changing fine-pointer geometry. The focused
narrow Storybook interaction verifies overflow, single-row geometry, computed
scroll and touch properties, and Home/End focus scrolling. Two focused Chromium
tests pass real horizontal-wheel input, keyboard traversal through the trailing
view controls, and a mobile coarse-pointer context. The 32 Mira Editor tests,
302 Mira tests, `pnpm spec:check`, `pnpm catalog:check`, `pnpm check:all`, package
builds with publint, and the static Storybook build pass. Direct Chromium review
confirms a compact scrollbar-free toolbar. The complete Storybook run passes
the new story and 146 of 147 interactions; its sole failure is the existing
doodle-divider menu-visibility interaction, outside this toolbar slice. The new
story remains `visual-pending`, and no visual baseline was created or refreshed.

The contextual-control clearance repair strengthens MIRA-UI-014 and implements
MIRA-CSS-024. Reproduction measured the previous contextual trigger at `24px`,
the shared post-gutter allowance at `18px`, and the top-level task-type trigger
extending `7.49px` into the contextual gutter's painted column. The repaired
geometry uses a `20px` contextual trigger, a `38px` dedicated gutter, and a
`28px` shared allowance; direct Chromium inspection measures `2.51px` of clear
space between the contextual and task hit areas. The focused Source, Live
Preview, and open-menu Storybook interactions pass, and the Comprehensive
Chromium interaction opens the real task picker, changes its marker, and keeps
the content column and horizontal scroll position stable. The 302 Mira tests,
`pnpm spec:check`, `pnpm catalog:check`, `pnpm check:all`, the Mira package
build with publint, and the static Storybook build pass. No visual baseline was
created or refreshed.

The blockquote accent repair implements MIRA-CSS-025 by bridging the default
blockquote border to the same theme-primary `--interactive-accent` used by
embed guides. The public blockquote override, thickness, nesting, and editable
geometry remain unchanged, and source mode retains its literal authored quote
markers. Static token-contract coverage and the focused Blockquotes Reading and
Live Preview Storybook plays assert the resolved accent; all three focused
stories pass. An Obsidian-theme browser inspection resolved the live guide to
`rgb(152, 115, 247)` and confirmed the nested guide remains aligned. The 303
Mira tests, package check and build with publint, `pnpm spec:check`,
`pnpm catalog:check`, `pnpm check:all`, and the static Storybook build pass.
Existing approved visual baselines remain unchanged until the intentional color
difference is separately reviewed.

The line-number gutter typography slice implements MIRA-CSS-026 by scoping the
public monospace bridge, `tabular-nums`, and theme-aware faint foreground to the
CodeMirror line-number column while retaining its existing end alignment,
synchronized line height, and gutter measurements. The focused unit regression
passes, and six Comprehensive Storybook tests cover the resolved font, color,
numeric variant, and a shared right edge across digit widths in Source and Live
Preview. An Obsidian-theme browser inspection resolved Source Code Pro,
`tabular-nums`, a 70%-faint foreground, and identical right-edge geometry for
the visible three-digit rows. The 304 Mira tests, package check and build with
publint, `pnpm spec:check`, `pnpm catalog:check`, `pnpm check:all`, and the
static Storybook build pass. Approved visual baselines remain unchanged.

The heading theme-contract slice implements MIRA-CSS-027 with explicit
`--mira-h1-*` through `--mira-h6-*` color, font, size, style, variant, weight,
and line-height variables. Each level color defaults through
`--mira-heading-color`, whose default is the body foreground, and the shipped
sizes, weights, and line heights now match Lapis exactly. The Obsidian-compatible
heading aliases, reading surfaces, and Source and Live Preview CodeMirror lines
all resolve through the same contract while raw Markdown delimiters retain their
separate muted treatment. The catalog documents all 42 level tokens and passes
with 115 documented tokens. The six theme-contract tests, complete 305-test
Mira suite, and five focused Chromium heading stories pass. Direct Chrome
inspection under the Obsidian theme confirms body-colored H1-H6 content and the
Lapis scale in Reading, Source, and Live Preview. `pnpm spec:check`, package
checks and builds with publint, the sequential 11-package test gate, and the
static Storybook build pass. The default concurrent `pnpm check:all` reaches its
test phase after passing checks and lint but exhausts test-runner resources when
all Vitest packages start together; the same packages pass sequentially. No
visual baseline was created or refreshed.

The portable parity audit recorded 59 present features, six consumer-adapter
boundaries, six Lapis-only behaviors, and no remaining portable P0-P2 gaps at
the time it was retired. This is historical evidence, not a waiver from current
tests or the requirements above.
