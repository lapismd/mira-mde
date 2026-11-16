# Shared registry installation readiness

The source-owned verifier previously performed one initial npm installation
after independent registry-integrity checks. That observation can race npm's
install-v1 metadata after a genuine publication. The existing bounded publisher
visibility repair remains separate: readiness must never repeat an upload.

This slice consumes Lapis CI's qualified npm12 default-peer profile at immutable
main `69a81e05ca32dc5b7024ef2cd0711860b1813926`. Normal release verification and
existing-publication recovery both prepare the shared source helper. Mira keeps
its source/artifact validation and independent registry-integrity comparison,
then creates a disposable manifest with every selected exact package version.
The shared install-v1/SHA512 check and initial installation operate on that whole
batch under one300000ms budget with29 possible ten-second delays. Each attempt
uses a fresh cache; typed exact-candidate propagation/transient failures alone
may retry. Missing setup, identity disagreement and unrelated failures block.

The npm12.0.2 default peer policy, disabled scripts and explicit lock remain.
Installed-version verification, the file-backed complete npm signature audit,
original SLSA provenance checks and owned fixture cleanup remain in their prior
order. The publisher,36 visibility probes, source approval/OIDC policy and tag
creation boundaries are unchanged. No source dependency, package version,
registry upload, version command or bound recipe input changes. The empty
maintenance note creates no new runtime release intent.

The exact new `scripts/verify-release.spec.mjs` complete-batch target failed
once before implementation and passes afterward. All six focused verifier
controls pass, including large signature stdout/stderr, spawn failures, missing
setup, unchanged identity/signature/provenance order and both workflow paths.
Shared npm12 source qualification separately exercised the actual official
tool against24 protocol controls; that does not replace Mira acceptance.

## Owning-source qualification

The Docker specification and complete release-test lanes pass (73 release
controls). The first full check stopped at one ESLint spacing diagnostic in the
new workflow-selector regex. The exact file check reproduced it; replacing two
literal spaces with the equivalent `{2}` quantifier repaired it without changing
the selected workflow boundary. The exact six verifier controls and focused
ESLint check pass afterward.

The subsequent Docker `check:all` passes formatting, check, lint, all532 package
units and all package builds. Svelte reports zero errors/warnings. The audit
gate retains one LOW under its unchanged recorded ignore, not a clean raw audit;
no manifest, lockfile or advisory policy changed. Cold browser acceptance passes
62 cases. Its red progress marker belongs to the existing explicit `test.fail`
indentation case, not a new unexpected failure; that marker and test are
unchanged. All182 Storybook interaction/accessibility cases pass in four cold
shards (36/48/35/63). Formatter and actionlint pass. No visual baseline changes.

## Original publication acceptance

The changed source verifier passes against both packages in actual publication
[43811922461](https://github.com/lapismd/mira-mde/actions/runs/43811922461),
source `f0c18ff0aef5f48e3f3cfbb8f1b786c0ec6e0db4`.
The existing recovery validator checks the successful original build/publisher,
canonical manual-main run and immutable artifact14201265764. Its ZIP digest is
`sha256:05d8fa61bdb140fa83987b46a95f241a7be02f977eae6a0e62f48f0dc361e8bc`.
Both original tarballs are independently verified against their manifest and
public registry SHA512 values: Mermaid0.0.5 is12217 bytes and Editor0.0.5
is174479 bytes.

An isolated official-integrity-checked npm12.0.2 on Node24.15.0 runs the actual
new verifier using shared source bytes from the pinned accepted commit. The
original product checkout remains separate from changed verifier tooling.
Install-v1 plus clean installation succeeds on attempt1 in14813ms; the entire
verifier completes in19400ms. Complete signature evidence records86 verified,
zero invalid and zero missing entries, and original workflow-source/run-bound
provenance passes for both selected packages. No upload, tag creation, writer
App, secret retrieval or global npm change participates. The local receipt is
`/home/steve/.cache/mira-s5-readiness/retained-receipt.json`; it is operational
evidence outside source and public documentation artifacts.

## Scope and remaining deployment

The current custom CLI3 version command and all five bound recipe inputs remain
unchanged. No historical full-source receipt is claimed to match these changed
verification workflows. Hosted PR/main qualification and a hosted exact-source
existing-publication recovery remain required before calling this deployed.

Workspace inspection found only this default workspace's intended readiness
slice unmerged. `canvas-mira-baseline`, `foundation-auth-base` and
`mira-ci-flake-20261109` are clean with no nonempty unmerged commits. The owned
`mira-s5-retained-qualification` workspace is a clean original-source validation
fixture, with no new product work. No workspace was overwritten or removed.
The open Dependabot query returned none; no empty dependency PR is created.
