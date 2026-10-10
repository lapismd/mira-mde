# Embedded editor cursor buffers

Live-preview Task checkboxes wrapped their labels onto the next line when the
editor was nested inside a `.markdown-rendered` ancestor. Generic Markdown image
styles selected CodeMirror's invisible `img.cm-widgetBuffer` nodes, adding a
border and block layout. The exported Mira image selector now excludes those
internal buffers while retaining authored-image styling. A patch Changeset
records the public package change.

The exact regression command was:

```sh
pnpm exec vitest run --project storybook \
  stories/markdown/task-states/TaskStates.stories.ts -t 'Embedded Live Preview'
```

It failed one story before the fix and passes one story after the root build.
The nested-editor fixture verifies checkbox/label overlap, zero-width inline
buffers without borders, authored-image block styling, and checkbox interaction.
The first command used the export identifier rather than the rendered story
name and skipped the tests; that skipped run is not regression evidence.

Initial source validation before dependency repair passed:

- `pnpm spec:check`, `pnpm lint`, and `pnpm catalog:check`.
- Root formatting and `pnpm exec turbo run check`: all package diagnostics
  passed, with zero Svelte errors or warnings.
- `pnpm test`: 416 tests across 71 files; eleven Turbo tasks passed.
- `pnpm build`: eight tasks passed. An initial concurrent build collided with
  the test lane's implicit package build; the serialized exact build passed.
- `pnpm test:storybook --maxWorkers=1 --no-file-parallelism`: 155 stories in
  35 files passed, including enabled accessibility checks.
- `pnpm build-storybook` and the Mira package's `pnpm pack` passed.

The initial development-server `pnpm test:e2e` run passed 47 tests and timed out
once in `publishes catalog descriptions, spec links, and token metadata` while
loading catalog/specification Docs. A fresh development-server retry also
timed out during initial navigation. A static-host mitigation passed that exact
focused case but the full static suite passed 42 cases and timed out six times;
four of those six isolated retries passed, while table interactions and Docs
theme still timed out. That mitigation was unsuccessful. A fresh development
server then passed all three focused catalog, table, and Docs-theme cases.

After dependency repair, the freshly restarted development server passed the
complete `pnpm test:e2e` suite: 48 cases in 1.8 minutes, zero unexpected failures.
The indented-blockquote case retains its pre-existing expected-failure marker;
its displayed failure is expected and included in the successful suite count.
No assertions, timeout limits, or browser configuration were weakened.

The initial required root `pnpm check` failed on 19 dependency advisories
(7 high, 8 moderate, 4 low), reproduced with `pnpm audit --json` before any
manifest or lockfile edits. The user requested repair rather than deferral.
Declared overrides now select patched devalue, markdown-it, js-yaml 5,
brace-expansion, DOMPurify, smol-toml, source-map-js, and KaTeX. KaTeX 0.18.10
avoids the deprecated 0.18.11 release. Changesets 3 removes legacy
`sprintf-js` and its `safeLoad` reader; the new regression discovers the real
eight-workspace/six-public-package graph and exercises CLI release planning
without a local base branch. Major-bounded js-yaml overrides remain intact.

An intermediate audit fell to one finding under Markdownlint CLI2's unpatched
`braces` dependency. Switching to the maintained `markdownlint-cli` removes
that path. The same rules and authored-document globs remain enforced by
`spec:lint`, the specification validator's public structured check lane, and
`spec:validate`. No advisory ignores or dependency source patches were added.
The exact `pnpm audit` now reports zero known vulnerabilities. The focused
release acceptance passes three tests, and preview acceptance passes ten tests,
including inline/display math and resistance to inherited polluted trust options.

The workspace KaTeX override does not travel with published packages:
`rehype-katex@7.0.1` still declares KaTeX 0.16. Packed consumers require the same
declared patched renderer override until that upstream range is updated.
This limitation is separate from the zero-advisory committed workspace graph.

Final source acceptance after dependency repair passed:

- `pnpm check`: audit, root/package formatting, Svelte and TypeScript gates;
  zero Svelte errors or warnings.
- `pnpm lint`, `pnpm spec:check`, `pnpm catalog:check`, and `pnpm packages:check`.
- `pnpm test`: 418 tests across 71 files, eleven Turbo tasks passed.
- `pnpm build`: eight tasks passed.
- Exact `Embedded Live Preview` regression: one story passed.
- Full interaction/accessibility lane: 155 stories across 35 files passed.
- Fresh development-server browser acceptance: all 48 cases passed.
- `pnpm packages:pack`: six public tarballs installed together; Svelte, React,
  Vanilla, public CSS resolution, and private-import leakage acceptance passed.
- `pnpm build-storybook`: complete static catalog built successfully after the
  dependency refresh.

The Tasks consumer installs the built Mira tarball through a temporary pnpm
hook outside the repository, retaining its existing local host-package hook.
No consumer stylesheet repairs the cursor-buffer defect. Publishable manifests
and lockfiles retain registry dependencies; source publication and released
consumer refresh remain pending. Stories remain `visual-pending`, with no
baseline updates.
