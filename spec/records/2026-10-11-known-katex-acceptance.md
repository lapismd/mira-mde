# Known packed KaTeX advisory acceptance

The user accepted the known KaTeX issue across subsequent releases on
2026-10-11 and requested that it stop failing builds. The former exception
expired whenever any of the six public package versions changed. This slice
removes that release-version restriction while retaining the exact advisory,
package, low severity, vulnerable range, audit-response validation, and full
JSON evidence requirements under MIRA-ARCH-039.

The accepted finding is
[GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7),
KaTeX `>=0.11.0 <0.18.2`. The vulnerable transitive graph remains present;
acceptance does not repair it. Published dependency manifests and the lockfile
remain unchanged. Workspace audits still run normally. Remove this policy when
upstream math dependencies admit a patched renderer.

## Regression evidence

`node --test scripts/packed-audit-policy.spec.mjs` reproduced the recurrence
before the policy change: the new `known KaTeX acceptance persists across
subsequent package releases` test failed with the expired-version error
(**1 failed, 5 passed**). The same exact command now passes **6 tests, 0
failures**. Tests reject other advisories at every severity, escalated or changed
KaTeX findings, malformed reports, muted findings, inconsistent counts, and
failed commands; clean reports pass without using the exception.

The packed-consumer gate continues to print the accepted advisory and retain
`.release/production-consumer-audit.json`. No global audit-ignore rule, consumer
override, dependency patch, fork, or copied dependency source is added.

## Repository and packed acceptance

- `pnpm check:all` passed the workspace audit, formatting, type checks, lint,
  package builds/publint, and **418 public-package unit tests**.
- `pnpm packages:check` passed boundary and release checks, including **36
  release-policy tests**. `pnpm spec:check` passed all four specification lanes.
- `node scripts/check-package-tarballs.mjs` passed all six tarball fixtures:
  Svelte, React, Vanilla, isolated public CSS, and dependency-leak checks. The
  complete packed production audit recorded **one low advisory**, the accepted
  KaTeX finding, and printed the version-independent acceptance.
- `pnpm build-storybook` passed. `CI=1 pnpm test:e2e` passed **49 browser tests**
  against a fresh Storybook process (**0 failures**).
