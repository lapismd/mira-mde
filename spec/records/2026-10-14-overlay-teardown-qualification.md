# Overlay teardown qualification

The Plugins Linux catalog reproduced a `derived_inert` warning in File
Properties / Left Sidebar, with the stack in Bits UI 2.18.1's deferred
dismissible-layer registration. Mira 0.0.3 pins that dependency, so the fix
belongs in Mira's portable dependency declaration.

The public dropdown regression mounts and destroys an open menu in the same
task before deferred registration settles. The cold command
`CI=true pnpm test:e2e tests/storybook/overlay-teardown.spec.ts` fails once with
the original dependency and its explicit destroyed-derived diagnostic. Bits UI
2.19.5's published npm tarball guards deferred focus work after destruction and
registers dismissible layers synchronously. Pinning that published version
changes the original regression to one pass. Repeated teardown also waits for
actual portal removal and body-pointer restoration, preserving the asynchronous
body-lock cleanup contract rather than assuming two frames complete it.

Source validation passes the cold native target (1/1), complete native browser
suite (50/50), and full Storybook interactions (157/157). `TURBO_CONCURRENCY=1
pnpm check:all` passes the workspace audit, formatting, 11 check tasks, lint,
11 test tasks (418 public-package tests), and eight builds with publint.
Specification, six catalog regressions, five package-boundary regressions,
36 release-tool tests, the static Storybook build, and all six package packs
with standalone Svelte/React/Vanilla/style imports and production audit policy
pass. New visual coverage
remains pending and no visual baseline is changed.

Changesets selects only `@lapismd/mira@0.0.4`; the five existing companion
packages already accept the core patch through their published `~0.0.3` range.
The source declaration remains portable. npm publication requires the verified
source/version candidates and the explicit production release gate.

## Temporary consumer acceptance

An isolated Jujutsu Plugins workspace, `lapis-plugins-mira-validation`, uses
the packed provider from this source through an ignored `.pnpmfile.cjs` and
`.local/mira-overlay-validation.tgz`. This is a validation-only replacement
for the existing 0.0.3 package, not a publishable version candidate. Every
published manifest retains its npm range. The unused 2.18.1 patch declaration
is removed only in this disposable validation workspace because the provider
now resolves 2.19.5. No dependency source or patch is edited.

The consumer runs in the existing immutable Linux image
`ghcr.io/lapismd/lapis-plugins-ci@sha256:527172f067f79ed79a82595a2a1cb4c229c3c6f798533f1af97aba8bdf711d50`.
Its temporary lock and dependency volumes are separate from public CI. The
fatal Svelte warning guard remains enabled. The original File Properties / Left
Sidebar case passes 1/1 with the packed provider. The full catalog must pass
before the consumer follow-up is qualified; clean
GitHub CI must subsequently resolve the released provider from npm.
