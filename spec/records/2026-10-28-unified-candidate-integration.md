# Unified candidate integration

Lapis consumers required one Mira build carrying both the editor stacking
containment of main-lineage `082703eb` and the displayed-record contract of
`cb8f2b2b` (properties-edit-boundary line, on attachment `d24f79bf`). No
existing archive carried both: the qualified Plugins candidate `03e15e02…`
lacks the isolation contract, and the editor-surface build `5df6b906…` lacks
`previousRecord`. This slice integrates the properties line into the main
lineage and packs the unified candidate.

## Integration

`jj duplicate -r 'd24f79bf | cb8f2b2b' -o 082703eb` replayed both commits
without conflicts as `0fbf3d7a` (preview writer identity) and `5ee4c0e7`
(rendered frontmatter authority). The merged tree is exactly `082703eb` plus
the two source deltas: `jj diff --from cb8f2b2b --to 5ee4c0e7` equals the
`082703eb` file set, and `jj diff --from 082703eb --to 5ee4c0e7` equals the
union of the two source file sets. The original workspace commits are
untouched; no bookmark moved.

One semantic resolution was required (`13a93535`): `082703eb` recorded the
MIRA-CSS-045 verification row in a standalone top table whose singular
`Requirement` header the grouped canonical-matrix validator does not read, so
`spec-validator validate` failed with `SPEC-VERIFY-UNMAPPED MIRA-CSS-045` on
the base itself — reproduced byte-identically on the extracted `082703eb`
tree before integration. The row now sits in the canonical matrix with its
original evidence and status; the top narrative table is preserved.

## Owner lanes

Docker worker lanes at the merged tip: `build` **8/8 tasks**, `lint` pass,
`test` **520 package cases** (mira 457, editor 32, react 12, vanilla 4, ai 4,
mermaid 7), `spec:check` pass, `spec:validate` pass. Native at the final tip:
prettier pass, `turbo run check` **11/11**, `turbo run test` **11/11**,
`spec-validator first --base 082703eb… --head 13a93535…` pass (9 protected
files, 3 canonical chapters), and `scripts/check-package-tarballs.mjs` pass
(six tarballs installed together; Svelte/React/Vanilla tsc, stylesheet
resolution, leak checks, and the prod audit with only the documented KaTeX
exception).

Not run: `test:e2e`/`storybook:check` (deferred by the task scope; consumer
catalog acceptance covers the browser surface) and no publication step.

Pre-existing, merge-independent findings: the `check` lane audit gate fails on
a new low deepmerge advisory (GHSA-gcqx-w48m-w2h4 via
`@sveltejs/vite-plugin-svelte`, no patched release; the lockfile is
byte-identical to `082703eb`, and the host reproduces the same single
finding) — owned by dependency consolidation. The standalone Docker
`spec:first` lane rejects `--head` without `--base` unless `MIRA_CHECK_BASE`
is set — a harness contract, not a spec failure. The remote validation host
dropped SSH mid-session; the pack-validation script above ran natively during
that outage.

## Unified archive

`pnpm pack` in `packages/mira` at `13a93535` produced
`lapismd-mira-0.1.1.tgz` (343,772 bytes), byte-identical across two packs,
SHA-256
`012dcd4d6d21f043ed2e13d9a391e441cd6da0b376ec850216d7a3c852c8491a`. Packed
dist verification: `MiraMarkdownEditingSession.hold`
(`dist/extensions/markdown-editing.d.ts`, `dist/preview/editable-markdown-preview/editing-session.js`),
`FrontmatterControllerCommit.previousRecord`
(`dist/preview/frontmatter/controller.svelte.d.ts`), and
`isolation: "isolate"` (`dist/internal/codemirror/base/index.js`). The
archive is staged for the consumer at
`lapis-plugins/.local/mira-candidate/lapismd-mira-0.1.1-unified-13a93535.tgz`
beside the preserved `03e15e02…` candidate. Publication remains gated on the
existing release process; four changesets stay pending.
