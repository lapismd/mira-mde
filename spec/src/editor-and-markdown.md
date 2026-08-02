# Portable Markdown and Editor

Mira provides the portable part of the Lapis Markdown editing contract without
its application runtime. The renderer and editor surfaces share syntax,
resolvers, extension contributions, source fallback, and shipped plain CSS.

## Requirements

| ID          | Requirement                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-MD-001 | Source, live-preview, reading/preview, embedded preview, and split surfaces MUST render the same supported Markdown feature families.                                                                                                                                        |
| MIRA-MD-002 | Supported portable syntax MUST include frontmatter, headings, inline formatting, lists, task states, blockquotes, callouts, links, wikilinks, tags, code, math, images, embeds, directives, footnotes, pipe tables, grid tables, and Mermaid through its plugin.             |
| MIRA-MD-003 | Rendered inline and block widgets MUST provide a path back to editable Markdown source where the corresponding Lapis surface does.                                                                                                                                           |
| MIRA-MD-004 | File-backed behavior MUST be expressed through `MiraFileAdapter`, link/asset resolvers, watchers, and renderer callbacks; consumers retain storage and navigation ownership.                                                                                                 |
| MIRA-MD-005 | Live-preview widgets MUST preserve CodeMirror line, gutter, wrapping, selection, and scroll geometry.                                                                                                                                                                        |
| MIRA-MD-006 | Split view MUST synchronize editor and preview scrolling by ratio while keeping each surface independently scrollable.                                                                                                                                                       |
| MIRA-MD-007 | The comprehensive and focused Storybook fixtures MUST cover every feature listed by MIRA-MD-002.                                                                                                                                                                             |
| MIRA-MD-008 | Editor inputs, task controls, and icon-only widget chrome MUST expose stable accessible names; public Storybook stories MUST pass automated accessibility checks except for explicitly documented non-content CodeMirror geometry.                                           |
| MIRA-MD-009 | Internal editor action menus MUST pair accessible text with a semantic Lucide icon where one exists, or reserve the same leading icon column for consumer-defined actions without a semantic icon.                                                                           |
| MIRA-MD-010 | The opt-in Markdown outline MUST mirror rendered heading IDs and navigate within the preview scroll owner. Its default floating marker rail MUST expand into a titled panel and track the active heading; a persistent sidebar MUST remain available as an explicit variant. |

## Lapis reference boundary

Portable DOM shape, class hooks, spacing, icons, menus, source toggles, table
chrome, Mermaid controls, and interaction behavior should match Lapis where
practical. Vault indexing, note lifecycle, workspace views, media URL ownership,
cross-file property mutation, settings persistence, and sidebars are excluded.

The Lapis Markdown Feature Tour and CodeMirror Layout Showcase are reference
fixtures. Mira owns adapted Storybook copies with consumer-neutral paths and
adapters.

Callout and task-state rendering consumes public RGB-channel tokens inside
`rgb()` and `rgba()` declarations. Those tokens therefore remain raw channel
triplets in every color mode; mode selection changes the channel value without
changing its grammar. Floating Markdown surfaces similarly consume a complete
shadow token rather than a color-only function.

Portable parser type declarations are included through normal module imports so
the package remains compatible with the repository TypeScript and lint gates.

The implementation is consolidated inside `@lapismd/mira`: controller and file
contracts are exposed from `/core`, plugin contracts from `/extensions`,
curated CodeMirror factories from `/codemirror`, rendering from `/preview`, and
table surfaces from `/tables`. `createMiraCodeMirrorExtensions` is the shared
composition boundary used by editor products and adapters; CodeMirror source
beneath `src/internal` is not a consumer import path.

The public composable Svelte surface is named `Mira`, with `MiraProps` and
`MiraHandle`; its semantic shell hooks begin with `.mira`. Removed `Mde` names
and `.mira-mde*` hooks are neither exported nor retained as compatibility
selectors.
