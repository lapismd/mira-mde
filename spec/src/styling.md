# Styling and CSS Tokens

Exported package styling works without Tailwind processing. Packages ship plain
CSS and stable semantic hooks, with Mira variables preferred for consumer
customization and Obsidian-compatible aliases retained as a compatibility layer.

## Requirements

| ID           | Requirement                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-CSS-001 | Exported styled surfaces MUST work when consumers import the package `styles.css` entrypoint without running Tailwind.                                                             |
| MIRA-CSS-002 | New public styling roles MUST prefer stable `--mira-*` custom properties and semantic package classes.                                                                             |
| MIRA-CSS-003 | Every exported or Storybook-visible styled surface MUST have a Storybook token table listing token name, purpose, default or fallback, inheritance, and affected element or state. |
| MIRA-CSS-004 | Private subcomponents MUST document their applicable public tokens under the owning public surface rather than becoming separate public theming APIs.                              |
| MIRA-CSS-005 | Obsidian-compatible variables MUST be documented separately as compatibility aliases and MUST NOT be presented as the preferred Mira token API.                                    |
| MIRA-CSS-006 | A catalog checker MUST reject missing public-surface entries, unknown token names, and documented tokens unused by shipped CSS.                                                    |
| MIRA-CSS-007 | The public `theme` value MUST accept an arbitrary case-sensitive whitespace-separated token list, copy it to `data-mira-theme`, and omit the attribute when the value is absent or empty. |
| MIRA-CSS-008 | Palette selection MUST remain independent from `inherit`, `light`, `dark`, and `system` color modes; explicit component appearance MUST override page appearance without observing DOM mutations. |
| MIRA-CSS-009 | Mira MUST ship distinct `mira` and `obsidian` light/dark palettes through individual CSS exports and an aggregate theme export; absent selectors MUST fall back to Mira with system color mode. |
| MIRA-CSS-010 | Consumer theme tokens loaded after Mira MUST be able to extend a built-in palette by overriding only selected `--mira-*` variables, including on portaled editor overlays.                 |

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

The Storybook catalog assigns every shipped `--mira-*` reference to a styled
surface and records its purpose, default or fallback, inheritance behavior,
and affected element or state. `pnpm catalog:check` compares those assignments
with package exports and token references in shipped CSS, Svelte components,
and runtime style contributions, rejecting missing public surfaces, unassigned
or stale tokens, and unknown references. Obsidian-compatible variables appear
in a separate compatibility section and are not described as Mira's preferred
theming API.
