# Architecture and Boundaries

Recursive-embed qualification preserves MIRA-ARCH-039's mandatory audit. Scoped
workspace overrides move only ESLint, markdownlint-cli and their lint helpers to
patched Minimatch 11.x; the six public runtime packages retain their dependency
graph. Full lint, specification and packed-consumer gates qualify the intake.

The 0.1.1 release retains the six-package graph and existing public runtime
ranges. Workspace-only audit overrides keep DOMPurify on patched 3.x and Undici
on patched 7.x/8.x; the independently installed public archives remain subject
to the production-consumer audit.

The Visual Delta 0.0.9 adoption preserves MIRA-ARCH-020: only the root npm
development tool and its lock identity change. It remains outside the six
public packages; runtime entry points, dependency direction and consumer
ownership are unchanged. Static Storybook and functional browser checks qualify
the tooling independently of Mira package publication; screenshot comparisons
are excluded from CI and release qualification by MIRA-CAT-006.

Inline site-icon links follow the bundled opt-in extension boundary, alongside
doodle dividers and selection toolbars. Their registry is local presentation
data; it does not depend on forge accounts or application preferences. Public
package identities and dependency direction remain unchanged.

Mira is a pnpm monorepo of independently buildable public products. The
workspace root, six public packages, and private adapters are licensed
Apache-2.0. Supported entry points are defined in
[Public packages and entry points](packages.md), and dependency direction flows
from the composable editor toward plugins, the batteries-included editor, and
thin framework adapters.

## Requirements

| ID            | Requirement                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MIRA-ARCH-045 | Root checks, builds and functional/browser tests MUST default to isolated Docker execution with fingerprinted reusable toolchains, frozen dependencies, bounded resources, exact tracked source/history and retained reports; explicit native execution MUST remain available without silent fallback or visual-baseline mutation.                                                                                                                              |
| MIRA-ARCH-001 | Packages MUST preserve their documented public entrypoints unless a breaking change is explicitly authorized.                                                                                                                                                                                                                                                                                                                                                   |
| MIRA-ARCH-002 | Portable packages MUST NOT depend on Lapis vault, workspace, route, sidebar, metadata-worker, settings-persistence, or plugin-registry services.                                                                                                                                                                                                                                                                                                                |
| MIRA-ARCH-003 | Extensions MUST integrate through Mira callbacks, resolvers, adapters, commands, renderer hooks, and CodeMirror extensions rather than application singletons.                                                                                                                                                                                                                                                                                                  |
| MIRA-ARCH-004 | Every workspace package MUST expose deterministic check, test where applicable, and build behavior compatible with root orchestration.                                                                                                                                                                                                                                                                                                                          |
| MIRA-ARCH-005 | Storybook MUST be the only repository application used for browsable documentation, demos, component examples, and interaction scenarios.                                                                                                                                                                                                                                                                                                                       |
| MIRA-ARCH-020 | Root Storybook tooling MUST resolve the published `@lapismd/storybook-addon-visual-delta` package from npm once available, while specification tooling MUST resolve published `@lapismd/spec-validator` from npm once available; both dependencies MUST remain outside the six-package public graph.                                                                                                                                                            |
| MIRA-ARCH-030 | The `@lapismd/mira` root MUST export `MiraCodeEditor`, `MiraCodeEditorProps`, and `MiraCodeEditorHandle`. Mira's primary Markdown surface and editable preview editor MUST consume that shell, while downstream packages MAY supply language and domain extensions through the public CodeMirror extension prop and bridge their theme from an ancestor through the shell's inheritable public background, focus-ring, search-control, and syntax tokens.       |
| MIRA-ARCH-039 | The root `check` and `check:all` commands MUST run `pnpm audit` against the committed lockfile before package validation. Fixable findings MUST be resolved with declared ranges or workspace overrides in the same change; `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml` MAY list only unpatched advisories. Override replacements MUST stay on the same major line as the selector they replace so a security pin cannot substitute an incompatible API. |

Overlay lifecycle ownership follows MIRA-ARCH-043 in [Public packages](packages.md).
The portable Mira dependency declaration owns dismissal, registration, and focus
cleanup for its public UI primitives; downstream hosts own when to destroy them.
The pending post-0.1.1 intake aligns the exact Bits UI declaration with released
2.20.2 while retaining every public entry point. This dependency alignment does
not qualify the separately discovered delayed LinkPreview selection callback;
that upstream source repair and its packed-consumer acceptance remain distinct.

## Package boundary

Root validation defaults to Docker under MIRA-ARCH-045. The runner preserves
the original native commands, exact tracked source and parent history, frozen
registry dependencies, bounded resources, reusable toolchain images and caches,
and collected failure reports. Native execution requires an explicit override;
Docker failures never silently run a suite on the host. Hosted CI explicitly
selects its already provisioned native runner. Development servers and manual
Visual Delta commands retain their existing platform and approval boundaries.
Source export MUST support colocated checkouts and separate Jujutsu workspaces.
Report collection MUST receive the complete archive before extraction so macOS
tar's early padding exit does not falsely fail a worker; corrupt archives and
nonzero transfer exits MUST remain errors.

Packed-consumer audit policy remains separate from the committed workspace
audit under MIRA-ARCH-039. Only the recorded, advisory-specific KaTeX exception in
[Public packages](packages.md) MAY qualify an otherwise failing packed audit;
workspace `ignoreGhsas` entries cover unpatched development advisories and do
not weaken packed-production acceptance.

The six-package public graph separates installation products from implementation
modules. `@lapismd/mira` owns the portable runtime and supported advanced
subpaths; plugins, the default editor, and adapters depend only on those public
entry points. Private placeholder adapters and source under `src/internal` are
never shipped as independent products.

The portable controller, extension SDK, CodeMirror layers, preview renderer,
tables, UI primitives, theme, and composable Svelte surface are implemented in
the single `packages/mira` workspace. Its internal source layout may remain
modular, but downstream workspaces resolve it only through the supported
`@lapismd/mira` export map.

`MiraCodeEditor` is the canonical CodeMirror lifecycle boundary. It builds and
reconfigures the `EditorView`, controlled document synchronization, selection,
focus, history, accessibility, sizing, and base chrome. The Markdown editor and
editable preview reuse that boundary, while downstream packages retain
language parsers, linting, review decorations, and other domain extensions.

The root Storybook may compose every package for documentation and acceptance,
but package source must not import Storybook-owned catalog data. Packages used
directly by Storybook stories, including `@lapismd/mira/ui`, are explicit root
workspace dependencies so clean Vite builds do not rely on transitive package
resolution.

Storybook infrastructure dependencies are root-only development tools and MUST
NOT leak into a public package manifest or emitted package output. Visual Delta
is developed independently from Mira's six-package runtime graph and remains
subject to the catalog's build and functional browser gates. Mira resolves the
published package through a root-only npm semver dependency; that tooling
dependency MUST NOT enter any public package graph. The Visual Delta package
MUST own the clean-stage worker
fallback, generated-cache exclusions, canonical build identity, and runner
behavior required by those gates; Mira does not maintain a downstream pnpm
patch for behavior available in the reviewed upstream release.

Wave 3 consumes the released Visual Delta 0.0.8 with Playwright 1.62.1,
matching the approved immutable browser image profile rather than a new image.
Vite and Markdown-it audit repairs retain their existing major versions.
These are portable registry resolutions, with no sibling paths or new public
package graph edges. Full hosted package/browser lanes qualify this shared
tooling update; local checks begin with exact preview/table and release guards.

Specification validation follows the same root-only boundary but resolves from
the published `@lapismd/spec-validator` npm package once available. Mira owns
its validator configuration, requirement IDs, paths, and evidence locally; it
does not require the validator sibling checkout for normal repository checks.

The root keeps the `storybook`, accessibility, docs, themes, Vitest, and Svelte
Vite packages on one reviewed patch line; the declared floor is `10.6.2` and
the lockfile resolves `10.6.3`.
Vitest and its browser/mocker tooling use `4.1.12` to address the October 22
origin-validation and mocker traversal advisories without disabling audit.
Storybook MCP, Svelte CSF, icons, and third-party addons retain their own release
lines and are not version-coupled to the core patch. A Storybook patch change
MUST pass the root quality gates and a complete static Storybook build without
rewriting visual baselines.

Storybook's palette addon and manager color-mode control are host-only tooling.
They update the preview document's public theme attribute and shadcn-compatible
mode classes; runtime packages remain unaware of Storybook. Fixed appearance
stories apply their variants through public editor props and story-local page
wrappers so rendering a Canvas cannot replace the Docs page's global selection.
The preview palette addon is explicitly prebundled so concurrent browser workers
cannot trigger a mid-suite dependency-optimization reload.

The former `apps/demo` and `apps/docs` workspaces are retired. The root package
owns Storybook development, static builds, and browser acceptance. The
`packages` directory contains exactly six public products; unimplemented Vue
and Solid placeholders remain private under `internal/adapters`.

Root `check` and `check:all` run `pnpm audit` first so a lockfile or override
change cannot land with a known-vulnerable graph. Workspace overrides pin
transitive patches; public package ranges that ship those dependencies, such as
Mermaid, MUST declare a patched floor so packed consumers do not reintroduce
the advisory. Override replacements MUST stay on the requested major line. An
unbounded `js-yaml` 3.x replacement can resolve to 5.x and break legacy
`safeLoad` consumers. Changesets 3 uses the maintained Manypkg workspace reader
with the maintained YAML 2 parser; acceptance MUST discover the real public package graph and
produce a release plan from an explicit Git commit without requiring a local
`main` branch, including in a Jujutsu workspace with a shared Git store. The toolchain
upgrade MUST remove vulnerable `braces` and `sprintf-js` paths rather than
ignoring their unpatched advisories. Markdown tooling and renderer overrides
MUST select patched devalue, brace-expansion, DOMPurify, js-yaml 5,
markdown-it, smol-toml, source-map-js, and KaTeX releases.
Exported stylesheet dependencies belong to the owning public package's runtime
manifest, with an isolated packed fixture checking their resolution.
The private root's Node range MUST match Changesets 3's supported Node versions
(`^22.11 || ^24 || >=26`); public runtime package ranges remain independent.
Markdown linting MUST use the maintained `markdownlint-cli` runner and the same
rule settings and authored-document globs. The specification validator's public
structured check lane MUST enforce that command; `spec:validate` MUST also run
it so changing runners does not remove lint enforcement.

Audit-only refreshes of Svelte development ranges may update the private root
and public package `devDependencies` together so repository checks resolve a
single patched compiler graph. Those refreshes MUST leave public runtime peer
ranges and workspace dependency direction unchanged unless the consumer contract
itself changes.

The workspace consumes the published Spec Validator through `^0.2.0` so merge
checks use its current Node runtime, Jujutsu range handling, and optional search
dependency contract.

Root quality gates compose the specification, catalog, package, Storybook, and
browser checks. In particular, `storybook:check` validates catalog metadata and
CSS-token coverage before building the static host and running focused
Storybook browser acceptance. `build-storybook` first builds every workspace
package so the static host and canonical container capture do not depend on
stale local `dist` output. Its explicit 4 GB Node heap ceiling fits within the
pinned capture profile while accommodating the complete catalog bundle. The
user's 2026-10-21 decision excludes screenshot comparisons from CI and release
gates. `pnpm test:visual` remains available only for explicitly requested manual
review; existing `visual-pending` stories retain separate baseline approval.

The private root also owns Changesets and release orchestration. One shared
public-package graph supplies package-boundary validation, tarball validation,
registry planning, and publication order so those gates cannot drift into
different product sets. Release tooling may mutate versions and changelogs, but
it is not a runtime dependency and cannot enter a public package tarball.

The planner is read-only against npm and writes ignored local evidence. It
classifies each exact stable version as publishable or already published, fails
when the workspace is behind the registry, and identifies the special
never-published bootstrap state. Preparation then packs only the selected nodes
in graph order and records their commit, SHA-512 integrity, order, and exact
changelog entry in one transferable manifest.

GitHub Actions keeps three trust levels distinct: pull-request validation has
read-only repository access, the Changesets job can update the Version Packages
pull request but receives no npm credential, and the production publish job
receives npm's GitHub Actions trusted-publisher OIDC only after its named
environment approval. Initial `0.0.1` artifacts are prepared by the workflow but
published manually because npm trusted publishers can only be configured after a
package exists. The post-publish job consumes the artifact again for
clean-install and provenance checks before a final repository-write job creates
tags and release notes.

The root owns the Vitest 4 Storybook project and its Chromium browser provider;
package-local Vitest configurations continue to own pure unit tests. The
consolidated Mira workspace owns the former subsystem suites so package test
commands cannot inherit the root Storybook browser project. The Playwright
configuration is split by
responsibility: the default config belongs to the
installed Visual Delta suite, while `playwright.storybook.config.ts` owns the
focused Storybook acceptance tests. Visual Delta reuses its prewarmed, validated
static server during both update and comparison runs so a second process cannot
race the canonical capture host. Baseline URLs are written directly into each
story's `parameters.visualDelta` metadata by the add-on; no parallel path mapper
or preview-time fallback is maintained.

The canonical Docker runner stages a clean workspace without trusting authored
`storybook-static` or build-tool caches, but transports the package-owned
affected state and preview graph needed to preserve valid passing evidence. It
may restore an atomic, checksum-verified static Storybook and Linux build cache
from `.visual-delta/cache/canonical-build`; stale or incomplete evidence
triggers one rebuild inside the pinned environment. `pnpm test:visual` uses the
add-on's conservative affected preflight and performs read-only comparisons of
the selected stories, falling back to the full eligible catalog when graph or
cache evidence is unreliable. Root visual commands explicitly select
`nested-import` baseline paths so their CLI behavior matches the Storybook host
and portable Playwright suite.
