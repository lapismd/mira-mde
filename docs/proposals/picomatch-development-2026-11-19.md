# Disabled Mira development-audit proposal

This proposal is **disabled** and grants no audit exception. Mira's normal check,
CI and release workflows still run raw `pnpm audit`; the two HIGH findings remain
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

Dependency/adoption source is
[`fb07d9c6b004d34949c802407d540977b42854f6`](https://github.com/lapismd/mira-mde/commit/fb07d9c6b004d34949c802407d540977b42854f6).
This proposal changes documentation only. The facts file records actual root and
all eight workspace manifests, workspace policy, lockfile, audit entry points,
workflow checker and qualification bindings. **These hashes are review evidence,
not enforced exception bindings yet.** No shared checker is pinned or claimed.

Before requesting an operator decision, the owning Lapis CI repository must
provide its reviewed shared checker extension. Mira must integrate that actual
immutable implementation into normal portable checks and CI/release, retain raw
full and production reports, and prove these recorded hashes are enforced. The
checker must reject malformed/failed/muted reports, unknown or additional
findings, altered identities/severities/counts/versions/paths, any production
finding, a known fix, expiry, and changed bound source. Captured exact cases and
negative regressions must pass with the default proposal still disabled.

Only after that integration and final immutable checker/test evidence exist may
the operator consider this exact two-path source exception. Enabling anything
now would bypass the outstanding review and is not part of this proposal.
