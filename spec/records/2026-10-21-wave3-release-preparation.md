# Wave 3 dependency-first Mira preparation

Date: 2026-10-21. Revision: enclosing Jujutsu change. This is source integration
and release qualification, not approval to publish npm packages, tags or images.

## Source and release boundary

- Refreshed GitHub main `46bafdf4` includes PR #14. Default workspace remains
  clean at local `408809d3`; the two pending changes are safe preview
  highlighting `a95a541b` and immutable table reading `408809d3`.
- A separate Jujutsu workspace merges that source with remote main. Existing
  published history and default-workspace work are preserved.
- Existing Changesets PR #15 is retained. npm currently publishes core 0.0.5
  and five dependents at 0.0.2. Its proposed core 0.1.0 / dependent 0.0.3 cohort
  remains unpublished. The new Changeset includes both pending fixes.
- No open Dependabot proposals were found on 2026-10-21. The existing version
  PR is not a dependency update and must not be duplicated.
- MIRA-GOV-010 now requires explicit manual publication and protected
  exact-source approval. Source pushes and default manual qualification cannot
  publish or create package tags. The publisher independently rejects push
  events, non-main refs, missing requests, missing/stale source approval and
  missing OIDC, before registry IO. Existing immutable-recovery gates remain.
- `npm-production` previously had no protection. It now requires reviewer
  `stevejuma` and the exact `main` deployment branch. No approved-source variable
  or npm credential is installed as part of preparation.
- Manual CI can qualify the existing bot version branch. A separate strict,
  read-only visual comparison job uses the already released canonical browser
  image. No new image or baseline publication is authorized.

## Dependency audit

`pnpm audit --json` initially reports eight findings: three high, four moderate
and one low in Vite 7/8 and Markdown-it. Root Vite moves to the patched 7.3.7
line, with major-preserving Vite overrides; Markdown-it moves to patched 14.3.3.
Visual Delta moves from published 0.0.7 to 0.0.8, with exact Playwright 1.62.1
matching its qualified browser profile. No sibling dependency paths are added.

`pnpm install --lockfile-only --ignore-scripts` and then frozen installation
pass. Fresh audit reports zero vulnerabilities. Raw initial/final audit reports
are `/tmp/mira-wave3-audit-{before,after}.json`. The existing KaTeX packed-consumer
policy is retained unchanged; a workspace audit is not a packed-consumer audit.

## Focused acceptance and failures

- Before dependencies were installed, the initial release regression command
  fails to load `semver`; no product assertion ran. After installation,
  `node --test scripts/publish-release.spec.mjs` reports six passes and one
  failure proving the exact-source admission guard is absent.
- After implementation, the publisher/workflow pair passes 14 tests. The
  complete `pnpm release:test` passes 38 tests and `pnpm release:check` passes.
- `pnpm --filter @lapismd/mira exec vitest run
src/preview/safe-code-preview.test.ts src/tables/table-reader.test.ts
src/tables/widgets/lifecycle.test.ts` passes five tests in three files.
- `pnpm catalog:check` initially rejects the undocumented public
  `--mira-table-reader-cell-padding` token. Register the token and TableReader
  public component, and add a production-component annotated-row story. The
  same gate then passes 19 entries, 157 tokens and six checker tests.
- The complete preview/table family initially reports 136 passes and one
  failure: the existing inline-parser test reads CodeMirror's partial initial
  `Document(Body)` tree during parallel load. That exact test passes alone.
  The assertion now completes the incremental parse with `ensureSyntaxTree`
  before requiring all seven original syntax nodes. MIRA-MD-002 and runtime
  parsing behavior are unchanged. Exact and family reruns are recorded below.
- `pnpm --filter @lapismd/mira check` passes formatting, types and strict
  Svelte diagnostics with zero errors/warnings. Its build and publint pass.
- `pnpm spec:check` passes all four lanes (validation, Markdown lint, mdBook,
  spec-first). Final mapped-source and release-intent checks remain required.
- `visual-delta test --help` unexpectedly starts clean-stage preparation before
  rejecting the missing selection mode; no comparison or baseline write occurs.
  The correct `test --all --dry-run --baseline-path-mode nested-import` exits
  successfully but finds zero targets before the static index exists; that is
  inconclusive, not visual qualification. Hosted build/comparison is required.

Local tools: Node 26.9.0, pnpm 10.32.1; hosted workflows retain Node 24. No native
compilation, local aggregate suite, browser capture or baseline update is run.
Shared tooling/package/release changes require full non-browser, packed-consumer,
Storybook interaction/accessibility, cold browser and visual checks. They are
assigned to hosted CI to keep local work focused; unrun checks are pending.

Final focused results: the exact inline-parser regression passes, followed by
all 32 preview/table files and 137 tests. Root formatting, release configuration,
catalog and actionlint checks pass. Explicit-range spec-first passes 20 protected
paths and seven canonical chapters. The first explicit release-intent command
cannot locate Git from the non-colocated Jujutsu workspace; rerun it with
`GIT_DIR` selected by the read-only `jj git root`, as already used by the
Changesets reader fixture. That exact comparison passes five public changes
and one Changeset. All 38 release tests pass again, followed by specification
validation (six validators, 11 chapters, 199 requirements) and Markdown lint.

## Remaining gates

Record final focused checks and protected PR CI, merge source only when qualified,
refresh the existing Changesets PR, then qualify the versioned candidate and its
immutable artifacts. Inspect package/license notices and public-registry
consumers before presenting exact versions/source/checksums for separate human
publication approval. Do not inherit Wave 1's dev-tool exception or Wave 2's
publication approval. Actual Design Core/Desktop adoption remains in later waves.

Milestone review: this source slice preserves existing product contracts except
the stricter publication-admission requirement. New reader visuals remain
visual-pending; original Desktop M11/M12 distribution/retirement gates remain
Planned. Source and library qualification do not complete Desktop distribution.
