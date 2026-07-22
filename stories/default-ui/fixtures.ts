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
