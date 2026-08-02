# Storybook Catalog

Storybook is Mira's sole browsable documentation, demo, and component test host.
Its catalog data is repository-owned test/documentation input, not a published
runtime dependency.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-CAT-001 | Storybook MUST render every canonical spec chapter from raw `spec/src` Markdown and link internal chapter references to their Storybook mirrors.                                                                                       |
| MIRA-CAT-002 | Plugin and public component pages MUST provide a concise description and a link to the governing spec chapter or anchor.                                                                                                               |
| MIRA-CAT-003 | Focused fixtures and the comprehensive demo document MUST live under the Storybook catalog with no manually synchronized copies.                                                                                                       |
| MIRA-CAT-004 | The comprehensive demo MUST provide fixed source, live-preview, preview, and split stories using identical Markdown and adapter data.                                                                                                  |
| MIRA-CAT-005 | Every testable public story MUST render in the Storybook browser test project; meaningful stateful behavior MUST use a `play` interaction.                                                                                             |
| MIRA-CAT-006 | New visual stories MUST enter review as `visual-pending`; baseline mutation MUST use the installed Visual Delta suite and requires a separate authorized review.                                                                       |
| MIRA-CAT-007 | Every shipped `@lapismd/mira/ui` primitive family MUST have representative rendered Storybook coverage with interaction or semantic assertions.                                                                                        |
| MIRA-CAT-008 | Public opt-in preview surfaces MUST have a discoverable focused story, and the comprehensive demo MUST expose the same option wherever it materially changes a supported view.                                                         |
| MIRA-CAT-009 | Storybook MUST expose independent built-in-palette and light/dark globals, render ordinary stories through inherited page appearance, and provide fixed built-in, system, custom-extension, and targeted-overlay verification stories. |

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
and portal settlement. Story-only icon dependencies are prebundled so a clean
browser run cannot invalidate its story modules with a mid-suite Vite reload.

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
The add-on writes each committed baseline URL into the owning story's
`parameters.visualDelta` metadata and marks regenerated stories
`visual-pending`; Storybook MUST NOT infer a second URL scheme at preview time.
The current catalog contains 122 indexed stories, all with plugin-owned metadata
and committed baseline images. Stories retain `visual-pending` until human
acceptance is recorded separately. The visual gate intentionally exposes
missing baselines for new pending stories rather than silently treating them as
approved. Once baselines exist, `pnpm test:visual`
invokes the affected preflight in the add-on's clean Docker stage; its
deliberately missing cache produces a full-suite fallback before compare-only
validation.

## Host and fixture ownership

The repository does not ship a separate documentation or demo application.
`pnpm dev` starts the root Storybook, and `tests/storybook` targets published
Storybook entries. `stories/demo/comprehensive-demo.md` is the full portable
feature fixture; all four fixed view stories import that same file. Focused
fixtures under `stories/markdown` remain the smaller debugging surfaces.
