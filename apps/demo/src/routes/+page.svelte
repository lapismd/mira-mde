<script lang="ts">
  import CheckIcon from "@lucide/svelte/icons/check";
  import MonitorIcon from "@lucide/svelte/icons/monitor";
  import MoonIcon from "@lucide/svelte/icons/moon";
  import PackageIcon from "@lucide/svelte/icons/package";
  import PaletteIcon from "@lucide/svelte/icons/palette";
  import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
  import Settings2Icon from "@lucide/svelte/icons/settings-2";
  import SunIcon from "@lucide/svelte/icons/sun";
  import WorkflowIcon from "@lucide/svelte/icons/workflow";
  import {
    MiraDefaultMde,
    MiraDefaultToolbar,
    MiraFeature,
    type MiraDefaultMdeHandle,
    type MiraDefaultToolbarActionContext,
    type MiraDefaultToolbarDefinition,
  } from "@mira-mde/default-ui/svelte";
  import { mermaidExtension } from "@mira-mde/plugin-mermaid";
  import { MiraMde, type MiraMdeHandle } from "@mira-mde/svelte";
  import type { MiraEditorSelection } from "@mira-mde/core";
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
import { createMiraDefaultEditor } from "@mira-mde/default-ui";
import "@mira-mde/default-ui/styles.css";
\`\`\`
`;

  type EditorShell = "default" | "composable";

  let value = $state(sample);
  let mode = $state<MiraMode>("live-preview");
  let theme = $state<MiraTheme>("system");
  let editorShell = $state<EditorShell>("default");
  let mermaidEnabled = $state(true);
  let defaultEditor = $state<MiraDefaultMdeHandle | null>(null);
  let composableEditor = $state<MiraMdeHandle | null>(null);
  const extensions = $derived(mermaidEnabled ? [mermaidExtension()] : []);
  const toolbarFeatures = $derived({
    [MiraFeature.Mermaid]: mermaidEnabled,
  });
  const editorFeatures = $derived({
    [MiraFeature.Mermaid]: mermaidEnabled,
    [MiraFeature.Toolbar]: false,
  });
  const wordCount = $derived(value.trim().split(/\s+/).filter(Boolean).length);

  function activeEditor(): MiraDefaultMdeHandle | MiraMdeHandle | null {
    return editorShell === "default" ? defaultEditor : composableEditor;
  }

  const toolbarContext = $derived({
    value,
    mode,
    readonly: false,
    focus() {
      activeEditor()?.focus();
    },
    getMarkdown() {
      return activeEditor()?.getMarkdown() ?? value;
    },
    getMode() {
      return mode;
    },
    getSelection() {
      return activeEditor()?.getSelection() ?? null;
    },
    insertMarkdown(markdown: string) {
      activeEditor()?.insertMarkdown(markdown);
    },
    setMarkdown(markdown: string) {
      value = markdown;
      activeEditor()?.setMarkdown(markdown);
    },
    setMode(nextMode: MiraMode) {
      mode = nextMode;
      activeEditor()?.setMode(nextMode);
    },
    setReadonly() {
      return undefined;
    },
    setSelection(selection: MiraEditorSelection) {
      activeEditor()?.setSelection(selection);
    },
  } satisfies MiraDefaultToolbarActionContext);

  const demoToolbars = $derived([
    {
      id: "demo-controls",
      label: "Demo controls",
      align: "start",
      items: [
        {
          id: "reset-sample",
          label: "Reset sample",
          icon: RotateCcwIcon,
          run(editor: MiraDefaultToolbarActionContext) {
            value = sample;
            editor.setMarkdown(sample);
          },
        },
        {
          id: "toggle-mermaid",
          label: mermaidEnabled ? "Disable Mermaid" : "Enable Mermaid",
          icon: WorkflowIcon,
          pressed: () => mermaidEnabled,
          run() {
            mermaidEnabled = !mermaidEnabled;
          },
        },
        {
          type: "dropdown",
          id: "demo-settings",
          label: "Demo settings",
          icon: Settings2Icon,
          items: [
            {
              type: "label",
              label: "Package",
            },
            {
              id: "package-default",
              label: "Default UI",
              icon: editorShell === "default" ? CheckIcon : PackageIcon,
              checked: () => editorShell === "default",
              run() {
                editorShell = "default";
              },
            },
            {
              id: "package-composable",
              label: "Composable",
              icon: editorShell === "composable" ? CheckIcon : PackageIcon,
              checked: () => editorShell === "composable",
              run() {
                editorShell = "composable";
              },
            },
            {
              type: "separator",
            },
            {
              type: "label",
              label: "Appearance",
            },
            {
              id: "theme-light",
              label: "Light",
              icon: theme === "light" ? CheckIcon : SunIcon,
              checked: () => theme === "light",
              run() {
                theme = "light";
              },
            },
            {
              id: "theme-dark",
              label: "Dark",
              icon: theme === "dark" ? CheckIcon : MoonIcon,
              checked: () => theme === "dark",
              run() {
                theme = "dark";
              },
            },
            {
              id: "theme-system",
              label: "System",
              icon: theme === "system" ? CheckIcon : MonitorIcon,
              checked: () => theme === "system",
              run() {
                theme = "system";
              },
            },
          ],
        },
        {
          type: "dropdown",
          id: "demo-theme",
          label: "Appearance",
          icon: PaletteIcon,
          items: [
            {
              id: "theme-light-shortcut",
              label: "Light",
              icon: theme === "light" ? CheckIcon : SunIcon,
              checked: () => theme === "light",
              run() {
                theme = "light";
              },
            },
            {
              id: "theme-dark-shortcut",
              label: "Dark",
              icon: theme === "dark" ? CheckIcon : MoonIcon,
              checked: () => theme === "dark",
              run() {
                theme = "dark";
              },
            },
            {
              id: "theme-system-shortcut",
              label: "System",
              icon: theme === "system" ? CheckIcon : MonitorIcon,
              checked: () => theme === "system",
              run() {
                theme = "system";
              },
            },
          ],
        },
      ],
    },
  ] satisfies MiraDefaultToolbarDefinition[]);
</script>

<svelte:head>
  <title>Mira MDE Demo</title>
</svelte:head>

<div class={`demo-shell mira-theme-${theme}`}>
  <header class="demo-header">
    <h1>Mira MDE</h1>
    <span class="demo-header__meta">{wordCount} words</span>
  </header>

  <MiraDefaultToolbar
    bind:mode
    {value}
    features={toolbarFeatures}
    toolbars={demoToolbars}
    context={toolbarContext}
    class="demo-toolbar"
  />

  <main class="demo-main">
    {#if editorShell === "default"}
      <MiraDefaultMde
        bind:this={defaultEditor}
        bind:value
        bind:mode
        {theme}
        features={editorFeatures}
        class="demo-editor"
        sourcePath="demo.md"
      />
    {:else}
      <MiraMde
        bind:this={composableEditor}
        bind:value
        bind:mode
        {theme}
        {extensions}
        toolbar={false}
        class="demo-editor"
        sourcePath="demo.md"
      />
    {/if}
  </main>
</div>
