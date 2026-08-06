# Changesets

Every pull request that changes a public package must include a Changeset. Run
`pnpm changeset`, select only the packages whose public behavior changed, and
describe the consumer-visible result. Select an empty Changeset when the change
does not require a package release.

Mira versions its six public packages independently. The release workflow owns
version and changelog updates; do not edit published versions by hand.
