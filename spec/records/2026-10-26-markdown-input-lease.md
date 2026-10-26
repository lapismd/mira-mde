# Portable Markdown input lease

Scope: MIRA-MD-054. A source-owned synchronous input lease lets an adapter hold
new edits while it admits an external lifecycle. It does not introduce host or
native policy, another writer, a save timer or a recovery acknowledgement.
Ordinary flush, protected flush and recovery retain their separate contracts.

The exact boundary is
`pnpm --filter @lapismd/mira exec vitest run src/preview/editable-markdown-preview/input-lease.test.ts`.
The five new cases cover immediate input exclusion, retained failed drafts,
explicit flush, an accepted save and independent source-bound leases.

## Result

All five exact cases fail on frozen `ef393bbf`, receipt
`mira-input-before-b8e9e900-3fae-4537-a78f-80390af236de`, because neither the
writer nor its bound session exposes the lease. No existing failure is waived.

The implementation factors the writer's existing independent protection counter
into synchronous `hold()`. `protect()` still acquires protection and flushes,
releasing only its own lease on failure. Source-bound sessions forward optional
`hold()` through the public extensions contract. No storage, admission, native
host or application policy enters Mira; no dependency or package version changes.

Frozen `416e81a835b9aae19ef325bbc80797c9f0da3a36`, receipt
`mira-input-full-d7b5f803-668c-4038-8820-931a441deef6`, passes:

- Five exact and 31 affected writer/session cases; all 504 package cases.
- Complete audit with zero findings, formatter, strict Svelte/TypeScript,
  lint, sixteen validation-runner cases and every package build.
- Public boundaries, all forty release tests and all six npm packages installed
  together through Svelte, React, Vanilla, CSS and leak fixtures.
- All 170 cold Storybook interaction/accessibility cases (36/47/34/53), catalog
  checks, static Storybook and all sixty cold Chromium browser cases.
- Complete specification checks. The final evidence/status-only snapshot is
  qualified separately; runtime and test source stay unchanged.

The unchanged packed-production policy retains its previously accepted low
KaTeX advisory, GHSA-238p-pmpm-9mq7, separately from the zero-finding workspace
audit. No vulnerability is hidden or newly accepted by this source slice.

The first full controller attempt refused a fifth global Docker worker before
creating a container or executing checks. Its infrastructure receipt is retained;
the same frozen input passes once a slot becomes free. Validation uses isolated
Docker snapshots and leaves the current desktop session untouched.

The qualified core public archive SHA256 is
`e79ba9cd1fbdc3e1e078dbea6c1dac9e49a11e045dcd58fa329401cff2fa8d82`.
A candidate packed after source/public checks is byte-identical to the final
archive. Exact six-package paths/checksums remain in ignored
`.local/qualified-archives.json`. These are documented temporary consumer
validation inputs; publishing and host/editor adoption remain separate gates.

Final documentary snapshot `9ee9620b76de1c7dbd53a7ef03693c14881741de`, receipt
`mira-input-docs-6d968de1-9249-4b62-ab3d-255c7bc29f5e`, passes complete
formatting and all four canonical specification lanes. The final receipt-only
addition is formatted before committing; product/test bytes match `416e81a8`.
