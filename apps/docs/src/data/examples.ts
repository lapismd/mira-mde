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
