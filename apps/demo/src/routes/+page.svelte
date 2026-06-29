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
  import type {
    MiraFileAdapter,
    MiraFileRef,
    MiraMode,
    MiraTheme,
  } from "@mira-mde/extensions";

  const sample = `---
title: Mira MDE Demo
status: portable-v1
published: 2026-06-28
featured: true
priority: 3
tags:
  - markdown
  - editor
aliases:
  - Mira Markdown demo
summary: Portable markdown feature coverage for the default editor.
related:
  package: "@mira-mde/default-ui"
  surface: live-preview
---

# Mira MDE

This standalone editor is backed by CodeMirror 6, Svelte 5, unified, and the Mira extension contract.

## Headings and inline formatting

### Portable Markdown surface

![[Embedded Note|Markdown embed preview]]

Inline **bold**, _italic_, ~~strikethrough~~, \`inline code\`, [path links](notes/architecture.md), [external links](https://example.com), automatic links like https://example.com, [[Project Plan|wikilinks]], embedded images like ![[Architecture Diagram|Architecture diagram embed]], tags like #mira/editor, and inline math $E = mc^2$ all render in preview and live preview.

> [!note] Portable package boundary
> The editor, preview renderer, Mermaid support, and UI shell are separate workspace packages.

> [!tip]+ Expanded callout
> Collapsible callouts preserve the Lapis-style title, icon, and fold state.

> [!warning]- Collapsed callout
> This content starts collapsed in rendered Markdown.

> Regular blockquotes remain regular blockquotes and are not converted into callouts.

## Lists and tasks

- Unordered item
  - Nested unordered item
- [x] Completed task without live-edit strikethrough
- [ ] Open task with editable checkbox
- [/] Custom task marker
- [?] Question task marker
- [-] Cancelled task marker

- & Highlighted list callout item
- ? Question list callout item
- ! Warning list callout item

1. Ordered item
2. Ordered item with nested tasks
   - [ ] Nested task

## Tables and grid tables

### Pipe table

| Package | Role | Status |
| :--- | :--- | ---: |
| @mira-mde/core | editor controller | ready |
| @mira-mde/preview | rendered markdown | ready |
| @mira-mde/plugin-mermaid | optional extension | ready |

### MultiMarkdown spans

| MultiMarkdown | Span | Status |
| :--- | :--- | ---: |
| Combined cell | | ready |
| Persistent row | rendered markdown | ready |
| ^ | source-compatible spans | ready |

### Grid table

#### Overview spans and sections

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
|        | \`\`\`             |
| multi  | and contain     |
| line   | blocks          |
| cells  | \`\`\`             |
+========+=========:+======+
| footer |    cells |      |
+--------+----------+------+

#### Horizontal alignment

+>-----<+
| A b C |
+-------+

+:-----:+
|  ABC  |
+-------+

+:------+
| ABC   |
+------+

+------:+
|   ABC |
+------+

#### Vertical alignment

+---^---+
| Larum |
| Ipsum |
|       |
|       |
+-------+

+---x---+
|       |
| Larum |
| Ipsum |
|       |
+-------+

+---v---+
|       |
|       |
| Larum |
| Ipsum |
+-------+

## Media, embeds, and raw HTML

![[Embedded Note|Markdown embed preview]]

![Mira Markdown demo asset](/mira-markdown-demo.svg "Mira demo asset")

<mark>Raw HTML is preserved</mark> and <kbd>keyboard</kbd> elements render through the Markdown preview pipeline.

:::mira{title="Directive example"}
Directive syntax is parsed and surfaced as a portable custom element.
:::

## Mermaid

### Flowchart

~~~mermaid
flowchart LR
  Core["@mira-mde/core"] --> Svelte["@mira-mde/svelte"]
  Extensions["@mira-mde/extensions"] --> Svelte
  Mermaid["@mira-mde/plugin-mermaid"] --> Preview["@mira-mde/preview"]
  Svelte --> Demo["apps/demo"]
~~~

### Rough sequence

~~~mermaid
---
look: rough
rough:
  seed: 4
---
sequenceDiagram
  participant User
  participant Toolbar
  participant Editor
  User->>Toolbar: choose mode or insert block
  Toolbar->>Editor: dispatch editor action
  Editor-->>User: update live preview
~~~

## Code, math, and footnotes

~~~ts {2}
import { createMiraDefaultEditor } from "@mira-mde/default-ui";
import "@mira-mde/default-ui/styles.css";
~~~

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

GFM footnotes are supported too.[^feature-footnote]

[^feature-footnote]: Footnotes come from the shared GFM Markdown pipeline.

## Custom task marker gallery

- [>] Forwarded task marker
- [<] Scheduled task marker
- [?] Question task marker
- [/] Incomplete task marker
- [!] Important task marker
- ["] Quote task marker
- [-] Cancelled task marker
- [*] Star task marker
- [l] Location task marker
- [i] Info task marker
- [S] Savings task marker
- [I] Idea task marker
- [f] Fire task marker
- [k] Key task marker
- [u] Up task marker
- [d] Down task marker
- [w] Win task marker
- [p] Pro task marker
- [c] Con task marker
- [b] Bookmark task marker

## Callout variants

> [!note]

> [!abstract] Abstract, Summary, Tldr

> [!info] Info, Todo

> [!tip] Tip, Hint, Important

> [!success] Success, Check, Done

> [!question] Question, Help, FAQ

> [!warning] Warning, Caution, Attention

> [!failure] Failure, Fail, Missing

> [!danger] Danger, Error

> [!bug]

> [!example]

> [!quote] Quote, Cite
`;

  type EditorShell = "default" | "composable";

  const demoFiles = new Map<
    string,
    MiraFileRef & { markdown?: string; assetUrl?: string }
  >([
    [
      "notes/architecture.md",
      {
        kind: "markdown",
        markdown:
          "# Architecture\n\nThe demo resolves ordinary markdown path links through `MiraFileAdapter`.",
        name: "Architecture",
        path: "notes/architecture.md",
      },
    ],
    [
      "Project Plan",
      {
        kind: "markdown",
        markdown:
          "# Project Plan\n\nWikilinks resolve through the same adapter surface as markdown path links.",
        name: "Project Plan",
        path: "Project Plan",
      },
    ],
    [
      "Embedded Note",
      {
        kind: "markdown",
        markdown:
          "# Embedded Note\n\nThis linked Markdown file is rendered through the same preview component as the main document.\n\n- Nested markdown stays formatted.\n- Links like [Architecture](notes/architecture.md) resolve through `MiraFileAdapter`.",
        name: "Embedded Note",
        path: "Embedded Note",
      },
    ],
    [
      "Architecture Diagram",
      {
        assetUrl: "/mira-markdown-demo.svg",
        kind: "image",
        name: "Architecture Diagram",
        path: "Architecture Diagram",
      },
    ],
  ]);

  const demoFileAdapter: MiraFileAdapter = {
    resolveLink({ href }) {
      const path = href.split("#", 1)[0] ?? href;
      return demoFiles.get(path) ?? null;
    },
    readMarkdown(file) {
      return demoFiles.get(file.path)?.markdown ?? null;
    },
    readAssetUrl(file) {
      return demoFiles.get(file.path)?.assetUrl ?? null;
    },
    openFile(file) {
      console.info("Mira demo openFile", file.path);
    },
    listFiles() {
      return Array.from(demoFiles.values());
    },
  };

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
        theme="inherit"
        themeConfig={{ fallback: "system" }}
        fileAdapter={demoFileAdapter}
        features={editorFeatures}
        class="demo-editor"
        sourcePath="demo.md"
      />
    {:else}
      <MiraMde
        bind:this={composableEditor}
        bind:value
        bind:mode
        theme="inherit"
        themeConfig={{ fallback: "system" }}
        {extensions}
        fileAdapter={demoFileAdapter}
        toolbar={false}
        class="demo-editor"
        sourcePath="demo.md"
      />
    {/if}
  </main>
</div>
