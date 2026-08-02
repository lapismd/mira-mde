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
