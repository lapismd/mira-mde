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
stories. All 132 are now baseline-covered. The ten new list, continuation,
nested-quote, active-prefix, and indent-width stories have canonical
Linux/ARM64 Chromium PNGs and explicit baseline metadata, while remaining
`visual-pending` until human review. Their Storybook play functions require
every regression target to remain inside the initial editor viewport, and
focused Chromium acceptance owns the browser geometry assertions.

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
The complete focused Chromium indentation suite passes all 16 cases, including
the retained expected-failure marker for the unrelated whitespace-only
CodeMirror row. The parser and widget unit suite passes all 214 package tests;
the package check and build, canonical spec check, and catalog check also pass.
No visual baselines were created or refreshed for this repair. The full
`pnpm check:all` gate remains blocked at its initial Prettier check by 31
pre-existing Storybook and Visual Delta configuration files outside this
repair; none of this repair's files appear in that failure list.

The add-on's Docker stage does not trust authored `storybook-static` output,
but it transports the affected cache and preview graph and may restore a
checksum-verified canonical static build. The `test:visual` gate therefore uses
the affected preflight to reuse valid passing evidence and falls back to the
full catalog only when the graph or cache is unreliable. The ten UI-primitive
stories and two focused Markdown outline variants are now baseline-covered.
Stories retain `visual-pending` until human acceptance is recorded separately;
this review state does not mean their committed baseline or deterministic
comparison is missing.

The Visual Delta suite is reviewed at `0.0.5` and temporarily installed from
the sibling source checkout while the remaining integration issues are being
resolved. It retains the canonical capture runner used by both Storybook's Diff
Browser action and the CLI, so a host-local browser cannot be mislabeled as the
Linux/ARM64 baseline target. The package retains the `0.0.4` guards that build a source worker only when
`tsconfig.node-build.json` exists, use its executable shipped `dist` worker
otherwise, and exclude `.turbo` from both clean-workspace staging and post-run
artifact inventory. The package carries focused regression tests for both
behaviors, so Mira consumes the linked source without its former `0.0.3` pnpm
patch. Version `0.0.5` replaces the physical-path-sensitive,
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

The linked source additionally recreates workspace-local pnpm links in every
fresh canonical staging directory even after its dependency volume is warm. It
stages the external Visual Delta checkout at the consumer's resolved `link:`
target with a separate Linux dependency volume, so canonical capture neither
skips package-local links nor imports macOS `node_modules`. Focused runner tests
cover both the warm relink command and isolated linked-source staging. The
staged copy is disposable and writable so pnpm can materialize the shipped CLI
bin without mutating the host checkout. A content-only fingerprint of the
linked manifest, lockfile, and source enters the canonical static-build key,
preventing a source edit from restoring stale output.

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

Upgrade validation resolves the unpatched published tarball and verifies the
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

The portable parity audit recorded 59 present features, six consumer-adapter
boundaries, six Lapis-only behaviors, and no remaining portable P0-P2 gaps at
the time it was retired. This is historical evidence, not a waiver from current
tests or the requirements above.
