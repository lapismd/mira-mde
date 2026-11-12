# Maintenance publication provenance

The approved release remains only `@lapismd/mira@0.1.5`, from
`7b3109536816e3f5dfb4ba043e382e8dfca4b08c`. The first protected publication
attempt, Actions run 43302760348, failed with npm E422: the package checkout's
SHA had replaced the workflow SHA, so the provenance digest disagreed with
GitHub's OIDC certificate. npm still reports this version missing. No package
was published, and no version or runtime source changes are needed.

The corrected jobs retain GitHub's actual workflow identity. They check out
the selected product source at the root and reviewed workflow tooling in
`.release/tooling`. Explicit `MIRA_RELEASE_SOURCE` and
`MIRA_RELEASE_SOURCE_ROOT` bind manifest approval, package versions, integrity,
verification and tags to that product source. Publisher credentials and
`GITHUB_SHA` retain their original workflow values. Immutable-source,
exact-version, protected-environment and tarball-integrity gates remain active.

The three focused identity regressions failed before implementation and now
pass. All 53 release-tool tests pass, including workflow rejection cases that
prohibit publisher SHA overrides. Specification and lint pass; full source
checks pass 11 tasks, all 531 units and eight builds. The fresh native lane
passes 61 cases (5280ebd1-b97c-47a5-8d4e-fe6870a60064). The cold interaction
and accessibility catalog passes 40 families / 181 cases / zero failures
(da0f5c82-adec-41e8-9289-84f9194cdd01). No visual baseline changed.

The downloaded artifact was validated using the approved source manifests and
the new tooling while retaining the separate workflow SHA. It contains only
Mira 0.1.5 and retains the previously qualified SHA-512 integrity:
`sha512-6978z+8ba8gf7UAYoXp7/n+/ed7On8JmuxkmHpPAsEdN3VEm/zce1oNiMwLzWsUWtWWU41sh/IOqw2M5XNZZHQ==`.
Publication will retry through a new protected workflow after this correction
merges; this qualification does not claim successful publication.

Release remote was fetched. The default workspace contains this tooling fix;
canvas-mira-baseline and mira-ci-flake-20261109 are clean empty qualification
changes on ba0ddf7e, already ancestors of the approved product source. Later
0.2.0 product work is merged but explicitly outside the approved 0.1.5 scope.
No workspace has additional unmerged product work. The pre-push Dependabot
query returned no open updates, so no dependency consolidation PR is needed.
