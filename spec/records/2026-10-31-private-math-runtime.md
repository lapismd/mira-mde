# Private math runtime packaging

Requirements: MIRA-ARCH-039, MIRA-ARCH-045, MIRA-MD-002.

## Original boundary

Published Mira 0.1.3 at source `e2ad5063` declares patched direct KaTeX 0.18.10,
but published `rehype-katex@7.0.1` and `micromark-extension-math@3.1.0` still
require KaTeX `^0.16.0`. The existing workspace override does not propagate to
consumers. Latest registry releases retain those ranges. The refreshed Tasks
required runtime/peer closure retains one low GHSA-238p-pmpm-9mq7 pair at
KaTeX 0.16.47 after ordinary compatible updates remove the other 30 pairs.
Its installed receipt remains at
`/private/tmp/lapis-tasks-publication-20261030/.local/release-preflight/compatible-refresh-installed-runtime-advisories.json`.

Before source changes, the exact existing target
`pnpm --filter @lapismd/mira test src/preview/preview.test.ts -t 'patched math renderer'`
passes both cases. The new exact policy target
`node --test --test-name-pattern='rejects the formerly accepted KaTeX advisory' scripts/packed-audit-policy.spec.mjs`
fails once because the historical policy still accepts that finding. Its receipt
is `/tmp/lapis-runtime-owner-audit-20261031/mira-strict-audit-before.log`.

An in-memory feasibility probe compares nine math inputs in safe and trusted
mode: 18 exact AST equalities, plus two inherited-trust rejection checks pass.
It covers inline/display, escaped dollars, literal code, math fences, unsupported
commands, raw HTML, links and multiline aligned expressions. This is feasibility
evidence, not a packed or browser acceptance claim. The first helper-resolution
setup stops before assertions because the current manifest does not declare the
new explicit helpers; corrected probe resolution uses their existing upstream
owner context. Receipts remain under `/tmp/lapis-runtime-owner-audit-20261031`.

## Source-owned repair

A private source entry re-exports the unchanged released adapters with no public
API addition. The normal Svelte build then bundles their math/parser code into
that private runtime file. Both adapter packages become build-only dependencies;
KaTeX stays at the declared patched 0.18.10 runtime boundary.

`devlop`, `hast-util-from-html-isomorphic` and `unist-util-visit-parents` remain
explicit runtime dependencies. Bundling the whole closure first exposes Node
builtins; preserving those boundaries keeps development assertions, browser/Node
HTML parsing and Node diagnostic coloring intact. Default, browser and Node
condition profiles produce identical private bundle bytes with these boundaries.
Every included package is MIT; the artifact retains the original complete license
and copyright text plus checksum-bound inventory. No dependency source patch,
consumer override, handwritten replacement renderer or new audit exception is used.

Build and packed guards reject undeclared/foreign imports, missing or changed
assets, stale runtime adapter requirements and unpatched direct KaTeX. The packed
base Mira production audit now rejects every finding. The existing 2026-10-11
cohort acceptance remains only for the unchanged Mermaid 11/layout-ELK path;
installed identities and all finding paths must match. Base math and downstream
consumers never inherit that scope. No public Mermaid or Node contract changes.

## Required qualification

Exact policy/math and artifact guards, all affected package and repository lanes,
full catalog/accessibility and cold browser checks, all six public tarballs with
isolated no-hoist consumers, strict declarations and a clean production audit
remain required. The actual new npm version, provenance, tag/release and downstream
Core floor/consumer acceptance remain separate gates. No visual baseline change
is authorized.

The first package build stops at the license guard: the two adapter tarballs
omit their monorepo-root MIT license. Exact upstream license bytes are retained
from the published npm gitHeads (`d5d0660b` and `88a9497e`) with registry integrity
and SHA-256 provenance; the guard remains strict. The corrected build retains
11 MIT notices and passes publint. Four artifact guards pass. An initial private
plugin annotation reports one strict HAST-root error and zero warnings; the
precise root type and its explicit type dependency correct it. The same owning
package check then passes with zero errors/warnings, without a type shim.

The packed fixture additionally checks private declarations with `skipLibCheck`
false, installed Node math/trust behavior and fresh public MarkdownPreview Vite
development/production hosts. Both browser contexts (ordinary and polluted trust)
retain exact inline/display, malformed-math, safe-HTML and trust assertions; every
browser warning/error remains fatal. These new cold gates are pending until the
complete isolated tarball command passes.

The initial cold fixture attempts retained separate setup failures: an unsupported
command did not represent malformed input, and `data:,` was not an image URI.
The fixture now uses an unclosed fraction and the existing valid data PNG.
Runs `cc21dffe`, `9817e4b7`, `b0f53579` and `2fb7dadb` retain their original
failures. The latest ordinary browser context passes all seven assertions;
the polluted context fails because its descriptor defaults to nonwritable,
preventing ordinary KaTeX Settings assignment. Independent module comparison
confirms this affects both the old and patched renderer. The fixture now tests
ordinary and writable-property rendering with the original assertions and
deadlines, plus a separate read-only context that verifies visible fail-closed
fallback and no browser diagnostics. Source tests separately retain that
read-only case instead of claiming normal rendering under an assignment barrier.

## Completed source qualification and remaining package gate

Qualified source `c0902e0b152bea37af8c2e5267793cffbb35f063` retains the original
six-product graph and adds the separately evidenced table-focus disposal repair.

| Command                                 | Result                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check:all`                        | Passed: 525 units, 16 runner guards, lint, formatting, all builds/publint, zero Svelte source errors/warnings. Run `525478e5`.    |
| `pnpm test:storybook`                   | Passed: 178 unique interaction/axe cases, four cold shards, zero failures/errors/skips. Run `41ddea53`.                           |
| `pnpm storybook:check`                  | Passed: catalog guards, static build, 60 cold browser cases under the unchanged existing expected-failure policy. Run `3f951b52`. |
| Native `pnpm packages:check` on Node 24 | Passed: five boundary guards, release configuration and 45 release-policy tests.                                                  |
| Native `pnpm spec:check`                | All four canonical lanes passed.                                                                                                  |

The cold browser count is 59 ordinary passes and one unchanged expected failure
for the known whitespace-only blockquote source row. The entire test file is
byte-identical to published source `e2ad5063`; no failure marker or assertion
changed. Its retained error context and successful last-run report distinguish
that governed case from an unexpected failure. Detailed independent report
checks remain under `/tmp/lapis-mira-math-validation-20261031`.

Exact `pnpm packages:pack` recovery run `1cc3f0e1` at source `a09d9dbe` passes
the four artifact guards, strict private declarations, public CSS resolution,
zero-finding base runtime audit and the development host's four Node scenarios
and 18 browser assertions with zero diagnostics. Its production host fails on
one pre-existing external `@dnd-kit/svelte@0.4.0` compiler warning about capturing
`managerProp`. The actual 0.4.0 and latest 0.5.1 registry artifacts reproduce
that warning under qualified Svelte 5.57.2; a compiler pin or ordinary upgrade
does not resolve it. The proposed exact-file/code/hash/count scope remains
**unactivated**, pending an explicit user decision. No warning suppression,
dependency patch, public entrypoint workaround or new exception is active.
The original failure and full raw diagnostic remain retained. The final packed
production check, source/version PRs and actual publication remain pending.

During ownership handoff the previous agent's pending fixture edit completed
before the new owner's first patch. That context check failed atomically without
overwriting files; the finished edit was re-read and preserved. The coordinator
confirmed the previous agent was interrupted, with no other writer or active
worker. All original 25 changed paths and earlier failed reports were preserved.
