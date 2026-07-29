# Lapis Markdown Parity Audit

## Audit stamp

- Audit date: 2026-07-29
- Mira source revision: `1a3aa482ecc3563e570b1fdacb26d662b8b9133d`
  (`Port Lapis search and replace panel to Mira CodeMirror`)
- Lapis source revision: `db08f863e9b4915e5ab2c9b2f3f525a7267e0e6e`
  (empty working-copy revision over `a371198e495d9e4e465c2960a04b3a4fd11f4023`)
- Mira root in evidence links: this repository
- Lapis root in evidence links: `../lapis-notes`
- Original deliverable scope: audit only. The matrix now also records verified,
  separately committed implementation slices while preserving the audited
  source revisions above.

The Mira revision is the audited source base. Pre-existing local changes in
`apps/demo/src/routes/+page.svelte` and `assets/` were excluded from this audit
and its commit.

### Implementation log

- **2026-07-29 — Slice 1 complete:** extension commands now have public
  dispatch, enablement, and CodeMirror keybinding behavior; framework-neutral
  toolbar contributions render in both default UI wrappers; extension styles
  have a documented URL/inline-CSS contract with reference-counted lifecycle.
  Focused unit, package check/build, docs build, Storybook build, and real
  Chromium interaction validation passed. The full visual comparison remains
  blocked by a pre-existing capture-size mismatch affecting all 86 stories
  (current captures are 3840×2700 while stored baselines use older dimensions);
  the new story has no accepted baseline and remains pending review. No
  snapshot was created, updated, or approved.
- **2026-07-29 — Slice 2 complete:** portable file, embed, heading, and
  display-text completion now consumes `MiraFileAdapter.listFiles` and
  `getHeadings`, with a configurable internal-link formatter; smart paste
  converts HTML or wraps a selection with a pasted URL; Generic Directives are
  registered with the Markdown parser; and code-fence/frontmatter input
  handlers are enabled by default while ellipsis substitution is opt-in.
  Focused unit, package check/build, docs build, Storybook build, and Chromium
  interaction validation passed. The authoring story remains `visual-pending`;
  no snapshot was created, updated, or approved.
- **2026-07-29 — Slice 3 complete:** source-line capture/restore now preserves
  visible position and selection across editor, reading, and split mode
  changes; list, quote, and plain indentation has deterministic authored-column
  fallbacks plus persistent measured-pixel decorations; explicit `text` fences
  use dedicated no-wrap source lines and the editor content scroll path; and a
  tracked CodeMirror Layout Showcase covers all four modes at narrow and wide
  widths. Focused tests, package checks/builds, docs/Storybook builds, and real
  Chromium geometry and round-trip mode validation passed. All new layout
  stories remain `visual-pending`; no snapshot was created, updated, or
  approved.
- **2026-07-29 — Slice 4 complete:** `MiraFileAdapter` now receives parsed
  path/heading/block targets and can invalidate unresolved or resolved targets
  through `watchTarget`, while `watchFile` refreshes embedded Markdown and
  assets. Markdown embeds select heading sections and block references; image
  embeds and Markdown images accept Lapis-style dimensions; failed images show
  an accessible placeholder. Frontmatter adds injectable name suggestions and
  clipboard-backed cut/copy/paste/remove actions plus whole-wikilink pills.
  Rendered code blocks expose their language beside the copy action. Focused
  tests and package checks/builds passed, and the new `visual-pending` stories
  were exercised in Chromium without creating or approving snapshots.
- **2026-07-29 — Slice 5 complete:** list-callout definitions are extension
  contributions shared by reading and live-preview modes, including overrides,
  disabled defaults, icons, and consumer `renderMarker` callbacks. The preview
  package now exports `MarkdownEmbed`, `FileEmbed`, and `NoteLink`, while
  high-level preview extensions can register cleanup-capable DOM
  postprocessors. Mermaid's seven dialog controls have matching accessible
  names and hover titles and retain native keyboard activation. Focused tests,
  package checks/builds, docs, static Storybook, and Chromium acceptance passed;
  all new stories remain `visual-pending`.

## Executive summary

Mira already covers most of Lapis's portable Markdown rendering and its central
editing surfaces. CommonMark/GFM content, frontmatter, callouts, tasks, links,
wikilinks, tags, code, math, Mermaid, pipe tables, grid tables, images,
footnotes, raw HTML, source mode, live preview, reading mode, and source
fallbacks are all represented in shipped packages, stories, tests, and
standalone CSS.

All confirmed portable gaps identified by the stamped audit are now
implemented. The matrix has no `Partial`, `Missing portable`, `Unverified`, P0,
P1, or P2 follow-up rows. The remaining rows are deliberate consumer adapters
or Lapis application capabilities: vault indexing, backlinks, workspace state,
media views, diagnostics providers, application processor registries, and
settings persistence stay outside Mira's portable core.

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

| Capability                                                   | Status  | Priority | Confidence | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                          | Finding and follow-up                                                                                                                                                                                            |
| ------------------------------------------------------------ | ------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CommonMark and GFM blocks/inline formatting                  | Present | —        | High       | [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M parity tests](packages/preview/src/remark/parity.test.ts), [L preview](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/markdown-preview/markdown-preview.svelte)                                                                                                                                                                        | Headings, emphasis, strong, strikeout, lists, blockquotes, thematic breaks, links, and GFM behavior are wired in both.                                                                                           |
| YAML frontmatter parsing and collapsible presentation        | Present | —        | High       | [M frontmatter component](packages/preview/src/components/frontmatter.svelte), [M tests](packages/preview/src/frontmatter/frontmatter.test.ts), [L frontmatter component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/frontmatter/frontmatter.svelte), Runtime M1-M3                                                                                                                                       | Mira parses typed/nested values, shows compact Properties UI, supports collapse, and decorates source delimiters. Editing differences are tracked separately.                                                    |
| Blockquote callouts/admonitions                              | Present | —        | High       | [M transform](packages/preview/src/remark/callouts.ts), [M component](packages/preview/src/components/callout.svelte), [L transform](../lapis-notes/packages/plugins/plugin-markdown/src/lib/remark-plugins/callout.ts), Runtime M2-M3                                                                                                                                                                                            | Standard, expanded, collapsed, nested, and live-preview callouts are represented.                                                                                                                                |
| List callout markers                                         | Present | —        | High       | [M extension contract](packages/extensions/src/index.ts), [M preview transform](packages/preview/src/remark/list-callouts.ts), [M live utility](packages/codemirror-rich/src/utils/list-callouts.ts), [M tests](packages/codemirror-rich/src/utils/list-callouts.test.ts), [M story](stories/markdown/lists/Lists.stories.ts), [L editor registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts), Runtime M11 | One injected catalog drives reading and live-preview modes. Extensions can override, disable, or append markers, select icons, or render consumer icons; settings persistence and editing remain consumer-owned. |
| Task lists and extended task states                          | Present | —        | High       | [M transform](packages/preview/src/remark/custom-checklists.ts), [M live widget](packages/codemirror-rich/src/widgets/task-checkbox.ts), [M tests](packages/codemirror-rich/src/utils/tasks.test.ts), [L feature fixture](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>), Runtime M2                                                                                                                        | Standard and custom markers render and can be toggled without forcing Lapis-incompatible done-task strikeout in live preview.                                                                                    |
| External, Markdown, and raw-space path links                 | Present | —        | High       | [M path-link transform](packages/preview/src/remark/pathlink.ts), [M CodeMirror parser](packages/codemirror-markdown/src/lapis-inline.ts), [M tests](packages/preview/src/remark/links.test.ts), [L registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                                                                                                                   | Raw-space destinations such as `[Label](My Note.md)` and external-link handling are covered.                                                                                                                     |
| Wikilinks and tags                                           | Present | —        | High       | [M wiki transform](packages/preview/src/remark/wikilink.ts), [M tag transform](packages/preview/src/remark/tags.ts), [M inline parser](packages/codemirror-markdown/src/lapis-inline.ts), [L fixture](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>)                                                                                                                                                        | Reading/source/live syntax, display text, and class hooks are present. File lifecycle differences are tracked under adapters.                                                                                    |
| File and note embeds                                         | Present | —        | High       | [M embed](packages/preview/src/components/embed.svelte), [M target/selection helpers](packages/preview/src/embed-target.ts), [M adapter contract](packages/extensions/src/index.ts), [M tests](packages/preview/src/embed-target.test.ts), [M story](stories/markdown/embeds/Embeds.stories.ts), [L file embed](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/file-embed/file-embed.svelte), Runtime M10     | Markdown, asset, missing, and custom embeds use a portable adapter. Heading sections, `^block-id` fragments, sized images, resolved-file refresh, and unresolved-target recovery are defined without vault APIs. |
| Markdown images, data images, reference images, and lightbox | Present | —        | High       | [M image component](packages/preview/src/components/image.svelte), [M image utilities](packages/core/src/images.ts), [M preview/embed tests](packages/preview/src/preview.test.ts), [M story](stories/markdown/images/Images.stories.ts), [L image component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-image/Image.svelte), Runtime M10                                                          | Standard, data-URI, upload-generated, reference-style, and sized images work. Failed loads expose an accessible alt/source placeholder, and adapter images subscribe to target/file invalidation.                |
| Fenced and inline code rendering                             | Present | —        | High       | [M code component](packages/preview/src/components/code.svelte), [M code styles](packages/preview/src/styles/code-katex.css), [L code renderer](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-code/Code.svelte), Runtime M3                                                                                                                                                                           | Highlighting, line options, copy action, and source fallback exist. Source-editing geometry and the missing language label are tracked under authoring.                                                          |
| Inline and block math, including bracket math                | Present | —        | High       | [M parser](packages/codemirror-markdown/src/latex.ts), [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M live tests](packages/codemirror-rich/src/utils/inline-math.test.ts), Runtime M3/M5                                                                                                                                                                                                                  | `$…$`, `$$…$$`, `\\(…\\)`, and `\\[…\\]` are parsed/rendered, and block source can be revealed.                                                                                                                  |
| Mermaid rendering and source toggle                          | Present | —        | High       | [M plugin](packages/plugin-mermaid/src/index.ts), [M renderer](packages/plugin-mermaid/src/mermaid.svelte), [M tests](packages/plugin-mermaid/src/index.test.ts), [L renderer](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-mermaid/Mermaid.svelte), Runtime M3/M6                                                                                                                                   | Inline SVG, copy, expand, pan/zoom/reset behavior, render IDs, and source reveal match Lapis. Dialog-control accessibility is tracked separately.                                                                |
| GFM pipe tables                                              | Present | —        | High       | [M extension](packages/codemirror-tables/src/extension.ts), [M widget](packages/codemirror-tables/src/widgets/pipe-table-widget.ts), [M tests](packages/codemirror-tables/src/pipe-table.test.ts), Runtime M2-M3                                                                                                                                                                                                                  | Rendering, live editor, menus, row/column chrome, drag/drop, sizing, and source fallback are present.                                                                                                            |
| MultiMarkdown table spans                                    | Present | —        | High       | [M transform](packages/preview/src/remark/multimarkdown-table.ts), [M rehype spans](packages/preview/src/rehype-table-spans.ts), [M tests](packages/preview/src/remark/parity.test.ts)                                                                                                                                                                                                                                            | Colspan/rowspan-style reading behavior is implemented in Mira in addition to the core Lapis fixture.                                                                                                             |
| Adobe/grid tables                                            | Present | —        | High       | [M parser](packages/codemirror-markdown/src/grid-table.ts), [M extension](packages/codemirror-tables/src/grid-table.ts), [M tests](packages/codemirror-tables/src/grid-table.test.ts), [L registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                                                                                                                             | Parser, reading render, live editor, multi-line cells, controls, and source fallback are present.                                                                                                                |
| Generic directives                                           | Present | —        | High       | [M directive parser](packages/codemirror-markdown/src/directives.ts), [M CodeMirror registration](packages/codemirror-markdown/src/index.ts), [M parser test](packages/codemirror-markdown/src/index.test.ts), [M docs](apps/docs/src/content/docs/markdown/directives.mdx), [L base language](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/markdown/index.ts), Runtime M8                       | Container, leaf, and inline directives are structurally parsed in CodeMirror while the preview pipeline renders directive custom elements. Rendered directives retain source-reveal behavior.                    |
| Footnotes                                                    | Present | —        | High       | [M preview pipeline](packages/preview/src/markdown-preview.svelte), [M stories](stories/markdown/footnotes/Footnotes.stories.ts), [L feature fixture](<../lapis-notes/e2e-vault/plugin-markdown/Markdown Feature Tour.md>)                                                                                                                                                                                                        | GFM footnote references and definitions are rendered and documented.                                                                                                                                             |
| Raw HTML and safe rendering policy                           | Present | —        | High       | [M preview component](packages/preview/src/markdown-preview.svelte), [M tests](packages/preview/src/preview.test.ts), [M story](stories/markdown/raw-html/RawHtml.stories.ts)                                                                                                                                                                                                                                                     | Mira supports trusted raw HTML and adds a sanitizing `safe` policy that preserves allowed links and data images.                                                                                                 |
| Stable source positions and heading IDs                      | Present | —        | High       | [M heading transform](packages/preview/src/remark/headings.ts), [M HAST transform](packages/preview/src/remark/hast.ts), [M outline](packages/preview/src/outline.ts)                                                                                                                                                                                                                                                             | Rendered nodes retain source metadata needed by widgets and consumers; opt-in heading IDs and prefixes are available.                                                                                            |

## B. Editor modes and authoring interactions

| Capability                                                    | Status           | Priority | Confidence | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Finding and follow-up                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | ---------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source mode                                                   | Present          | —        | High       | [M Svelte editor](packages/svelte/src/mira-mde.svelte), [M source styles](packages/preview/src/styles/source-mode.css), Runtime M1                                                                                                                                                                                                                                                                                                                                                          | Raw Markdown, line numbers, source classes, folding, and custom search are active.                                                                                                                                                                                        |
| Live preview mode                                             | Present          | —        | High       | [M rich extension](packages/codemirror-rich/src/index.ts), [M live styles](packages/preview/src/styles/live-preview.css), Runtime M2/M5-M7                                                                                                                                                                                                                                                                                                                                                  | Inline and block replacement widgets retain editable source fallbacks. Directive parsing is the known syntax exception.                                                                                                                                                   |
| Reading/preview mode                                          | Present          | —        | High       | [M preview](packages/preview/src/markdown-preview.svelte), [M Svelte editor](packages/svelte/src/mira-mde.svelte), Runtime M3                                                                                                                                                                                                                                                                                                                                                               | The standalone and editor-integrated preview render the audited syntax set.                                                                                                                                                                                               |
| Split mode                                                    | Present          | —        | High       | [M Svelte editor](packages/svelte/src/mira-mde.svelte), [M story](stories/default-ui/modes/Modes.stories.ts), Runtime M4                                                                                                                                                                                                                                                                                                                                                                    | Mira adds a portable split surface beyond Lapis's mutually exclusive view modes.                                                                                                                                                                                          |
| Rendered-widget source fallback                               | Present          | —        | High       | [M source toggle](packages/codemirror-rich/src/widgets/source-toggle.ts), [M table source button](packages/codemirror-tables/src/widgets/source-button.ts), [M tests](packages/codemirror-tables/src/widgets/source-button.test.ts), Runtime M2/M5                                                                                                                                                                                                                                          | Table and math checks selected the underlying Markdown and returned focus to CodeMirror. Code, links, embeds, horizontal rules, and Mermaid use the same activation pattern.                                                                                              |
| Mode-switch visible-position continuity                       | Present          | —        | High       | [M mode implementation](packages/svelte/src/mira-mde.svelte), [M position controller](packages/svelte/src/mode-position.ts), [M tests](packages/svelte/src/mode-position.test.ts), [M layout story](stories/markdown/layout/Layout.stories.ts), [L mode-position mapping](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/markdown/index.ts), Runtime M9                                                                                                                      | Editor/reading transitions capture the nearest visible source line and top delta, retain the CodeMirror selection without forcing focus, and restore the corresponding surface. Entering split maps the newly visible pane before ratio synchronization continues.        |
| Heading folding and gutter affordances                        | Present          | —        | High       | [M fold indicators](packages/codemirror-rich/src/decorations/fold-indicators.ts), [M heading gutter](packages/codemirror-rich/src/decorations/heading-gutter.ts), [M tests](packages/codemirror-rich/src/decorations/fold-indicators.test.ts), Runtime M1                                                                                                                                                                                                                                   | Collapse/expand controls and accessible labels are available in editor and rendered headings.                                                                                                                                                                             |
| Wrapped lists, blockquotes, and plain indentation             | Present          | —        | High       | [M structural indent](packages/codemirror-rich/src/utils/indent.ts), [M measured indent](packages/codemirror-rich/src/utils/measured-indent.ts), [M tests](packages/codemirror-rich/src/utils/indent.test.ts), [M shipped CSS](packages/preview/src/styles/source-mode.css), [M fixture](<stories/markdown/layout/CodeMirror Layout Showcase.md>), [L measured indent](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/measured-indent/index.ts), Runtime M9  | Markdown list/quote/plain lines expose authored-column fallbacks before layout and persistent measured pixel variables after visible DOM exists. Marker slots, continuation anchoring, tabs, wrapped rows, and source gutters remain aligned without widget-root margins. |
| Search and replace                                            | Present          | —        | High       | [M search extension](packages/codemirror/src/search.ts), [M panel](packages/codemirror/src/search-panel.svelte), [M tests](packages/codemirror/src/search.test.ts), Runtime M1                                                                                                                                                                                                                                                                                                              | Mira now uses the Lapis interface for search, replace, case/word/regex toggles, navigation, select-all, status, and keyboard focus.                                                                                                                                       |
| File, embed, heading, and display-text completion             | Present          | —        | High       | [M completion extension](packages/codemirror-markdown/src/completion.ts), [M authoring tests](packages/codemirror-markdown/src/authoring.test.ts), [M Svelte assembly](packages/svelte/src/mira-mde.svelte), [M React assembly](packages/react/src/mira-mde.tsx), [M story](stories/default-ui/editor-plugins/EditorPlugins.stories.ts), [L completion sources](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/completion/autocomplete-files.ts), Runtime M8 | Portable completion uses `listFiles`, `resolveLink`, and `getHeadings` for file, embed, heading, display-text, and image-size suggestions. Consumers can filter candidates, include missing targets, or replace the internal-link formatter.                              |
| Consumer suggestion completion                                | Consumer adapter | P3       | High       | [M CodeMirror extension hook](packages/extensions/src/index.ts), [L suggestion adapter](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/completion/autocomplete-suggestions.ts)                                                                                                                                                                                                                                                                               | Lapis bridges the application `EditorSuggest` registry. Mira consumers can supply a CodeMirror completion extension; a framework-neutral provider hook is optional.                                                                                                       |
| Smart HTML and URL paste                                      | Present          | —        | High       | [M smart-paste extension](packages/codemirror-markdown/src/paste.ts), [M authoring tests](packages/codemirror-markdown/src/authoring.test.ts), [M Svelte assembly](packages/svelte/src/mira-mde.svelte), [L paste extension](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/paste/index.ts), Runtime M8                                                                                                                                                      | Rich HTML is converted through a portable unified pipeline, a pasted URL wraps the current selection, image-file clipboards still take the existing image-upload path, and consumers can disable or replace HTML conversion.                                              |
| Code-fence, frontmatter, and ellipsis input handlers          | Present          | —        | High       | [M input handlers](packages/codemirror-markdown/src/input-handlers.ts), [M authoring tests](packages/codemirror-markdown/src/authoring.test.ts), [M story](stories/default-ui/editor-plugins/EditorPlugins.stories.ts), [L input handlers](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/input-handlers/index.ts), Runtime M8                                                                                                                               | Code fences and frontmatter scaffold by default. Consumers can disable either handler, and typographic ellipsis conversion is explicitly opt-in.                                                                                                                          |
| Image paste, drop, upload, and insertion                      | Present          | —        | High       | [M image utilities](packages/core/src/images.ts), [M editor assembly](packages/svelte/src/mira-mde.svelte), [M stories](stories/default-ui/editor-plugins/EditorPlugins.stories.ts)                                                                                                                                                                                                                                                                                                         | File picker, paste/drop validation, upload callback, data URL, and reference-style output are covered.                                                                                                                                                                    |
| Pipe-table editing                                            | Present          | —        | High       | [M table package](packages/codemirror-tables/src/index.ts), [M menus](packages/codemirror-tables/src/menu.ts), [M drag/drop](packages/codemirror-tables/src/markdown-table-dnd.ts), Runtime M2                                                                                                                                                                                                                                                                                              | Cell editing, insert/delete/alignment menus, row/column drag, and source fallback match the portable Lapis behavior.                                                                                                                                                      |
| Grid-table editing                                            | Present          | —        | High       | [M grid editor](packages/codemirror-tables/src/grid-editor-table.svelte), [M widget](packages/codemirror-tables/src/widgets/grid-table-widget.ts), [M tests](packages/codemirror-tables/src/grid-table.test.ts)                                                                                                                                                                                                                                                                             | Multi-line grid cells, table chrome, controls, drag behavior, and fallback are present.                                                                                                                                                                                   |
| Frontmatter property editing                                  | Present          | —        | High       | [M component](packages/preview/src/components/frontmatter.svelte), [M property utilities](packages/preview/src/frontmatter/properties.ts), [M suggestion utilities](packages/preview/src/frontmatter/suggestions.ts), [M tests](packages/preview/src/frontmatter), [M story](stories/markdown/frontmatter/FrontmatterActionsStory.svelte), [L component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/frontmatter/frontmatter.svelte), Runtime M10                    | Mira supports add, rename, nested paths, typed editors, list pills/removal, lazy or static name suggestions, injected/native clipboard cut/copy/paste, property removal, and file-adapter links for whole-wikilink pills.                                                 |
| Task checkbox editing                                         | Present          | —        | High       | [M live widget](packages/codemirror-rich/src/widgets/task-checkbox.ts), [M task utility tests](packages/codemirror-rich/src/utils/tasks.test.ts), Runtime M2                                                                                                                                                                                                                                                                                                                                | Checkbox changes update the exact source marker and remain keyboard-addressable.                                                                                                                                                                                          |
| Text-code fence source geometry                               | Present          | —        | High       | [M line decoration](packages/codemirror-rich/src/utils/code-block-lines.ts), [M tests](packages/codemirror-rich/src/utils/code-block-lines.test.ts), [M source CSS](packages/preview/src/styles/source-mode.css), [M rendered viewport cap](packages/preview/src/components/code.svelte), [L code-block extension](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/code-block/index.ts), Runtime M9                                                           | Explicit `text` fences mark every source line, remain unwrapped, keep the outer editor width bounded, and use the CodeMirror content area for horizontal scrolling; rendered live-preview blocks retain their viewport cap.                                               |
| Rendered code language label                                  | Present          | —        | High       | [M code component](packages/preview/src/components/code.svelte), [M language labels](packages/preview/src/code-language.ts), [M tests](packages/preview/src/code-language.test.ts), [L code component](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-code/Code.svelte), Runtime M10                                                                                                                                                                             | The mounted keyboard-focusable copy action includes a compact normalized language label and remains visually revealed on hover or focus.                                                                                                                                  |
| Split scroll synchronization                                  | Present          | —        | High       | [M ratio sync](packages/svelte/src/mira-mde.svelte), Runtime M4                                                                                                                                                                                                                                                                                                                                                                                                                             | Editor-to-preview and preview-to-editor scroll positions are synchronized by scrollable-range ratio, not fixed pixels.                                                                                                                                                    |
| Readonly, spellcheck, line wrapping, and indentation settings | Present          | —        | High       | [M base CodeMirror](packages/codemirror/src/index.ts), [M editor props](packages/svelte/src/types.ts), [M configuration stories](stories/default-ui/configuration/Configuration.stories.ts)                                                                                                                                                                                                                                                                                                 | These controls are portable props and covered by stories/tests.                                                                                                                                                                                                           |
| Default toolbar and mode switching                            | Present          | —        | High       | [M toolbar](packages/default-ui/src/default-toolbar.svelte), [M tests](packages/default-ui/src/default-toolbar.test.ts), Runtime M1-M6                                                                                                                                                                                                                                                                                                                                                      | The toolbar is compact, keyboard-addressable, feature-gated, and keeps view controls at the end.                                                                                                                                                                          |
| Mermaid dialog control accessibility                          | Present          | —        | High       | [M Mermaid controls](packages/plugin-mermaid/src/mermaid.svelte), [M accessibility test](packages/plugin-mermaid/src/mermaid.test.ts), [M story](stories/markdown/mermaid/MermaidDialogStory.svelte), [L Mermaid controls](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/rehype-mermaid/Mermaid.svelte), Runtime M6/M11                                                                                                                                                | All seven pan/zoom/reset icon buttons have matching accessible names and hover titles, remain native keyboard-focusable buttons, and improve on the unnamed Lapis controls.                                                                                               |
| Multi-cursor modifier and editor keyboard map                 | Present          | —        | High       | [M base CodeMirror](packages/codemirror/src/index.ts), [L registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                                                                                                                                                                                                                                                                                                                       | Mira uses CodeMirror's standard history/search/indent/default keymaps and platform multi-selection behavior.                                                                                                                                                              |

## C. Extension, adapter, CSS, and package boundaries

| Capability                                                                                    | Status  | Priority | Confidence | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Finding and follow-up                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CodeMirror, remark, rehype, component, language, block-action, slash-command, and mount hooks | Present | —        | High       | [M extension contract](packages/extensions/src/index.ts), [M editor assembly](packages/svelte/src/mira-mde.svelte), [M preview assembly](packages/preview/src/markdown-preview.svelte), [M extension tests](packages/extensions/src/index.test.ts)                                                                                                                                                                                                             | The implemented hooks keep portable plugins independent of Lapis registries and vault state.                                                                                                                                                            |
| Declared extension commands                                                                   | Present | —        | High       | [M command contract and dispatcher](packages/extensions/src/index.ts), [M Svelte runtime](packages/svelte/src/mira-mde.svelte), [M React runtime](packages/react/src/mira-mde.tsx), [M tests](packages/extensions/src/index.test.ts)                                                                                                                                                                                                                           | Commands expose enablement, imperative dispatch, and portable CodeMirror keybindings. Later extensions override earlier command IDs consistently.                                                                                                       |
| Declared extension toolbar items                                                              | Present | —        | High       | [M toolbar contract](packages/extensions/src/index.ts), [M Svelte default UI](packages/default-ui/src/default-mde.svelte), [M React default UI](packages/react/src/default-mde.tsx), [M story](stories/default-ui/editor-plugins/EditorPlugins.stories.ts)                                                                                                                                                                                                     | Framework-neutral icon, group, alignment, tooltip, and command references render through both default UI wrappers while remaining independent of framework components.                                                                                  |
| Declared extension styles                                                                     | Present | —        | High       | [M style contract and lifecycle](packages/extensions/src/index.ts), [M preview consumer](packages/preview/src/markdown-preview.svelte), [M lifecycle tests](packages/extensions/src/index.test.ts), [M docs](apps/docs/src/content/docs/default-editor.mdx)                                                                                                                                                                                                    | Styles accept external stylesheet URLs or explicit inline CSS descriptors, mount in editor and standalone-preview hosts, deduplicate per document, and clean up after the final consumer unmounts.                                                      |
| File adapter resolution, reading, opening, and custom embeds                                  | Present | —        | High       | [M adapter contract](packages/extensions/src/index.ts), [M link](packages/preview/src/components/link.svelte), [M embed](packages/preview/src/components/embed.svelte)                                                                                                                                                                                                                                                                                         | The core boundary correctly keeps file access and navigation consumer-owned while supporting portable rendering. Refresh and completion gaps are separate rows.                                                                                         |
| File watching and unresolved-target recovery                                                  | Present | —        | High       | [M adapter contract](packages/extensions/src/index.ts), [M link watcher](packages/preview/src/components/link.svelte), [M embed](packages/preview/src/components/embed.svelte), [M image](packages/preview/src/components/image.svelte), [M interactive story](stories/markdown/embeds/AdapterInvalidationStory.svelte), [L embed spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md), Runtime M10                                                  | `watchTarget` observes parsed paths before and after resolution so create/delete/rename events can recover missing targets; `watchFile` refreshes resolved link, embed, and image content. Both return consumer-owned cleanup callbacks.                |
| `listFiles` and `getHeadings` adapter methods                                                 | Present | —        | High       | [M adapter contract](packages/extensions/src/index.ts), [M completion extension](packages/codemirror-markdown/src/completion.ts), [M authoring tests](packages/codemirror-markdown/src/authoring.test.ts), [L completion sources](../lapis-notes/packages/plugins/plugin-markdown/src/lib/codemirror-extensions/completion/autocomplete-files.ts)                                                                                                              | Both adapter methods now drive built-in authoring completion. Resolution falls back to an unambiguous `listFiles` basename when an adapter cannot resolve a shortened wikilink directly.                                                                |
| Reusable `MarkdownEmbed`, `FileEmbed`, and `NoteLink` surfaces                                | Present | —        | High       | [M preview exports](packages/preview/src/index.ts), [M Markdown embed](packages/preview/src/markdown-embed.svelte), [M file embed](packages/preview/src/file-embed.svelte), [M note link](packages/preview/src/note-link.svelte), [M tests](packages/preview/src/portable-surfaces.test.ts), [M story](stories/markdown/embeds/PortableSurfacesStory.svelte), [L package exports](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts), Runtime M11   | Narrow public surfaces reuse Mira's renderer, extension, resolver, and file-adapter contracts without importing Lapis file or workspace lifecycle.                                                                                                      |
| Markdown postprocessor lifecycle                                                              | Present | —        | High       | [M extension contract](packages/extensions/src/index.ts), [M high-level preview](packages/preview/src/markdown-preview.svelte), [M renderer cleanup](packages/preview/src/renderer/renderer.svelte), [M tests](packages/preview/src/portable-surfaces.test.ts), [M docs](apps/docs/src/content/docs/extensions-api.mdx), [L preview](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/markdown-preview/markdown-preview.svelte), Runtime M11 | `MarkdownPreview`, narrow surfaces, and `MiraExtension.postProcessors` expose typed per-node DOM hooks with cleanup. Structural work should still prefer remark, rehype, or renderer components.                                                        |
| Standalone exported CSS and stable mode hooks                                                 | Present | —        | High       | [M preview styles](packages/preview/src/styles.css), [M Svelte styles](packages/svelte/src/styles.css), [M default UI styles](packages/default-ui/src/styles.css), [L styles](../lapis-notes/packages/plugins/plugin-markdown/src/styles.css)                                                                                                                                                                                                                  | Mira ships plain CSS, token bridges, and Lapis-compatible surface classes without requiring consumer Tailwind processing.                                                                                                                               |
| Themes and token customization                                                                | Present | —        | High       | [M Obsidian theme](packages/theme-obsidian/styles.css), [M default UI styles](packages/default-ui/src/styles.css), [M theme stories](stories/default-ui/themes/Themes.stories.ts)                                                                                                                                                                                                                                                                              | Obsidian, light, dark, system, and inherited themes are package-level behavior with `--mira-*` tokens.                                                                                                                                                  |
| Svelte and React wrappers                                                                     | Present | —        | High       | [M Svelte entry](packages/svelte/src/index.ts), [M React entry](packages/react/src/index.ts), [M React styles](packages/react/src/styles.css)                                                                                                                                                                                                                                                                                                                  | Both framework surfaces route through the same editor packages and stylesheet chain.                                                                                                                                                                    |
| Public package entry points                                                                   | Present | —        | High       | [M package manifests](packages/default-ui/package.json), [M extension package](packages/extensions/package.json), [M preview package](packages/preview/package.json)                                                                                                                                                                                                                                                                                           | Existing Mira editor, preview, extension, table, Mermaid, theme, Svelte, default UI, and React entry points remain intact.                                                                                                                              |
| Feature documentation and per-mode stories                                                    | Present | —        | High       | [M Markdown stories](stories/markdown), [M default UI stories](stories/default-ui), [M visual test](tests/visual/storybook.spec.ts), existing snapshot tree                                                                                                                                                                                                                                                                                                    | Every audited syntax family has source/live/preview stories and stored Chromium baselines; default UI adds split/configuration/plugin stories. Baselines were used as evidence and not updated.                                                         |
| Combined Lapis layout-regression fixture                                                      | Present | —        | High       | [M layout fixture](<stories/markdown/layout/CodeMirror Layout Showcase.md>), [M parser test](packages/codemirror-markdown/src/showcase-fixture.test.ts), [M four-mode stories](stories/markdown/layout/Layout.stories.ts), [M story docs](stories/markdown/layout/Layout.mdx), [L layout fixture](<../lapis-notes/e2e-vault/plugin-markdown/CodeMirror Layout Showcase.md>), Runtime M9                                                                        | One tracked fixture combines frontmatter, wrapped quotes/lists/plain indent, links, directives, embeds, tables, text/code fences, math, and Mermaid. Source/live/reading/split plus 36rem and 72rem source stories are available for regression review. |
| Focused unit and visual regression coverage                                                   | Present | —        | High       | [M package tests](packages), [M visual test](tests/visual/storybook.spec.ts), Validation V1                                                                                                                                                                                                                                                                                                                                                                    | The audited packages passed 35 test files/148 tests. Existing visual baselines cover 20 Markdown feature groups in three modes and four default UI modes.                                                                                               |

## D. Adapter and application-owned appendix

These rows are intentionally not counted as missing Mira editor features.

| Capability                                             | Status           | Priority | Confidence | Evidence                                                                                                                                                                                                                                                                          | Boundary recommendation                                                                                                                                              |
| ------------------------------------------------------ | ---------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vault metadata extraction/cache and worker             | Lapis app-only   | —        | High       | [L metadata cache](../lapis-notes/packages/plugins/plugin-markdown/src/lib/metadata/cache.ts), [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                                           | Keep indexing, invalidation, and workers in the consumer. Mira should only accept resolved metadata/file-adapter callbacks.                                          |
| Backlinks and outgoing links sidebars                  | Lapis app-only   | —        | High       | [L link sidebar](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/link-sidebar/link-sidebar.svelte), [L plugin registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts)                                                                           | These depend on vault-wide indexing, active-note state, pane navigation, and workspace placement.                                                                    |
| All Properties and File Properties views               | Lapis app-only   | —        | High       | [L views](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views), [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                                                                | Keep side views and cross-file mutations in the app. Reuse Mira's portable frontmatter widgets if/when exported.                                                     |
| Global property rename/removal semantics               | Lapis app-only   | —        | High       | [L mutation helper](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/frontmatter/mutate-frontmatter.ts), [L All Properties](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/all-properties/all-properties.svelte)                                 | Cross-vault changes and `FileManager.processFrontMatter` are not editor-core behavior.                                                                               |
| Workspace view registration, commands, and persistence | Lapis app-only   | —        | High       | [L plugin registration](../lapis-notes/packages/plugins/plugin-markdown/src/index.ts), [L Markdown view](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/markdown/index.ts)                                                                                         | Consumers own route/view registration, active file, command palettes, persisted mode, and workspace panes.                                                           |
| Markdown media views and resource-URL lifecycle        | Lapis app-only   | —        | High       | [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md), [L media view](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/media)                                                                                                                     | Mira should render URLs supplied by `assetResolver`/`readAssetUrl`; it should not acquire or revoke vault resource URLs.                                             |
| Non-image embed registry (PDF and other plugins)       | Consumer adapter | P3       | High       | [M `renderEmbed`](packages/extensions/src/index.ts), [L embed spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                                                                                      | Mira already has the correct `renderEmbed` boundary. Consumers register PDF/media components and own their lifecycle.                                                |
| Markdown diagnostics/language service                  | Consumer adapter | P3       | High       | [M CodeMirror hook](packages/extensions/src/index.ts), [M lint example](apps/docs/src/content/docs/extensions-api.mdx), [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md)                                                                                  | Diagnostic providers and their worker/index lifecycle remain outside core; the documented CodeMirror extension boundary is sufficient.                               |
| Callout catalog persistence/settings/import            | Consumer adapter | P3       | High       | [L plugin spec](../lapis-notes/packages/plugins/plugin-markdown/spec.md), [M catalog contract](packages/extensions/src/index.ts), [M list-callout transform](packages/preview/src/remark/list-callouts.ts), [M docs](apps/docs/src/content/docs/markdown/lists.mdx)               | Mira accepts catalog and marker-renderer values. Consumers own settings storage, icon picker UI, and legacy-plugin migration.                                        |
| Advanced workspace outline                             | Consumer adapter | P3       | High       | [M outline](packages/preview/src/markdown-outline.svelte), [L outline](../lapis-notes/packages/plugins/plugin-markdown/src/lib/views/outline/outline.svelte)                                                                                                                      | Mira's flat portable outline is present. Hierarchical collapse state, search/filter, active-file observation, navigation, and auto-scroll belong in a consumer view. |
| Application Markdown/code-block processors             | Consumer adapter | P3       | High       | [M remark/rehype/components/postprocessor hooks](packages/extensions/src/index.ts), [M docs](apps/docs/src/content/docs/extensions-api.mdx), [L preview integration](../lapis-notes/packages/plugins/plugin-markdown/src/lib/components/markdown-preview/markdown-preview.svelte) | Prefer Mira's typed syntax/render hooks. A consumer can adapt an application registry without making that registry part of Mira.                                     |

## Status totals

The audit contains **71 capability rows**:

| Status           | Count |
| ---------------- | ----: |
| Present          |    59 |
| Partial          |     0 |
| Missing portable |     0 |
| Consumer adapter |     6 |
| Lapis app-only   |     6 |
| Unverified       |     0 |

Follow-up rows by priority:

| Priority | Count | Interpretation                           |
| -------- | ----: | ---------------------------------------- |
| P0       |     0 | No confirmed portable accessibility gaps |
| P1       |     0 | No core authoring gaps                   |
| P2       |     0 | No portable parity or reusable gaps      |
| P3       |     6 | Optional consumer integration            |

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
- **M7 — Original directive gap:** at the stamped audit revision,
  `markdown-directives--preview` rendered a `<directive
data-directive="mira">` element while live preview showed raw `:::mira`
  source, confirming the original parser/surface gap.
- **M8 — Authoring primitives after Slice 2:**
  `default-ui-editor-plugins--markdown-authoring` completed `[[pro` to
  `[[project]]`, offered `Next Steps` for `[[project#Ne`, converted `...` to
  `…` when configured, wrapped a selected label with a pasted URL, and
  scaffolded a fenced code block. `markdown-directives--live-preview` rendered
  the generic directive and **Edit source** revealed the exact directive
  Markdown.
- **M9 — Cross-mode layout after Slice 3:** the tracked
  `markdown-layout-parity` fixture preserved a near-end document position from
  source to reading (`scrollTop 1921.29` of a `2154px` range) and back to the
  editor (`scrollTop 2107.43` of a `2232px` range). At 36rem and 72rem story
  widths, visible list/quote/plain lines carried measured pixel variables; the
  narrow source fixture showed aligned wrapped rows and gutters. The explicit
  `text` fence exposed three no-wrap source lines and remained bounded by the
  editor surface.
- **M10 — Document adapters and metadata after Slice 4:**
  `markdown-embeds--adapter-invalidation` recovered an initially missing note
  after its `watchTarget` callback and refreshed resolved Markdown in place
  after `watchFile`. `markdown-embeds--preview` rendered heading and block
  fragments while excluding the next sibling heading, and applied `320x180`
  image dimensions. `markdown-images--preview` exposed a broken-image
  placeholder with `role="img"`, the expected accessible name, and the failed
  source. `markdown-code--preview` kept the named Copy code button and showed
  `TypeScript`. In
  `markdown-frontmatter--property-actions`, keyboard focus
  loaded `review-status`, the property menu exposed cut/copy/paste/remove,
  cutting and pasting restored a property, and a whole-wikilink alias rendered
  through the note-link component.
- **M11 — Extensible surfaces and accessibility after Slice 5:**
  `markdown-lists--custom-callout-catalog` and its live-preview counterpart
  rendered the same custom `^` marker, omitted a disabled `%` default, and
  rendered the built-in `@` book icon.
  `markdown-embeds--portable-surfaces` resolved a `NoteLink`, selected the
  `FileEmbed` heading fragment without its next sibling section, rendered a
  standalone `MarkdownEmbed`, and applied an extension DOM postprocessor.
  `markdown-mermaid--dialog-controls` exposed exactly one named button for
  Zoom in, Zoom out, four pan directions, and Reset view; every title matched
  its accessible name, and Enter/Space activation retained focus on the
  invoked control.

Slices 1-5 added `visual-pending` stories and the tracked layout fixture. No
snapshot was created, updated, or approved.

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
an embed and bracket math as `BlockMathBracket`. Slice 2 added structural
leaf, inline, and container directive coverage to the CodeMirror parser.

### V2 — Slice 2 validation

The new authoring implementation passed 22 CodeMirror-Markdown tests, including
completion through `listFiles`/`getHeadings`, a unique-basename resolution
fallback, display-text preservation, consumer link formatting, input-handler
configuration, HTML conversion, selection-aware URL paste, and a custom
converter. Checks, tests, and builds passed for extensions, CodeMirror
Markdown, core, Svelte, React, default UI, and docs. The full Storybook static
build also passed.

### V3 — Slice 3 validation

The layout implementation passed 23 CodeMirror-Markdown tests, 45 rich-editor
tests, three Svelte tests, and the existing 27 preview tests. Package checks
and builds passed for CodeMirror Markdown, rich editor, Svelte, and preview.
The parser regression proves that the tracked showcase reaches the registered
frontmatter, table, grid-table, list, quote, link, tag, directive, code, math,
and embed syntax.

### V4 — Slice 4 validation

The adapter and metadata implementation added unit coverage for parsed
heading/block targets, Markdown fragment selection, image dimensions,
frontmatter removal/merge behavior, lazy suggestion filtering, whole-wikilink
pills, and code-language labels. Checks and tests passed for extensions,
CodeMirror Markdown, preview, Svelte, default UI, and React; package and
Storybook builds exercised the public type and rendering paths.

### V5 — Slice 5 validation

The final portable slice passed 13 extension tests, 44 preview tests, 47
rich-editor tests, and seven Mermaid tests. Package checks and builds passed for
extensions, preview, rich editor, Mermaid, Svelte, default UI, and React. The
docs check/build/browser tests and the static Storybook build passed. Browser
acceptance covered shared list-callout configuration in reading/live preview,
portable public surfaces, postprocessor execution, and keyboard operation of
all seven named Mermaid dialog controls.

The final `pnpm check:all` reached 29 of 31 successful workspaces before the
excluded, pre-existing `apps/demo/src/routes/+page.svelte` edit failed Svelte
parsing with 589 diagnostics. `pnpm test:e2e` was likewise unable to start that
demo and timed out at its web-server gate; no end-to-end assertion ran or
failed. The affected workspaces were therefore rerun directly and passed. The
demo file and untracked `assets/` remained untouched.

Existing visual baselines under
`tests/visual/storybook.spec.ts-snapshots/` were inspected as historical
evidence only. No snapshot update or acceptance action was run.

## Prioritized roadmap

### Slice 1 — Make existing portable contracts truthful (P1) — Complete

Completed across `@mira-mde/extensions`, Svelte, React, preview, and default UI.
The default-editor docs and the
`Default UI/Editor Plugins/Extension Commands, Toolbar, And Styles` story show
the public contract. The new visual baseline is intentionally pending human
review.

This slice reduces API ambiguity before new features build on the extension
model.

### Slice 2 — Complete Markdown authoring primitives (P1) — Complete

Completed through `@mira-mde/codemirror-markdown` and the shared
`MiraMarkdownAuthoringConfig`, with Svelte/React/default-UI wiring. The
default-editor and directive docs plus the
`Default UI/Editor Plugins/Completions, Smart Paste, And Input Handlers` story
show the configurable contract. The story is intentionally
`visual-pending`.

### Slice 3 — Cross-mode and editor geometry parity (P1/P2) — Complete

Completed through the Svelte mode-position controller, rich-editor line and
measurement extensions, and shipped preview CSS. The
`Markdown/Layout Parity` stories and MDX expose source, live-preview, reading,
split, 36rem, and 72rem examples against one tracked Markdown fixture. All new
stories remain `visual-pending`.

### Slice 4 — Finish document adapters and editable metadata (P1/P2) — Complete

Completed through parsed `MiraFileTarget` values, `watchTarget` and `watchFile`
subscriptions, portable Markdown fragment selection, sized/broken image
handling, frontmatter suggestion and clipboard adapters, wikilink pills, and
code-language labels. Storybook exposes both the static parity cases and
interactive invalidation/property-action examples; the new stories remain
`visual-pending`.

### Slice 5 — Accessibility and reusable surfaces (P0/P2) — Complete

Completed through shared extension-contributed list-callout catalogs,
cleanup-capable high-level DOM postprocessors, public `MarkdownEmbed`,
`FileEmbed`, and `NoteLink` surfaces, and named Mermaid dialog controls. The
Markdown Lists, Embeds, Mermaid, and Extensions API docs provide consumer
examples; the matching stories remain `visual-pending`.

Each slice should remain separately reviewable and should not import Lapis
vault, workspace, command-registry, metadata-worker, or persistence internals
into Mira.
