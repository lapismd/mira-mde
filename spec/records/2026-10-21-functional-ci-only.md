# User-directed functional CI qualification

Date: 2026-10-21. Revision: enclosing Jujutsu change.

The user instructs: "skip visual tests, we don't do them, ensure ci doesn't run
them either". This supersedes Wave 3's proposed screenshot-comparison gate.
Update MIRA-CAT-006 before removing the workflow job; MIRA-GOV-003/010 retain
canonical evidence, protected publication and exact-source approval.

Cancel run 39593979169 while its only remaining running job is screenshot
comparison. Its package/repository, six packed consumers, specification/release
intent, 168 Storybook interactions/accessibility and 58 browser cases have
already passed. Cancellation is requested; comparison is never counted as
passed. No image
baseline, threshold or capture artifact is changed.

Remove `visual-compare` from Mira CI. Keep catalog/static Storybook,
interaction/accessibility, functional browser, package/audit and release gates.
Scan all workflow files, including additional future workflows, for visual CLI,
baseline-update and screenshot-update invocations; required workflow validation
must reject reintroduction. Explicit manual tooling and historical screenshot
evidence remain available without being CI/release prerequisites.

## Focused regression

The initial `node --test --test-name-pattern='rejects screenshot comparison'
scripts/check-release-workflow.spec.mjs` fails one case because the existing
validator permits screenshot commands. The regression covers ordinary CI,
release, Pages and additional workflow sources. Separate regressions retain
static build, interaction/accessibility and functional browser commands.

Run the exact workflow regressions, release-control family, actionlint,
specification/format and exact-source intent gates before push. Hosted CI must
show only its three retained jobs; its ordinary functional suites remain
required. Mira publication and Desktop milestones retain their own approvals.

The final exact workflow regression passes nine cases; the full release-control
family passes 40 cases. `actionlint .github/workflows/mira-spec-first.yml` and
`pnpm spec:check` pass, including all four specification lanes. A normal cancel
request is followed by force-cancel because the old visual job keeps running;
neither request changes its previously successful functional job results.
