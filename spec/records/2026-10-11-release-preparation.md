# Mira release preparation

The release workspace duplicates only the embedded-checkbox and direct-editor
list fixes onto the existing Svelte audit PR. The two earlier js-yaml commits
have identical tree content to remote main and are not replayed. Conflicts keep
the Changesets 3 reader, the maintained Markdown lint runner, patched workspace
overrides, and Svelte development ranges of `^5.57.1` with the existing public
peer range unchanged.

## Packed production dependency audit

Exact command: `pnpm packages:pack`.

Before release preparation, all eight build tasks passed. The new clean packed
fixture audit failed once with one low-severity advisory, GHSA-238p-pmpm-9mq7.
Both `rehype-katex@7.0.1` and `micromark-extension-math@3.1.0` declare KaTeX
`^0.16.0`; those are still their latest upstream versions. The workspace's
reviewed KaTeX 0.18.10 override does not travel to consumers.

The packed fixture retains public import, framework, CSS, and private-import
checks and now audits its own production graph. Registry publication remains
blocked by that explicit dependency gate; no assertion, audit severity, or
dependency implementation is weakened or patched.

## Completed source and package checks

- `pnpm check:all`: passes lint, type/check/build lanes and 418 unit tests in
  71 files; workspace audit reports zero findings.
- Exact preview/CSS targets: 11 passes. Embedded-checkbox and Bare Code
  Storybook regressions each pass.
- Full Storybook interaction/accessibility lane: 156 passes in 35 files.
- Static Storybook build and catalog checks pass.
- Cold `CI=true STORYBOOK_EXTRA_PORTS='' pnpm test:e2e`: 49 passes.
- `pnpm packages:check`: 30 release tests and package boundaries pass.
- Spec-first, canonical specification, and formatting checks pass.
- The exact Changesets CLI regression failed once in the non-colocated
  Jujutsu workspace and now passes using read-only Git-store discovery and
  a controlled metadata-only six-package fixture. It remains valid after
  versioning consumes pending Changesets.
- Final `pnpm packages:pack`: all public framework type, import, CSS, and
  private-import checks pass before the production audit fails on the same
  one KaTeX advisory. The failure remains explained and blocking.

Representative logs: `/tmp/mira-release-check-all.log`,
`/tmp/mira-release-storybook.log`, `/tmp/mira-release-browser.log`,
`/tmp/mira-release-contracts-final.log`, and
`/tmp/mira-release-pack-final.log`. Remote PRs can review this preparation;
merging for publication requires the dependency blocker to be resolved or
explicitly accepted. No npm publication has occurred.
