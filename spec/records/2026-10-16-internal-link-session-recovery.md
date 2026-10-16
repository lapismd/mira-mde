# Internal-link preview recovery

MIRA-MD-049 retains the existing resolved reference when its path, name,
extension and kind are unchanged. Re-resolving the same target therefore does
not replace the write callback and detach the visible source session.
MIRA-MD-050 treats empty Markdown as loaded content, preserving the editor after
an empty save. The public adapter and preview exports are unchanged.

## Before and exact qualification

The native Notes consumer first passes two of three preview conflict cases.
Accepting disk text clears the conflict but leaves original text in the visible
editor. Temporary, subsequently removed writer tracing identifies a second
writer created while the failed original is retained. Protected recovery then
updates the invisible original. The corrected native target passes all three
cases, including later saving, cold restart and recovery after owner-tab close.

`pnpm exec vitest run --project storybook stories/markdown/embeds/BoundRecovery.stories.ts -t 'Internal link recovery' --no-file-parallelism`
reproduces one failure when refreshing an equivalent target. After rebuilding
the public package, the final complete two-story target passes. A component
regression separately verifies accepted external text while its recovery lease
remains held, with no reread or rebinding.

Failed attempts remain explicit: the first fixture clicked Fail persistence
after opening a clean card, correctly dismissing it through the outside-click
boundary. The corrected fixture enables failure first. One source retry still
used old built exports; it is not qualification of the source correction.
Continuation through synthetic outside clicks and typing then encounters card
dismissal after successful recovery. The actual browser continuation now uses
Playwright input and reopens the link through real hover. It preserves the
accepted-text, readonly-release, empty-save, later-input and one-session
assertions. No existing assertion or timeout is relaxed.

## Complete source qualification

Node 26.9.0, pnpm 10.32.1, macOS ARM64, Vitest 4.1.11 and Playwright 1.61.1.

- `pnpm check:all`: eleven check tasks, all 443 unit cases (384 core), lint and
  eight build tasks pass. The new component recovery case passes.
- `pnpm test:storybook --no-file-parallelism`: all 160 interaction/accessibility
  cases across 36 files pass with fresh built output.
- `pnpm packages:check` and `pnpm packages:pack`: package/release checks and all
  six public packed consumers pass, including Svelte, React, Vanilla and CSS.
  The pre-existing approved low-severity KaTeX exception remains recorded by
  the packed audit; no audit policy changes are included.
- `pnpm build-storybook`: the complete static catalog builds.
- `pnpm exec playwright test -c <isolated-port-config>`: all 52 cold browser
  cases pass, including both recovery/input cases. A fresh checkout-owned
  server uses port 7107; the original Mira server on 7007 is preserved.
- The initial `pnpm spec:check` flags missing mapped `spec/src/packages.md`.
  The owning public-package chapter now records the unchanged entrypoints and
  the two preview lifecycle corrections. The final `pnpm spec:check` passes
  all four lanes after that correction and verification status finalization.

The ignored isolated-port configuration is retained beneath
`.visual-delta/cache/preview-playwright.config.ts`; its earlier temporary
`.local` location is removed. No local configuration is committed. No visual
baselines, package publication or app signing are included. Desktop M4 retains
its original aggregate gate and must separately qualify every enabled writer.
