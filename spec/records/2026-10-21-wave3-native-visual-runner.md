# Native canonical visual runner correction

Date: 2026-10-21. Revision: enclosing Jujutsu change.

PR #16 head `2d095ba44607bb202ad28172bfc8efa9adedca48` passes the specification
and full package/repository/packed-consumer lanes in CI 39580553453. Its new
visual job fails before build or capture: Ubuntu x64 pulls approved ARM64 image
`ghcr.io/lapismd/storybook-addon-visual-delta-ci@sha256:661cb2485c34efc928a3ab2b64b867ee02908a71145f6a2d8a61d6febfb8abc4`
and tini reports `exec docker-entrypoint.sh failed: Exec format error`.

Change only that job's runner to `ubuntu-24.04-arm`. The released canonical
image, browser profile, comparison assertions and baselines remain unchanged.
MIRA-CAT-006 and MIRA-GOV-010 remain unchanged; no package/image publication or
visual baseline mutation is admitted. Exact corrected hosted qualification is
pending. Other product/platform and Desktop M11/M12 gates remain separate.

Evidence reads: `gh run view 39580553453 --repo lapismd/mira-mde --json
status,conclusion,jobs` and GitHub completed-job logs through the Actions API.
`actionlint .github/workflows/mira-spec-first.yml`, all seven focused
release-workflow checks and `pnpm spec:first` pass with zero failures. No local browser capture or
aggregate product run is required for this runner-selection change.
