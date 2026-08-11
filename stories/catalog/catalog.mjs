// @ts-check

/** @typedef {import("./types").CssTokenDefinition} CssTokenDefinition */
/** @typedef {import("./types").CatalogEntry} CatalogEntry */

/**
 * @param {`--mira-${string}`} name
 * @param {string} purpose
 * @param {string} defaultValue
 * @param {string} affects
 * @returns {CssTokenDefinition}
 */
function token(name, purpose, defaultValue, affects) {
  return { name, purpose, defaultValue, inherits: true, affects };
}

const semanticTokens = [
  token(
    "--mira-background",
    "Primary canvas color.",
    "#fbfbfc",
    "Editor, preview, Mira Editor, and primitives.",
  ),
  token(
    "--mira-foreground",
    "Primary text and icon color.",
    "#1d1d20",
    "All text-bearing surfaces.",
  ),
  token(
    "--mira-muted",
    "Subdued surface color.",
    "#f0f1f3",
    "Secondary buttons, groups, and panels.",
  ),
  token(
    "--mira-muted-foreground",
    "Subdued text and icon color.",
    "#63656f",
    "Metadata, placeholders, markers, and inactive controls.",
  ),
  token(
    "--mira-border",
    "Standard border color.",
    "#d8dbe1",
    "Editor frame, separators, fields, and tables.",
  ),
  token(
    "--mira-border-strong",
    "Emphasized border color.",
    "#aeb4bf",
    "Hover borders, guides, and checkbox outlines.",
  ),
  token(
    "--mira-accent",
    "Primary interactive accent.",
    "#0f766e",
    "Selected controls, focus, links, and active chrome.",
  ),
  token(
    "--mira-accent-foreground",
    "Content drawn on the accent.",
    "#ffffff",
    "Accent buttons and checkbox markers.",
  ),
  token(
    "--mira-focus-ring",
    "Keyboard focus-ring color.",
    "var(--mira-accent)",
    "Focused editor controls and shadcn-derived primitives.",
  ),
  token(
    "--mira-accent-soft",
    "Low-emphasis accent surface.",
    "color-mix(in oklab, var(--mira-accent) 11%, transparent)",
    "Hover, selection, and soft active states.",
  ),
  token(
    "--mira-danger",
    "Destructive action foreground.",
    "#dc2626",
    "Block deletion controls and other destructive editor actions.",
  ),
  token(
    "--mira-active-line-background",
    "Active CodeMirror line fill.",
    "transparent",
    "Editor active line.",
  ),
  token(
    "--mira-selection",
    "Text selection fill.",
    "color-mix(in oklab, var(--mira-accent) 25%, transparent)",
    "CodeMirror and rendered text selection.",
  ),
  token(
    "--mira-popover",
    "Floating surface background.",
    "#ffffff",
    "Menus, tooltips, dialogs, and suggestions.",
  ),
  token(
    "--mira-popover-foreground",
    "Floating surface foreground.",
    "var(--mira-foreground)",
    "Content inside menus, tooltips, and dialogs.",
  ),
  token(
    "--mira-editor-background",
    "Editable pane background.",
    "#ffffff",
    "Source and live-preview panes.",
  ),
  token(
    "--mira-preview-background",
    "Reading pane background.",
    "#ffffff",
    "Reading, split preview, and embeds.",
  ),
  token(
    "--mira-code-background",
    "Inline and fenced code background.",
    "#f4f5f7",
    "Code spans and code blocks.",
  ),
  token(
    "--mira-code-foreground",
    "Inline and fenced code text.",
    "#24262d",
    "Code spans and code blocks.",
  ),
  token(
    "--mira-heading-color",
    "Heading foreground.",
    "#1d1d20",
    "Heading levels one through six.",
  ),
  token(
    "--mira-tag-background",
    "Tag pill background.",
    "#e6f4f1",
    "Rendered tags and tag properties.",
  ),
  token(
    "--mira-tag-foreground",
    "Tag pill text.",
    "#0f5f59",
    "Rendered tags and tag properties.",
  ),
  token(
    "--mira-link",
    "Link foreground.",
    "#0b6fcb",
    "Markdown links, wikilinks, tags, and autolinks.",
  ),
  token(
    "--mira-frontmatter-background",
    "Frontmatter surface background.",
    "#f7f8fa",
    "Property editor and rendered frontmatter.",
  ),
  token(
    "--mira-frontmatter-label",
    "Frontmatter label foreground.",
    "#4b5563",
    "Property keys and frontmatter chrome.",
  ),
  token(
    "--mira-widget-background",
    "Rendered widget background.",
    "#ffffff",
    "Embeds, Mermaid, tables, and floating widgets.",
  ),
  token(
    "--mira-widget-shadow",
    "Rendered widget elevation.",
    "0 8px 28px rgb(15 23 42 / 8%)",
    "Embeds, Mermaid dialogs, and floating widgets.",
  ),
  token(
    "--mira-font-sans",
    "Interface and Markdown sans-serif stack.",
    "Inter, ui-sans-serif, system-ui, sans-serif",
    "Editor, preview, toolbar, and primitives.",
  ),
  token(
    "--mira-font-mono",
    "Code and source monospace stack.",
    "Source Code Pro, ui-monospace, monospace",
    "CodeMirror, code spans, code blocks, and Mermaid source.",
  ),
  token(
    "--mira-font-size",
    "Base interface and Markdown size.",
    "14px",
    "Editor and preview typography.",
  ),
  token(
    "--mira-line-height",
    "Base Markdown line height.",
    "1.6",
    "Editor and preview prose.",
  ),
  token(
    "--mira-indent-size",
    "Number of columns in one Markdown indentation stop.",
    "4",
    "CodeMirror list and continuation indent widgets.",
  ),
  token(
    "--mira-indent-unit",
    "Width of one Markdown indentation column.",
    "0.5625em",
    "CodeMirror list and continuation indent widgets.",
  ),
  token(
    "--mira-list-indent",
    "Composed width of one Markdown indentation stop.",
    "calc(var(--mira-indent-unit) * var(--mira-indent-size))",
    "CodeMirror list and continuation indent widgets.",
  ),
  token(
    "--mira-doodle-divider-height",
    "Rendered doodle-divider height.",
    "32px",
    "Seeded doodle-divider SVGs in reading and live-preview surfaces.",
  ),
  token(
    "--mira-doodle-divider-stroke-width",
    "Rendered doodle-divider stroke width.",
    "2.35",
    "Seeded doodle-divider SVG paths.",
  ),
  token(
    "--mira-editor-padding",
    "Inline editor content padding.",
    "2rem",
    "CodeMirror scroller content.",
  ),
  token(
    "--mira-preview-padding",
    "Reading surface content padding.",
    "2rem in theme; 2.25rem in preview bridge",
    "Reading and split preview content.",
  ),
  token(
    "--mira-preview-bottom-padding",
    "Scrollable reading tail runway.",
    "50svh",
    "Reading and split preview content.",
  ),
  token(
    "--mira-radius",
    "Shared control and surface radius.",
    "6px",
    "Frames, buttons, menus, fields, and widgets.",
  ),
  token(
    "--mira-markdown-font-size",
    "Optional Markdown-only size override.",
    "falls back to var(--mira-font-size)",
    "Rendered and editable Markdown content.",
  ),
  token(
    "--mira-markdown-line-height",
    "Optional Markdown-only line-height override.",
    "falls back to 1.5",
    "Rendered and editable Markdown content.",
  ),
  token(
    "--mira-outline-level",
    "Current outline nesting level.",
    "set per outline item; falls back to 1",
    "Markdown outline indentation.",
  ),
];

const codeEditorTokens = [
  token(
    "--mira-code-editor-background",
    "Code editor canvas background.",
    "var(--mira-editor-background)",
    "MiraCodeEditor code and document variants.",
  ),
  token(
    "--mira-code-editor-foreground",
    "Code editor foreground.",
    "var(--mira-foreground)",
    "MiraCodeEditor text and cursor.",
  ),
  token(
    "--mira-code-editor-border",
    "Code editor frame and gutter border.",
    "var(--mira-border)",
    "Framed MiraCodeEditor and gutter separator.",
  ),
  token(
    "--mira-code-editor-radius",
    "Code editor frame and tooltip radius.",
    "var(--mira-radius)",
    "Framed MiraCodeEditor and completion popovers.",
  ),
  token(
    "--mira-code-editor-focus-ring",
    "Code editor focus border and ring color.",
    "var(--mira-focus-ring, var(--mira-accent))",
    "Focused framed MiraCodeEditor.",
  ),
  token(
    "--mira-code-editor-gutter-background",
    "Code editor gutter background.",
    "var(--mira-code-editor-background)",
    "MiraCodeEditor line-number gutter.",
  ),
  token(
    "--mira-code-editor-active-line",
    "Code editor active-line fill.",
    "var(--mira-active-line-background)",
    "MiraCodeEditor active line and gutter.",
  ),
  token(
    "--mira-code-editor-selection",
    "Code editor selection fill.",
    "var(--mira-selection)",
    "MiraCodeEditor selected text.",
  ),
  token(
    "--mira-code-editor-popover",
    "Code editor floating surface background.",
    "var(--mira-popover)",
    "MiraCodeEditor completion and lint popovers.",
  ),
  token(
    "--mira-code-editor-font-size",
    "Code editor text size.",
    "0.82rem",
    "MiraCodeEditor code variant content.",
  ),
  token(
    "--mira-code-editor-line-height",
    "Code editor line height.",
    "1.55",
    "MiraCodeEditor code variant content.",
  ),
  token(
    "--mira-code-editor-padding",
    "Code editor content inset.",
    "0.7rem 0.8rem",
    "MiraCodeEditor code variant content.",
  ),
  token(
    "--mira-code-editor-min-height",
    "Resolved minimum editor block size.",
    "10rem",
    "Content-height MiraCodeEditor hosts.",
  ),
  token(
    "--mira-code-editor-search-radius",
    "Find and Replace field radius.",
    "999px",
    "MiraCodeEditor Find and Replace field shells.",
  ),
  token(
    "--mira-code-editor-search-input-background",
    "Search input background.",
    "var(--mira-code-editor-background)",
    "MiraCodeEditor Find and Replace inputs.",
  ),
  token(
    "--mira-code-editor-search-input-foreground",
    "Search input foreground.",
    "var(--mira-code-editor-foreground)",
    "MiraCodeEditor Find and Replace inputs.",
  ),
  token(
    "--mira-code-editor-search-input-border",
    "Search input border.",
    "var(--mira-code-editor-border)",
    "MiraCodeEditor Find and Replace inputs.",
  ),
  token(
    "--mira-code-editor-search-input-hover-border",
    "Search input hover border.",
    "var(--mira-code-editor-focus-ring)",
    "Hovered MiraCodeEditor Find and Replace inputs.",
  ),
  token(
    "--mira-code-editor-search-muted",
    "Search placeholder and resting icon foreground.",
    "var(--mira-muted-foreground)",
    "MiraCodeEditor Find and Replace controls.",
  ),
  token(
    "--mira-code-editor-search-button-background",
    "Search button resting background.",
    "transparent",
    "MiraCodeEditor Find and Replace buttons.",
  ),
  token(
    "--mira-code-editor-search-button-foreground",
    "Search button resting foreground.",
    "var(--mira-code-editor-search-muted)",
    "MiraCodeEditor Find and Replace buttons.",
  ),
  token(
    "--mira-code-editor-search-button-border",
    "Search button resting border.",
    "transparent",
    "MiraCodeEditor Find and Replace buttons.",
  ),
  token(
    "--mira-code-editor-search-button-hover-background",
    "Search button hover background.",
    "var(--mira-code-editor-active-line)",
    "Hovered MiraCodeEditor Find and Replace buttons.",
  ),
  token(
    "--mira-code-editor-search-button-hover-foreground",
    "Search button hover foreground.",
    "var(--mira-code-editor-foreground)",
    "Hovered MiraCodeEditor Find and Replace buttons.",
  ),
  token(
    "--mira-code-editor-search-button-hover-border",
    "Search button hover border.",
    "transparent",
    "Hovered MiraCodeEditor Find and Replace buttons.",
  ),
  token(
    "--mira-code-editor-search-active-background",
    "Search option active background.",
    "var(--mira-code-editor-active-line)",
    "Active MiraCodeEditor Find and Replace option toggles.",
  ),
  token(
    "--mira-code-editor-search-focus-ring",
    "Search input and button focus color.",
    "var(--mira-code-editor-focus-ring)",
    "Focused MiraCodeEditor Find and Replace controls.",
  ),
];

const syntaxDefaults = {
  heading: "#0f766e",
  link: "#0b6fcb",
  comment: "#697386",
  keyword: "#7c3aed",
  string: "#0f766e",
  number: "#b45309",
  variable: "#0b6fcb",
  property: "#9a3412",
  type: "#8b3a94",
  operator: "#475569",
  invalid: "#dc2626",
  "invalid-background": "#fee2e2",
};
const codeEditorSyntaxTokens = Object.entries(syntaxDefaults)
  .filter(([name]) => name !== "invalid-background")
  .map(([name]) =>
    token(
      /** @type {`--mira-${string}`} */ (`--mira-code-editor-syntax-${name}`),
      `Code editor syntax ${name} color override.`,
      `var(--mira-syntax-${name})`,
      "MiraCodeEditor syntax highlighting.",
    ),
  );
codeEditorSyntaxTokens.push(
  token(
    "--mira-code-editor-syntax-punctuation",
    "Code editor punctuation and bracket color.",
    "var(--mira-code-editor-syntax-operator)",
    "MiraCodeEditor punctuation and brackets.",
  ),
  token(
    "--mira-code-editor-syntax-keyword-weight",
    "Code editor keyword font weight.",
    "inherit",
    "MiraCodeEditor language keywords.",
  ),
);
const syntaxTokens = Object.entries(syntaxDefaults).map(([name, value]) =>
  token(
    /** @type {`--mira-${string}`} */ (`--mira-syntax-${name}`),
    `Syntax ${name.replaceAll("-", " ")} color.`,
    value,
    "CodeMirror source, fenced code, and inline syntax highlighting.",
  ),
);

const calloutDefaults = {
  background: "#f7faf9",
  bug: "220, 38, 38",
  default: "8, 109, 221",
  error: "220, 38, 38",
  example: "124, 58, 237",
  info: "8, 109, 221",
  question: "213, 138, 0",
  quote: "107, 114, 128",
  success: "0, 153, 102",
  summary: "0, 114, 178",
  tip: "0, 153, 102",
  warning: "213, 138, 0",
};
const calloutTokens = Object.entries(calloutDefaults).map(([name, value]) =>
  token(
    /** @type {`--mira-${string}`} */ (`--mira-callout-${name}`),
    `Callout ${name} ${name === "background" ? "surface" : "RGB channel color"}.`,
    value,
    `Rendered ${name === "background" ? "callout bodies" : `${name} callouts`}.`,
  ),
);

const headingDefaults = {
  1: { size: "1.802em", lineHeight: "1.2", weight: "700" },
  2: { size: "1.602em", lineHeight: "1.2", weight: "600" },
  3: { size: "1.424em", lineHeight: "1.3", weight: "600" },
  4: { size: "1.266em", lineHeight: "1.4", weight: "600" },
  5: {
    size: "1.125em",
    lineHeight: "1.5",
    weight: "600",
  },
  6: {
    size: "1em",
    lineHeight: "1.5",
    weight: "600",
  },
};
const headingTokens = Object.entries(headingDefaults).flatMap(
  ([level, values]) => [
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-color`),
      `Heading ${level} foreground.`,
      "var(--mira-heading-color)",
      `Level ${level} headings in editor and preview.`,
    ),
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-font`),
      `Heading ${level} font family.`,
      "var(--mira-font-sans)",
      `Level ${level} headings in editor and preview.`,
    ),
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-size`),
      `Heading ${level} font size.`,
      values.size,
      `Level ${level} headings in editor and preview.`,
    ),
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-line-height`),
      `Heading ${level} line height.`,
      values.lineHeight,
      `Level ${level} headings in editor and preview.`,
    ),
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-style`),
      `Heading ${level} font style.`,
      "normal",
      `Level ${level} headings in editor and preview.`,
    ),
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-variant`),
      `Heading ${level} font variant.`,
      "normal",
      `Level ${level} headings in editor and preview.`,
    ),
    token(
      /** @type {`--mira-${string}`} */ (`--mira-h${level}-weight`),
      `Heading ${level} font weight.`,
      values.weight,
      `Level ${level} headings in editor and preview.`,
    ),
  ],
);

const checkboxTokens = [
  token(
    "--mira-checkbox-radius",
    "Task checkbox corner radius.",
    "4px",
    "Standard and extended task checkboxes.",
  ),
  token(
    "--mira-checkbox-size",
    "Task checkbox size.",
    "var(--mira-font-size)",
    "Standard and extended task checkboxes.",
  ),
  token(
    "--mira-checkbox-marker",
    "Task checkbox marker color.",
    "var(--mira-accent-foreground)",
    "Checked and custom task markers.",
  ),
  token(
    "--mira-checkbox-color",
    "Checked task background.",
    "var(--mira-accent)",
    "Checked and custom task markers.",
  ),
  token(
    "--mira-checkbox-border",
    "Unchecked task border.",
    "var(--mira-border-strong)",
    "Unchecked task checkboxes.",
  ),
  token(
    "--mira-checkbox-border-hover",
    "Task hover border.",
    "var(--mira-muted-foreground)",
    "Hovered task checkboxes.",
  ),
];

export const cssTokens = [
  ...semanticTokens,
  ...codeEditorTokens,
  ...codeEditorSyntaxTokens,
  ...syntaxTokens,
  ...calloutTokens,
  ...headingTokens,
  ...checkboxTokens,
];

const commonTokens = [
  "--mira-background",
  "--mira-foreground",
  "--mira-muted",
  "--mira-muted-foreground",
  "--mira-border",
  "--mira-border-strong",
  "--mira-accent",
  "--mira-accent-foreground",
  "--mira-focus-ring",
  "--mira-accent-soft",
  "--mira-danger",
  "--mira-radius",
  "--mira-font-sans",
];
const editorTokens = [
  ...commonTokens,
  ...codeEditorTokens.map((entry) => entry.name),
  ...codeEditorSyntaxTokens.map((entry) => entry.name),
  "--mira-active-line-background",
  "--mira-selection",
  "--mira-popover",
  "--mira-popover-foreground",
  "--mira-editor-background",
  "--mira-preview-background",
  "--mira-code-background",
  "--mira-code-foreground",
  "--mira-font-mono",
  "--mira-font-size",
  "--mira-line-height",
  "--mira-indent-size",
  "--mira-indent-unit",
  "--mira-list-indent",
  "--mira-editor-padding",
  "--mira-preview-padding",
  "--mira-preview-bottom-padding",
  ...syntaxTokens.map((entry) => entry.name),
];
const markdownTokens = [
  ...editorTokens,
  "--mira-heading-color",
  "--mira-link",
  "--mira-tag-background",
  "--mira-tag-foreground",
  "--mira-frontmatter-background",
  "--mira-frontmatter-label",
  "--mira-widget-background",
  "--mira-widget-shadow",
  "--mira-markdown-font-size",
  "--mira-markdown-line-height",
  "--mira-doodle-divider-height",
  "--mira-doodle-divider-stroke-width",
  "--mira-outline-level",
  ...calloutTokens.map((entry) => entry.name),
  ...headingTokens.map((entry) => entry.name),
  ...checkboxTokens.map((entry) => entry.name),
];

/** @type {CatalogEntry[]} */
export const catalogEntries = [
  {
    id: "mira",
    name: "Mira",
    packageName: "@lapismd/mira",
    importPath: "@lapismd/mira",
    components: ["Mira", "MiraCodeEditor"],
    description:
      "Composable Svelte editor with source, live-preview, reading, and split surfaces.",
    spec: "editor-and-markdown.md#requirements",
    tokens: editorTokens,
    publicSurface: true,
  },
  {
    id: "mira-editor",
    name: "Mira Editor",
    packageName: "@lapismd/mira-editor",
    importPath: "@lapismd/mira-editor",
    components: ["MiraEditor", "MiraEditorToolbar"],
    description:
      "Batteries-included editor shell and its independently composable toolbar.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: editorTokens,
    publicSurface: true,
  },
  {
    id: "preview",
    name: "Markdown preview surfaces",
    packageName: "@lapismd/mira/preview",
    importPath: "@lapismd/mira/preview",
    components: [
      "MarkdownPreview",
      "MarkdownOutline",
      "Markdown",
      "Renderer",
      "FileEmbed",
      "MarkdownEmbed",
      "NoteLink",
    ],
    description:
      "Reading, outline, renderer, link, and embed surfaces shared by the editor and standalone preview consumers.",
    spec: "editor-and-markdown.md#requirements",
    tokens: markdownTokens,
    publicSurface: true,
  },
  {
    id: "tables",
    name: "Editable table surfaces",
    packageName: "@lapismd/mira/tables",
    importPath: "@lapismd/mira/tables",
    components: [
      "EditorTable",
      "EditorColumn",
      "GridEditorTable",
      "GridEditorColumn",
    ],
    description:
      "Pipe-table and grid-table widgets, cells, menus, and editing chrome.",
    spec: "editor-and-markdown.md#requirements",
    tokens: markdownTokens,
    publicSurface: true,
  },
  {
    id: "ai",
    name: "AI plugin",
    packageName: "@lapismd/mira-plugin-ai",
    importPath: "@lapismd/mira-plugin-ai",
    components: ["aiExtension", "createMiraAiToolbarAction"],
    description:
      "Consumer-wired AI actions with slash, block, and toolbar entry points plus an accessible prompt and review popover.",
    spec: "plugins/ai.md#requirements",
    tokens: [
      ...commonTokens,
      "--mira-popover",
      "--mira-popover-foreground",
      "--mira-widget-shadow",
      "--mira-font-mono",
      "--mira-accent-soft",
    ],
    publicSurface: true,
  },
  {
    id: "mermaid",
    name: "Mermaid",
    packageName: "@lapismd/mira-plugin-mermaid",
    importPath: "@lapismd/mira-plugin-mermaid",
    components: ["Mermaid"],
    description:
      "Rendered Mermaid diagram with inline controls, source fallback, and expanded dialog.",
    spec: "plugins/mermaid.md#requirements",
    tokens: [
      ...commonTokens,
      "--mira-popover",
      "--mira-popover-foreground",
      "--mira-widget-background",
      "--mira-widget-shadow",
      "--mira-font-mono",
    ],
    publicSurface: true,
  },
  {
    id: "ui-core",
    name: "Core UI primitives",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui",
    components: [
      "Button",
      "Separator",
      "ScrollArea",
      "ToggleGroup.Root",
      "ToggleGroup.Item",
    ],
    description:
      "Shared actions, separators, scrolling, toggles, and drag grip primitives.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: commonTokens,
    publicSurface: true,
  },
  {
    id: "ui-context-menu",
    name: "Context menu family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/context-menu",
    components: [
      "Root",
      "Trigger",
      "Content",
      "Item",
      "CheckboxItem",
      "RadioItem",
      "Group",
      "GroupHeading",
      "Label",
      "Separator",
      "Shortcut",
      "Sub",
      "SubTrigger",
      "SubContent",
    ],
    description:
      "Compound contextual action menu, selection items, groups, labels, and submenus.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [...commonTokens, "--mira-popover", "--mira-popover-foreground"],
    publicSurface: true,
  },
  {
    id: "ui-dialog",
    name: "Dialog family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/dialog",
    components: [
      "Root",
      "Trigger",
      "Portal",
      "Overlay",
      "Content",
      "Header",
      "Footer",
      "Title",
      "Description",
      "Close",
    ],
    description:
      "Compound modal dialog surface, overlay, semantic content, and controls.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [
      ...commonTokens,
      "--mira-popover",
      "--mira-popover-foreground",
      "--mira-widget-shadow",
    ],
    publicSurface: true,
  },
  {
    id: "ui-dropdown-menu",
    name: "Dropdown menu family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/dropdown-menu",
    components: [
      "Root",
      "Trigger",
      "Content",
      "Item",
      "CheckboxItem",
      "RadioItem",
      "Group",
      "GroupHeading",
      "Label",
      "Separator",
      "Shortcut",
      "Sub",
      "SubTrigger",
      "SubContent",
    ],
    description:
      "Compound toolbar/menu action surface with selectable items and submenus.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [...commonTokens, "--mira-popover", "--mira-popover-foreground"],
    publicSurface: true,
  },
  {
    id: "ui-popover",
    name: "Popover family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/popover",
    components: ["Root", "Trigger", "Content", "Close"],
    description:
      "Shared portaled popover surface for rich controls. CodeMirror slash-command suggestions retain editor-coordinate positioning while sharing this typography, chrome, and token contract.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [
      ...commonTokens,
      "--mira-popover",
      "--mira-popover-foreground",
      "--mira-widget-shadow",
    ],
    publicSurface: true,
  },
  {
    id: "ui-table",
    name: "Table primitive family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/table",
    components: [
      "Root",
      "Header",
      "Body",
      "Footer",
      "Head",
      "Row",
      "Cell",
      "Caption",
    ],
    description:
      "Semantic table building blocks used by editable and rendered table surfaces.",
    spec: "editor-and-markdown.md#requirements",
    tokens: commonTokens,
    publicSurface: true,
  },
  {
    id: "ui-toolbar",
    name: "Toolbar primitive family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/toolbar",
    components: ["Root", "Button", "Group", "GroupItem", "Link"],
    description: "Compact accessible toolbar composition and action controls.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: commonTokens,
    publicSurface: true,
  },
  {
    id: "ui-tooltip",
    name: "Tooltip family",
    packageName: "@lapismd/mira/ui",
    importPath: "@lapismd/mira/ui/tooltip",
    components: ["Root", "Trigger", "Content", "Provider", "Portal"],
    description:
      "Accessible tooltip trigger, floating content, provider, and portal family.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [...commonTokens, "--mira-popover", "--mira-popover-foreground"],
    publicSurface: true,
  },
  {
    id: "react-wrapper",
    name: "React wrappers",
    packageName: "@lapismd/mira-react",
    importPath: "@lapismd/mira-react",
    components: ["Mira", "MiraEditor", "MiraEditorToolbar"],
    description:
      "Thin React adapters over the same styled Svelte editor and Mira Editor surfaces.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [],
    tokensFrom: "mira-editor",
    publicSurface: true,
  },
  {
    id: "vanilla-wrapper",
    name: "Vanilla mount API",
    packageName: "@lapismd/mira-vanilla",
    importPath: "@lapismd/mira-vanilla",
    components: ["createMira", "createMiraEditor"],
    description:
      "Framework-neutral mounting adapters that reuse Mira and the Mira Editor styling.",
    spec: "mira-editor-and-frameworks.md#requirements",
    tokens: [],
    tokensFrom: "mira-editor",
    publicSurface: true,
  },
  {
    id: "storybook-spec-page",
    name: "Specification mirror",
    packageName: "Storybook catalog",
    importPath: "stories/spec/SpecPage.svelte",
    components: ["SpecPage"],
    description:
      "Storybook-only renderer for canonical raw specification Markdown.",
    spec: "storybook-catalog.md#requirements",
    tokens: [],
    tokensFrom: "preview",
    publicSurface: false,
  },
  {
    id: "storybook-comprehensive",
    name: "Comprehensive demo shell",
    packageName: "Storybook catalog",
    importPath: "stories/demo/ComprehensiveDemoStory.svelte",
    components: ["ComprehensiveDemoStory"],
    description:
      "Storybook-only full-page shell around the comprehensive portable fixture.",
    spec: "storybook-catalog.md#host-and-fixture-ownership",
    tokens: [],
    tokensFrom: "mira-editor",
    publicSurface: false,
  },
  {
    id: "storybook-catalog-page",
    name: "Catalog documentation",
    packageName: "Storybook catalog",
    importPath: "stories/catalog/CatalogPage.svelte",
    components: ["CatalogPage"],
    description:
      "Storybook-only component descriptions and CSS-token tables rendered from this registry.",
    spec: "storybook-catalog.md#requirements",
    tokens: [...commonTokens, "--mira-popover", "--mira-popover-foreground"],
    publicSurface: false,
  },
];

export const catalogRegistry = { tokens: cssTokens, entries: catalogEntries };

export const customThemeTemplate = `[data-mira-theme~="company-brand"] {
${cssTokens
  .map(
    (entry) =>
      `  /* ${entry.purpose} Default: ${entry.defaultValue} */\n  /* ${entry.name}: ${entry.defaultValue}; */`,
  )
  .join("\n")}
}`;

export function catalogEntry(id) {
  const entry = catalogEntries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Unknown Mira catalog entry: ${id}`);
  return entry;
}

export function catalogTokens(id) {
  const entry = catalogEntry(id);
  return entry.tokensFrom ? catalogTokens(entry.tokensFrom) : entry.tokens;
}

export function catalogParameters(id) {
  const entry = catalogEntry(id);
  return {
    mira: { catalogId: id, spec: entry.spec, tokens: catalogTokens(id) },
  };
}
