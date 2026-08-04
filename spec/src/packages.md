# Public Packages and Entry Points

Mira exposes six public packages under the `@lapismd` scope. Runtime
implementation layers are consolidated into `@lapismd/mira`; consumers do not
install internal CodeMirror, renderer, UI, or theme workspaces separately.

## Requirements

| ID            | Requirement                                                                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-006 | The public release set MUST contain exactly `@lapismd/mira`, `@lapismd/mira-editor`, `@lapismd/mira-plugin-ai`, `@lapismd/mira-plugin-mermaid`, `@lapismd/mira-react`, and `@lapismd/mira-vanilla`.                                             |
| MIRA-ARCH-007 | Public packages MUST use version `0.0.1`, public npm access metadata, explicit export maps, shipped-file lists, side-effect declarations, and package descriptions; repository automation MUST NOT publish them without separate authorization. |
| MIRA-ARCH-008 | `@lapismd/mira` MUST provide the Svelte-first root plus supported `core`, `extensions`, `codemirror`, `preview`, `tables`, `ui`, theme CSS, and aggregate stylesheet subpaths.                                                                  |
| MIRA-ARCH-009 | Public package output MUST NOT reference `@mira-mde/*`, `@mira-internal/*`, or another unshipped implementation package.                                                                                                                        |
| MIRA-ARCH-010 | Public dependencies MUST flow from `mira` to plugins and `mira-editor`, then to React and Vanilla adapters; plugins MUST integrate through supported Mira entry points.                                                                         |
| MIRA-ARCH-011 | Vue and Solid placeholders MUST remain private under `internal/adapters` until they implement and verify a public adapter contract.                                                                                                             |
| MIRA-ARCH-012 | Package, symbol, DOM-hook, documentation, catalog, and Storybook identities MUST use the canonical Mira names without compatibility aliases for the pre-release `@mira-mde/*` surface.                                                          |
| MIRA-ARCH-013 | `@lapismd/mira` MUST export the individual Mira and Obsidian theme stylesheets plus an aggregate stylesheet that loads every built-in palette.                                                                                                  |

## Public graph

| Package                        | Responsibility                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `@lapismd/mira`                | Composable Svelte editor, controllers, extension SDK, Markdown rendering, tables, UI, and styles. |
| `@lapismd/mira-editor`         | Batteries-included Svelte editor, toolbar, feature presets, and default styling.                  |
| `@lapismd/mira-plugin-ai`      | Optional AI commands and interactions.                                                            |
| `@lapismd/mira-plugin-mermaid` | Mermaid language, preview, controls, and rendering.                                               |
| `@lapismd/mira-react`          | React components adapting both composable and batteries-included editors.                         |
| `@lapismd/mira-vanilla`        | Plain JavaScript factories adapting both editor surfaces.                                         |

`@lapismd/mira-editor` depends on Mira and the Mermaid plugin because Mermaid
is part of its default feature set. The AI plugin remains opt-in. React and
Vanilla depend only on the public products they adapt.

Repository-only tools such as `@lapismd/storybook-addon-visual-delta` belong in
the private root manifest. They are not part of the six-package public release
set and MUST NOT appear in packed consumer dependency graphs. The root consumes
the reviewed `0.0.5` source checkout through the temporary private
`link:../../storybook-addon-visual-delta` development dependency while its
canonical-runner integration is being stabilized. The linked checkout owns the
compact, path-independent affected state, canonical Storybook build reuse,
fresh-workspace dependency relinking, and isolated linked-source staging used
by this repository. Its staged content fingerprint also makes linked source
edits part of the canonical static-build identity; Mira does not duplicate
those fixes in a downstream patch.
The link MUST remain repository-only and MUST NOT enter any public package's
manifest or packed dependency graph.

The private root toolchain aligns the six core Storybook packages at `10.5.6`.
That alignment is repository infrastructure only: it MUST NOT add Storybook to
any public package manifest, export map, packed dependency graph, or runtime
entry point.

## Supported `@lapismd/mira` entry points

- The package root exports `Mira`, `MiraProps`, and `MiraHandle` and defaults to
  the `Mira` Svelte component.
- `core` exports controller APIs and the shared CodeMirror composition factory.
- `extensions` exports extension contracts, commands, resolvers, and
  plugin-author helpers.
- `codemirror` exports the supported low-level extension factories, including
  `measuredIndentExtension` and `syncMeasuredIndentStyles`; internal layout
  repairs MUST preserve those exports. Indentation-guide, continuation, and
  syntax-tree-derived indented-code line geometry remains internal to those
  factories and MUST NOT require a new consumer API. Internal rendered block
  widget styles MUST also normalize CodeMirror's source whitespace behavior so
  embedded Markdown retains the same block spacing as the public preview
  renderer without exposing another styling API. Internal Markdown parser
  precedence MUST close a lazily continued blockquote when reading mode starts
  a following list, so list-contained blockquotes and indented code retain the
  same classification across editor and preview surfaces.
- `preview` exports Markdown preview, outline, embed, and renderer surfaces.
- `tables` exports the supported Markdown and grid-table components.
- `ui` and its documented component subpaths export the shared UI primitives.
- `themes/mira.css`, `themes/obsidian.css`, `themes.css`, and `styles.css`
  provide explicit CSS entry points.

Individual and aggregate theme entry points MUST preserve the documented value
grammar of every public token. In particular, RGB-channel tokens and complete
shadow declarations remain valid after packaging in inherited, explicit, and
system color modes.

Source beneath a package's `src/internal` directory is not a public entry point
and MUST NOT appear in a package export map. Tests and Storybook may exercise
internal behavior through public surfaces but MUST NOT teach consumers to
import it directly.

The runtime consolidation stage places all former controller, extension,
CodeMirror, preview, table, UI, theme, and composable Svelte implementation in
`packages/mira`. The package exposes only the curated entrypoints above; its
downstream workspaces build against those entrypoints so emitted output cannot
retain links to a removed implementation workspace.

The public product stage is complete: the six approved manifests are versioned
`0.0.1`, use explicit public metadata and export maps, and pass their focused
check, test, build, and package-boundary gates. The React package exports
components only, while both imperative mounting factories are isolated in
`@lapismd/mira-vanilla`.

`pnpm packages:pack` packs and installs all six products together in a temporary
consumer project. Its Svelte, React, and Vanilla compile fixtures validate type
resolution, the public CSS entrypoints are resolved through package export
maps, and extracted tarball text is scanned for private or legacy imports. The
CSS resolution fixture covers `themes/mira.css`, `themes/obsidian.css`, and the
aggregate `themes.css` independently so consumers can choose a deterministic
base without importing an unused built-in palette.

## Canonical names

The composable component is `Mira`; the batteries-included component and
toolbar are `MiraEditor` and `MiraEditorToolbar`. Plain JavaScript factories are
`createMira` and `createMiraEditor`. Public names containing `Mde` or `Default`
are removed rather than aliased.

DOM hooks follow the same hard migration: `mira-mde*`, `mira-default-ui*`, and
`mira-default-toolbar*` become `mira*`, `mira-editor*`, and
`mira-editor-toolbar*`. The stable `--mira-*` token namespace and portable
`markdown-*`, `cm-*`, and Obsidian-compatibility hooks remain unchanged.
