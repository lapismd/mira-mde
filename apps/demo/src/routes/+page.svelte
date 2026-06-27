<script lang="ts">
  import { mermaidExtension } from "@mira-mde/plugin-mermaid";
  import { MiraMde } from "@mira-mde/svelte";
  import { Button } from "@mira-mde/ui/button";
  import * as ToggleGroup from "@mira-mde/ui/toggle-group";
  import type { MiraMode, MiraTheme } from "@mira-mde/extensions";

  const sample = `---
title: Mira MDE Demo
status: portable-v1
tags:
  - markdown
  - editor
---

# Mira MDE

This standalone editor is backed by CodeMirror 6, Svelte 5, unified, and the Mira extension contract.

> [!note] Portable package boundary
> The editor, preview renderer, Mermaid support, and UI shell are separate workspace packages.

## Tables

| Package | Role | Status |
| :--- | :--- | ---: |
| @mira-mde/core | editor controller | ready |
| @mira-mde/preview | rendered markdown | ready |
| @mira-mde/plugin-mermaid | optional extension | ready |

## Mermaid

\`\`\`mermaid
flowchart LR
  Core["@mira-mde/core"] --> Svelte["@mira-mde/svelte"]
  Extensions["@mira-mde/extensions"] --> Svelte
  Mermaid["@mira-mde/plugin-mermaid"] --> Preview["@mira-mde/preview"]
  Svelte --> Demo["apps/demo"]
\`\`\`

## Markdown Features

- [x] GFM task lists
- [x] Wikilinks like [[Project Plan|Project Plan]]
- [x] Tags like #mira/editor
- [x] Math: $E = mc^2$

\`\`\`ts
import { MiraMde } from "@mira-mde/svelte";
import { mermaidExtension } from "@mira-mde/plugin-mermaid";
\`\`\`
`;

  let value = $state(sample);
  let mode = $state<MiraMode>("split");
  let theme = $state<MiraTheme>("light");
  let mermaidEnabled = $state(true);
  const extensions = $derived(mermaidEnabled ? [mermaidExtension()] : []);
  const wordCount = $derived(value.trim().split(/\s+/).filter(Boolean).length);
</script>

<svelte:head>
  <title>Mira MDE Demo</title>
</svelte:head>

<div class={`demo-shell ${theme === "dark" ? "mira-theme-dark" : ""}`}>
  <header class="demo-header">
    <h1>Mira MDE</h1>
    <span class="demo-header__meta">{wordCount} words</span>
  </header>

  <div class="demo-body">
    <aside class="demo-sidebar" aria-label="Demo controls">
      <section class="demo-section">
        <h2>Mode</h2>
        <ToggleGroup.Root bind:value={mode} aria-label="Editor mode">
          <ToggleGroup.Item value="source">Source</ToggleGroup.Item>
          <ToggleGroup.Item value="live-preview">Live</ToggleGroup.Item>
          <ToggleGroup.Item value="preview">Preview</ToggleGroup.Item>
          <ToggleGroup.Item value="split">Split</ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>

      <section class="demo-section">
        <h2>Theme</h2>
        <ToggleGroup.Root bind:value={theme} aria-label="Theme">
          <ToggleGroup.Item value="light">Light</ToggleGroup.Item>
          <ToggleGroup.Item value="dark">Dark</ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>

      <section class="demo-section">
        <h2>Extensions</h2>
        <label class="demo-check">
          <input type="checkbox" bind:checked={mermaidEnabled} />
          Mermaid
        </label>
      </section>

      <section class="demo-section">
        <h2>Document</h2>
        <Button variant="outline" size="sm" onclick={() => (value = sample)}>
          Reset sample
        </Button>
      </section>
    </aside>

    <main class="demo-main">
      <MiraMde
        bind:value
        bind:mode
        {theme}
        {extensions}
        class="demo-editor"
        sourcePath="demo.md"
      />
    </main>
  </div>
</div>
