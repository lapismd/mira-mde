# Table cell focus lifetime

Requirement: MIRA-MD-036.

The math release's full `pnpm check:all` at `a09d9dbe` passes all 462 Mira
unit assertions but fails on one uncaught `MouseEvent is not defined` exception
from `grid-editor-column.svelte` after teardown. The full receipt is
`.local/validation/runs/mira-validation-b381fc0a-e257-4a5e-abb1-b450106d09a8`.
The original isolated keyboard-focus case passes alone; that does not qualify
the failing aggregate or dispose its pending callback.

Both grid and pipe cells schedule focus and selection through a Svelte tick
followed by a timer, without canceling either boundary on unmount. The new exact
regression mounts real production cells, focuses their keyboard triggers,
unmounts before or after the tick settles, then runs pending timers and verifies
that no EditorView focus or dispatch occurs. The original focus assertion stays.

Before the fix the exact target
`MIRA_VALIDATION_RUNTIME=native pnpm --filter @lapismd/mira test src/tables/grid-editor-column.test.ts`
fails all four teardown regressions while the original focus case passes. The
receipt is `/tmp/lapis-mira-math-validation-20261031/table-cell-focus-before.log`.

The two owning components now cancel pending focus timers on teardown and guard
the preceding tick and callback against disposal. Pointer coordinates are
captured synchronously; mounted keyboard and pointer behavior stays unchanged.
The exact rerun passes all five cases. Full source `c0902e0b` then passes
`pnpm check:all` with 525 units and zero unhandled errors, plus 178 Storybook/axe
cases and the complete cold 60-case browser lane under its unchanged existing
expected-failure policy. The real pointer-reorder/mutation/source-reveal browser
case also passes. Receipts are `525478e5`, `41ddea53` and `3f951b52` under the
owning workspace's `.local/validation/runs`.

The independent new packed production host still stops at the external Dnd
compiler warning described in the math packaging record; that gate is not
waived. No timeout, diagnostic, assertion or visual baseline is weakened.
