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

Stylesheet order remains theme, UI, preview, Svelte/default UI, and framework
wrapper composition as documented by the package entrypoints.

The Storybook catalog assigns every shipped `--mira-*` reference to a styled
surface and records its purpose, default or fallback, inheritance behavior,
and affected element or state. `pnpm catalog:check` compares those assignments
with package exports and token references in shipped CSS, Svelte components,
and runtime style contributions, rejecting missing public surfaces, unassigned
or stale tokens, and unknown references. Obsidian-compatible variables appear
in a separate compatibility section and are not described as Mira's preferred
theming API.
