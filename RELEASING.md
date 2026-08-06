# Releasing Mira packages

Mira publishes six stable npm packages with independent versions. Changesets
collect release intent, one Version Packages pull request updates package
versions and changelogs, and the release workflow publishes only the exact
unpublished versions in the public dependency graph.

## Authoring a release change

1. Make the public package change and update the canonical specification.
2. Run `pnpm changeset` and select only the affected public packages. Choose an
   empty Changeset when no package version should change.
3. Run `pnpm spec:check`, `pnpm packages:check`, and the affected package gates.
4. Merge the reviewed pull request. The release workflow creates or updates the
   `Version Packages` pull request.
5. Review and merge that pull request. The workflow rebuilds and packs the exact
   unpublished versions, then waits for approval on `npm-production` before
   publishing.

Published package tags use `<package-name>@<version>`, such as
`mira-editor@0.2.0`. GitHub release notes are the exact package changelog entry.
The workflow performs a clean npm installation plus signature and SLSA
provenance verification before creating either.

## One-time `0.0.1` bootstrap

npm trusted publishing can only be configured after a package exists. Perform
this sequence once:

1. Make `github.com/lapismd/mira` public and enable GitHub Actions to create pull
   requests.
2. Create protected GitHub environments named `npm-bootstrap` and
   `npm-production`, each with required reviewers.
3. Create a short-lived granular npm access token that can publish the six
   `@lapismd` packages. Store it only as `NPM_BOOTSTRAP_TOKEN` on the
   `npm-bootstrap` environment.
4. From `main`, manually run **Release public packages** with `bootstrap` set to
   `true`, approve `npm-bootstrap`, and wait for all six `0.0.1` packages plus
   provenance verification to complete.
5. On npm, configure a GitHub Actions trusted publisher for every package with
   organization `lapismd`, repository `mira`, workflow `release.yml`, and
   environment `npm-production`.
6. Delete the `NPM_BOOTSTRAP_TOKEN` secret and revoke the temporary npm token.
   All later releases use GitHub OIDC and `npm-production` only.

The normal workflow detects an empty registry and reports that bootstrap is
required; it cannot silently fall back to the token path.

## Recovery and safety

- Rerun the same failed workflow. Existing versions are skipped only when npm's
  integrity is identical to the verified tarball.
- An existing version with different integrity, a local version behind npm, a
  changed commit, a prerelease, or a changed tarball fails closed.
- Do not rebuild or hand-publish after artifact preparation. Do not unpublish
  automatically. Investigate the retained release manifest and npm signature
  artifact before choosing a manual recovery.
- `pnpm release:plan` is read-only against npm and writes ignored evidence under
  `.release/`. `pnpm release:publish` refuses to run outside an explicitly
  approved CI environment.
