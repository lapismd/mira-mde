# Preview attachment tracking

Scope: MIRA-MD-055. Desktop native preview acceptance exposed repeated source
registration while its adapter reported admission through reactive Problems
state. The portable owner is Mira's source-creation effect, which previously
tracked reads performed by binding and legacy registration callbacks.

The exact source boundary is:

```sh
pnpm --filter @lapismd/mira exec vitest run src/preview/editable-markdown-preview/attachment-tracking.test.ts
```

Frozen `4f507ac4e75b61f285ae23779560ebb5e57ae405`, receipt
`mira-attachment-before-6c479e3b-8980-469f-999d-b4926268626f`, fails both
reactive-callback cases: each expected one attachment and observed two after
the unrelated observation changed. The explicit path, adapter and write
capability replacement case passes. Before state: two failures, one pass.

The repair captures the three explicit lifetime dependencies before invoking
attachment through public Svelte `untrack`. Existing writer construction,
input leases, persistence, flush and recovery remain unchanged. No host policy,
native protocol or application dependency enters Mira, and no public API changes.

The mounted regressions cover binding and legacy registration, deferred input
admission, visible editing, unrelated observations, captured session identity
and real source dependency changes. The cold `ReactiveAdmission` catalog case
also types and persists through the same held source session.

Exact-after snapshot `f18ae725f2fa4ab91f405c225d5b5e65cd7a9a93`, receipt
`mira-attachment-exact-bd9a6c26-3718-478c-9a05-0e98dd47b2b7`, passes all
three cases. The initial full snapshot `5115025e` additionally passes all 34
writer-family cases, package builds and the exact cold browser story. Strict
checking then catches three possibly-undefined array accesses in the new test.
The successful cardinality assertion precedes those accesses; explicit
non-null assertions repair their static type without changing test behavior.

The full worker's first connection-refused infrastructure attempt is retained
separately. No worker started during that attempt; the same frozen input
executes after bounded backoff. No host-runtime fallback is used.

Frozen `e097fc9a2344dbeb6eda4aca68727867411813e9`, receipt
`mira-attachment-full-c81bcf1d-e91e-493a-ad3d-b4626b19f4d3`, passes:

- Three exact and all 34 affected writer/session cases; all 507 package cases.
- Zero-finding workspace audit, formatting, strict Svelte/TypeScript, lint,
  sixteen validation-runner cases and all package builds.
- Public boundaries, all forty release tests and six-package positive/negative
  Svelte, React, Vanilla, CSS and package-leak acceptance.
- The exact cold admission story and all 171 cold interaction/accessibility
  cases (36/47/35/53); catalog checks and the static Storybook build.
- All sixty Chromium browser cases, with successful command exit.

The full worker then fails specification-first because the public-packages
chapter mapping was omitted. Its formatter, validator, Markdown lint and mdBook
checks already pass. The missing canonical cross-reference is added without
changing product/test bytes; documentary closure and final packing run separately.

The first documentary snapshot `0d1d00db`, receipt
`mira-attachment-docs-pack-d9d20de1-4ff2-48cd-80d4-7f19c5a78c50`, rejects
an unsupported verification status before build or packing. Its row uses the
canonical `Implemented` status after repair; qualification limits remain in
the evidence column and this record.

The packed-production policy retains its previously accepted low KaTeX advisory,
GHSA-238p-pmpm-9mq7, separately from the zero-finding workspace audit. This slice
adds no exception and does not alter that policy.

Desktop and hosted intake remain separate; this record does not claim their
native or browser acceptance. Publication and visual baseline approval remain
deferred.

Documentary/public-pack snapshot `923ccb5b7b210ac23d1c7221f7ea14fe3169e0a5`,
receipt `mira-attachment-docs-pack-c304b178-9963-4448-8110-93206c99dbd6`,
passes complete formatting, all four canonical specification lanes, all package
builds and fresh packing of the six public packages. Runtime, test and story
bytes equal the fully exercised `e097fc9a` snapshot.

The final core archive SHA256 is
`918e26bfc383e2dfc37c4ddce725412a76df1165af378acbc3ef3670042ed419`.
Its only changed members are the preview surface and its declaration map;
executable tests remain excluded from the core archive. Companion runtime
members stay unchanged; dependency-key order and archive metadata can change
repacked companion checksums without changing their public contracts.
Ignored `.local/qualified-archives.json` records all six exact paths/checksums.
These are private consumer-validation inputs, not a published release.

The final evidence/status-only patch retains identical product, test and story
bytes. Its documentary receipts are retained alongside the immutable runs.
