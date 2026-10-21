# Safe preview syntax highlighting

Notes' AI transcript renders complete Markdown fences through Design Core's
MarkdownContent/Mira safe preview. The sanitizer kept the code's language but
removed the generated `hljs` and token classes, leaving plaintext code and
omitting normal block chrome. Fix the owned safe preview schema, not the
consumer, without switching to unsafe HTML.

MIRA-MD-002 retains generated language, highlight-token and code-line classes.
Scripts, event attributes and unsafe destination restrictions stay unchanged.
The actual MarkdownPreview mount contains TypeScript, Markdown and hostile HTML.

- Before: `pnpm --filter @lapismd/mira exec vitest run src/preview/safe-code-preview.test.ts`
  fails once: no `code.hljs.language-typescript` survives sanitization.
- After: the same exact target passes one case, including highlighted keyword
  and Markdown heading spans and stripped script/onerror content.

The heading token `hljs-section` now uses the existing syntax-heading color.
`pnpm --filter @lapismd/mira check` passes formatting and strict Svelte/TS
checks. The complete preview family passes 22 files/105 tests. The package build
and publint pass; built public archive acceptance is recorded in Notes E-AI-039.
`pnpm exec spec-validator validate` passes six validators/11 chapters/199
requirements. The initial spec-first run required the mapped packages chapter;
the unchanged export/archive contract is now explicit there. Final spec-first
also includes the owning styling chapter. Logs are under
`/tmp/lapis-ai-safe-code-{before,after,check,family,build,spec,first-final}.log`.

Notes E-AI-039 owns public-package browser acceptance.
No package publication, installed app replacement or visual baseline updates.
This corrects portable preview behavior; original milestone statuses are
unchanged. Broad provider/platform/release checks are deferred by the user's
visible-delivery scope.
