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

## Isolated stylesheet regression and final qualification

Draft PR #7's first Linux package job found one missing `katex/dist/katex.css`
import. Explicitly selecting the isolated pnpm linker locally reproduced that
exact failure once; the earlier local fixture inherited a hoisted linker even
with hoisting disabled. KaTeX 0.18.10 moves from Mira's development graph into
its runtime manifest. This supplies the public stylesheet without changing its
reviewed version or CSS.

The next packed run passed the direct Mira import but found one stale nested
registry Mira copy under a companion package. The fixture now declares its
six tarball overrides in its own `pnpm-workspace.yaml`, so sibling dependencies
and peers also use the packed source. Final `pnpm packages:pack` passes all
framework types and isolated public stylesheet imports, then fails on only the
known unique KaTeX advisory. These are fixture-only archive references; published
manifests retain portable npm specifications. Logs:
`/tmp/mira-release-isolated-css-before.log`,
`/tmp/mira-release-isolated-css-after.log`, and
`/tmp/mira-release-isolated-graph-final.log`.

The full Storybook rerun found one timing failure in
`Property actions and suggestions` (155 passed / 1 failed): an immediate menu
lookup raced asynchronous portal creation after ArrowRight. The exact isolated
target passed unchanged, confirming intermittent timing, then passed again
after switching the two menu lookups to `findByRole`. Visibility, keyboard,
type state, geometry, hit testing, and mutation assertions remain intact.
The full serial Storybook rerun passes all 156 tests in 35 files. Logs:
`/tmp/mira-release-frontmatter-before.log`,
`/tmp/mira-release-frontmatter-after.log`, and
`/tmp/mira-release-storybook-portal-final.log`.

Final `pnpm check:all` passes all checks/builds and 418 unit tests; the refreshed
cold browser suite passes all 49 tests. Package/release checks pass all 30 tests.
The first final spec-first attempt reported one missing mapped Markdown chapter;
MIRA-MD-040 now records portal settlement alongside the catalog requirement.
No timeout, assertion, audit severity, or visual baseline is weakened.
