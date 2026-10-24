# Mira 0.1.1 release preflight

The user authorized guidance updates, dependency consolidation, source
integration and npm publication on 2026-10-24. The candidate starts at
`0a72edf8`; GitHub main is `a332ca3b`. Changesets selects only
`@lapismd/mira@0.1.1`; the five companion packages retain 0.0.3.

## Workspace inventory

After fetching `codex-https`, each registered workspace was inspected with
`jj --no-pager st` and its ancestors compared with the candidate.

| Workspace          | Head     | Disposition                                         |
| ------------------ | -------- | --------------------------------------------------- |
| default            | dded9737 | Clean empty child of candidate 0a72edf8             |
| desktop-migration  | 36d3800d | Clean; only its empty head is outside the candidate |
| inline-links       | 3060b281 | Clean; only its empty head is outside the candidate |
| npm-release        | b64ba1e6 | Clean; only its empty head is outside the candidate |
| static-registry-ci | 9cd59bf1 | Clean; only its empty head is outside the candidate |
| wave3-release      | 6ba4ea4a | Clean; only its empty head is outside the candidate |

All substantive secondary-workspace changes are included. No workspace needs
source merging or removal. The four default-workspace source changes still
need integration into GitHub main.

## Dependency disposition

The GitHub open-PR query returned no open pull requests, including Dependabot.
No consolidation PR or bot closure is needed. Recheck before each push.
The npm registry still reports core 0.1.0 and companions 0.0.3.

## Remaining release gates

Complete source, specification, audit, package, Storybook interaction/axe,
cold browser and affected-consumer qualification. Preserve the existing
immutable-artifact, exact-source and protected OIDC publication controls.
The safe-task-artwork Changeset completes the fourth source fix's release notes.
Screenshot comparisons and baseline updates remain outside this release.

## Guidance validation

Changed-file Prettier and all four `pnpm spec:check` lanes pass. The focused
leaf-link, public-index, safe-task, rich-editor and indentation unit targets
pass 38 tests in five files with two workers and zero failures.
