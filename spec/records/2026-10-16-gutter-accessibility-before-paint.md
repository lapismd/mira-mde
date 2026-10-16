# Gutter accessibility before paint

The complete Tauri native suite reports one `aria-hidden-focus` failure while
editing: CodeMirror's gutter wrapper hides focusable block buttons until Mira's
next measurement frame. Reading and the other native specs pass. The prior
source test waits for a frame and passes unchanged, so it cannot establish the
earlier accessibility boundary.

The new exact regression mounts the real EditorView and checks semantic
exposure after synchronous DOM work, before another animation frame. It fails
one case with the existing case passing:

`pnpm --filter @lapismd/mira exec vitest run src/internal/codemirror/rich/block-controls-accessibility.test.ts`

The accessibility lease needs DOM attributes only. Coalesce its existing
ownership work into a microtask after CodeMirror's synchronous updates, without
requesting layout. Keep decorative columns hidden and restore only owned
attributes on reconfiguration or teardown. MIRA-MD-043 retains the same public
contract and entrypoints; no consumer wait or axe exclusion is added.

## Qualification

Node 26.9.0 / pnpm 10.32.1, macOS ARM64. The native consumer uses pnpm 10.34.5.

- The exact gutter command passes both cases, including keyboard focus,
  immediate semantic exposure, document updates and reconfiguration.
- `pnpm check:all`: all 444 units (385 core), eleven check/test tasks, lint,
  audit and eight builds pass.
- `pnpm exec vitest run --project storybook stories/mira-editor/features/BlockToolbar.stories.ts --no-file-parallelism`:
  all three focused interaction/axe cases pass.
- `pnpm test:storybook --no-file-parallelism`: all 160 cases across 36 files
  pass with freshly built output.
- `pnpm packages:check` and `pnpm packages:pack`: package/release checks and all
  six public packed consumers pass. The existing approved low KaTeX advisory
  remains unchanged; no audit exception is added.
- `pnpm build-storybook` succeeds. All 52 cold Playwright cases pass on isolated
  port 7107, preserving the original Mira server on 7007.
- `pnpm spec:check` passes all four lanes, including final record/status updates.
- The updated verified archives pass all 27 native WebView cases, including
  the exact editing and reading axe checks. A separate obsolete failed-startup
  test navigation is corrected in the desktop; its exact recovery target passes.
  Complete desktop lifecycle evidence remains desktop-owned.

This is an additional source fix after internal-link preview recovery, not a
replacement for its earlier evidence. Publication, app signing and visual
baselines remain deferred. Desktop M4 retains its original aggregate gate.
