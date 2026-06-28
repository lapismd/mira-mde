export const overviewMarkdown = String.raw`---
title: Mira MDE Docs
status: portable
published: 2026-06-28
featured: true
tags:
  - markdown
  - editor
---

# Mira MDE

Mira MDE is a portable Markdown editor stack with a composable core, Svelte bindings, React bindings, Lapis-aligned Markdown rendering, and a default UI package for faster onboarding.

> [!note] Default UI
> The default editor includes the toolbar, live preview, preview mode, split mode, tables, Mermaid, frontmatter, links, tags, callouts, math, and source fallback behavior.

## A table

| Package | Role | Surface |
| :--- | :--- | :--- |
| @mira-mde/default-ui | Onboarding UI | Svelte |
| @mira-mde/react | React components | React |
| @mira-mde/plugin-mermaid | Mermaid diagrams | Markdown |

## A diagram

~~~mermaid
flowchart LR
  Core["@mira-mde/core"] --> Svelte["@mira-mde/svelte"]
  Svelte --> Default["@mira-mde/default-ui"]
  Default --> Docs["apps/docs"]
  Core --> React["@mira-mde/react"]
~~~

## Markdown features

- [x] GFM tasks
- [x] Wikilinks like [[Editor Architecture|the architecture note]]
- [x] Embeds like ![[Architecture Diagram|architecture diagram]]
- [x] Tags like #mira/docs
- [x] Math like $E = mc^2$
- [x] Footnotes, raw HTML, images, callouts, and directives

~~~ts
import { createMiraDefaultEditor } from "@mira-mde/default-ui";
import "@mira-mde/default-ui/styles.css";
~~~
`;

export const markdownFeatureMarkdown = `---
title: Markdown feature tour
status: complete
published: 2026-06-28
featured: true
priority: 2
tags:
  - docs
  - preview
aliases:
  - Markdown showcase
summary: Full portable Markdown coverage for Mira MDE.
related:
  package: "@mira-mde/preview"
  surface: reading-mode
---

# Markdown feature tour

Mira keeps source mode, live preview, and reading mode aligned so portable Markdown renders consistently.

## Headings and inline syntax

### Inline rendering

Inline **bold**, _italic_, ~~strikethrough~~, \`inline code\`, [relative links](notes/markdown.md), [external links](https://example.com), automatic links like https://example.com, [[Daily Note|wikilinks]], embedded notes like ![[Architecture Diagram|architecture diagram]], #tags, and inline math $a^2 + b^2 = c^2$ stay editable in live preview.

Raw HTML such as <mark>highlighted text</mark> and <kbd>keyboard keys</kbd> is preserved.

## Callouts and blockquotes

> [!tip] Portable rendering
> Callouts, task items, links, wikilinks, tags, math, embeds, code, and tables are Markdown behavior, not demo-only UI.

> [!warning]- Collapsed warning
> Collapsible callouts preserve their default fold state.

> A normal blockquote remains a normal blockquote.

## Tasks

- [ ] Draft API examples
- [x] Add live preview parity checks
- [/] Custom task states keep their marker
- [?] Question task states keep their marker
- [-] Cancelled task states keep their marker
- [ ] Publish package docs

## Lists

1. Ordered item
2. Ordered item with children
   - Nested unordered item
   - [ ] Nested task item

## Images and embeds

![Mira Markdown demo asset](/mira-markdown-demo.svg "Mira demo asset")

:::mira{title="Directive example"}
Directive syntax is parsed and rendered as a portable custom element unless an application supplies a custom directive component.
:::

## Code

~~~ts
type EditorMode = "source" | "live-preview" | "preview" | "split";

export function selectMode(mode: EditorMode) {
  return mode;
}
~~~

## Math

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

## Footnotes

GFM footnotes render through the shared Markdown pipeline.[^docs-footnote]

[^docs-footnote]: This footnote belongs to the live Markdown example.
`;

export const livePreviewMarkdown = String.raw`---
title: Live preview document
status: editable
tags:
  - live-preview
  - source-toggle
---

# Live preview

Live preview renders block widgets while preserving the source selection path back to Markdown.

> [!warning] Source fallback
> Hover rendered widgets such as tables and Mermaid diagrams to use their source controls when you need raw Markdown.

## Editable table

| Action | Result |
| :--- | :--- |
| Click a cell | Edit table content |
| Use table chrome | Add, remove, align, and sort |
| Source toggle | Return to pipe table Markdown |

## Collapsible callout

> [!todo]+ Open by default
> Live preview keeps callout fold state and source fallback behavior.

## Mermaid

~~~mermaid
sequenceDiagram
  participant User
  participant Editor
  participant Preview
  User->>Editor: edit Markdown
  Editor->>Preview: render live widget
  Preview-->>User: source toggle and controls
~~~
`;

export const tableMarkdown = String.raw`# Tables

Pipe tables render as editable table widgets in live preview.

| Package | Owner | Status | Notes |
| :--- | :--- | ---: | :--- |
| @mira-mde/core | editor | 100 | selection and transactions |
| @mira-mde/preview | markdown | 100 | reading mode renderer |
| @mira-mde/codemirror-tables | editor | 100 | table widget and source fallback |

| Alignment | Left | Center | Right |
| :--- | :--- | :---: | ---: |
| Cell content | left | centered | right |

Grid tables are part of the portable Markdown table subsystem.

+----------------------+------------------------+
| Feature              | Behavior               |
+======================+========================+
| Row and column menus | Kebab dropdown actions |
+----------------------+------------------------+
| Drag handles         | Reorder rows/columns   |
+----------------------+------------------------+
| Source toggle        | Edit raw Markdown      |
+----------------------+------------------------+
`;

export const mermaidMarkdown = String.raw`# Mermaid

Mermaid blocks render with the Lapis-aligned control surface.

~~~mermaid
flowchart TB
  Start([Write Markdown]) --> Render{Live preview}
  Render --> Inline[Inline SVG]
  Render --> Dialog[Expanded dialog]
  Dialog --> Pan[Pan and zoom]
  Dialog --> Reset[Reset view]
~~~

Mermaid code fences can include YAML frontmatter config that is passed to Mermaid before rendering.

~~~mermaid
---
look: rough
rough:
  seed: 9
---
flowchart LR
  Config[Config frontmatter] --> Render[Mermaid render]
  Render --> Sketch[Rough sketch output]
~~~

~~~mermaid
mindmap
  root((Mira MDE))
    Core
    Svelte
    React
    Default UI
    Docs
~~~
`;

export const toolbarMarkdown = String.raw`# Toolbar API

The default UI ships with a compact toolbar, but consumers can add their own sections.

## Try the custom buttons

Use the custom toolbar controls to insert templates into this editor.
`;

export const featureToggleMarkdown = String.raw`# Feature flags

The default UI exposes feature flags so applications can choose a narrower editor surface.

| Feature | Package area |
| :--- | :--- |
| Tables | @mira-mde/codemirror-tables |
| Mermaid | @mira-mde/plugin-mermaid |
| Split mode | @mira-mde/svelte |

~~~mermaid
flowchart LR
  Flags --> Extensions
  Flags --> Toolbar
  Extensions --> Editor
~~~
`;
