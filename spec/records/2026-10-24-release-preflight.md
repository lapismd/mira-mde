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

## Completed publication

Dependency PR #19, source PR #18 and Version Packages PR #20 are merged.
Hosted CI passed all three lanes on the combined source and the version PR.
The final release source is `57d6d4409eb61f5b2288ca2d8c4782b88d1b9513`.
All six workspaces were rechecked after fetching main; each secondary workspace
remains clean, with only its empty head outside the release ancestry.

[Release run 40127946289](https://github.com/lapismd/mira-mde/actions/runs/40127946289)
prepared immutable artifact `12573945022`, which contains only
`@lapismd/mira@0.1.1`. Its manifest, archive integrity and public `lineNumbers`
declaration were inspected before exact-source protected publication approval.
The first attempt published successfully but exceeded the two-minute registry
visibility window. Once npm exposed identical integrity, the failed stages were
rerun against the same retained artifact without rebuilding or republishing.
The second attempt passed publication, clean installation, npm signatures and
SLSA provenance verification, then created the
[mira@0.1.1 release](https://github.com/lapismd/mira-mde/releases/tag/mira%400.1.1).

The npm `latest` version is 0.1.1 with verified integrity
`sha512-8u53kwNYy/yYsG1pk8YRUcNo55ByVQhTq6M29H9Rku54SLU9bC0EXzUiYPEttUIZTXv151bvScoRnMZywyZkYA==`.
Companion versions remain 0.0.3. Design Core's registry integration and Docker
qualification continue in its owning repository; no Design Core publication or
visual-baseline update was included in this release.
