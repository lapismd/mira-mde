/** Shared sample document for Default UI catalog stories. */
export const defaultUiSampleMarkdown = String.raw`---
title: Default UI sample
status: draft
tags:
  - mira
  - default-ui
---

# Default UI

The default editor composes toolbar, mode switching, live widgets, and preview rendering.

> [!note] Configuration
> Features, themes, indentation, and mode availability are controlled through props and feature flags.

## Checklist

- [x] Toolbar and mode switch
- [ ] Feature flags
- [/] Indentation settings

## Table

| Setting | Prop | Default |
| :--- | :--- | :--- |
| Mode | \`mode\` | live-preview |
| Theme | \`theme\` | light |
| Line wrap | \`lineWrapping\` | true |

## Math and code

Inline $E = mc^2$ and a fence:

~~~ts
import { MiraDefaultMde } from "@mira-mde/default-ui/svelte";
~~~

## Mermaid

~~~mermaid
flowchart LR
  Source --> LivePreview
  LivePreview --> Preview
  Preview --> Split
~~~
`;

/** Empty doc so slash menus open on `/` without competing body text. */
export const slashCommandsMarkdown = "";

/** Multi-block sample for gutter block controls and section folding. */
export const blockControlsMarkdown = String.raw`# Block controls

Hover the left gutter to move, duplicate, or delete blocks.

## Nested section

Paragraph under a heading. Use the fold indicator to collapse this section.

- List item one
- List item two

> [!tip] Callout
> Callouts and lists also participate in block ranges.
`;

/** Headings + body for inline marker hiding and fold indicators. */
export const inlineHeadingsMarkdown = String.raw`# Inline headings

Move the caret onto this heading to reveal the ATX \`#\` markers. Off-line markers stay hidden in live preview.

## Foldable section

Content under this heading can fold from the gutter indicator.

### Nested heading

More body text for fold nesting.
`;

/** Image attachment demo copy; paste/drop still works in the live canvas. */
export const imageAttachmentsMarkdown = String.raw`# Image attachments

Use the toolbar image action, or paste / drop an image into the editor.

By default Mira uploads with \`FileReader.readAsDataURL\` and inserts reference-style Markdown. Override \`imageConfig.imageUpload\` to send files to your storage and return a URL.
`;
