# Source-bound Markdown writes and protected recovery

This slice implements MIRA-MD-046, MIRA-MD-047 and MIRA-MD-048. An adapter can
bind a writable preview's transport and registration to its captured source
session. Portable text state, subscriptions and recovery leases remain separate
from App, vault and conflict-presentation types.

Recovery blocks editing and ordinary refresh synchronously, settles admitted
persistence without retrying a failed write, and retains independent leases.
Only live leases can acknowledge local text or replace it with reviewed external
text. Failed writes remain barriers after undo. Detached failures stay registered
until persistence or explicit recovery succeeds. Legacy write callback arity and
ordinary session registration remain supported.

## Exact regressions

- `pnpm --filter @lapismd/mira exec vitest run src/preview/editable-markdown-preview/markdown-write-binding.test.ts`:
  eight failures before, eight passes after the initial implementation. Four
  additional edge cases expose three failures: refresh during recovery,
  subscriber-requested recovery before flight reservation, and malformed
  cleanup. All twelve cases now pass, including cleanup retry.
- `pnpm --filter @lapismd/mira exec vitest run src/preview/editable-markdown-preview`:
  all 25 writer, attachment and interaction-behavior cases pass.
- `pnpm exec vitest run --project storybook stories/markdown/embeds/BoundRecovery.stories.ts`:
  the initial synthetic select-and-type interaction replaces its first input
  character. State tracing confirms this occurs before persistence. A native
  Playwright keyboard probe retains the complete replacement. The story clears
  the selection before typing and preserves full draft/disk assertions. It
  passes without product keyboard changes or relaxed assertions.
- `pnpm exec vitest run --project storybook stories/markdown/embeds`:
  all eight interactions pass. The recovery story covers active protection,
  external replacement, subsequent saves, detached failure, acknowledgement and
  reopening through the public preview.

## Complete qualification

- `pnpm check`: zero audit advisories and eleven successful tasks. Final
  `pnpm check:format` and `pnpm lint` pass after the story/browser additions.
- `pnpm test`: eleven tasks and 442 unit cases pass, including 383 core cases.
  `pnpm build`: all eight tasks pass with publint.
- `pnpm test:storybook`: the first broad attempt passes 157 and times out two
  of 159 interactions during concurrent compilation. The exact Custom Theme
  Extending Mira and Comprehensive Split retries each pass. A fresh complete
  `pnpm test:storybook --no-file-parallelism` passes all 159 interaction/axe
  cases with unchanged per-test timeouts and assertions.
- `pnpm exec playwright test --config .release/m4-recovery.playwright.config.ts markdown-recovery.spec.ts`:
  the initial ignored projection cannot start because its web-server cwd points
  at `.release`. After correcting cwd, the first cold run times out waiting for
  story completion. A cold retry after compiler completion passes the exact
  native replacement case with the original timeout and full text assertions.
- `pnpm exec playwright test --config .release/m4-recovery.playwright.config.ts`:
  all 51 cases pass on a fresh server at port 7091. The ignored projection uses
  the canonical tests and assertions, changing only cwd, test directory, port
  and server reuse. The original port 7007 server remains untouched.
- `pnpm packages:check`: boundaries and all 36 release-tool cases pass.
  `pnpm packages:pack`: all six public packages install together; Svelte, React,
  Vanilla, stylesheet and package-leak checks pass. The packed production audit
  reports its existing approved low-severity KaTeX exception; no ignore is added.
- `pnpm build-storybook`: the complete static catalog builds, including the new
  recovery documentation. No visual baselines are changed.
- The first `pnpm spec:check` reports 187 unmapped requirements because a new
  introductory verification table hides the existing matrix. Moving its three
  rows into the original matrix restores all four lanes without validator changes.

Qualification uses macOS ARM64, Node 26.9.0, pnpm 10.32.1, Vitest 4.1.11,
Playwright 1.61.1, Storybook 10.5.6 and spec-validator 0.1.4. A patch Changeset
records release intent; package versions and registry dependency ranges remain
unchanged and no publication occurs.

## Migration review

This qualifies portable Mira behavior and packed public consumers. The App-bound
Markdown adapter, installed host cohorts and actual desktop WebView recovery need
separate qualification. Desktop M4 and complete enabled-writer coverage remain
open. These hooks alone do not complete either gate.
