# Directive fence highlighting

The legacy Lapis highlighter explicitly traversed a fenced code node's mounted
language overlay inside container directives. Mira retained the nested parser
but lost this token-decoration bridge. Restore it in the portable Markdown
extension rather than in Notebook.

Exact regression:
`pnpm --filter @lapismd/mira exec vitest run src/internal/codemirror/markdown/index.test.ts -t 'highlights fenced JavaScript'`.
Before: 1 pass, 1 failure (nested fence). After: 2 pass, 0 failures.
Additional regressions exercise lazy TypeScript/SQL loading, nested containers,
and editing highlighted tokens. Browser stories cover Source and Live Preview.

After the additional nested-language/edit regressions, the owning Markdown
test file passes 19 tests. The Code story's Source and exposed Live Preview
cases pass (2 tests). The first Live Preview play asserted hidden raw source;
it now activates the production Edit source control before asserting tokens.

The first full check found one AI-plugin suite unable to parse a Svelte UI
import pulled in through the new highlighter import. Extracting the unchanged
class highlighter into a leaf module preserves its public re-export and keeps
Markdown parsing independent of editor UI. The exact AI suite passes all four
tests afterward; the full lane then passes.

Final source qualification:

- `pnpm check:all`: audit, formatting, all package Svelte/type checks, lint,
  520 unit cases across the six public packages, builds and publint pass.
- `pnpm test:storybook`: 177 interaction/accessibility stories pass across four
  cold shards (36 + 47 + 35 + 59).
- `pnpm build-storybook`: static build passes.
- `pnpm test:e2e`: all 60 Chromium acceptance tests pass.
- `pnpm spec:check`: validation, Markdown lint, mdBook and spec-first pass.
- Doctor passes seven checks with the existing routing-alias warning. Semantic
  discovery reports QMD disabled in this repository, permitting its rg fallback.

Logs: `/tmp/mira-directive-check-all-final.log`,
`/tmp/mira-directive-full-stories.log`, `/tmp/mira-directive-static.log`,
`/tmp/mira-directive-e2e.log`, `/tmp/mira-directive-spec.log`.

An explicit native `pnpm build` builds all public package outputs. The built
core archive `.local/packages/lapismd-mira-0.1.2.tgz` has SHA256
`890a064170adf07012db9d0911902dafb7776e639fd87f7ff6f7b845ab92e889`.
Notebook's isolated acceptance consumes this archive through pnpm overrides,
restores its registry manifests/lockfile, and passes all four exact full-shell
layout/highlighting/identifier regressions. Source highlighting moved from one
consumer failure to a pass. Full consumer lanes are recorded in Notebook's
own qualification record.

No visual baseline is generated or updated. No push or publication occurred.
