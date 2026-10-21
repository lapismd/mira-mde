# Approved six-package Mira publication

Date: 2026-10-21. Revision: enclosing Jujutsu change.

## Authority and unchanged contracts

The user explicitly requests: "can we publish mira please". This approves the
current Wave 3 cohort: core 0.1.0 and the five companion packages at 0.0.3.
MIRA-GOV-010 retains manual main dispatch, protected exact-source approval,
immutable artifacts, OIDC provenance and verified registry consumers.
MIRA-ARCH-006/007/016 retain the six Apache-2.0 packages, independent versions
and dependency order. No product contract or audit exception is expanded.
MIRA-CAT-006 excludes screenshot comparisons; functional gates remain required.

Source: `e8d0dc8968991dba1e8af2c8a9649c521e072ae2`, the merge of version PR #15.
Its tree is identical to qualified head
`50851948827706322c118ceb09986edd41041ec2`. Source PR #16 is already merged.
No open Dependabot proposal exists at the publication refresh.

## Completed source and artifact qualification

- Original protected version CI `39596942787` and manual `39597235670` pass.
  The earlier bot approval/merge block is resolved without a policy bypass.
- Exact-main CI `39601875848` passes specification/release intent, complete
  repository/package and six packed-consumer gates, 168 Storybook
  interaction/accessibility and 58 functional browser cases. Pages
  `39601875721` passes. No screenshot comparison runs.
- Qualification-only release `39601875729` passes artifact preparation and
  skips publication/verification/notes as designed. Workspace audit is clean.
  Packed consumers retain exactly one previously accepted low KaTeX advisory,
  GHSA-238p-pmpm-9mq7. That vulnerability remains present; no higher-severity
  finding is waived.
- Download and independently inspect artifact `12346437476`,
  `mira-release-e8d0dc8968991dba1e8af2c8a9649c521e072ae2`, with
  `python3 /tmp/inspect-mira-wave3-artifact.py ARTIFACT SOURCE`. The inspection
  checks manifest/source and SHA-512 integrity, archive paths/types, exact
  versions, public exports, portable dependency ranges and Apache licenses.
  Core includes the Simple Icons CC0 and Lucide ISC attribution notice and
  excludes executable tests. All six archives pass.
- Qualification manifest SHA-256:
  `7e34f8b880afacdbf712ac743fe660babfa1934dce827177057168b99dfe0c82`.
  Artifact ZIP digest:
  `7853673a50ec2db73bcdd826b26e751b0e3d5e99856fcdd31be7f0e59501195d`.

| Package                      | Version | Bytes/files  | Archive SHA-256                                                  |
| ---------------------------- | ------- | ------------ | ---------------------------------------------------------------- |
| @lapismd/mira                | 0.1.0   | 341379 / 770 | c1fe885b183882674d0c76dc1dc6936cd1715752ed6f25877de75a473a09e2f4 |
| @lapismd/mira-plugin-ai      | 0.0.3   | 6455 / 6     | ed453fdcb1bcca9c72635c74f0594b3f6c7b3e17babb3ba71774b8389a50f8b2 |
| @lapismd/mira-plugin-mermaid | 0.0.3   | 11533 / 35   | ae477790d47a67d62ff6eaf4e5f874fec78336f921e89772537751195151250d |
| @lapismd/mira-editor         | 0.0.3   | 174046 / 46  | 4bb15b03b33e1b9b623d2129d06af0135ea5cb4f724c6d6801c0494e0d564b1a |
| @lapismd/mira-react          | 0.0.3   | 16830 / 7    | d77b4edf319d281891e767dba420d9abb71e3b1abb483cb58865e2d53f650b74 |
| @lapismd/mira-vanilla        | 0.0.3   | 2881 / 6     | 338209d514258308e08982b1b6c2d46ce0b2bb9561b821b6877e876cf539685e |

## Protected publication

Confirm remote main still matches the qualified source. Set
`MIRA_RELEASE_APPROVED_SOURCE` to that exact commit and dispatch `release.yml`
on main with `publish=true`: run `39604766563`. `npm-production` retains
required reviewer `stevejuma` and main-only deployment.

The first strict archive comparison detects one difference: React's packed
`package.json` has equal dependency keys serialized in a different order. All
other React files, tar metadata and parsed manifest values match; the other
five archives are byte-identical. Independent inspection of all publication
archives passes. This is recorded rather than treating the first comparison as
passing. The qualification React archive was 16829 bytes with SHA-256
`581baa9770359e2721506e588ff4bbe6d86571665dddd78f1efdc35557f85bf6`.
The table records the actual immutable publication archive (16830 bytes).

Publication manifest SHA-256 is
`6287012c9c9612cf97055e7d1a75c84b1bce7162f7e698f93a72b631725f297d`.
After proving the difference and rechecking exact main/approval binding,
approve protected environment `20876795483` under the user's publication
authorization. Publication, registry verification and GitHub completion remain
pending until their actual outcomes are recorded.

Attempt 1: npm's core upload command returns success, but twelve ten-second
integrity probes exhaust the 110-second visibility window. The publisher stops
before the five dependent uploads; verifier and notes skip. Record this as a
failed attempt, not failed publication of proven bytes or a passing cohort.
Independent fresh metadata then exposes core 0.1.0 with matching SHA-512 and
attestations. Downloaded public bytes match its complete protected archive and
SHA-256 `c1fe885b183882674d0c76dc1dc6936cd1715752ed6f25877de75a473a09e2f4`.
Canonical `npm view` also returns the expected integrity before recovery.

Rerun only publisher job `119239765057` and its downstream jobs in the same
workflow. It downloads the original verified artifact, skips an existing exact
matching core and uploads only missing identities. Do not repack, replace bytes,
dispatch a new candidate or treat an uncertain upload as absent.

Attempt 2 skips matching core and uploads AI and Mermaid once. AI verification
settles, but Mermaid's visibility probes time out, again stopping publication
before the remaining packages. Independently download all three public archives
and match complete bytes and exact SHA-512; canonical `npm view` for Mermaid
also matches. Resume publisher job `119242786576` only, retaining the original
artifact and source. Editor, React and Vanilla remain pending at this point.

Attempt 3 skips the three existing versions, uploads Editor once, then times
out on Editor visibility. The four public complete archives and canonical
Editor integrity all match before resuming publisher `119245841073`. React and
Vanilla remain pending. Each recovery admits only still-missing identities;
earlier public bytes and provenance remain unchanged.

Attempt 4 skips the four existing versions, uploads React and Vanilla once,
and succeeds. All five release jobs now pass in `39604766563`, including the
clean registry install, npm signature/SLSA verification and package release
notes. No version is uploaded twice and no tag or published byte is replaced.

## Independent public and consumer verification

- `node /tmp/verify-mira-public-artifacts.mjs ARTIFACT PUBLIC` and the archive
  inspector pass on all six public tarballs. Complete bytes and SHA-512 match
  the publication artifact; each package has public attestations.
- An isolated `/tmp` consumer uses empty npm user/global configurations and
  npm 12.0.2 under Node 26.9.0. Registry installation adds 387 packages and
  audits 388. No sibling resolution, source alias or local package override is
  present. Every lock entry resolves to the public npm registry.
- TypeScript 5.9.3 passes imports of all six packages, TableReader, inline
  links, preview/editor and framework APIs. Recursive public CSS imports resolve
  across 34 files. Exact versions/integrities and all 870 installed package
  files match the protected archives.
- The first consumer containment assertion incorrectly compares macOS's real
  `/private/tmp` paths with the `/tmp` spelling. Normalize both the root and
  candidate with `realpathSync`, then rerun the exact filesystem/CSS checker:
  it passes. The already passing type check is not repeated. No package or
  consumer dependency is changed to conceal this fixture-path failure.
- `npm audit signatures --json --include-attestations` succeeds, with 57
  verified attestation entries and zero invalid/missing entries. The owning
  provenance verifier passes all six PURLs, SHA-512 subjects, repository,
  workflow and main ref. Independent decoded, cryptographically verified SLSA
  also binds each exact source Git commit and original release invocation.
- Production npm audit reports 12 low affected-package entries, all tracing to
  the single previously accepted KaTeX GHSA-238p-pmpm-9mq7 advisory; moderate,
  high and critical counts are zero. This is not a clean production audit and
  no additional advisory is accepted.

| Package                   | Release attempt | Sigstore transparency index |
| ------------------------- | --------------- | --------------------------- |
| mira 0.1.0                | 1               | 3356497171                  |
| mira-plugin-ai 0.0.3      | 2               | 3356561531                  |
| mira-plugin-mermaid 0.0.3 | 2               | 3356584523                  |
| mira-editor 0.0.3         | 3               | 3356636067                  |
| mira-react 0.0.3          | 4               | 3356692114                  |
| mira-vanilla 0.0.3        | 4               | 3356709234                  |

All six GitHub releases are public, stable and non-draft. Their package-version
tags point directly to `e8d0dc8968991dba1e8af2c8a9649c521e072ae2`; publication
times span 2026-10-21 13:29:25–13:29:40 UTC. The
[core release](https://github.com/lapismd/mira-mde/releases/tag/mira%400.1.0)
and companion releases retain the exact package changelogs.

Remove `MIRA_RELEASE_APPROVED_SOURCE` after completion and read back its absence.
Reviewer/main-only protection remains intact. Source lock SHA-256:
`ddb1a23f571b8a1d4538353638131d2fd10c7b33114203f165d3fa86e29c9c4d`.
Publication artifact `12348151934` ZIP digest:
`5b32457085c8909a9cdfa79281fc9d4a9190fb1b9438458961e4acf76918e172`.
Hosted signature artifact `12349606371` digest:
`87fd0ccd9e3773850a2df3d9c405fd235b469bc5a71c9eb7fb3e4e5748a7e4d4`.

The bounded metadata visibility window remains an operational limitation;
observed timeouts and immutable recovery are retained above. A later polling
improvement does not justify replacing this completed release's bytes.

## Milestone review

This slice publishes Mira libraries only. Actual Design Core and Desktop
dependency adoption belong to later waves. Desktop M11/M12 retain their
original installation, platform, upgrade/rollback and Deno-retirement gates;
neither source CI nor package publication completes them. Historical screenshot
evidence and prior committed records remain unchanged.
