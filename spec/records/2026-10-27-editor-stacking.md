# Editor stacking containment

The shared CodeMirror base theme now isolates each real editor root. The
CodeMirror panel/gutter stack remains local while host overlays cover it.
There is no new component input, entry point or host-specific stylesheet.

Targeted qualification only, as requested:

- `pnpm exec vitest run --project storybook stories/mira-code-editor/MiraCodeEditor.stories.ts -t 'Find beneath host overlay'`: before **0 passed / 1 failed**, after **1 passed / 0 failed**.
- The same targeted family with `-t 'Find beneath host overlay|Find and Replace'`: **2 passed / 0 failed** against rebuilt public output.
- `pnpm exec vitest run src/internal/codemirror/base/search.test.ts` in `packages/mira`: **6 passed / 0 failed**.
- `pnpm exec vitest run --project storybook stories/mira-editor/features/BlockToolbar.stories.ts -t 'Open menu'`: **1 passed / 0 failed**, preserving the portaled block menu.
- The Mira package build and publint pass; the spec-first changed-path gate passes.

The verified local `@lapismd/mira@0.1.1` archive has SHA-256
`5df6b9065f184a8213ba9d2d7c21be33404231586bea6f6b04c77dda93c4f57f`.
Plugins consumes it using its existing ignored archive hook. No published
manifest, lockfile or baseline is changed. Full suites and wider consumer
qualification remain explicitly deferred; this is not release approval.
