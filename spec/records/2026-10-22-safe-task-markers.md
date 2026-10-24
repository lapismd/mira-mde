# Safe task markers

Agent UI's recorded README preview showed filled checked boxes without ticks.
The safe HTML pipeline removed the parser's list-item `dataTask` property, so
the shared checkbox renderer received the unchecked artwork marker even though
its checked property remained true. Preserve only that list-item metadata in
the safe schema; executable HTML and writable-preview policy stay unchanged.

Focused evidence:

- `pnpm exec vitest run src/preview/safe-tasks.test.ts` in `packages/mira`:
  1 failed / 1 passed before the fix.
- The first attempted dashed schema key still failed; HAST requires `dataTask`.
- `pnpm exec vitest run src/preview/safe-tasks.test.ts src/preview/portable-surfaces.test.ts`:
  19 passed after the fix.
- `pnpm --filter @lapismd/mira check:svelte`: 0 errors / 0 warnings.
- `pnpm --filter @lapismd/mira check:types`: passed.
- Changed-file Prettier and `pnpm spec:check`: passed, four spec lanes.
- Root `pnpm build`: eight successful tasks, including public package builds.

The rebuilt Mira archive is a local validation dependency for Agent UI; ordinary
manifests retain registry ranges. Agent UI records the cold browser check of
checked marker paint in its Files review record. Full suites, broad visual
qualification and publication remain deferred until the user's final review.
