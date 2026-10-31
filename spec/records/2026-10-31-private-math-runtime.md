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

## Explicit Dnd disposition

The user explicitly approved the prepared scope on 2026-10-31: at most one exact
`@dnd-kit/svelte@0.4.0` `DragDropProvider.svelte` compiler warning per production
build, with source SHA-256
`9750aa31f409e0f6be0e70b3fef6c8d8e8e447ff25b150fbc2dd4bec4781eaab`,
code/message identity and expiry 2026-11-30. The source-owned fixture now checks
every field and retains/prints all raw diagnostics, including failed checks.
Negative guards cover changed source, identity, message, mode, repeated warning
and expiration. All other fatal gates, runtime assertions and deadlines remain
unchanged. This explicit decision supersedes the earlier unactivated proposal;
the original warning and all failed attempts remain retained.

Recovery run `677d5fb8` at `719b24f4` passes both public cold hosts: four Node
scenarios and 18 browser assertions each, with zero runtime diagnostics. The
development build emits zero compiler warnings; production emits exactly the
one approved warning. Both raw receipts are retained and source-bound. The
base production audit is clean. The cohort metadata reader then fails because
CommonJS resolution cannot select the adapter's import-only export. The exact
new fixture reproduces that failure without executing any browser module;
manifest inspection now follows canonical installed roots and preserves every
existing identity/advisory check. No package export or Node contract changes.

## Successful final packed acceptance

The exact original `pnpm packages:pack` command passes at
`b76eac565e23b890d432e735ee9e22de8d486e02`, run
`mira-validation-a455ea13-9166-4ed6-9d04-9ef9e97d63b9`. All six isolated public
tarballs, strict private declarations, Svelte/React/Vanilla entrypoints, public
CSS and leak checks pass. Both cold development and production hosts pass four
Node scenarios and 18 browser assertions with zero runtime diagnostics.
The base production audit contains zero findings. The cohort retains only its
existing scoped finding at actual Mermaid 11.17.2, layout-ELK 0.1.9 with peer
`^11.0.2` and KaTeX 0.16.47; no consumer or base exception is inherited.

Development compilation emits no warnings. Production emits exactly the one
approved warning, with its full raw frame, source identity and bounded decision
retained. The portable worker, CI and immutable release artifact retain those
receipts even when later checks fail. The retention guard changes one failure
to one pass; all 13 focused scope/workflow cases and 11 cohort-policy cases pass.
The original failed attempts remain unchanged. Source/version PR checks and
actual publication/provenance remain separate pending gates.

The first hosted PR run `41202593577` passes specification/release intent and
full non-browser validation, then its independent package job fails before
browser assertions because Chromium headless shell 1234 is absent. The new
cold fixture needs a browser in that job as well as Storybook's separate job.
The owning CI and release-artifact jobs now install pinned Chromium with OS
dependencies before package validation. Its job-scoped guard reproduces one
failure before the repair; complete required new-head CI remains the recovery
gate. The original failed job `124541176610` and successfully retained early
audit/diagnostic artifact remain evidence, without a waived check or test change.

## Verified 0.1.4 publication

Source PR #26 passes all three normal jobs in recovery run `41203120667` and
merges as `11ecdb86089a0bde855776f7111715b9c6f304df`. The bot's actual version
plan selects only `@lapismd/mira@0.1.4`; the other five packages remain 0.0.3.
Version Packages PR #27 is reviewed in full and formally approved at exact head
`13539eabd01992f6296b2fc7d2d9c5ac68705582` (review `5722819959`). All three
jobs in `41203791057` pass before the checked merge to
`6658fe563b6ff725a931d339abca727c10263420`. All three main CI jobs then pass in
`41204586592`. No required check or original expected-failure marker is waived.

After a fresh workspace/Dependabot preflight, the normal production dispatch
`41205035585` builds immutable artifact `13043527864`. Its tarball is
byte-identical to the prior qualified main artifact. Source-bound development
receipts contain zero warnings; production contains exactly the approved single
warning. Base audit findings remain zero; only the unchanged scoped Mermaid
cohort finding remains. The exact-source variable and normal protected
`npm-production` reviewer gate are approved after independent artifact checks.

All five production stages succeed: version preparation, artifact qualification,
trusted npm publication, clean-install/signature/provenance verification, and
automatic package tag/GitHub release creation. Registry `latest` is 0.1.4.
The 356854-byte registry tarball has SHA-256
`d2c16137900f9512527c699206a5294a3a7ad593f1f59e0f7b7347bd3053ed3e` and SRI
`sha512-Tt7qqDTrWBrJWdDksJszt0HuBwXPaSlh+ADaKQTGJab9E2J7d2N+STWnbD6OZW0c2B7zUcyvGosA3ehxb23Ogg==`.
Independent cryptographic Sigstore verification binds those exact bytes to
the source above, GitHub's Actions issuer,
`.github/workflows/release.yml@refs/heads/main` and run `41205035585` attempt 1.

A separate fresh registry consumer installs 0.1.4 and reports zero runtime
vulnerabilities. Initial npm version-list propagation briefly reports ETARGET;
the retained fresh-cache retry succeeds without source or dependency changes.
`npm audit signatures --json --include-attestations` reports zero invalid and
zero missing signatures, with 34 verified entries including Mira's SLSA
provenance. Complete reports and original retry logs remain under
`/tmp/lapis-mira-014-release-20261031/`.

Tag `mira@0.1.4` points exactly to the published source. Its normal non-draft
[GitHub release](https://github.com/lapismd/mira-mde/releases/tag/mira%400.1.4)
is published; this workflow uses the immutable Actions artifact and does not
attach release assets. This closes Mira's publication gate. Core and other
consumers still require their own released-minimum refresh and registry
acceptance; they do not inherit Mira's Mermaid cohort acceptance.
