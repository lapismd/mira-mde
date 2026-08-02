/** Backtick for interpolation inside String.raw (where \` is literal). */
const tick = "`";

/** Shared sample document for Mira Editor catalog stories. */
export const miraEditorSampleMarkdown = String.raw`---
title: Mira Editor sample
status: draft
tags:
  - mira
  - mira-editor
---

# Mira Editor

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
| Mode | ${tick}mode${tick} | live-preview |
| Theme | ${tick}theme${tick} | inherit page |
| Color mode | ${tick}colorMode${tick} | inherit |
| Line wrap | ${tick}lineWrapping${tick} | true |

## Math and code

Inline $E = mc^2$ and a fence:

~~~ts
import { MiraEditor } from "@lapismd/mira-editor";
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

Move the caret onto this heading to reveal the ATX ${tick}#${tick} markers. Off-line markers stay hidden in live preview.

## Foldable section

Content under this heading can fold from the gutter indicator.

### Nested heading

More body text for fold nesting.
`;

/** Image attachment demo copy; paste/drop still works in the live canvas. */
export const imageAttachmentsMarkdown = String.raw`# Image attachments

Use the toolbar image action, or paste / drop an image into the editor.

Paste or drop shows ${tick}![Uploading name…](mira-uploading:…)${tick} until upload finishes, then replaces it with the final Markdown. Default upload uses ${tick}FileReader.readAsDataURL${tick}; override ${tick}imageConfig.imageUpload${tick} for your storage.
`;
