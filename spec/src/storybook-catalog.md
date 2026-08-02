# Storybook Catalog

Storybook is Mira's sole browsable documentation, demo, and component test host.
Its catalog data is repository-owned test/documentation input, not a published
runtime dependency.

## Requirements

| ID           | Requirement                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-CAT-001 | Storybook MUST render every canonical spec chapter from raw `spec/src` Markdown and link internal chapter references to their Storybook mirrors.         |
| MIRA-CAT-002 | Plugin and public component pages MUST provide a concise description and a link to the governing spec chapter or anchor.                                 |
| MIRA-CAT-003 | Focused fixtures and the comprehensive demo document MUST live under the Storybook catalog with no manually synchronized copies.                         |
| MIRA-CAT-004 | The comprehensive demo MUST provide fixed source, live-preview, preview, and split stories using identical Markdown and adapter data.                    |
| MIRA-CAT-005 | Every testable public story MUST render in the Storybook browser test project; meaningful stateful behavior MUST use a `play` interaction.               |
| MIRA-CAT-006 | New visual stories MUST enter review as `visual-pending`; existing approved baselines MUST remain compare-only unless a separate mutation is authorized. |

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

Every public or Storybook-visible styled surface has a concise catalog page.
Compound primitives share family pages, and React and Vanilla wrappers point
to the Svelte/default UI surface they adapt.

## Host and fixture ownership

The repository does not ship a separate documentation or demo application.
`pnpm dev` starts the root Storybook, and `tests/storybook` targets published
Storybook entries. `stories/demo/comprehensive-demo.md` is the full portable
feature fixture; all four fixed view stories import that same file. Focused
fixtures under `stories/markdown` remain the smaller debugging surfaces.
