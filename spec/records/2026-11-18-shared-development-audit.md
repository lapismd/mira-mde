# Shared development audit, acceptance still disabled

The implementation source is
`efd6eb0f6bb3dd90d314fc82e0fdb93ccd739b3c`. Its exact private-root repository
identity satisfies the existing shared source check. The adapter uses actual
reviewed Lapis CI source `63e64958e9b271d36feba06a162ee02b079a3206`, merged through
Lapis CI #30, with build scripts disabled and no copied collector. Normal checks,
CI and release use the same audit lane. Complete raw full and production reports
are retained. The schema2 operational policy has `approvals: []`.

On a fresh exact-source clone with its own frozen install, the actual GitHub
source-distributed CLI reports `unapproved-finding`, raw full exit 1 with two HIGH
findings and production exit 0 with zero. There is one advisory object with two
finding groups: picomatch 4.0.7 through Changesets/config and 4.0.5 through
Changesets/git. No entry
is accepted, and no exception or credential is activated. The graph is clean
before and after collection; dependency-source, manifest and lock hashes match
the committed input. Earlier source lacking root repository metadata failed
closed before audit, and is not counted as this actual audit proof.

Manifest SHA256:
`b5ee695f16d307bdf936f5faa529a36bcf8e8179970c3778ecd232327fd69799`.
Lock SHA256:
`da5000188deea37ad19e01bc875ae9258bd632b402680fe4da8a5ac737523c71`.
Actual decision, full report and production report SHA256 values are respectively
`85bd03434b93e19b57fc897f016acefdeecc315fc9bcc7ee18f03119295f95ef`,
`6d872c623f48c1c42f1424a88a2550709a4fc1827bef2324f1224cafeec6c86d`,
and `b1de92466613de47f76511ba9fb528582fabd16b4ab580c43b3aff84b1b83e34`.
The complete reports remain local/CI artifacts, separate from public docs.

Eight source-adapter regressions, 95 release tests, five specification lanes,
repository formatting, ESLint and actionlint pass. Public product source and
dependency versions are unchanged from the prior complete 62-browser/six-package
acceptance in the adoption record. Full normal quality remains blocked by the
unapproved advisory; these passing checks do not waive it.

The exact new manifest also passes the actual reviewed Node version guard and
whole original `pnpm release:version` recipe in the disposable checkout with Deno
absent from its qualified command path before and after execution. All static
recipe/helper/config/workspace bindings remain exact, the real Changesets 3 guard reports
false release intent, and all nine workspace/root versions remain unchanged.
Only empty validation notes are consumed; no version, tag, publication or App
credential is created. Historical genuine nonempty qualification remains distinct
from this no-op proof; the qualified recipe and all its bound inputs are unchanged.

The proposal remains disabled until an exact independent source decision. The
shared evaluator enforces its specified repository/dependency-source/manifest/
lock and finding/time/record/registry bindings. The additional review inventory
and immutable checker/test hashes in the proposal are evidence, not claimed as
extra runtime enforcement of every source file. Its deadline is November 19, 2026
at 00:00 UTC or earlier on a known fix/successor beyond 4.0.7. No coordinator or
other consumer approval transfers to Mira.
