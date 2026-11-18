# Disabled Mira development-audit proposal

This proposal is **disabled** and grants no audit exception. Mira's normal check,
CI and release workflows delegate to the same pinned shared executable, which
retains complete raw full and production `pnpm audit` reports. The two HIGH findings remain
blocking under [issue 48](https://github.com/lapismd/mira-mde/issues/48). Production
audit and every other functional, browser, packaging, publication and activation
gate remain unchanged.

The proposed scope is only HIGH `GHSA-fc5q-39xc-vjpf`, module `picomatch`, at:

| Version | Exact source development path                    |
| ------- | ------------------------------------------------ |
| 4.0.7   | `.>@changesets/cli>@changesets/config>picomatch` |
| 4.0.5   | `.>@changesets/cli>@changesets/git>picomatch`    |

The CLI is declared only as root development tooling. Its versioning job can
later hold the existing repository-scoped App write credential, so approval for
the coordinator or any other consumer cannot transfer to this source runtime.
The proposed deadline is November 19, 2026 at 00:00 UTC, or earlier when a known
fix appears. No expiry extension, extra path, version, severity or advisory is
authorized by this document.

The reviewed shared checker must validate each installed version and the 4.0.7
ceiling against the official registry. Any successor beyond that ceiling blocks
this proposal even before a patched version is recorded; this does not admit
arbitrary older versions or paths.

The raw report records no patched version (`patched_versions: <0.0.0`). It has one
advisory object with two version findings and `metadata.vulnerabilities.high=2`;
every other severity is zero. Production audit has zero findings. The adjacent
fixtures preserve the security-relevant fields without copying advisory prose.
The full raw reports remain in local qualification evidence; their SHA256 values
are recorded in the facts file.

The adoption baseline is
[`fb07d9c6b004d34949c802407d540977b42854f6`](https://github.com/lapismd/mira-mde/commit/fb07d9c6b004d34949c802407d540977b42854f6).
The private source root also declares its exact GitHub repository identity for
the shared probe's existing strict caller check; this changes no dependencies,
versions, qualified recipe or audit behavior. The facts file records actual root and
all eight workspace manifests, workspace policy, lockfile, audit entry points,
workflow checker and qualification bindings. **These hashes are review evidence,
not additional runtime checks of that entire inventory.** The actual shared
implementation is pinned to `63e64958e9b271d36feba06a162ee02b079a3206`, merged
through [Lapis CI #30](https://github.com/lapismd/lapis-ci/pull/30). Its specified
repository/dependency-source/manifest/lock, time, record and finding bindings are
enforced when an approved entry is used. The operational policy is schema2 with
`approvals: []`, so no development finding is currently admitted.

The source-owned adapter invokes the dependency-free private GitHub source tool
with pnpm build scripts disabled. It neither installs Mira's graph nor changes
its manifests/lock. Normal portable checks and CI/release share that adapter;
the original direct `pnpm audit` command remains available for raw diagnostics.
The shared checker rejects malformed/failed/muted reports, unknown or additional
findings, altered identities/severities/counts/versions/paths, any production
finding, a known fix, expiry, and changed bound graph source. Immutable shared
checker/test hashes and the final actual Mira probe are recorded separately in
the facts/qualification evidence. Whole source, workspace-manifest and adapter
review hashes are not claimed as extra runtime enforcement.

The operator decision remains outstanding. No approval from the coordinator or
another consumer transfers here. Enabling any acceptance before that exact
source decision is not part of this proposal.

The [actual disabled qualification](../../spec/records/2026-11-18-shared-development-audit.md)
records the final committed dependency source, actual raw HIGH2/production0
blocked decision, immutable shared checker/test evidence, and refreshed whole
version-recipe/no-release proof. It does not simulate operator approval.
