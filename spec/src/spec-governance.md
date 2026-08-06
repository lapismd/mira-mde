# Specification Governance

Specification changes precede or accompany protected implementation changes.
The gate is intentionally package-aware: updating an unrelated chapter does not
satisfy a plugin or package contract change.

## Requirements

| ID           | Requirement                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MIRA-GOV-001 | `spec/src` Markdown MUST be canonical, indexed once by `SUMMARY.md`, link-valid, and buildable by mdBook.                                                                                                                                                                |
| MIRA-GOV-002 | Requirement IDs MUST be unique and each ID MUST appear in the verification matrix.                                                                                                                                                                                       |
| MIRA-GOV-003 | Protected implementation and configuration changes MUST update every mapped canonical chapter in the same logical change.                                                                                                                                                |
| MIRA-GOV-004 | The local gate MUST inspect the current Jujutsu change; pull-request CI MUST compare the exact base and head revisions.                                                                                                                                                  |
| MIRA-GOV-005 | Tests, generated output, visual results, and ordinary story assertions MUST NOT satisfy or spuriously trigger the specification-first gate.                                                                                                                              |
| MIRA-GOV-006 | Governance tooling MUST have regression tests and MUST fail closed when it cannot determine a trustworthy change set.                                                                                                                                                    |
| MIRA-GOV-007 | Generated mdBook output MUST remain untracked.                                                                                                                                                                                                                           |
| MIRA-GOV-008 | Package-boundary validation MUST reject unapproved public products, invalid dependency direction, legacy package imports, and leaked internal runtime references.                                                                                                        |
| MIRA-GOV-009 | A protected public-package change MUST include a Changeset or an explicit empty Changeset, and the Version Packages workflow MUST preserve independent package versions and per-package changelogs.                                                                      |
| MIRA-GOV-010 | Stable npm publication MUST require the protected `npm-production` environment, GitHub OIDC provenance, and a verified immutable artifact containing only exact unpublished package versions.                                                                            |
| MIRA-GOV-011 | Release automation MUST be retry-safe, publish in dependency order, reject registry/version/integrity disagreement, create package-version tags and GitHub releases, and verify clean consumer installation and provenance without automatically unpublishing a release. |

`spec:validate` also enforces a one-to-one relationship between chapters
indexed by `SUMMARY.md`, raw Markdown Storybook mirrors, and the internal-link
registry. Mirror MDX files contain composition only; they do not copy normative
prose.

## Change map

| Protected area                                                                  | Required chapter                               |
| ------------------------------------------------------------------------------- | ---------------------------------------------- |
| Mira controller, extension, CodeMirror, preview, and table source               | `editor-and-markdown.md`, `packages.md`        |
| Mira Editor and UI source                                                       | `mira-editor-and-frameworks.md`, `packages.md` |
| Framework adapters                                                              | `mira-editor-and-frameworks.md`, `packages.md` |
| Theme and shipped public CSS                                                    | `styling.md`, `packages.md`                    |
| AI plugin                                                                       | `plugins/ai.md`, `packages.md`                 |
| Mermaid plugin                                                                  | `plugins/mermaid.md`, `packages.md`            |
| Storybook infrastructure and catalog metadata                                   | `storybook-catalog.md`                         |
| Root architecture, workspace, build, package manifests, and dependency topology | `architecture.md`, `packages.md`               |
| Governance scripts, spec configuration, and CI workflows                        | `spec-governance.md`                           |

The protected governance set includes both the specification checkers and the
catalog/token checker. Changes to either cannot weaken or bypass the contract
without updating this chapter in the same logical change.

`pnpm packages:check` verifies the exact six publishable manifests, dependency
direction, stable Semantic Version metadata, private adapter identities, curated export
maps, and public source/build output. It rejects legacy package imports,
internal adapter or runtime imports, removed public symbols, and removed CSS
hooks.

`pnpm packages:pack` is the corresponding built-artifact gate. It installs the
six tarballs as consumers see them, compiles adapter-specific fixtures, resolves
CSS exports, and rejects legacy or internal imports in packed output.

Changesets owns release intent and version/changelog mutation. Pull requests
that change a public product must carry either a version-bearing Changeset or an
explicit empty Changeset. Merging ordinary changes to `main` updates a single
Version Packages pull request; merging that pull request prepares one verified
artifact containing the selected package tarballs and manifest.

Publication is a separate job guarded by the GitHub `npm-production`
environment. It receives only the verified artifact, authenticates with npm's
GitHub Actions trusted publisher through OIDC, publishes in public-graph order,
and verifies exact-version installation and provenance before creating release
metadata. The first `0.0.1` publication is a one-time exception because npm
cannot configure a trusted publisher for a package that does not yet exist: a
manually dispatched job under the distinct `npm-bootstrap` environment may use
the temporary `NPM_BOOTSTRAP_TOKEN`, after which maintainers configure trusted
publishers and remove that credential. Neither path automatically unpublishes.

The initial pipeline change carries an explicit empty Changeset so it can add
governance and packaging machinery without moving any first-release package
beyond `0.0.1`. Boundary regression tests accept later stable versions, reject
prereleases, and require every declared public graph edge to use
`workspace:~`.

Focused release tests cover registry selection, local-behind rejection,
artifact path and integrity validation, graph-ordered publication, safe reruns,
integrity disagreement, scoped npm provenance PURLs, and release-intent
classification. Post-publish verification performs a clean exact-version
install and validates npm signatures plus SLSA provenance before the release
notes command may create commit-bound package tags and GitHub releases.

Pull-request CI runs the canonical specification and release-intent gates,
repository/package validation, packed-consumer checks, a static Storybook build,
and focused browser acceptance. On `main`, the Changesets action uses the
GitHub API to maintain one Version Packages pull request without receiving npm
credentials. Only a commit with no pending Changesets advances to artifact
planning. Production and bootstrap publishing are separate jobs and protected
environments; both download the already verified artifact and neither checks
out or rebuilds package source after approval.

Rename-aware working-copy validation evaluates both the removed and added path
of a Jujutsu or Git rename. Consolidating a protected workspace therefore
requires every chapter mapped to its former subsystem and its new public
package destination; a move cannot bypass spec-first enforcement.

The catalog checker scans shipped CSS, Svelte, TypeScript, and JavaScript style
sources for public `--mira-*` references. Any internal layout-only variable
must be explicitly allowlisted and regression-tested rather than silently
omitted from the public token registry. It also cross-checks every `ui-*`
catalog family against the rendered primitive story module so exported UI
families cannot remain metadata-only. Newly exported compound families, such as
Popover, MUST be registered as public subpath surfaces and represented by a
focused story before the catalog gate passes.

## Agent workflow

1. Inspect Jujutsu status and preserve unrelated work.
2. Read the mapped chapter and requirement IDs.
3. Update requirements and verification before or with implementation.
4. Add focused unit, story interaction, browser, or visual evidence.
5. Run `pnpm spec:check` plus boundary-appropriate validation.
6. Commit the verified logical slice with a review-quality message.
