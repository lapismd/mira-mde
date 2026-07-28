# Lapis Markdown Parity Audit

## Audit stamp

- Audit date: 2026-07-29
- Mira source revision: `1a3aa482ecc3563e570b1fdacb26d662b8b9133d`
  (`Port Lapis search and replace panel to Mira CodeMirror`)
- Lapis source revision: `db08f863e9b4915e5ab2c9b2f3f525a7267e0e6e`
  (empty working-copy revision over `a371198e495d9e4e465c2960a04b3a4fd11f4023`)
- Mira root in evidence links: this repository
- Lapis root in evidence links: `../lapis-notes`
- Deliverable scope: audit only. No runtime behavior, public API, generated
  baseline, demo file, or asset was changed.

The Mira revision is the audited source base. Pre-existing local changes in
`apps/demo/src/routes/+page.svelte` and `assets/` were excluded from this audit
and its commit.

## Executive summary

Mira already covers most of Lapis's portable Markdown rendering and its central
editing surfaces. CommonMark/GFM content, frontmatter, callouts, tasks, links,
wikilinks, tags, code, math, Mermaid, pipe tables, grid tables, images,
footnotes, raw HTML, source mode, live preview, reading mode, and source
fallbacks are all represented in shipped packages, stories, tests, and
standalone CSS.

The most important confirmed gaps are concentrated in authoring behavior and
in contracts that Mira already declares but does not yet use:

1. **P0 quality hardening:** the expanded Mermaid dialog's seven icon-only
   pan/zoom controls have no accessible names or tooltips. This defect is also
   present in Lapis, so it is not a visual parity delta, but it should not be
   propagated as acceptable portable behavior.
2. **P1 core authoring:** built-in file, embed, heading, and display-text
   completion is absent even though `MiraFileAdapter.listFiles` and
   `getHeadings` already advertise the required data.
3. **P1 core authoring:** Lapis's HTML-to-Markdown paste and
   paste-URL-over-selection behavior is absent; Mira's paste path currently
   handles image files only.
4. **P1 cross-mode correctness:** directive syntax renders in reading mode but
   is not registered with Mira's CodeMirror parser, so it remains raw and
   structurally unrecognized in live preview.
5. **P1 API truthfulness:** extension `commands`, `toolbarItems`, and `styles`
   are collected by `resolveMiraExtensions` but are not consumed by the
   Svelte/default UI runtime.
6. **P1 continuity:** split scrolling is correctly synchronized by ratio, but
   switching between preview and editor modes does not map the visible
   document position as Lapis does.
7. **P1 document editing:** frontmatter lacks remove/cut/copy/paste property
   actions, embeds do not re-resolve after unresolved targets become available,
   and section/block embed behavior has no portable contract.

No P0 data-loss or correctness regression was confirmed. The P0 item above is
an accessibility defect discovered during runtime validation. The recommended
roadmap deliberately leaves vault indexing, backlinks, workspace state, media
views, and app command registration outside Mira's portable core.

## Method and classification

The Lapis inventory was built from:

- [the Markdown package specification](../lapis-notes/packages/plugins/plugin-markdown/spec.md),
  [plugin registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts),
  CodeMirror extensions, renderers, components, styles, and tests;
- the
  [Markdown Feature Tour](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>)
  and
  [CodeMirror Layout Showcase](<../lapis-notes/e2e-vault/plugin-markdown/CodeMirror Layout Showcase.md>);
- Mira's parser, preview, CodeMirror, rich-editor, tables, Mermaid, Svelte,
  default UI, extension contracts, framework wrappers, stories, tests, and
  existing visual baselines.

Statuses:

- **Present** — portable Lapis behavior is implemented with sufficient source,
  test, or runtime evidence.
- **Partial** — a useful implementation exists, but a material behavior,
  surface, or contract is incomplete.
- **Missing portable** — portable Lapis behavior has no Mira implementation.
- **Consumer adapter** — Mira should expose or use a portable boundary while a
  consumer supplies application data or lifecycle.
- **Lapis app-only** — capability belongs to the Lapis vault/workspace
  application and is not a Mira core gap.
- **Unverified** — evidence was insufficient to make a reliable claim.

Priorities apply only where follow-up is recommended:

- **P0** — correctness, data loss, or accessibility.
- **P1** — core authoring and cross-mode behavior.
- **P2** — parity, polish, reusable surfaces, or regression coverage.
- **P3** — optional or application integration.

Confidence is based on the strongest evidence available: **High** means source
plus tests/runtime or an unambiguous absence; **Medium** means source-only
comparison; **Low** means the relevant runtime could not be exercised.

## A. Markdown syntax and rendering

| Capability                                                   | Status  | Priority | Confidence | Evidence                                                                                                                                                                                                                                                                                                                            | Finding and follow-up                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------ | ------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CommonMark and GFM blocks/inline formatting                  | Present | —        | High       | [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M parity tests](packages/preview/src/remark/parity.test.ts), [L preview](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/markdown-preview/markdown-preview.svelte)                                                                          | Headings, emphasis, strong, strikeout, lists, blockquotes, thematic breaks, links, and GFM behavior are wired in both.                                                                                                                                                     |
| YAML frontmatter parsing and collapsible presentation        | Present | —        | High       | [M frontmatter component](packages/preview/src/components/frontmatter.svelte), [M tests](packages/preview/src/frontmatter/frontmatter.test.ts), [L frontmatter component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/frontmatter/frontmatter.svelte), Runtime M1-M3                                         | Mira parses typed/nested values, shows compact Properties UI, supports collapse, and decorates source delimiters. Editing differences are tracked separately.                                                                                                              |
| Blockquote callouts/admonitions                              | Present | —        | High       | [M transform](packages/preview/src/remark/callouts.ts), [M component](packages/preview/src/components/callout.svelte), [L transform](../lapis-notes/packages/plugins/plugin-markdown/src/lib/remark-plugins/callout.ts), Runtime M2-M3                                                                                              | Standard, expanded, collapsed, nested, and live-preview callouts are represented.                                                                                                                                                                                          |
| List callout markers                                         | Partial | P2       | High       | [M preview transform](packages/preview/src/remark/list-callouts.ts), [M live utility](packages/codemirror-rich/src/utils/list-callouts.ts), [L editor registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                                                                   | Mira has a fixed built-in catalog in preview/live paths. Lapis has one configured catalog with icons and style settings. Add a shared injectable catalog; keep persistence and settings UI consumer-owned.                                                                 |
| Task lists and extended task states                          | Present | —        | High       | [M transform](packages/preview/src/remark/custom-checklists.ts), [M live widget](packages/codemirror-rich/src/widgets/task-checkbox.ts), [M tests](packages/codemirror-rich/src/utils/tasks.test.ts), [L feature fixture](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>), Runtime M2                          | Standard and custom markers render and can be toggled without forcing Lapis-incompatible done-task strikeout in live preview.                                                                                                                                              |
| External, Markdown, and raw-space path links                 | Present | —        | High       | [M path-link transform](packages/preview/src/remark/pathlink.ts), [M CodeMirror parser](packages/codemirror-markdown/src/lapis-inline.ts), [M tests](packages/preview/src/remark/links.test.ts), [L registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                     | Raw-space destinations such as `[Label](My Note.md)` and external-link handling are covered.                                                                                                                                                                               |
| Wikilinks and tags                                           | Present | —        | High       | [M wiki transform](packages/preview/src/remark/wikilink.ts), [M tag transform](packages/preview/src/remark/tags.ts), [M inline parser](packages/codemirror-markdown/src/lapis-inline.ts), [L fixture](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>)                                                          | Reading/source/live syntax, display text, and class hooks are present. File lifecycle differences are tracked under adapters.                                                                                                                                              |
| File and note embeds                                         | Partial | P1       | High       | [M embed](packages/preview/src/components/embed.svelte), [M adapter contract](packages/extensions/src/index.ts), [L embed spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md), [L file embed](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/file-embed/file-embed.svelte)                           | Mira renders custom, Markdown, asset, and missing embeds, but it does not watch resolved embeds, recover unresolved targets after create/rename, define heading/block selection, or honor Lapis-style sized image embeds. Extend the adapter without importing vault APIs. |
| Markdown images, data images, reference images, and lightbox | Partial | P2       | High       | [M image component](packages/preview/src/components/image.svelte), [M image utilities](packages/core/src/images.ts), [M preview tests](packages/preview/src/preview.test.ts), [L image component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-image/Image.svelte)                                     | Standard, data-URI, upload-generated, and reference-style images work. Add Lapis's broken-image placeholder and file-change refresh; sized wiki-image syntax belongs with the embed follow-up.                                                                             |
| Fenced and inline code rendering                             | Present | —        | High       | [M code component](packages/preview/src/components/code.svelte), [M code styles](packages/preview/src/styles/code-katex.css), [L code renderer](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-code/Code.svelte), Runtime M3                                                                             | Highlighting, line options, copy action, and source fallback exist. Source-editing geometry and the missing language label are tracked under authoring.                                                                                                                    |
| Inline and block math, including bracket math                | Present | —        | High       | [M parser](packages/codemirror-markdown/src/latex.ts), [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M live tests](packages/codemirror-rich/src/utils/inline-math.test.ts), Runtime M3/M5                                                                                                                    | `$…$`, `$$…$$`, `\\(…\\)`, and `\\[…\\]` are parsed/rendered, and block source can be revealed.                                                                                                                                                                            |
| Mermaid rendering and source toggle                          | Present | —        | High       | [M plugin](packages/plugin-mermaid/src/index.ts), [M renderer](packages/plugin-mermaid/src/mermaid.svelte), [M tests](packages/plugin-mermaid/src/index.test.ts), [L renderer](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-mermaid/Mermaid.svelte), Runtime M3/M6                                     | Inline SVG, copy, expand, pan/zoom/reset behavior, render IDs, and source reveal match Lapis. Dialog-control accessibility is tracked separately.                                                                                                                          |
| GFM pipe tables                                              | Present | —        | High       | [M extension](packages/codemirror-tables/src/extension.ts), [M widget](packages/codemirror-tables/src/widgets/pipe-table-widget.ts), [M tests](packages/codemirror-tables/src/pipe-table.test.ts), Runtime M2-M3                                                                                                                    | Rendering, live editor, menus, row/column chrome, drag/drop, sizing, and source fallback are present.                                                                                                                                                                      |
| MultiMarkdown table spans                                    | Present | —        | High       | [M transform](packages/preview/src/remark/multimarkdown-table.ts), [M rehype spans](packages/preview/src/rehype-table-spans.ts), [M tests](packages/preview/src/remark/parity.test.ts)                                                                                                                                              | Colspan/rowspan-style reading behavior is implemented in Mira in addition to the core Lapis fixture.                                                                                                                                                                       |
| Adobe/grid tables                                            | Present | —        | High       | [M parser](packages/codemirror-markdown/src/grid-table.ts), [M extension](packages/codemirror-tables/src/grid-table.ts), [M tests](packages/codemirror-tables/src/grid-table.test.ts), [L registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                               | Parser, reading render, live editor, multi-line cells, controls, and source fallback are present.                                                                                                                                                                          |
| Generic directives                                           | Partial | P1       | High       | [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M HAST transform](packages/preview/src/remark/hast.ts), [M CodeMirror registration](packages/codemirror-markdown/src/index.ts), [L base language](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/markdown/index.ts), Runtime M7 | Reading mode renders directive custom elements, but Mira does not register Lapis's `GenericDirectives` parser extension. Leaf/inline/container directives remain raw in live preview and lack structural editing/folding.                                                  |
| Footnotes                                                    | Present | —        | High       | [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M stories](stories/markdown/footnotes/Footnotes.stories.ts), [L feature fixture](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>)                                                                                                          | GFM footnote references and definitions are rendered and documented.                                                                                                                                                                                                       |
| Raw HTML and safe rendering policy                           | Present | —        | High       | [M preview component](packages/preview/src/markdown-preview.svelte), [M tests](packages/preview/src/preview.test.ts), [M story](stories/markdown/raw-html/RawHtml.stories.ts)                                                                                                                                                       | Mira supports trusted raw HTML and adds a sanitizing `safe` policy that preserves allowed links and data images.                                                                                                                                                           |
| Stable source positions and heading IDs                      | Present | —        | High       | [M heading transform](packages/preview/src/remark/headings.ts), [M HAST transform](packages/preview/src/remark/hast.ts), [M outline](packages/preview/src/outline.ts)                                                                                                                                                               | Rendered nodes retain source metadata needed by widgets and consumers; opt-in heading IDs and prefixes are available.                                                                                                                                                      |

## B. Editor modes and authoring interactions

| Capability                                                    | Status           | Priority | Confidence | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Finding and follow-up                                                                                                                                                                                                                                       |
| ------------------------------------------------------------- | ---------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source mode                                                   | Present          | —        | High       | [M Svelte editor](packages/svelte/src/mira-mde.svelte), [M source styles](packages/preview/src/styles/source-mode.css), Runtime M1                                                                                                                                                                                                                                                                                                                           | Raw Markdown, line numbers, source classes, folding, and custom search are active.                                                                                                                                                                          |
| Live preview mode                                             | Present          | —        | High       | [M rich extension](packages/codemirror-rich/src/index.ts), [M live styles](packages/preview/src/styles/live-preview.css), Runtime M2/M5-M7                                                                                                                                                                                                                                                                                                                   | Inline and block replacement widgets retain editable source fallbacks. Directive parsing is the known syntax exception.                                                                                                                                     |
| Reading/preview mode                                          | Present          | —        | High       | [M preview](packages/preview/src/markdown-preview.svelte), [M Svelte editor](packages/svelte/src/mira-mde.svelte), Runtime M3                                                                                                                                                                                                                                                                                                                                | The standalone and editor-integrated preview render the audited syntax set.                                                                                                                                                                                 |
| Split mode                                                    | Present          | —        | High       | [M Svelte editor](packages/svelte/src/mira-mde.svelte), [M story](stories/default-ui/modes/Modes.stories.ts), Runtime M4                                                                                                                                                                                                                                                                                                                                     | Mira adds a portable split surface beyond Lapis's mutually exclusive view modes.                                                                                                                                                                            |
| Rendered-widget source fallback                               | Present          | —        | High       | [M source toggle](packages/codemirror-rich/src/widgets/source-toggle.ts), [M table source button](packages/codemirror-tables/src/widgets/source-button.ts), [M tests](packages/codemirror-tables/src/widgets/source-button.test.ts), Runtime M2/M5                                                                                                                                                                                                           | Table and math checks selected the underlying Markdown and returned focus to CodeMirror. Code, links, embeds, horizontal rules, and Mermaid use the same activation pattern.                                                                                |
| Mode-switch visible-position continuity                       | Partial          | P1       | High       | [M mode implementation](packages/svelte/src/mira-mde.svelte), [L mode-position mapping](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/markdown/index.ts)                                                                                                                                                                                                                                                                                     | Mira preserves the mounted editor state and split scroll, but switching to/from preview does not capture a source anchor and restore the equivalent viewport/selection. Port Lapis's position mapping as a package-local controller behavior.               |
| Heading folding and gutter affordances                        | Present          | —        | High       | [M fold indicators](packages/codemirror-rich/src/decorations/fold-indicators.ts), [M heading gutter](packages/codemirror-rich/src/decorations/heading-gutter.ts), [M tests](packages/codemirror-rich/src/decorations/fold-indicators.test.ts), Runtime M1                                                                                                                                                                                                    | Collapse/expand controls and accessible labels are available in editor and rendered headings.                                                                                                                                                               |
| Wrapped lists, blockquotes, and plain indentation             | Partial          | P1       | High       | [M indent utility](packages/codemirror-rich/src/utils/indent.ts), [M rich theme](packages/codemirror-rich/src/theme.ts), [L list extension](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/list/index.ts), [L measured indent](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/measured-indent/index.ts), [L fixture](<../lapis-notes/e2e-vault/plugin-markdown/CodeMirror Layout Showcase.md>) | Mira computes static indentation and guides, but lacks Lapis's first-paint fallback variables, visible-line measurement refinement, marker-slot variables, and dedicated plain-indent alignment. Port the geometry without introducing widget-root margins. |
| Search and replace                                            | Present          | —        | High       | [M search extension](packages/codemirror/src/search.ts), [M panel](packages/codemirror/src/search-panel.svelte), [M tests](packages/codemirror/src/search.test.ts), Runtime M1                                                                                                                                                                                                                                                                               | Mira now uses the Lapis interface for search, replace, case/word/regex toggles, navigation, select-all, status, and keyboard focus.                                                                                                                         |
| File, embed, heading, and display-text completion             | Missing portable | P1       | High       | [M file adapter contract](packages/extensions/src/index.ts), [M editor assembly](packages/svelte/src/mira-mde.svelte), [L completion sources](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/completion/autocomplete-files.ts)                                                                                                                                                                                                | Mira provides slash completion only. Implement portable completion sources backed by `listFiles`, `getHeadings`, source path, and a configurable link formatter.                                                                                            |
| Consumer suggestion completion                                | Consumer adapter | P3       | High       | [M CodeMirror extension hook](packages/extensions/src/index.ts), [L suggestion adapter](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/completion/autocomplete-suggestions.ts)                                                                                                                                                                                                                                                | Lapis bridges the application `EditorSuggest` registry. Mira consumers can supply a CodeMirror completion extension; a framework-neutral provider hook is optional.                                                                                         |
| Smart HTML and URL paste                                      | Missing portable | P1       | High       | [M image paste](packages/core/src/images.ts), [L paste extension](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/paste/index.ts)                                                                                                                                                                                                                                                                                              | Mira handles pasted/dropped images, but not HTML-to-Markdown conversion or wrapping the current selection when a URL is pasted. Port both as an opt-out Markdown extension.                                                                                 |
| Code-fence, frontmatter, and ellipsis input handlers          | Missing portable | P2       | High       | [M editor assembly](packages/svelte/src/mira-mde.svelte), [L input handlers](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/input-handlers/index.ts)                                                                                                                                                                                                                                                                          | Lapis auto-completes a code fence, scaffolds frontmatter after `---`, and converts three dots. Port code/frontmatter conveniences together; make typographic substitution configurable.                                                                     |
| Image paste, drop, upload, and insertion                      | Present          | —        | High       | [M image utilities](packages/core/src/images.ts), [M editor assembly](packages/svelte/src/mira-mde.svelte), [M stories](stories/default-ui/editor-plugins/EditorPlugins.stories.ts)                                                                                                                                                                                                                                                                          | File picker, paste/drop validation, upload callback, data URL, and reference-style output are covered.                                                                                                                                                      |
| Pipe-table editing                                            | Present          | —        | High       | [M table package](packages/codemirror-tables/src/index.ts), [M menus](packages/codemirror-tables/src/menu.ts), [M drag/drop](packages/codemirror-tables/src/markdown-table-dnd.ts), Runtime M2                                                                                                                                                                                                                                                               | Cell editing, insert/delete/alignment menus, row/column drag, and source fallback match the portable Lapis behavior.                                                                                                                                        |
| Grid-table editing                                            | Present          | —        | High       | [M grid editor](packages/codemirror-tables/src/grid-editor-table.svelte), [M widget](packages/codemirror-tables/src/widgets/grid-table-widget.ts), [M tests](packages/codemirror-tables/src/grid-table.test.ts)                                                                                                                                                                                                                                              | Multi-line grid cells, table chrome, controls, drag behavior, and fallback are present.                                                                                                                                                                     |
| Frontmatter property editing                                  | Partial          | P1       | High       | [M component](packages/preview/src/components/frontmatter.svelte), [M property utilities](packages/preview/src/frontmatter/properties.ts), [L component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/frontmatter/frontmatter.svelte)                                                                                                                                                                                                  | Mira supports add, rename, nested paths, typed editors, list pills, and pill removal. It lacks property remove/cut/copy/paste actions, property-name suggestions, and NoteLink rendering for whole-wikilink list pills.                                     |
| Task checkbox editing                                         | Present          | —        | High       | [M live widget](packages/codemirror-rich/src/widgets/task-checkbox.ts), [M task utility tests](packages/codemirror-rich/src/utils/tasks.test.ts), Runtime M2                                                                                                                                                                                                                                                                                                 | Checkbox changes update the exact source marker and remain keyboard-addressable.                                                                                                                                                                            |
| Text-code fence source geometry                               | Partial          | P1       | High       | [M fenced-code utility](packages/codemirror-rich/src/utils/fenced-code.ts), [M code styles](packages/preview/src/styles/code-katex.css), [L code-block extension](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/code-block/index.ts)                                                                                                                                                                                         | Rendered code supports overflow, but Mira lacks Lapis's explicit `text` fence source-line class, no-wrap behavior, shared editor horizontal scroll path, and viewport cap.                                                                                  |
| Rendered code language label                                  | Partial          | P2       | High       | [M code component](packages/preview/src/components/code.svelte), [L code component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-code/Code.svelte)                                                                                                                                                                                                                                                                              | Mira exposes copy but omits Lapis's compact language label. Add the label without hiding the keyboard-focusable copy action.                                                                                                                                |
| Split scroll synchronization                                  | Present          | —        | High       | [M ratio sync](packages/svelte/src/mira-mde.svelte), Runtime M4                                                                                                                                                                                                                                                                                                                                                                                              | Editor-to-preview and preview-to-editor scroll positions are synchronized by scrollable-range ratio, not fixed pixels.                                                                                                                                      |
| Readonly, spellcheck, line wrapping, and indentation settings | Present          | —        | High       | [M base CodeMirror](packages/codemirror/src/index.ts), [M editor props](packages/svelte/src/types.ts), [M configuration stories](stories/default-ui/configuration/Configuration.stories.ts)                                                                                                                                                                                                                                                                  | These controls are portable props and covered by stories/tests.                                                                                                                                                                                             |
| Default toolbar and mode switching                            | Present          | —        | High       | [M toolbar](packages/default-ui/src/default-toolbar.svelte), [M tests](packages/default-ui/src/default-toolbar.test.ts), Runtime M1-M6                                                                                                                                                                                                                                                                                                                       | The toolbar is compact, keyboard-addressable, feature-gated, and keeps view controls at the end.                                                                                                                                                            |
| Mermaid dialog control accessibility                          | Partial          | P0       | High       | [M Mermaid controls](packages/plugin-mermaid/src/mermaid.svelte), [L Mermaid controls](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-mermaid/Mermaid.svelte), Runtime M6                                                                                                                                                                                                                                                         | Seven pan/zoom/reset icon buttons have no accessible name or tooltip in both projects. Add `aria-label` and tooltip/title values in Mira; this is accessibility hardening rather than a Lapis delta.                                                        |
| Multi-cursor modifier and editor keyboard map                 | Present          | —        | High       | [M base CodeMirror](packages/codemirror/src/index.ts), [L registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                                                                                                                                                                                                                                                                                        | Mira uses CodeMirror's standard history/search/indent/default keymaps and platform multi-selection behavior.                                                                                                                                                |

## C. Extension, adapter, CSS, and package boundaries

| Capability                                                                                    | Status           | Priority | Confidence | Evidence                                                                                                                                                                                                                                                 | Finding and follow-up                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ---------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CodeMirror, remark, rehype, component, language, block-action, slash-command, and mount hooks | Present          | —        | High       | [M extension contract](packages/extensions/src/index.ts), [M editor assembly](packages/svelte/src/mira-mde.svelte), [M preview assembly](packages/preview/src/markdown-preview.svelte), [M extension tests](packages/extensions/src/index.test.ts)       | The implemented hooks keep portable plugins independent of Lapis registries and vault state.                                                                                                                                                                            |
| Declared extension commands                                                                   | Partial          | P1       | High       | [M extension resolver](packages/extensions/src/index.ts), [M editor runtime](packages/svelte/src/mira-mde.svelte)                                                                                                                                        | `commands` are accumulated but never bound to a command runner, keymap, toolbar, or public dispatch surface. Consume the field or remove/deprecate the unsupported promise.                                                                                             |
| Declared extension toolbar items                                                              | Partial          | P1       | High       | [M extension resolver](packages/extensions/src/index.ts), [M default toolbar](packages/default-ui/src/default-toolbar.svelte)                                                                                                                            | `toolbarItems` are accumulated, while the default toolbar resolves only feature configuration and explicit toolbar props. Bridge resolved extension items through the Svelte/default UI boundary.                                                                       |
| Declared extension styles                                                                     | Partial          | P1       | High       | [M extension resolver](packages/extensions/src/index.ts), [M package styles](packages/svelte/src/styles.css)                                                                                                                                             | `styles` are collected but never loaded or rendered. Define whether they are URLs, package exports, or caller responsibilities; avoid runtime CSS injection unless the contract is explicit.                                                                            |
| File adapter resolution, reading, opening, and custom embeds                                  | Present          | —        | High       | [M adapter contract](packages/extensions/src/index.ts), [M link](packages/preview/src/components/link.svelte), [M embed](packages/preview/src/components/embed.svelte)                                                                                   | The core boundary correctly keeps file access and navigation consumer-owned while supporting portable rendering. Refresh and completion gaps are separate rows.                                                                                                         |
| File watching and unresolved-target recovery                                                  | Partial          | P1       | High       | [M link watcher](packages/preview/src/components/link.svelte), [M embed](packages/preview/src/components/embed.svelte), [M image](packages/preview/src/components/image.svelte), [L embed spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md) | Only resolved link previews call `watchFile`. Embeds/images do not watch, and there is no unresolved-target watch. Extend the adapter with target-level invalidation or a general metadata revision signal.                                                             |
| `listFiles` and `getHeadings` adapter methods                                                 | Missing portable | P1       | High       | [M adapter contract](packages/extensions/src/index.ts), repository-wide call-site search, [L completion sources](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/completion/autocomplete-files.ts)                         | Both methods are declared but unused. The completion slice should make them real, tested API behavior.                                                                                                                                                                  |
| Reusable `MarkdownEmbed`, `FileEmbed`, and `NoteLink` surfaces                                | Partial          | P2       | High       | [M preview exports](packages/preview/src/index.ts), [M internal embed](packages/preview/src/components/embedded-markdown-preview.svelte), [L package exports](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                              | Mira exports `Markdown`, `MarkdownOutline`, and `MarkdownPreview`, but equivalent narrow embed/link components remain internal or absent. Export portable surfaces without Lapis app lifecycle.                                                                         |
| Markdown postprocessor lifecycle                                                              | Consumer adapter | P2       | High       | [M low-level renderer](packages/preview/src/renderer/markdown.svelte), [L preview](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/markdown-preview/markdown-preview.svelte)                                                          | Mira's low-level renderer accepts `postProcess`, but high-level `MarkdownPreview`/`MiraExtension` does not expose the Lapis-style per-node lifecycle. Add a typed high-level hook only if consumers need DOM postprocessing; prefer remark/rehype/components otherwise. |
| Standalone exported CSS and stable mode hooks                                                 | Present          | —        | High       | [M preview styles](packages/preview/src/styles.css), [M Svelte styles](packages/svelte/src/styles.css), [M default UI styles](packages/default-ui/src/styles.css), [L styles](../lapis-notes/packages/plugins/plugin-markdown/src/styles.css)            | Mira ships plain CSS, token bridges, and Lapis-compatible surface classes without requiring consumer Tailwind processing.                                                                                                                                               |
| Themes and token customization                                                                | Present          | —        | High       | [M Obsidian theme](packages/theme-obsidian/styles.css), [M default UI styles](packages/default-ui/src/styles.css), [M theme stories](stories/default-ui/themes/Themes.stories.ts)                                                                        | Obsidian, light, dark, system, and inherited themes are package-level behavior with `--mira-*` tokens.                                                                                                                                                                  |
| Svelte and React wrappers                                                                     | Present          | —        | High       | [M Svelte entry](packages/svelte/src/index.ts), [M React entry](packages/react/src/index.ts), [M React styles](packages/react/src/styles.css)                                                                                                            | Both framework surfaces route through the same editor packages and stylesheet chain.                                                                                                                                                                                    |
| Public package entry points                                                                   | Present          | —        | High       | [M package manifests](packages/default-ui/package.json), [M extension package](packages/extensions/package.json), [M preview package](packages/preview/package.json)                                                                                     | Existing Mira editor, preview, extension, table, Mermaid, theme, Svelte, default UI, and React entry points remain intact.                                                                                                                                              |
| Feature documentation and per-mode stories                                                    | Present          | —        | High       | [M Markdown stories](stories/markdown), [M default UI stories](stories/default-ui), [M visual test](tests/visual/storybook.spec.ts), existing snapshot tree                                                                                              | Every audited syntax family has source/live/preview stories and stored Chromium baselines; default UI adds split/configuration/plugin stories. Baselines were used as evidence and not updated.                                                                         |
| Combined Lapis layout-regression fixture                                                      | Missing portable | P2       | High       | [L layout fixture](<../lapis-notes/e2e-vault/plugin-markdown/CodeMirror Layout Showcase.md>), [M fixtures](stories/markdown/fixtures.ts), [M default fixture](stories/default-ui/fixtures.ts)                                                            | Mira's focused stories are broad, but there is no one fixture combining wrapped quotes/lists/plain indent, raw-space links, directives, embeds, tables, math, code, and Mermaid across modes. Add a parity fixture and interaction test before geometry work.           |
| Focused unit and visual regression coverage                                                   | Present          | —        | High       | [M package tests](packages), [M visual test](tests/visual/storybook.spec.ts), Validation V1                                                                                                                                                              | The audited packages passed 35 test files/148 tests. Existing visual baselines cover 20 Markdown feature groups in three modes and four default UI modes.                                                                                                               |

## D. Adapter and application-owned appendix

These rows are intentionally not counted as missing Mira editor features.

| Capability                                             | Status           | Priority | Confidence | Evidence                                                                                                                                                                                                                                          | Boundary recommendation                                                                                                                                              |
| ------------------------------------------------------ | ---------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vault metadata extraction/cache and worker             | Lapis app-only   | —        | High       | [L metadata cache](../lapis-notes/packages/plugins/plugin-markdown/src/lib/metadata/cache.ts), [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                           | Keep indexing, invalidation, and workers in the consumer. Mira should only accept resolved metadata/file-adapter callbacks.                                          |
| Backlinks and outgoing links sidebars                  | Lapis app-only   | —        | High       | [L link sidebar](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/link-sidebar/link-sidebar.svelte), [L plugin registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                           | These depend on vault-wide indexing, active-note state, pane navigation, and workspace placement.                                                                    |
| All Properties and File Properties views               | Lapis app-only   | —        | High       | [L views](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views), [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                                | Keep side views and cross-file mutations in the app. Reuse Mira's portable frontmatter widgets if/when exported.                                                     |
| Global property rename/removal semantics               | Lapis app-only   | —        | High       | [L mutation helper](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/frontmatter/mutate-frontmatter.ts), [L All Properties](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/all-properties/all-properties.svelte) | Cross-vault changes and `FileManager.processFrontMatter` are not editor-core behavior.                                                                               |
| Workspace view registration, commands, and persistence | Lapis app-only   | —        | High       | [L plugin registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts), [L Markdown view](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/markdown/index.ts)                                                         | Consumers own route/view registration, active file, command palettes, persisted mode, and workspace panes.                                                           |
| Markdown media views and resource-URL lifecycle        | Lapis app-only   | —        | High       | [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md), [L media view](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/media)                                                                                     | Mira should render URLs supplied by `assetResolver`/`readAssetUrl`; it should not acquire or revoke vault resource URLs.                                             |
| Non-image embed registry (PDF and other plugins)       | Consumer adapter | P3       | High       | [M `renderEmbed`](packages/extensions/src/index.ts), [L embed spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                                                      | Mira already has the correct `renderEmbed` boundary. Consumers register PDF/media components and own their lifecycle.                                                |
| Markdown diagnostics/language service                  | Consumer adapter | P3       | High       | [M CodeMirror hook](packages/extensions/src/index.ts), [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                                                   | Keep diagnostic providers outside core; document a lint-extension example.                                                                                           |
| Callout catalog persistence/settings/import            | Consumer adapter | P3       | High       | [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md), [M list-callout transform](packages/preview/src/remark/list-callouts.ts)                                                                                                | Mira should accept a catalog/style value. Consumers own settings storage, icon picker UI, and legacy-plugin migration.                                               |
| Advanced workspace outline                             | Consumer adapter | P3       | High       | [M outline](packages/preview/src/markdown-outline.svelte), [L outline](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/outline/outline.svelte)                                                                                      | Mira's flat portable outline is present. Hierarchical collapse state, search/filter, active-file observation, navigation, and auto-scroll belong in a consumer view. |
| Application Markdown/code-block processors             | Consumer adapter | P3       | High       | [M remark/rehype/components hooks](packages/extensions/src/index.ts), [L preview integration](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/markdown-preview/markdown-preview.svelte)                                        | Prefer Mira's typed syntax/render extension points. A consumer can adapt an app registry without making the registry part of Mira.                                   |

## Status totals

The audit contains **71 capability rows**:

| Status           | Count |
| ---------------- | ----: |
| Present          |    38 |
| Partial          |    15 |
| Missing portable |     5 |
| Consumer adapter |     7 |
| Lapis app-only   |     6 |
| Unverified       |     0 |

Follow-up rows by priority:

| Priority | Count | Interpretation                                                  |
| -------- | ----: | --------------------------------------------------------------- |
| P0       |     1 | Shared Mermaid control accessibility defect                     |
| P1       |    13 | Core authoring, continuity, adapters, and declared API behavior |
| P2       |     7 | Parity polish, reusable surfaces, and regression coverage       |
| P3       |     6 | Optional consumer integration                                   |

## Runtime evidence

### Mira Storybook

Storybook was started from this revision at `http://localhost:7007`. The
following existing stories were exercised in the in-app Chromium browser:

- **M1 — Source:** `default-ui-modes--source`. Confirmed raw frontmatter,
  formatting and table Markdown, fold buttons, accessible toolbar labels, and
  the Lapis-style search/replace panel opened with `Meta+F`. Search options,
  case-sensitive, whole-word, regex, replace toggle, previous/next, select all,
  close, and match status all exposed accessible names.
- **M2 — Live preview:** `default-ui-modes--live-preview`. Confirmed
  frontmatter, callout, task controls, editable pipe-table cells, row/column
  drag controls, add-column control, and source toggles. Activating **Edit table
  source** removed the rendered widget, focused CodeMirror, and selected the
  exact five-line source table.
- **M3 — Reading:** `default-ui-modes--preview`. Confirmed one reading surface
  containing Properties, callout, two tables, KaTeX, Mermaid SVGs, and code
  blocks.
- **M4 — Split:** `default-ui-modes--split`. Confirmed one CodeMirror editor and
  one reading surface. Pressing `PageDown` in the editor moved both scroll
  containers to their ends; measured ratios were `1.0002` and `1.0005`,
  respectively, confirming range-ratio synchronization.
- **M5 — Math source fallback:** `markdown-math--live-preview`. Activating
  **Edit source** focused the editor and revealed the `$$` fenced source while
  leaving the other rendered math available.
- **M6 — Mermaid:** `markdown-mermaid--live-preview`. Confirmed SVG rendering,
  source edit, expand, and source copy. The expanded dialog exposed seven
  unnamed pan/zoom/reset buttons plus a named Close button, which produced the
  P0 accessibility finding.
- **M7 — Directives:** `markdown-directives--preview` rendered a `<directive
data-directive="mira">` element. The equivalent live-preview story showed raw
  `:::mira` source and no directive widget, confirming the parser/surface gap.

No Storybook source, fixture, or baseline was modified or approved.

### Lapis runtime

The equivalent Lapis web runtime was attempted with:

```sh
pnpm --filter @lapis-notes/web exec vite --host 127.0.0.1 --port 7100
```

Vite exited before serving the application:

```text
Error: Failed to resolve entry for package "@vscode/codicons".
The package may have incorrect main/module/exports specified in its package.json.
```

Therefore Lapis runtime equivalence is **not inferred**. Lapis claims in the
matrix are based on the stamped source, package specification, tests, and the
two tracked fixtures. This environment failure does not change any row to
`Unverified` where the source contract and registration were unambiguous.

## Automated validation

### V1 — Focused package tests

All requested focused test suites passed:

| Workspace                       | Test files |   Tests |
| ------------------------------- | ---------: | ------: |
| `@mira-mde/codemirror`          |          2 |      22 |
| `@mira-mde/codemirror-markdown` |          1 |      11 |
| `@mira-mde/codemirror-rich`     |         14 |      40 |
| `@mira-mde/codemirror-tables`   |          7 |      23 |
| `@mira-mde/preview`             |          6 |      27 |
| `@mira-mde/plugin-mermaid`      |          1 |       6 |
| `@mira-mde/svelte`              |          1 |       1 |
| `@mira-mde/default-ui`          |          3 |      18 |
| **Total**                       |     **35** | **148** |

The test commands were:

```sh
pnpm --filter @mira-mde/codemirror test
pnpm --filter @mira-mde/codemirror-markdown test
pnpm --filter @mira-mde/codemirror-rich test
pnpm --filter @mira-mde/codemirror-tables test
pnpm --filter @mira-mde/preview test
pnpm --filter @mira-mde/plugin-mermaid test
pnpm --filter @mira-mde/svelte test
pnpm --filter @mira-mde/default-ui test
```

An additional parser probe confirmed that Mira recognizes `!![[note.md]]` as
an embed and bracket math as `BlockMathBracket`, while leaf/container directive
syntax is not recognized structurally by the CodeMirror parser.

Existing visual baselines under
`tests/visual/storybook.spec.ts-snapshots/` were inspected as historical
evidence only. No snapshot update or acceptance action was run.

## Prioritized roadmap

### Slice 1 — Make existing portable contracts truthful (P1)

1. Connect extension `toolbarItems` to the default UI.
2. Define and implement command dispatch/keybinding behavior for extension
   `commands`.
3. Decide and document the `styles` contract, then either consume it or
   deprecate it.
4. Add focused contract tests proving every declared contribution has a
   runtime consumer.

This slice reduces API ambiguity before new features build on the extension
model.

### Slice 2 — Complete Markdown authoring primitives (P1)

1. Implement file/embed/heading/display-text completion using
   `listFiles`/`getHeadings`.
2. Port smart HTML and URL-over-selection paste.
3. Register Generic Directives with CodeMirror and add live-preview/source
   interaction coverage.
4. Port code-fence/frontmatter input handlers; make ellipsis conversion
   configurable.

### Slice 3 — Cross-mode and editor geometry parity (P1/P2)

1. Add a Mira equivalent of the CodeMirror Layout Showcase.
2. Port source-anchor capture/restore for mode switches.
3. Port Lapis's measured list/blockquote/plain-indent variables and explicit
   `text` fence source geometry.
4. Validate line/gutter alignment in real Chromium at narrow and wide
   viewports before changing baselines.

### Slice 4 — Finish document adapters and editable metadata (P1/P2)

1. Add target-level invalidation so links, embeds, and images refresh and
   unresolved targets recover.
2. Define heading/block and sized-image embed semantics.
3. Add property remove/cut/copy/paste, property-name suggestions, and wikilink
   pills to frontmatter.
4. Add the broken-image placeholder and rendered code language label.

### Slice 5 — Accessibility and reusable surfaces (P0/P2)

1. Give Mermaid dialog controls accessible names and tooltips, with a keyboard
   regression test.
2. Export narrow `MarkdownEmbed`, `FileEmbed`, and `NoteLink` equivalents where
   consumers need them.
3. Add a documented consumer example for diagnostics, callout configuration,
   custom embeds, and optional postprocessing.

Each slice should remain separately reviewable and should not import Lapis
vault, workspace, command-registry, metadata-worker, or persistence internals
into Mira.
