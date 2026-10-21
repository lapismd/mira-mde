# Embedded composer line numbers

MIRA-ARCH-008 now includes `MiraProps.lineNumbers`, default true, forwarded to
the existing MiraCodeEditor option. `false` omits the line-number extension;
there is no consumer CSS hiding the gutter. All other Mira behavior is unchanged.

The agent-ui paired composer exposed visible line numbers after removing its
custom gutter styling. The published Mira root did not expose the existing
CodeEditor option. The exact new public-component regression verifies that
`lineNumbers=false` mounts editable content without `.cm-lineNumbers`.

`pnpm exec vitest run src/index.test.ts` from `packages/mira`: 5 passed, zero
failures. Package build and packed consumer acceptance are recorded below.
Only focused checks are authorized during this review. Aggregate qualification
and publication remain pending; source consumers use documented ignored local
archives, while manifests retain npm ranges.

`pnpm build` and `pnpm pack --pack-destination ../../.local/packages` from
`packages/mira`: Svelte package build and publint passed. The ignored archive
`.local/packages/lapismd-mira-0.1.0.tgz` is consumed by Design Core and agent-ui
through ignored pnpm readPackage hooks with `--lockfile=false`. No manifest or
registry lockfile changes were needed. This is temporary review acceptance,
not publication. Native checklist indentation also reproduces in plain Mira;
that separate issue remains unchanged in this slice.
