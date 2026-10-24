# Mira 0.1.1 release preflight

The user authorized guidance updates, dependency consolidation, source
integration and npm publication on 2026-10-24, and resumed Mira publication
before the Design Core update. GitHub main is `a332ca3b`. Changesets selects only
`@lapismd/mira@0.1.1`; the five companion packages retain 0.0.3.

## Workspace inventory

After fetching `codex-https`, each registered workspace was inspected with
`jj --no-pager st` and its ancestors compared with the candidate.

| Workspace          | Head     | Disposition                                         |
| ------------------ | -------- | --------------------------------------------------- |
| default            | wltvnsym | Qualified Docker tooling and Linux release repairs  |
| desktop-migration  | 36d3800d | Clean; only its empty head is outside the candidate |
| inline-links       | 3060b281 | Clean; only its empty head is outside the candidate |
| npm-release        | b64ba1e6 | Clean; only its empty head is outside the candidate |
| static-registry-ci | 9cd59bf1 | Clean; only its empty head is outside the candidate |
| wave3-release      | 6ba4ea4a | Clean; only its empty head is outside the candidate |

All substantive secondary-workspace changes are included. No workspace needs
source merging or removal. Current source and tooling changes still need
integration through the existing release pull request.

## Dependency disposition

The refreshed GitHub Dependabot query returns no open bot requests. Source PR
#18 and dependency-only PR #19 remain open. The dependency update resolves six
workspace audit findings without changing public package dependency ranges.
Keep #19 separate and verify/merge it into the source release branch before
finalizing #18. No bot closure or empty consolidation PR is needed.
The npm registry still reports core 0.1.0 and companions 0.0.3.

## Qualification and release gates

Local Docker qualification passes audit, formatting, diagnostics, lint,
499 package tests, 14 runner regressions, package builds, specification and
six-package packed consumers, 170 Storybook interaction/accessibility cases,
and 60 cold browser cases. The exact fold case also passes on macOS.
Checksum-verified Jujutsu installation into hosted-runner temporary paths was
smoke-tested in Linux; hosted CI must qualify the reordered candidate.

Source integration, hosted CI, versioning, immutable artifact preparation,
protected publication and registry verification remain required. Preserve the
immutable-artifact, exact-source and protected OIDC publication controls.
The safe-task-artwork Changeset completes the fourth source fix's release notes.
The cold-browser Changeset adds current block ranges and font-independent fold
alignment. Temporary Design Core source-archive acceptance proved its strict
Mira types; replace that setup with the published 0.1.1 registry package after
publication and complete Design Core's Docker suites separately.
Screenshot comparisons and baseline updates remain outside this release.

## Guidance validation

Changed-file Prettier and all four `pnpm spec:check` lanes pass. The focused
leaf-link, public-index, safe-task, rich-editor and indentation unit targets
pass 38 tests in five files with two workers and zero failures.
