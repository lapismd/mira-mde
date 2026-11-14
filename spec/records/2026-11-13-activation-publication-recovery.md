# Activation publication verification recovery

The authorized six-package activation cohort was published by
[run 43524751692](https://github.com/lapismd/mira-mde/actions/runs/43524751692)
from product source `3e4738e0898ff586e3f93edd2c8e465774f2cbab` using reviewed
workflow source `ea06b2bec4b5c79d5e515de5f86a2b5a5bd24880`.

The first two attempts stopped after npm accepted packages but before their
registry visibility caught up. Each continuation inspected actual state and
skipped matching public integrities. Attempt three's publisher succeeded.
All six registry tarballs independently match artifact `14084209026`, whose
ZIP SHA256 is `26f82a39f47441c0154d3090f9c3c9f82331768dc2b91acc9bf596354a2a8b17`.
Sigstore cryptographic verification confirms issuer, workflow identity, tarball
subject, exact workflow source and original run, including its three attempts.
The artifact/source binding was qualified separately. None require republication.

The hosted verifier then failed with `spawnSync npm ENOBUFS`: the complete npm
signature/attestation JSON exceeds Node's default child-process pipe buffer.
The exact regression command is:

```sh
node scripts/validation.mjs run release:test scripts/verify-release.spec.mjs
```

On omarchy it records 50 passes and one ENOBUFS failure before the fix. Spooling
stdout/stderr to task-owned files retains complete 4 MiB JSON, preserves a
multi-megabyte failed-process diagnostic and fails closed on spawn errors.
The exact original command then passes all 53 cases.

An initial native invocation could not resolve this dependency-free checkout's
`semver` import and collected no functional regression. It is retained as an
operational failure; both functional before/after runs use installed remote
dependencies and identical command arguments.

MIRA-GOV-019 adds a manual verification-only recovery workflow. It checks
canonical main execution, original publisher/artifact success, exact source
ancestry, artifact identity and ZIP digest. It verifies the original tarballs
against a separate original-product checkout and current reviewed tooling.
Signature provenance must retain the original publishing workflow SHA and run.
Matching tags/releases follow verification; no npm publisher or OIDC permission
exists in recovery. The complete 64-case release-tooling family passes. An
initial workflow regression caught its missing explicit native-runtime setting
(15 pass, one fail); the corrected exact runner family passes all 16 without
changing its assertion. Full check/test/build passes 531 package tests, all
11 check and test tasks and eight builds. Canonical/package checks and all
181 cold interaction/accessibility cases and all 61 browser journeys pass.
Hosted recovery remains pending source review and exact-main CI.

The recovery guard also accepts the actual original GitHub run/job/artifact
metadata and verifies the retained original publication ZIP against its digest.
No second publication dispatch or package replay was performed.

Receipts remain under `.local/release-020-workspace-audit/`, including
`public-verification/verification.json`, `verifier-buffer-before-remote.log`,
`verifier-buffer-after-remote.log` and the original hosted failure logs.
Functional before/after runner identities are retained with those logs.

- Original buffer failure: `mira-validation-9c3c90ea-18f2-45c5-b513-c84aba2644f9`.
- Exact repaired command: `mira-validation-675c52bf-01ce-427a-8b73-f19f9ee6ebf6`.
- Complete release family: `mira-validation-81b10e32-cf8c-4dc7-bcfc-391d76400a91`.
- Corrected runner family: `mira-validation-7e93ecc6-c3de-45cf-9bea-732b5979b4d8`.
- Full check/test/build: `mira-validation-fec6b208-6a81-40e8-a973-926f69253eed`.
- Canonical check: `mira-validation-83a914c2-bb05-4e2c-94c3-4a156ff72226`.
- Package/release check: `mira-validation-ef240991-6998-4293-b77e-2e6a8026329b`.
- Complete cold catalog: `mira-validation-ace3b71f-6818-4e53-b271-83c422350053`.
- Complete browser lane: `mira-validation-8f5f2c9b-3bc9-4b19-a882-563d339ae248`.
