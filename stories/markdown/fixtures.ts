/** Markdown feature fixtures for Storybook (catalog source of truth). */

/** Backtick for interpolation inside String.raw (where \` is literal). */
const tick = "`";

export const frontmatterMarkdown = String.raw`---
title: Release notes
status: draft
published: 2026-06-29
featured: true
tags:
  - markdown
  - properties
aliases:
  - Markdown metadata
  - "[[Editor Architecture|Architecture note]]"
---

# Frontmatter

Frontmatter stores document properties before the Markdown body.
`;

export const headingsMarkdown = String.raw`# Heading 1

## Heading 2

### Heading 3

#### Heading 4

Headings create the document outline used by reading and editor surfaces.
`;

export const inlineFormattingMarkdown = String.raw`# Inline formatting

Use **bold**, _italic_, ~~strikethrough~~, and ${tick}inline code${tick} inside paragraphs.

Inline formatting can combine, so **bold text can include _emphasis_**.
`;

export const linksMarkdown = String.raw`# Links

Use [relative links](notes/markdown.md), [external links](https://example.com), and automatic links like https://example.com.

Mira passes links through the configured link resolver before rendering.
`;

export const wikilinksMarkdown = String.raw`# Wikilinks

Link to notes with [[Daily Note]] or use an alias such as [[Editor Architecture|the architecture note]].

Wikilinks keep Obsidian-style note references portable across apps.
`;

export const embedsMarkdown = String.raw`# Markdown embeds

Embed another note or asset with ![[Architecture Diagram]].

Add display text with ![[Architecture Diagram|Architecture diagram]].

Size image embeds with a width or width-by-height suffix:

![[Architecture Diagram|320x180]]

Markdown notes embed through the same adapter:

![[Embedded Note]]

Embed one heading section or one referenced block:

![[Embedded Note#Next Steps]]

![[Embedded Note#^portable-block]]
`;

export const tagsMarkdown = String.raw`# Tags

Tags such as #mira and nested tags such as #mira/docs render as navigable metadata.

Tags can appear inline with surrounding paragraph text.
`;

export const listsMarkdown = String.raw`# Lists

- Unordered parent
  - Nested unordered item
  - Another nested item

1. Ordered parent
2. Ordered item with children
   - Nested unordered item
   - Wrapped list content stays aligned with the item body.
`;

export const listCalloutsMarkdown = String.raw`# List callouts

- & Highlighted with the default catalog
- @ Documentation uses the default book icon
- ^ A custom decision marker contributed by an extension
- % This disabled default stays a plain list item
`;

export const taskStatesMarkdown = String.raw`# Task states

- [ ] Draft the docs
- [x] Ship the toolbar
- [/] In progress
- [?] Needs decision
- [-] Cancelled
- [!] Important
`;

export const blockquotesMarkdown = String.raw`# Blockquotes

> Blockquotes preserve quoted prose.
>
> > Nested blockquotes keep a second quote guide.
`;

export const calloutsMarkdown = String.raw`# Callouts

> [!note] Default callout
> Callouts render with Obsidian-compatible labels and icons.

> [!warning]- Collapsed warning
> Collapsible callouts preserve their initial folded state.
`;

export const tablesMarkdown = String.raw`# Pipe tables

| Package                | Surface | Status |
| :--------------------- | :-----: | -----: |
| @lapismd/mira/preview  | reading | 100    |
| @lapismd/mira          | editor  | 100    |
| @lapismd/mira-editor   | toolbar | 100    |

Pipe tables support alignment markers and shared preview/live-preview styling.
`;

export const gridTablesMarkdown = String.raw`# Grid tables

Grid tables use explicit row and column boundaries for spans, sections, and alignment.

+-------------------+------+
| Table Headings    | Here |
+--------+----------+------+
| Sub    | Headings | Too  |
+========+=================+
| cell   | column spanning |
| spans  +---------:+------+
| rows   |   normal | cell |
+---v----+:---------------:+
|        | cells can be    |
|        | *formatted*     |
|        | **paragraphs**  |
|        | ~~~             |
| multi  | and contain     |
| line   | blocks          |
| cells  | ~~~             |
+========+=========:+======+
| footer |    cells |      |
+--------+----------+------+
`;

export const codeMarkdown = String.raw`# Code

Inline ${tick}code${tick} stays inside the paragraph.

~~~ts {2}
type EditorMode = "source" | "live-preview" | "preview" | "split";

export function selectMode(mode: EditorMode) {
  return mode;
}
~~~
`;

export const mathMarkdown = String.raw`# Math

Inline math such as $a^2 + b^2 = c^2$ renders through KaTeX.

$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
`;

/** Visible PNG used for base64 image rendering demos (120x72 checkerboard). */
export const base64DemoPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAABICAYAAAA9HjF/AAAA4klEQVR42u3dMQ2AMBRF0TpgrAKW2kJohSABDxQFEAYg4eUMf73DO1tDQplqGy73ihEAuxTgedlOr6/7rbtq6H3TAwzYgICBANYDrAdY7zFgQ2f0AAM2IGAggPUA6wHWA6wHGDDgfGBDe4s2IGAggPUA6wHWAwwYMGADAgbimyw9b9F6gPUA6wEGbEDAQADrAdYDrOebLD1v0YABAzYgYCCA9QDrAdYDDBiwb7IM7S0aCGA9wHqA9QDrAQZsQMBAAAPxTZaet2g9wHqAAQMGbEDAQADrAdZ7EdiF/+LdAXY/uwPLpGopJ9GX1QAAAABJRU5ErkJggg==";

export const imagesMarkdown = `# Images

Resolved path image:

![Mira Markdown demo asset](/mira-markdown-demo.svg "Mira demo asset")

Inline base64 image (120×72 PNG data URI):

![Inline base64](${base64DemoPng})

Reference-style base64 image:

![Reference base64][base64-red]

Images can be resolved through the configured asset resolver. Data-URI images render without a resolver.

Sized image syntax keeps its intrinsic aspect ratio:

![Mira Markdown demo asset|320x180](/mira-markdown-demo.svg)

Broken images render an accessible placeholder:

![Missing diagram](/missing-mira-diagram.svg)

[base64-red]: ${base64DemoPng}
`;

export const rawHtmlMarkdown = String.raw`# Raw HTML

Raw HTML such as <mark>highlighted text</mark> and <kbd>keyboard keys</kbd> is preserved.

<details>
  <summary>Expandable HTML</summary>
  <p>This content comes from raw HTML.</p>
</details>
`;

export const directivesMarkdown = String.raw`# Directives

:::mira{title="Directive example"}
Directive syntax is parsed and rendered as a portable custom element unless an application supplies a custom directive component.
:::
`;

export const footnotesMarkdown = String.raw`# Footnotes

Footnotes keep supporting details close to the related paragraph.[^docs-footnote]

[^docs-footnote]: This footnote belongs to the focused feature example.
`;

export const mermaidMarkdownFeature = String.raw`# Mermaid

~~~mermaid
flowchart TB
  Start([Write Markdown]) --> Render{Preview}
  Render --> Inline[Inline SVG]
  Render --> Dialog[Expanded dialog]
  Dialog --> Pan[Pan and zoom]
  Dialog --> Reset[Reset view]
~~~
`;
