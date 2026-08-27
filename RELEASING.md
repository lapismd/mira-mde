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
   unpublished versions. Established packages then wait for approval on
   `npm-production` before publishing with trusted publishing.

Published package tags use `<package-name>@<version>`, such as
`mira-editor@0.2.0`. GitHub release notes are the exact package changelog entry.
The workflow performs a clean npm installation plus signature and SLSA
provenance verification before creating either.

## One-time manual `0.0.1` publication

npm trusted publishing can only be configured after a package exists. The first
publication is therefore manual, from the same reviewed tarballs used by the
release workflow. Perform this sequence once:

1. Make `github.com/lapismd/mira-mde` public and enable GitHub Actions to create
   pull requests.
2. Create protected GitHub environments named `npm-production` and
   `github-pages`, each with the intended required reviewers.
3. From `main`, manually run **Release public packages**. When all six packages
   are absent from npm, the workflow validates the repository, prepares the
   exact tarballs, uploads the release artifact, and stops with a manual
   first-publication notice.
4. Download the release artifact and inspect `.release/release-manifest.json`
   plus every `.release/tarballs/*.tgz`. Publish one tarball at a time, in
   manifest order, with public access and the v1 staging tag:
   `npm publish .release/tarballs/<name>.tgz --access public --tag next
--registry https://registry.npmjs.org`.
5. After every package resolves from npm with the manifest integrity, configure a
   GitHub Actions trusted publisher for every package with organization
   `lapismd`, repository `mira-mde`, workflow `release.yml`, environment
   `npm-production`, and allowed action `npm publish`.
6. Rerun **Release public packages** from `main` after trusted publishers are
   configured. The established-package path uses GitHub OIDC, verifies clean
   installs and provenance, and creates package tags plus GitHub releases.

The normal workflow detects an empty registry and reports that bootstrap is
required; it cannot silently fall back to a token path.

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
