# Public Packages and Entry Points

The existing `@lapismd/mira/codemirror` base-extension entry supplies the
editor-local stacking boundary required by MIRA-CSS-045. Consumers composing
the base extensions directly receive the same containment as MiraCodeEditor;
no new option, entry point or host-specific selector is introduced.

`MiraMarkdownEditingSession` MAY expose an optional synchronous `hold()` method
through the existing public extensions entry. Its input lease follows
MIRA-MD-054 without changing the ordinary flush or recovery contracts.

The core patch release keeps block-control actions synchronized with document
replacement without changing the public editor or block-toolbar APIs.

Release dependency qualification refreshes DOMPurify and Undici within their
current major lines. MIRA-ARCH-039 retains the complete workspace audit and
independent packed-production audit; these updates add no package or public API.

The public Mira preview output MUST preserve safe list-item task metadata so
read-only consumers retain checked and custom checkbox artwork without adding
consumer styles or enabling Markdown writes.

The `@lapismd/mira` list-indentation repair stays within shipped preview CSS
and the internal CodeMirror measurement extension. Public entry points and
consumer configuration remain unchanged; list and task spacing must work from
the packaged styles without consumer overrides.
The internal inline-formatting pass preserves parsed list-marker ranges so
asterisk bullets cannot lose their marker or measured hanging indentation.

Root-only Storybook `10.6.3` and Vitest `4.1.12` updates repair the mandatory
development audit gate; they do not change the public package graph.

Workspace `auditConfig.ignoreGhsas` MAY list only
[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
(deepmerge via `@sveltejs/vite-plugin-svelte`) while no patched release exists.
That advisory is development-tooling only; packed-production audit policy and
the KaTeX exception below stay unchanged.

MIRA-ARCH-008 includes the additive `MiraProps.lineNumbers` boolean, defaulting
to true. A false value MUST omit MiraCodeEditor's line-number extension rather
than hiding its output with consumer CSS. Focused evidence is recorded in
`spec/records/2026-10-22-composer-line-numbers.md`.

The preview leaf-child repair retains MIRA-ARCH-008's public package boundary:
no entry point, schema, dependency range or archive layout changes. The
existing preview handlers accept optional empty child fields from extensions.

MIRA-ARCH-008 includes the additive `/tables` TableReader export. It composes
the existing parser and preview with host cell/row snippets for immutable
annotated tables. Existing Table, Column and editable widget exports retain
their authoring behavior; the reader owns no persistence or comment model.

Safe preview highlighting remains inside the existing `@lapismd/mira/preview`
renderer. Its sanitizer preserves generated syntax classes without changing
exports, manifest ranges, HTML policy options or archive layout.

Wave 3 combines these two local fixes with GitHub main without resetting its
released package versions. Changesets retains the pending `0.1.0` core and
dependent package proposals. Repository-only Visual Delta 0.0.9 and Playwright
1.62.1 use the already qualified browser profile. Audited Vite 7/8 and Markdown-it
resolutions stay on their existing major lines with patched versions; published
runtime ranges, the existing narrowly scoped KaTeX policy and packed-consumer
audit remain authoritative.

The released runner correction changes no public package entry, archive layout
or runtime version proposal. MIRA-ARCH-008 and the six-package boundary remain
unchanged; static Storybook, interaction/accessibility and functional browser
checks qualify this root-only development tool. CI screenshot comparisons are
excluded by MIRA-CAT-006. See the released-runner record for archive evidence.

Reference-definition presentation remains in Mira's owned rich-editor and
preview layers. It reuses the existing renderer, asset resolver and source
selection contracts without new public packages or entry points.

## Bundled inline-link entry points

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-044 | `@lapismd/mira/extensions` MUST export `inlineLinksExtension`, `createLinkIconRegistry`, immutable default icon definitions and their public types. `@lapismd/mira/preview` MUST export `InlineLink` and `LinkSiteIcon`. This opt-in feature MUST remain inside Mira's existing six-package release set and existing stylesheet exports, without a new public package or consumer source dependency. |

SVG definitions contain local viewBox and path geometry with explicit fill and
stroke options, never raw SVG markup or external asset URLs. The bundled
defaults retain Simple Icons and Lucide source/version/license attribution.

The extension runtime context optionally exposes the complete ordered
`extensions` composition, so extension-owned nested previews retain consumer
renderers and transformations. Direct callers may omit this additive field.

The public rich-editor exports retain their entrypoints. Interactive gutter
accessibility now settles after synchronous DOM updates, before the next paint,
without waiting for geometry measurement.

The public `@lapismd/mira/extensions` file-adapter contract includes optional
bound Markdown writes and portable text-recovery leases under MIRA-MD-046 and
MIRA-MD-047. These callbacks carry source-session identity and state; they do
not import host application, vault, database or conflict-presentation types.

Internal-link previews retain that captured session across equivalent target
resolutions under MIRA-MD-049. Empty saved text remains a valid editable
preview under MIRA-MD-050. These corrections preserve the public preview
entrypoints and keep storage validation in the owning adapter.

## Editing-session adapter capability

Frontmatter record commits expose MIRA-MD-056's read-only `previousRecord`.
`FrontmatterController.updateProperty` accepts an optional rendered prior record;
existing callers continue to use the controller's current record. MIRA-MD-057
retains that record through focused text editing without host or storage policy.
Packed consumer fixtures verify both exported signatures and reject reassignment
or mutation of the captured previous record.
The existing frontmatter action-error callback additionally accepts `edit` for
MIRA-MD-058 target-change refusal; no replacement target receives the old edit.

MIRA-MD-055 keeps binding and registration callback observations outside the
preview writer's tracked lifetime. The explicit source path, adapter and write
capability continue to own replacement; this repair changes no public entry or
editing-session signature.

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIRA-ARCH-040 | `MiraFileAdapter` MUST expose an optional source-path editing-session registration hook with observable dirty state, awaited flush and temporary protection. The hook MUST remain independent of application, vault and synchronization protocols. Registration failure MUST disable the writer before returning an error. Registered writers MUST retain their original persistence destination and MUST NOT update a replacement surface through late callbacks. |
| MIRA-ARCH-041 | Published Mira tarballs MUST exclude executable unit/spec tests and their emitted declarations while preserving every declared public entry point.                                                                                                                                                                                                                                                                                                                 |

Mira exposes six public packages under the `@lapismd` scope. Runtime
implementation layers are consolidated into `@lapismd/mira`; consumers do not
install internal CodeMirror, renderer, UI, or theme workspaces separately.

## Requirements

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-006 | The public release set MUST contain exactly `@lapismd/mira`, `@lapismd/mira-editor`, `@lapismd/mira-plugin-ai`, `@lapismd/mira-plugin-mermaid`, `@lapismd/mira-react`, and `@lapismd/mira-vanilla`.                                                                                                                                                                                                                                                                                |
| MIRA-ARCH-007 | Public packages MUST use independent stable Semantic Versions, public npm access metadata, the Apache-2.0 license field, explicit export maps, shipped-file lists, side-effect declarations, and package descriptions; the first public version of each package MUST remain `0.0.1`.                                                                                                                                                                                               |
| MIRA-ARCH-008 | `@lapismd/mira` MUST provide the Svelte-first root plus supported `core`, `extensions`, `codemirror`, `preview`, `tables`, `ui`, theme CSS, and aggregate stylesheet subpaths.                                                                                                                                                                                                                                                                                                     |
| MIRA-ARCH-009 | Public package output MUST NOT reference `@mira-mde/*`, `@mira-internal/*`, or another unshipped implementation package.                                                                                                                                                                                                                                                                                                                                                           |
| MIRA-ARCH-010 | Public dependencies MUST flow from `mira` to plugins and `mira-editor`, then to React and Vanilla adapters; plugins MUST integrate through supported Mira entry points.                                                                                                                                                                                                                                                                                                            |
| MIRA-ARCH-011 | Vue and Solid placeholders MUST remain private under `internal/adapters` until they implement and verify a public adapter contract.                                                                                                                                                                                                                                                                                                                                                |
| MIRA-ARCH-012 | Package, symbol, DOM-hook, documentation, catalog, and Storybook identities MUST use the canonical Mira names without compatibility aliases for the pre-release `@mira-mde/*` surface.                                                                                                                                                                                                                                                                                             |
| MIRA-ARCH-013 | `@lapismd/mira` MUST export the individual Mira and Obsidian theme stylesheets plus an aggregate stylesheet that loads every built-in palette.                                                                                                                                                                                                                                                                                                                                     |
| MIRA-ARCH-014 | `@lapismd/mira-editor` MUST ship the logo used by its default About dialog and export a version constant synchronized with its package manifest, so the dialog remains self-contained for consumers.                                                                                                                                                                                                                                                                               |
| MIRA-ARCH-015 | `@lapismd/mira` MUST expose the additive Markdown action identifier and controller operation, and Mira Editor, React, and Vanilla handles and declarative toolbar contexts MUST delegate that operation without duplicating action semantics.                                                                                                                                                                                                                                      |
| MIRA-ARCH-016 | Public internal dependencies MUST use pre-1.0-compatible `workspace:~` ranges, release planning MUST follow the public dependency graph, and only packages whose exact local version is absent from npm MAY be selected for publication.                                                                                                                                                                                                                                           |
| MIRA-ARCH-017 | `@lapismd/mira` MUST expose additive block-control toolbar configuration, semantic block metadata, and explicit `toolbar`, `block-menu`, and `context-menu` action placements; Mira Editor, React, and Vanilla MUST normalize those contracts without creating framework-specific editing semantics. The core package MUST own the shared page-wide gutter allowance, clipped-surface escape, and themed overlay behavior used by every adapter.                                   |
| MIRA-ARCH-018 | `@lapismd/mira/extensions` MUST expose the opt-in doodle-divider factory, immutable default variant gallery and palette, synchronous seed and drawing contracts, and explicit pure Markdown seed-migration helper without adding a separately released package or runtime drawing dependency.                                                                                                                                                                                      |
| MIRA-ARCH-019 | The private workspace root MUST resolve `@lapismd/storybook-addon-visual-delta` from its published npm semver package. Visual Delta MUST remain repository-only and MUST NOT enter a public package manifest or packed dependency graph.                                                                                                                                                                                                                                           |
| MIRA-ARCH-021 | The shipped `@lapismd/mira/preview` implementation MUST retain portable semantic icons requested by consumer frontmatter type definitions, including the built-in Tags definition's canonical Lucide hash geometry, and its frontmatter editor's non-scrolling narrow single-column container behavior with label-aligned values without requiring consumer Tailwind processing, component-local Tailwind container utilities, or an app-specific icon registry.                   |
| MIRA-ARCH-022 | The shipped `@lapismd/mira/preview` frontmatter component MUST preserve local collapse and expand interaction while still synchronizing an initial or subsequently changed public `open` input. Context synchronization MUST NOT immediately overwrite an unchanged input's local disclosure state.                                                                                                                                                                                |
| MIRA-ARCH-023 | The shipped `@lapismd/mira/preview` internal-link surface MUST use the package's existing owner-document overlay infrastructure and Bits UI `LinkPreview` rather than consumer-specific portals or an inline absolutely positioned card. Its built output MUST retain lazy `MiraFileAdapter` preview loading, local navigation callbacks, stable link-preview hooks, full sticky owner-document collision placement, interactive pointer handoff, and Mira appearance propagation. |
| MIRA-ARCH-024 | `@lapismd/mira/extensions` MUST expose optional `MiraFileAdapter.writeMarkdown`, and `@lapismd/mira/preview` MUST export `EditableMarkdownPreview`. The editable surface MUST use Mira's own controller and CodeMirror extension pipeline without depending on `@lapismd/mira-editor` or consumer storage APIs. Adapters that omit the write capability MUST remain source-compatible and read-only.                                                                               |
| MIRA-ARCH-025 | `EditableMarkdownPreview` MUST expose an imperative `exit()` operation that flushes the current buffer and returns whether editing exited successfully. Portable overlay consumers MAY use that operation to implement outside-click dismissal without bypassing Mira's serialized writer or discarding a failed save.                                                                                                                                                             |
| MIRA-ARCH-026 | The shipped `@lapismd/mira/preview` internal-link overlay MUST preserve an omitted appearance contract across its portal by deriving opaque theme and color-mode attributes from the trigger's nearest Mira appearance host. Explicit component appearance remains authoritative, and no Lapis-specific palette or runtime dependency may enter the package.                                                                                                                       |
| MIRA-ARCH-027 | The shipped `@lapismd/mira/preview` image-embed surface MUST expose its visible caption as the accessible description and keep the nested image decorative, while standalone Markdown images retain their authored alternative text.                                                                                                                                                                                                                                               |
| MIRA-ARCH-028 | `@lapismd/mira/core` MUST expose `MiraCodeMirrorExtensionsOptions.includeBaseExtensions` as an optional composition control that defaults to `true`. Consumers MAY disable Mira's base CodeMirror setup while retaining the public portable authoring stack.                                                                                                                                                                                                                       |
| MIRA-ARCH-029 | The shipped `@lapismd/mira` table keymaps MUST retain valid row and column coordinates while moving between pipe-table cells. Package tests MUST exercise the Enter command directly so built consumers do not receive an undeclared runtime binding.                                                                                                                                                                                                                              |
| MIRA-ARCH-031 | The shipped `@lapismd/mira` CodeMirror stack MUST include the semantic Find and Replace structure and plain CSS needed for inline search options, compact input typography, pill-shaped fields, borderless actions, and transparent, divider-free panel presentation without consumer styling.                                                                                                                                                                                     |
| MIRA-ARCH-032 | The shipped `@lapismd/mira` block-toolbar portal MUST preserve editor theme scope without inheriting editor root geometry or requiring consumer cleanup and layout overrides.                                                                                                                                                                                                                                                                                                      |
| MIRA-ARCH-033 | The shipped `@lapismd/mira` Obsidian theme MUST provide an accessible light-mode string syntax color through the existing public theme export and `--mira-syntax-string` token without changing its dark-mode value or requiring a consumer override.                                                                                                                                                                                                                              |
| MIRA-ARCH-034 | The shipped `@lapismd/mira` UI stylesheet MUST scope popover paint and stacking declarations to Mira-owned overlays so aggregate-style consumers retain ownership of their generic shadcn popovers.                                                                                                                                                                                                                                                                                |
| MIRA-ARCH-035 | The public `@lapismd/mira/preview` frontmatter contract MUST expose optional `valueSuggestions` and an optional `FrontmatterEditor` `fileAdapter` without requiring consumers to fork pill-list editing.                                                                                                                                                                                                                                                                           |
| MIRA-ARCH-036 | The shipped `@lapismd/mira` UI stylesheet MUST scope tooltip paint and stacking declarations to Mira-owned overlays so aggregate-style consumers retain ownership of their generic shadcn tooltips.                                                                                                                                                                                                                                                                                |
| MIRA-ARCH-037 | The shipped `@lapismd/mira/preview` frontmatter component and stylesheet MUST expose the complete property type-and-action menu through Mira's portalled overlay boundary so property rows and consumer workspace viewports cannot clip it, without requiring a consumer override or alternate menu implementation.                                                                                                                                                                |
| MIRA-ARCH-038 | The shipped `@lapismd/mira/preview` frontmatter text control MUST reconcile an externally synchronized controller value into an unfocused contenteditable element even after prior user editing, while preserving focused in-progress input.                                                                                                                                                                                                                                       |

The exported preview and aggregate styles preserve CodeMirror cursor-buffer
geometry when an editor is embedded beneath rendered Markdown. This shipped
boundary excludes internal buffer images from authored-image styling; consumers
do not need to repair checkbox layout through local CSS. See MIRA-CSS-042.

List selectors in the exported source stylesheet support Markdown surface and mode classes
on the CodeMirror root, as used by directly composed API editors. List bullets
and indentation retain the wrapped editor's styling without consumer overrides.

## Overlay lifecycle

| ID            | Requirement                                                                                                                                                                                                                                                                |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-043 | The published Mira UI dependency graph MUST support destroying an open overlay before registration or focus callbacks settle. Teardown MUST cancel pending layer work without reading destroyed reactive state, retaining a portal, or leaving body pointer events locked. |

The core package pins released Bits UI 2.20.2 for the current dependency intake.
Consumers MUST receive MIRA-ARCH-043 through the released Mira dependency
declaration rather than a consumer patch or copied overlay code. The additional
delayed LinkPreview selection callback regression remains an upstream release
gate; merely aligning this declaration does not establish its repair.

## Public graph

Docker snapshot and archive-transfer portability repairs stay in private root
tooling and MUST NOT change published archives, entry points or runtime versions.
Docker validation is private root tooling. It MUST retain the six-package
public graph and registry-portable manifests and lockfile; its isolated outputs
and ignored configuration MUST NOT enter public archives.

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
Vanilla depend only on the public products they adapt. The Mermaid plugin's
published range MUST stay on the patched 11.16 line so consumers do not resolve
known-vulnerable Mermaid or DOMPurify releases. Workspace `pnpm audit` is part
of root `check` and `check:all`; a public-range or lockfile change that
reintroduces an advisory fails that gate. Audit overrides that pin `js-yaml`
MUST keep 3.x consumers on patched 3.x and 4.x consumers on patched 4.x so
legacy consumers retain their APIs. The maintained Changesets 3 reader MUST
discover all six public packages and parse the workspace through YAML 2.
Mira's direct KaTeX runtime dependency and workspace renderer override MUST select
`>=0.18.2 <0.19`, including the renderer nested under `rehype-katex`. Since
0.18.11 was deprecated for accidental breaking changes, the reviewed workspace
currently pins 0.18.10. Since `rehype-katex@7` still declares KaTeX 0.16,
this override is repository-local;
packed-consumer security acceptance MUST report that upstream range limitation
separately from the workspace audit.
The packed fixture MUST run its own production dependency audit without renderer
overrides; a workspace-only audit pass does not qualify registry publication.
The user-approved 2026-10-11 exception MAY accept only low-severity
[GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7)
for KaTeX `>=0.11.0 <0.18.2` across current and subsequent public-package
releases until upstream math dependencies are patched. Package version changes
MUST NOT expire this advisory-specific acceptance. Different advisories,
severity increases, changed vulnerable ranges, audit command failures, muted
findings, malformed responses, or inconsistent counts MUST fail the gate.
The full report MUST remain at `.release/production-consumer-audit.json`, and
the gate MUST print any accepted exception; clean audits require no exception.
The exception accepts a known remaining vulnerability; it does not repair or
hide it. Remove the policy when upstream math dependencies admit patched KaTeX.
Public stylesheet imports MUST resolve from the packed manifests without relying
on hoisted transitive dependencies or repository development dependencies.
KaTeX CSS therefore belongs to Mira's declared runtime graph; the packed
fixture explicitly selects the isolated pnpm linker and disables hoisting
regardless of the invoking workspace's package-manager configuration.

Svelte remains a public peer range of `^5.0.0`; repository-owned Svelte
`devDependencies` may move to a patched compiler range for audit validation
without changing that public peer contract.

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
actions. Its controls consume the core package's cataloged focus and elevation
tokens without expanding the public token registry.

## Release model

Every public package manifest MUST declare `license: "Apache-2.0"`. The workspace
root, private adapters, and `LICENSE.md` use the same SPDX identifier.

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
verified tarball. The verifier normalizes npm's scalar and single-result JSON
response shapes before comparison, while empty, multi-result, or non-string
integrity responses fail closed. Any disagreement fails without publishing
later dependants.

Package release tags use the unscoped package name plus exact version, for
example `mira-editor@0.2.0`. Tags target the commit recorded in the artifact and
their GitHub release body is the exact package changelog entry. Existing tags or
releases are accepted on a rerun only when their commit and notes agree.

Repository-only tools such as `@lapismd/storybook-addon-visual-delta` belong in
the private root manifest. They are not part of the six-package public release
set and MUST NOT appear in packed consumer dependency graphs. The root resolves
the published npm package so local Storybook and compare-only capture exercise
the reviewed upstream release. The package owns the compact, path-independent
affected state, canonical Storybook build reuse, isolated staging, and runner
behavior used by this repository; Mira does not duplicate those fixes in a
downstream patch. The
dependency MUST remain repository-only and MUST NOT enter any public package's
manifest or packed dependency graph.

The root consumes `@lapismd/spec-validator` from npm as development tooling
while retaining Mira's package graph, requirement IDs, paths, and enforcement
policy in this repository. The shared validator MUST NOT enter any public
package's manifest or packed dependency graph, and normal repository checks MUST
not require the sibling validator checkout.

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
  factories and MUST NOT require a new consumer API. Their measured indentation
  state MUST survive transient focus and selection decoration rebuilds without
  shifting an already resolved continuation column. Internal rendered block
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
  code-specific hooks continue to select the monospaced token. The line-number
  gutter MUST use the same public monospace bridge with tabular numerals and the
  theme-aware faint foreground without changing other gutter columns. Hidden
  live-preview Markdown formatting MUST retain its source mapping while
  contributing no inline or block geometry, so visible heading text stays on
  the same line as its gutter. Source-mode
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
  floating outline MUST resolve the nearest ancestor with an actual scroll
  range so a consumer-owned viewport drives the active rail stroke and panel
  item when the preview delegates scrolling. Outline navigation MUST resolve
  headings from the supplied preview/root before falling back to document-global
  IDs so embedded surfaces and Storybook docs cannot collide with same-slug
  headings outside the active preview. Its
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
  navigation before the generic indentation keymap. Rendered widget cells MUST
  wrap through `--table-white-space` without cell or widget overflow. Raw
  source table rows MUST scroll on the `.cm-line.cm-table` itself, keep
  consecutive rows of the same table aligned, and avoid a content-wide
  horizontal scrollport.
- `ui` and its documented component subpaths export the shared UI primitives.
- `themes/mira.css`, `themes/obsidian.css`, `themes.css`, and `styles.css`
  provide explicit CSS entry points.

Individual and aggregate theme entry points MUST preserve the documented value
grammar of every public token. In particular, RGB-channel tokens and complete
shadow declarations remain valid after packaging in inherited, explicit, and
system color modes.

The shipped preview token bridge MUST use the theme-primary interactive accent
for both embed and blockquote guides by default while preserving the public
blockquote border override for consumers.

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

Interactive Markdown gutters follow MIRA-MD-043 in [Editor and Markdown](editor-and-markdown.md): the core CodeMirror extension owns accessible controls and restores its attribute changes when removed.

MIRA-MD-044 and MIRA-MD-045 govern public file-target URI normalization and the optional MiraFileAdapter.releaseAssetUrl lifecycle hook. Asset URLs returned by a host remain host-owned resources; previews release each acquired URL without interpreting its protocol.
