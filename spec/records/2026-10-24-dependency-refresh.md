# Release dependency refresh

The first release PR CI run, 40121661978, fails its dependency audit before the
repository and packed-consumer lanes. Local `pnpm audit --json` reproduces six
findings: DOMPurify 3.4.16 has one critical, one high and one low advisory;
Undici 7.29.1 has two moderate and one high advisory.

Refresh only the relevant transitive resolutions with major-bounded overrides:
DOMPurify 3.4.17+, Undici 7.30.1+ on 7.x and 8.12.2+ on 8.x. The jsdom graph
retains Undici 7.x. Published package dependencies and versions are unchanged;
the clean packed-consumer audit must independently qualify the runtime graph.

Lockfile-only refresh and frozen installation pass. The exact `pnpm audit`
rerun reports zero known vulnerabilities, down from six. Changed-file
formatting, all four specification lanes and all 40 release-tool tests pass.
Full source, package and browser qualification follows in the dependency PR.

The refreshed source branch is merged into this dependency branch without
rewriting its existing published commit. The combined tree matches the locally
qualified candidate: audit has zero findings, 499 package tests, 14 runner
regressions, 170 interaction/accessibility cases and 60 cold browser cases pass,
alongside specification, builds and six-package packed consumers. Hosted CI
must qualify this updated dependency head before it merges into source PR #18.

No open Dependabot PR exists to supersede. This audit-driven update is isolated
in a dependency-only PR against the release source branch, to merge before the
release source PR is finalized. No audit exception or test threshold changes.
