# Exact-source maintenance publication

The user approved only @lapismd/mira@0.1.5 after source #31 and version #32
merged. Their merges are def0f2c9332234f8c6b95f4a15d8a2e3faec328a and
7b3109536816e3f5dfb4ba043e382e8dfca4b08c. Before publication, the required
remote fetch found main at 3e4738e0898ff586e3f93edd2c8e465774f2cbab, which
already versions the later asynchronous-embed changes as Mira 0.2.0. Publishing
that default plan would exceed the approved version and package scope.

The release workflow now accepts an immutable main-ancestor source and a JSON
array of exact package versions. Historical requests require a manual main
dispatch and a nonempty unique exact version set. The source preflight runs from
the workflow revision before checking out the selected product source. A copied,
checked workflow helper validates the old source's release plan outside that
checkout. Missing, extra or different versions fail before publication.

Source validation, planning, package preparation, publication, verification,
tags and consumer notifications retain the selected source commit. The shell
supplies the actual checkout's SHA to the existing source-bound release tools;
the workflow's revision remains distinct. Protected npm-production approval,
MIRA_RELEASE_APPROVED_SOURCE, the manual publish input, OIDC-only credentials,
immutable tarball validation and registry integrity checks remain mandatory.
No main bookmark is moved and no runtime package is versioned by this change.

The initial source-helper suite failed to import its absent implementation
(one failed suite, no cases). All five cases now pass. The focused source and
workflow gate passes 17 cases; release tooling passes all 49. Two initial
workflow-check failures identified command mutations that still targeted the
old literal command; their original rejection purposes are retained and the
checker now requires source-bound commands and exact-selection guards.

Full source checks pass 11 tasks with zero Svelte errors/warnings; all 531
units and eight build tasks pass. Lint and specification lanes pass. The fresh
native lane passes all 61 cases (run 1bb4c9f4-5e6a-4976-909d-c6677d218f5b).
The complete cold interaction/axe catalog passes 40 families and 181 cases
(run f0f81be1-1c9e-4ebf-8602-7e844f158a6a). The validator is Deno-free 0.2.0;
doctor retains the known wrapper-alias warning. QMD is disabled by repository
configuration and semantic discovery reported its fallback. No visual baselines
changed and no publication occurred during qualification.

Release inventory: default held a clean empty change on the approved 0.1.5
source before starting this workflow fix. canvas-mira-baseline and
mira-ci-flake-20261109 are clean empty qualification changes on ba0ddf7e;
their baseline work is already represented in the approved source's ancestry.
The later 0.2.0 work is merged on main but excluded from the explicitly approved
0.1.5 publication. No registered workspace has unmerged product work. The open
Dependabot query returned none; no empty dependency consolidation PR is needed.
The fetch, workspace inventory and dependency query must be repeated before
the final approved publication dispatch.
