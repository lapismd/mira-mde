# Styling and CSS Tokens

Exported package styling works without Tailwind processing. Packages ship plain
CSS and stable semantic hooks, with Mira variables preferred for consumer
customization and Obsidian-compatible aliases retained as a compatibility layer.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIRA-CSS-001 | Exported styled surfaces MUST work when consumers import the package `styles.css` entrypoint without running Tailwind.                                                                                                                     |
| MIRA-CSS-002 | New public styling roles MUST prefer stable `--mira-*` custom properties and semantic package classes.                                                                                                                                     |
| MIRA-CSS-003 | Every exported or Storybook-visible styled surface MUST have a Storybook token table listing token name, purpose, default or fallback, inheritance, and affected element or state.                                                         |
| MIRA-CSS-004 | Private subcomponents MUST document their applicable public tokens under the owning public surface rather than becoming separate public theming APIs.                                                                                      |
| MIRA-CSS-005 | Obsidian-compatible variables MUST be documented separately as compatibility aliases and MUST NOT be presented as the preferred Mira token API.                                                                                            |
| MIRA-CSS-006 | A catalog checker MUST reject missing public-surface entries, unknown token names, and documented tokens unused by shipped CSS.                                                                                                            |
| MIRA-CSS-007 | The public `theme` value MUST accept an arbitrary case-sensitive whitespace-separated token list, copy it to `data-mira-theme`, and omit the attribute when the value is absent or empty.                                                  |
| MIRA-CSS-008 | Palette selection MUST remain independent from `inherit`, `light`, `dark`, and `system` color modes; explicit component appearance MUST override page appearance without observing DOM mutations.                                          |
| MIRA-CSS-009 | Mira MUST ship distinct `mira` and `obsidian` light/dark palettes through individual CSS exports and an aggregate theme export; absent selectors MUST fall back to Mira with system color mode.                                            |
| MIRA-CSS-010 | Consumer theme tokens loaded after Mira MUST be able to extend a built-in palette by overriding only selected `--mira-*` variables, including on portaled editor overlays.                                                                 |
| MIRA-CSS-011 | Public theme tokens MUST retain their documented CSS value grammar and resolve to valid declarations in inherited, explicit, and system color modes; color-only functions MUST NOT wrap channel lists, shadows, or other non-color values. |
| MIRA-CSS-012 | Mira MUST expose `--mira-indent-size`, `--mira-indent-unit`, and `--mira-list-indent` defaults and bridge them to the Obsidian-compatible indentation variables used by shipped CodeMirror list and continuation widgets.                  |
| MIRA-CSS-013 | Visible task checkbox delimiters in source and live-preview editing MUST use the same muted syntax color as other Markdown delimiters while task content retains the normal prose color.                                                   |
| MIRA-CSS-014 | The editable task-type trigger MUST use shipped semantic hooks and theme tokens, remain outside normal line layout, become visible on line hover or focus, and reuse the shipped task-checkbox artwork inside its portaled picker.         |
| MIRA-CSS-015 | The Mira Editor About dialog MUST use shipped semantic hooks and tokens. Its combined logo asset MUST retain intrinsic dimensions, scale down responsively, and expose only the active light or dark half within the portaled dialog.      |
| MIRA-CSS-016 | Shipped source-mode table-line CSS MUST resolve through `--font-monospace`, preserve authored spacing with `white-space: pre`, and size each raw row to its content without changing rendered table-widget or reading-table typography.      |

Stylesheet order remains theme, UI, preview, Svelte/Mira Editor, and framework
wrapper composition as documented by the package entrypoints.

Theme, UI, preview, and composable-editor CSS are physically owned by
`@lapismd/mira`. The package exports `/themes/mira.css`,
`/themes/obsidian.css`, `/themes.css`, the documented UI and preview style
subpaths, and the aggregate `/styles.css`. The aggregate stylesheet loads both
built-in palettes before the UI and preview layers. Downstream editor and
adapter packages layer their own shipped CSS over those public entrypoints.

`theme` is an opaque string rather than a closed registry. Mira copies any
non-empty value to `data-mira-theme`; built-in CSS matches whitespace-separated
tokens with selectors such as `[data-mira-theme~="obsidian"]`. A consumer can
therefore compose `theme="obsidian company-brand"` and define only the
`company-brand` token overrides after Mira's CSS. Omitted and empty theme values
inherit the page. `colorMode` independently selects `inherit`, `light`, `dark`,
or `system` through `data-mira-color-mode`, with `.light` and `.dark` recognized
as page-level shadcn-compatible signals.

The default `:root` contract is the Mira palette with system color mode. Mira
does not register themes, inject consumer CSS, or observe ancestor mutations;
normal custom-property inheritance makes page changes live. Explicit component
appearance is copied to its portaled overlay roots so targeted editors keep the
same tokens outside their DOM subtree.

The default indentation contract uses four columns at `0.5625em` per column.
`--mira-list-indent` composes those values, while the preview bridge exposes
the compatible `--indent-size`, `--indent-unit`, and `--list-indent` aliases.
Every rendered indent-widget segment has a `--list-indent` minimum width;
structural fallback styles use that same width when the widget is present and
the authored character width while its raw prefix is editable. Enabled guides
use a line-owned pseudo-element whose height follows the full wrapped
CodeMirror line box. Consumer overrides of the bridged variables continue to
control both widget width and guide spacing. In live preview, inactive
unordered marker spans hide their authored glyph and paint the same tokenized
bullet shape used by reading mode; focusing the marker removes that presentation
so the original `-`, `*`, or `+` stays editable. When a blockquote line becomes
active in live preview, its authored quote markers become visible and nested
marker pseudo-borders become transparent; every editable child row's line-owned
outer border MUST align with the rendered parent block border without a
duplicate, displaced guide beside a first-depth prefix.

The default toolbar About dialog inherits the editor's portaled appearance
tokens. Its combined light/dark logo keeps explicit intrinsic dimensions to
avoid layout shift, scales down to the available inline size, and is capped by
shipped semantic CSS so it cannot overflow or dominate the dialog. The image
viewport exposes its left half for light appearances and right half for dark
appearances, including explicit, inherited, and system color modes.

Source and active live-preview task markers expose a stable
`.cm-formatting-task` hook for their authored `[value]` delimiter. Shipped CSS
uses the existing muted Markdown syntax color for that hook without changing
the task content color or introducing another public token.

Reading-mode list guides remain owned by shipped preview CSS. When an indented
blockquote follows a nested list under the same list item, a reading-only guide
segment MUST bridge the quote's block margins and height on the same painted
border column as the parent guide. Its logical inset MUST compensate for the
blockquote's own border box so tokenized non-zero quote borders cannot displace
the continuation segment; editor widget geometry MUST remain unchanged.

List expand/collapse controls use the marker as their geometry anchor. Reading
mode MUST derive the vertical anchor from the first rendered client rect of the
item content rather than the union of wrapped rows. Live preview MUST place the
control hitbox directly against the marker's inline-start edge. Both surfaces
MUST retain this relationship for nested, wrapped, ordered, and unordered items.

Source and live-preview indented code blocks use syntax-tree-derived line hooks
owned by Mira's CodeMirror extension. Shipped CSS MUST join those lines into one
block surface with reading-mode background, border, radius, and padding values;
any nested inline-code token chrome MUST be neutralized without hiding or
replacing the authored indentation.

Color tokens may use `light-dark()` directly. Channel-list tokens such as the
callout RGB values and compound tokens such as widget shadows retain their
documented value grammar instead: built-in palettes select their light and dark
forms through mode-aware selectors and media queries. This keeps downstream
uses such as `rgba(var(--mira-callout-default), 0.1)` and
`box-shadow: var(--mira-widget-shadow)` valid in page-inherited, system, and
targeted editor modes.

The Storybook catalog assigns every shipped `--mira-*` reference to a styled
surface and records its purpose, default or fallback, inheritance behavior,
and affected element or state. `pnpm catalog:check` compares those assignments
with package exports and token references in shipped CSS, Svelte components,
and runtime style contributions, rejecting missing public surfaces, unassigned
or stale tokens, and unknown references. Obsidian-compatible variables appear
in a separate compatibility section and are not described as Mira's preferred
theming API.
