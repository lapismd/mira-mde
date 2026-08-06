# Public Packages and Entry Points

Mira exposes six public packages under the `@lapismd` scope. Runtime
implementation layers are consolidated into `@lapismd/mira`; consumers do not
install internal CodeMirror, renderer, UI, or theme workspaces separately.

## Requirements

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIRA-ARCH-006 | The public release set MUST contain exactly `@lapismd/mira`, `@lapismd/mira-editor`, `@lapismd/mira-plugin-ai`, `@lapismd/mira-plugin-mermaid`, `@lapismd/mira-react`, and `@lapismd/mira-vanilla`.                                                                                                                                                                                                                                              |
| MIRA-ARCH-007 | Public packages MUST use independent stable Semantic Versions, public npm access metadata, explicit export maps, shipped-file lists, side-effect declarations, and package descriptions; the first public version of each package MUST remain `0.0.1`.                                                                                                                                                                                           |
| MIRA-ARCH-008 | `@lapismd/mira` MUST provide the Svelte-first root plus supported `core`, `extensions`, `codemirror`, `preview`, `tables`, `ui`, theme CSS, and aggregate stylesheet subpaths.                                                                                                                                                                                                                                                                   |
| MIRA-ARCH-009 | Public package output MUST NOT reference `@mira-mde/*`, `@mira-internal/*`, or another unshipped implementation package.                                                                                                                                                                                                                                                                                                                         |
| MIRA-ARCH-010 | Public dependencies MUST flow from `mira` to plugins and `mira-editor`, then to React and Vanilla adapters; plugins MUST integrate through supported Mira entry points.                                                                                                                                                                                                                                                                          |
| MIRA-ARCH-011 | Vue and Solid placeholders MUST remain private under `internal/adapters` until they implement and verify a public adapter contract.                                                                                                                                                                                                                                                                                                              |
| MIRA-ARCH-012 | Package, symbol, DOM-hook, documentation, catalog, and Storybook identities MUST use the canonical Mira names without compatibility aliases for the pre-release `@mira-mde/*` surface.                                                                                                                                                                                                                                                           |
| MIRA-ARCH-013 | `@lapismd/mira` MUST export the individual Mira and Obsidian theme stylesheets plus an aggregate stylesheet that loads every built-in palette.                                                                                                                                                                                                                                                                                                   |
| MIRA-ARCH-014 | `@lapismd/mira-editor` MUST ship the logo used by its default About dialog and export a version constant synchronized with its package manifest, so the dialog remains self-contained for consumers.                                                                                                                                                                                                                                             |
| MIRA-ARCH-015 | `@lapismd/mira` MUST expose the additive Markdown action identifier and controller operation, and Mira Editor, React, and Vanilla handles and declarative toolbar contexts MUST delegate that operation without duplicating action semantics.                                                                                                                                                                                                    |
| MIRA-ARCH-016 | Public internal dependencies MUST use pre-1.0-compatible `workspace:~` ranges, release planning MUST follow the public dependency graph, and only packages whose exact local version is absent from npm MAY be selected for publication.                                                                                                                                                                                                         |
| MIRA-ARCH-017 | `@lapismd/mira` MUST expose additive block-control toolbar configuration, semantic block metadata, and explicit `toolbar`, `block-menu`, and `context-menu` action placements; Mira Editor, React, and Vanilla MUST normalize those contracts without creating framework-specific editing semantics. The core package MUST own the shared page-wide gutter allowance, clipped-surface escape, and themed overlay behavior used by every adapter. |
| MIRA-ARCH-018 | `@lapismd/mira/extensions` MUST expose the opt-in doodle-divider factory, immutable default variant gallery and palette, synchronous seed and drawing contracts, and explicit pure Markdown seed-migration helper without adding a separately released package or runtime drawing dependency.                                                                                                                                                    |

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

The Markdown action identifier is exported additively from Mira and re-exported
by the editor, React, and Vanilla entry points. Their handles delegate to Mira's
controller so every framework uses the same transaction semantics.

Block-control toolbar configuration and explicit action placements follow the
same graph. Mira Editor filters default contextual items through its feature
flags, React adapts native icons without replacing the core menu, and Vanilla
forwards the Svelte editor contract unchanged.

The doodle-divider feature follows the same portable extension boundary. Its
factory, default gallery, customization types, and explicit migration helper
ship from `/extensions`; the implementation does not create a seventh public
package or require a framework adapter. Storybook exercises those exports
through the same package subpath rather than importing internal draw or parser
helpers. Its options also expose a `controls` switch, while custom seed factories
receive explicit `reroll` and `variant` reasons for Live Preview authoring
actions.

## Release model

The six public packages version independently. Changesets record release intent
and generate one changelog per affected package; a change to one product does
not force an unrelated package release. When an internal dependency must move,
Changesets updates its dependants according to the public graph and the
pre-1.0-compatible `workspace:~` ranges.

The canonical graph in `scripts/public-packages.mjs` supplies the exact package
set, directories, dependency edges, and topological order to every release and
package-validation command. Package manifests include their changelog in the
shipped file list, while the private root remains free to use `workspace:*` for
local Storybook composition.

Release planning compares every local public version with npm. An exact version
that already exists is skipped, an unpublished exact version is selected, and a
local version behind the registry fails closed. Selected packages are built and
packed once, in dependency order, and publication consumes those verified
tarballs rather than repacking mutable workspace source. Stable releases are the
only supported channel in this slice; prerelease and canary releases remain out
of scope.

The publish command accepts only a manifest whose commit, package versions,
graph order, paths, changelog entries, and tarball digests still match the
workspace and artifact. It runs only with the explicit approved-CI guard. A
rerun skips an exact npm version only when the registry integrity equals the
verified tarball; any disagreement fails without publishing later dependants.

Package release tags use the unscoped package name plus exact version, for
example `mira-editor@0.2.0`. Tags target the commit recorded in the artifact and
their GitHub release body is the exact package changelog entry. Existing tags or
releases are accepted on a rerun only when their commit and notes agree.

Repository-only tools such as `@lapismd/storybook-addon-visual-delta` belong in
the private root manifest. They are not part of the six-package public release
set and MUST NOT appear in packed consumer dependency graphs. The root consumes
the reviewed published `0.0.6` release through a normal semver development
dependency. That upstream release owns the compact, path-independent affected
state, canonical Storybook build reuse, isolated staging, and runner behavior
used by this repository; Mira does not duplicate those fixes in a downstream
patch. The dependency MUST remain repository-only and MUST NOT enter any public
package's manifest or packed dependency graph.

The private root toolchain aligns the six core Storybook packages at `10.5.6`.
That alignment is repository infrastructure only: it MUST NOT add Storybook to
any public package manifest, export map, packed dependency graph, or runtime
entry point.

## Supported `@lapismd/mira` entry points

- The package root exports `Mira`, `MiraProps`, and `MiraHandle` and defaults to
  the `Mira` Svelte component.
- `core` exports controller APIs and the shared CodeMirror composition factory.
- `extensions` exports extension contracts, commands, resolvers,
  plugin-author helpers, and the opt-in selection-toolbar extension.
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
  same classification across editor and preview surfaces. Internal live-preview
  blockquote chrome MUST preserve one aligned, line-owned outer guide across
  editable parent and child rows while suppressing nested marker pseudo-borders
  on an active editable line; this remains shipped CSS behavior and MUST NOT
  require a consumer option. The internal CodeMirror document theme MUST honor
  the public Markdown sans token for ordinary prose while the shipped
  code-specific hooks continue to select the monospaced token. Source-mode
  pipe-table line hooks MUST also select that monospaced token and preserve
  non-wrapping preformatted row geometry so authored delimiters remain aligned.
  Internal task marker ranges MUST account for authored blockquote prefixes
  before locating the list and checkbox delimiters. Internal live-preview fold controls MUST
  remain directly adjacent to their list marker without introducing a new
  consumer API. Editable rendered task widgets MUST reuse one internal task
  state registry and the exported Popover primitive to select a custom marker,
  update only that marker character, and preserve line geometry without adding
  a public option or entry point. Editable list-callout widgets MUST reuse the
  resolved extension catalog and the exported Popover primitive to turn the
  rendered marker itself into the selection trigger, select another marker, or
  remove the authored marker and its separator without changing geometry
  between highlight types.
- `preview` exports Markdown preview, outline, embed, and renderer surfaces. Its
  shipped reading styles MUST keep a list guide continued through a child
  blockquote on the parent's painted guide column after accounting for the
  blockquote border box. Reading list controls MUST use the first rendered item
  row as their marker-alignment anchor even when the item wraps. Editable
  preview checkboxes MUST share the internal task-type picker with live preview;
  editable list-callout markers MUST share the internal list-highlight picker
  with live preview. Read-only previews MUST retain their existing passive,
  non-button marker and checkbox DOM contracts. Shipped live-preview callout
  styling MUST separate consecutive rendered callouts through paint and
  padding geometry rather than margins on CodeMirror lines or widget roots.
- The shared list-highlight control MUST own one margin-free padded marker slot
  for both text and icon renderers. CodeMirror and editable preview integrations
  MUST preserve that slot on wrapped lines rather than adding surface-specific
  spacing around the mounted control.
- Preview styling MUST express consecutive list-highlight separation through
  live-line padding and reading-background insets, keeping the CodeMirror line
  and widget margin contract unchanged. The live background start inset MUST
  clear the list bullet, and a reading background followed by a plain list item
  MUST end before that sibling begins. Reading background layering MUST leave
  list-bullet and collapse-control positioning intact so highlighted and plain
  siblings share the same painted marker column.
- `tables` exports the supported Markdown and grid-table components and owns
  the `cm-table` raw-line decoration consumed by shipped source and
  live-preview fallback styles. Its default CodeMirror extensions MUST attach
  the matching grid-table line decoration and intercept grid-table Tab/Enter
  navigation before the generic indentation keymap.
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

The Mira Editor package also owns the optimized logo used by its default About
dialog. Its emitted image asset and public `MIRA_EDITOR_VERSION` constant travel
with the package; a manifest-sync test requires release version changes to
update the displayed value.

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
