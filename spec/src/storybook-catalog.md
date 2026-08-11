# Storybook Catalog

Storybook is Mira's sole browsable documentation, demo, and component test host.
Its catalog data is repository-owned test/documentation input, not a published
runtime dependency.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-CAT-001 | Storybook MUST render every canonical spec chapter from raw `spec/src` Markdown and link internal chapter references to their Storybook mirrors.                                                                                                                                                                                   |
| MIRA-CAT-002 | Plugin and public component pages MUST provide a concise description and a link to the governing spec chapter or anchor.                                                                                                                                                                                                           |
| MIRA-CAT-003 | Focused fixtures and the comprehensive demo document MUST live under the Storybook catalog with no manually synchronized copies.                                                                                                                                                                                                   |
| MIRA-CAT-004 | The comprehensive demo MUST provide fixed source, live-preview, preview, and split stories using identical Markdown and adapter data.                                                                                                                                                                                              |
| MIRA-CAT-005 | Every testable public story MUST render in the Storybook browser test project; meaningful stateful behavior MUST use a `play` interaction.                                                                                                                                                                                         |
| MIRA-CAT-006 | New visual stories MUST enter review as `visual-pending`; baseline mutation MUST use the installed Visual Delta suite and requires a separate authorized review. Visual Delta upgrades MUST pass the Storybook build and compare-only visual gates before adoption.                                                                |
| MIRA-CAT-007 | Every shipped `@lapismd/mira/ui` primitive family MUST have representative rendered Storybook coverage with interaction or semantic assertions.                                                                                                                                                                                    |
| MIRA-CAT-008 | Public opt-in preview surfaces MUST have a discoverable focused story, and the comprehensive demo MUST expose the same option wherever it materially changes a supported view.                                                                                                                                                     |
| MIRA-CAT-009 | Storybook MUST expose independent built-in-palette and light/dark globals, render ordinary stories through inherited page appearance, and provide fixed built-in, system, custom-extension, and targeted-overlay verification stories.                                                                                             |
| MIRA-CAT-010 | Storybook's Visual Delta host MUST format every staged story-source mutation with Mira's repository Prettier configuration before the addon writes it. A formatter failure MUST leave the affected story source and static index unchanged rather than introducing a format-gate regression.                                       |
| MIRA-CAT-011 | The comprehensive demo MUST enable every first-party public plugin and opt-in authoring extension through deterministic local adapters in both editor shells. Its editable views MUST expose the selection toolbar and contextual block toolbar without requiring network access or consumer credentials.                          |
| MIRA-CAT-012 | The focused Live Preview divider story MUST exercise seed reroll and explicit family selection through the rendered widget controls, wait for the post-transaction widget replacement before opening its menu, and assert the authored seed, rendered family, visible menu semantics, and source-edit control remain synchronized. |
| MIRA-CAT-013 | A focused narrow Mira Editor story MUST prove that the main toolbar overflows horizontally without visible scrollbar chrome, preserves its single-row geometry and action order, scrolls through direct horizontal input, and brings its first and last controls into view through keyboard navigation.                            |

Ordinary README prose points to Storybook and the specification. It must not
become a parallel behavioral reference.

## Structured catalog metadata

`stories/catalog/catalog.mjs` is the Storybook-owned registry for public
surface descriptions, package and import information, governing spec links,
component-family membership, and CSS-token assignments. Its internal
`CatalogEntry` and `CssTokenDefinition` types do not change published package
APIs. Stories expose the registry through `parameters.mira.catalogId`,
`parameters.mira.spec`, and `parameters.mira.tokens`; wrapper pages reference
the underlying styled surface instead of duplicating token definitions.

The editor token table includes Mira's indentation size, unit, and composed
list-indent tokens so continuation-widget geometry remains part of the public
shipped-CSS contract. Its Markdown token table also documents the public
doodle-divider height and stroke-width variables.

Catalog examples import consolidated runtime surfaces through the supported
`@lapismd/mira` root and subpaths. They must not teach consumers former
implementation-workspace imports or reach into `packages/mira/src/internal`.

Every public or Storybook-visible styled surface has a concise catalog page.
Compound primitives share family pages, and React and Vanilla wrappers point
to the Svelte/Mira Editor surface they adapt.

`pnpm test:storybook` runs the indexed CSF stories in a dedicated Vitest 4
project using Chromium browser mode. Story `play` functions own portable,
user-visible interactions; browser-sensitive geometry and native browser APIs
remain in focused Playwright acceptance against Storybook iframes. That
acceptance covers scroll ownership and synchronization, pointer drag/drop,
table mutation and source reveal, native clipboard behavior, and Mermaid SVG
and portal settlement. Story-only icon dependencies and the preview palette
addon are prebundled so a clean browser run cannot invalidate story modules
with a mid-suite Vite reload.

Public stories run the accessibility addon as an enforced browser assertion.
The non-content CodeMirror gutter remains the sole global exclusion; any new
technical exclusion must be documented and scoped to the narrowest story.

The preview document owns `data-mira-theme` and the shadcn-compatible
`.light`/`.dark` color-mode signal. Storybook starts in deterministic light mode
for visual capture even though a consumer page without an explicit mode uses
the system preference. Ordinary stories inherit the toolbar globals. Fixed
theme stories use targeted component props and story-local page wrappers so
their variants cannot overwrite the owning Docs page's toolbar globals; they
also include computed-token assertions.

Visual capture, comparison, readiness, clipping, diff sidecars, and failure
policy are owned by the installed Visual Delta Playwright suite. The default
`playwright.config.ts` is therefore reserved for Visual Delta; focused
Storybook acceptance uses `playwright.storybook.config.ts`. Authoritative
capture uses the addon's pinned profile and `nested-import` baseline layout.
The root dependency range records the reviewed add-on release; upgrading it is
a catalog-infrastructure change and does not authorize baseline mutation.
Repository-local dependency patches MUST be narrow, documented in verification,
and removed after an upstream release provides the same tested behavior.
Compare-only acceptance uses a repository-wide `0.064%` changed-pixel pass
threshold; any result above that value requires a code correction or an
explicitly reviewed baseline refresh rather than a looser local override.
The add-on writes each committed baseline URL into the owning story's
`parameters.visualDelta` metadata and marks regenerated stories
`visual-pending`; Storybook MUST NOT infer a second URL scheme at preview time.
The current catalog contains 143 indexed stories. The two deterministic
Markdown-toolbar action stories are tagged `skip-visual` because they are
interaction harnesses rather than stable visual references; they also exercise
the opt-in selection toolbar in source and live-preview modes. A dedicated
selection-toolbar stories keep the selected-text popover, its complete unique
border, and its context-aware selected state visible for visual review. The
remaining 141 stories retain their existing Visual Delta metadata: 122 have
committed baseline images, and nineteen focused
stories remain `visual-pending` without baseline mutation until their separate
human review. The visual gate
intentionally exposes missing baselines for new pending stories rather than
silently treating them as approved. Once baselines exist, `pnpm test:visual`
invokes the affected preflight in the add-on's clean Docker stage. Valid
path-independent passing evidence reduces the scope;
missing, stale, or unreliable evidence conservatively selects the full eligible
catalog. The runner reuses a verified canonical static build when its logical
inputs match, and strict visual mismatches or missing baselines are collected
across the selected scope without restarting the Playwright worker after every
expected policy failure.

The focused divider page covers Source, Live Preview, Reading, custom variants,
the frozen v1 gallery, a 24-divider review page, and a story-only refresh
control. The Live Preview story additionally exercises the shipped inline reroll
and family picker beside the source-edit control, including its selected radio
state and the synchronized authored seed. All divider stories remain
`visual-pending`; their interactions verify
semantic native rules, hidden decorative SVGs, source fallback, deterministic
families, nested rules, and explicit migration without creating baselines.

## Host and fixture ownership

The repository does not ship a separate documentation or demo application.
`pnpm dev` starts the root Storybook, and `tests/storybook` targets published
Storybook entries. `stories/demo/comprehensive-demo.md` is the full portable
feature fixture; all four fixed view stories import that same file. The
comprehensive default and composable shells both enable the selection-toolbar
and doodle-divider extensions plus the public AI and Mermaid plugins. They use a
deterministic local AI callback, expose the contextual block toolbar in editable
views, and require no credentials or network access. The seeded thematic break
retains authored comment and rule source in Source mode while exercising the
rendered SVG in Live Preview and Reading modes. Focused fixtures under
`stories/markdown` remain the smaller debugging surfaces.
