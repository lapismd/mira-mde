# AGENTS.md

Guidance for agents working in this repository. This file applies to the whole
repo unless a more specific `AGENTS.md` is added deeper in the tree.

## Project Shape

- This is a pnpm monorepo for Mira MDE. Keep package boundaries intact.
- Preserve public entry points unless the user explicitly asks for a breaking
  change, including `MiraMde`, `MarkdownPreview`, `createRichEditorExtensions`,
  `createTableExtensions`, `mermaidExtension`, `MiraDefaultMde`,
  `MiraDefaultToolbar`, and framework wrappers.
- Prefer existing Mira package APIs and extension patterns over adding new
  shared abstractions.
- Portable markdown behavior should stay separate from Lapis app internals such
  as vault/workspace APIs, command registries, metadata workers, sidebars, and
  file-tree services.

## Styling Model

- Exported package styling must work without requiring consumers to run
  Tailwind. Ship plain CSS and CSS variables through package `styles.css`
  exports.
- Theme tokens live in `packages/theme-obsidian/styles.css`. Prefer `--mira-*`
  tokens for new Mira-specific styles.
- Markdown and editor/browser-rendered surfaces live mainly in
  `packages/preview/src/styles.css`. This file also bridges Mira tokens to the
  Obsidian-compatible variables used by ported Lapis markdown styles.
- UI primitive styling lives in `packages/ui/src/styles.css`.
- Keep the stylesheet import order intact:
  - `packages/svelte/src/styles.css` imports UI styles, then preview styles.
  - `packages/default-ui/src/styles.css` imports theme styles, then Svelte
    styles.
  - `packages/react/src/styles.css` imports default UI styles.
- Do not check in generated Tailwind bundles as source. If Lapis styling is
  copied from Tailwind-authored code, convert only the needed rules to plain,
  maintainable CSS under stable class hooks.

## Tailwind And EBR CSS

In this repo, EBR means the editor/browser-rendered markdown surfaces:
CodeMirror source mode, live preview mode, reading/preview mode, embedded
preview, and the default editor shell around them.

- Avoid Tailwind `@apply`, `@reference`, and build-time Tailwind directives in
  exported package CSS.
- Existing Svelte components may contain Tailwind-like class strings inherited
  from Lapis, shadcn, or earlier work. Do not assume those utilities exist at
  runtime for consumers.
- When a utility class affects public rendering, mirror or replace it with plain
  CSS in the owning package stylesheet.
- `tailwind-variants` and `tailwind-merge` are acceptable for local UI class
  composition only when the resulting classes are backed by shipped CSS or by
  stable semantic classes.
- New styling should prefer semantic hooks such as `mira-*`, `markdown-*`,
  `cm-*`, table chrome classes, and Mermaid control classes over long utility
  strings.
- Do not create one-off global selectors when a package-level class hook can
  express the same behavior.

## Lapis Parity

- For portable markdown features, treat Lapis as the source of truth for DOM
  shape, classes, spacing, icons, menus, source toggles, and interaction.
- Port exact Lapis components and styles where practical. Remove only Lapis app
  internals and replace them with Mira callbacks, resolvers, or local services.
- Avoid custom rewrites for areas already solved in Lapis, especially tables,
  grid tables, frontmatter, task checkboxes, Mermaid, callouts, links, embeds,
  math, and live preview widgets.
- Preserve important class hooks such as `markdown-preview-surface`,
  `markdown-rendered`, `markdown-live-preview-mode`, `markdown-source-mode`,
  `markdown-widget-shell`, `cm-live-preview`, table chrome classes, and Mermaid
  control classes.
- Live preview block widgets must use Lapis-compatible margins and sizing.
  Margin around widget roots can break CodeMirror gutter alignment, so verify
  line numbers after changing widget CSS.
- In live preview, prefer padding over margins for line-level separation such
  as list-callout spacing, because margins change CodeMirror line/gutter
  geometry.

## Markdown Surfaces

- Keep source mode, live preview, reading/preview, embedded preview, split mode,
  docs examples, and the demo rendering aligned.
- Markdown features shown in the demo should also be covered in docs examples:
  headings, lists, tasks, frontmatter, callouts/admonitions, links, wikilinks,
  tags, code, inline and block KaTeX, images, embeds, blockquotes, tables, grid
  tables, and Mermaid.
- Task list bullets should be hidden where Lapis hides them.
- Done tasks in the live editor should not be styled as crossed out unless the
  matching Lapis behavior says so for that mode.
- Frontmatter should keep Lapis behavior, including collapsible presentation,
  compact spacing, tag pills, and remove controls.
- Mermaid should keep Lapis icons, hover controls, dialog controls, pan/zoom
  behavior, layout registration, copy actions, and source toggle behavior.
- Tables should keep Lapis menus, icons, drag/drop behavior, cell backgrounds,
  sizing, source fallback, and row/column chrome.
- Block and inline rendered widgets should keep source fallback behavior. If a
  user clicks rendered inline math, links, embeds, or block widgets such as
  horizontal rules and code fences, the underlying Markdown source must become
  editable.

## UI And Interactions

- Use Lucide icons consistently with the Lapis port and existing Mira UI.
- Icon-only buttons need accessible labels and hover tooltips where the action is
  not obvious from context.
- Hover-only editor chrome, such as code-copy controls, should remain mounted
  for keyboard accessibility but hidden visually until hover or focus.
- Default editor toolbars should stay compact and editor-like. View controls
  belong at the end of the toolbar unless a specific design says otherwise.
- Prefer declarative toolbar APIs for custom actions and dropdown menu items.
- Split view should keep editor and preview vertical scroll positions
  synchronized by ratio rather than by fixed pixel offsets.
- Avoid adding explanatory text inside the app UI when a standard control,
  icon, tooltip, or menu item is enough.

## Development Workflow

- The worktree may contain user changes. Do not revert unrelated edits.
- Use `rg` or `rg --files` for searches.
- Use `apply_patch` for manual file edits.
- Keep changes scoped to the package or app needed for the request.
- Do not add broad refactors, generated files, or metadata churn unless they are
  required to complete the task.
- For docs/demo assets, keep files in the owning app or package and avoid
  duplicating large assets across packages without a reason.

## Verification

Every workspace should expose a `check` script. That script is the local quality
gate for Prettier formatting, Svelte diagnostics where applicable, and
TypeScript diagnostics. Svelte diagnostics must fail on warnings.

For package- or app-scoped changes, always run the modified workspace's relevant
checks and tests before handing work back. Start with:

```sh
pnpm --filter @mira-mde/preview check
pnpm --filter @mira-mde/preview test
```

Also run the package build when the change affects exports, packaging, styles,
Svelte components, framework wrappers, or build-time behavior:

```sh
pnpm --filter @mira-mde/preview build
```

For changes that touch multiple packages/apps or shared repo configuration, run
full-repo validation instead of only filtered checks:

```sh
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

`pnpm check:all` runs the standard full-repo non-e2e validation:

```sh
pnpm check:all
```

For visual markdown or EBR styling changes, also compare Mira against Lapis in
Chrome without relying only on unit tests. Check at least headings/gutters,
frontmatter, task lists, tables, Mermaid, callouts, code fences, and inline
KaTeX.
