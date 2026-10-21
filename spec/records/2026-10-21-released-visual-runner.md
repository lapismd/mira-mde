# Adopt the released cold Linux visual runner correction

Date: 2026-10-21. Revision: enclosing Jujutsu change.

## Original acceptance target

PR #16 source c3cb99d2 passes package/packed consumers, 168 Storybook
interaction/accessibility cases and 58 browser cases in 39582531161. Its strict
native visual lane fails before actual comparison: released Visual Delta 0.0.8
accepts an empty cold index without building, then cannot remove private stage
files owned by container root. These are not successful zero-target captures.

The owning correction is Visual Delta 0.0.9, source
`c53f22a5cfa4de1cf74ce1639887036f1ec0d121`. It preserves capture identity,
immutable image/profile, scope and baseline policy, with cold all/affected
regressions and a real non-root ARM64 ownership proof. Only the user-approved
public correction may replace the dev-tool dependency; no unpublished alias,
sibling package or checkout override is admitted.

MIRA-CAT-006 and MIRA-GOV-010 remain unchanged. Public registry resolution,
frozen install/audit and the exact strict compare-only command are required.
The hosted full package, Storybook, browser and specification lanes qualify the
updated candidate. No local heavy browser build or baseline mutation is run.

The retained original command is `pnpm exec visual-delta test --all
--baseline-path-mode nested-import --failure-mode strict` on native Ubuntu ARM64
with the same reviewed image. A real visual mismatch remains a failed gate and
requires its own diagnosis/review; a runner repair cannot approve new baselines.

Existing Version Packages PR #15 remains the version proposal. This tooling
update adds no Mira runtime release bump. Separate Mira publication approval,
immutable package inspection and clean public-consumer gates remain pending.

## Registry and local preparation evidence

- The user approves only Visual Delta's exact 0.0.9 publication. npm upload
  39591969237 succeeds once. Initial registry visibility is delayed and hosted
  provenance verification times out; resume verification only after the exact
  public metadata and tarball resolve, without repeating upload.
- Public tarball SHA-256 matches
  `1f6c04f4743a74f9f9eccf50512944aa79a778ca1ca6d62aad74c228516b5f7a`.
  An isolated registry consumer installs 74 packages and audits clean. Verified
  Sigstore provenance binds the same SHA-512 archive, source c53f22a5, v0.0.9
  tag and owning npm workflow; transparency index 3355275666.
- `pnpm install --lockfile-only --ignore-scripts`, frozen install and full audit
  pass using pnpm 10.32.1. Only the root tool dependency and its lock identities
  change from 0.0.8 to 0.0.9; one package replaces one, audit has zero findings.
- Scoped Prettier, `pnpm spec:validate` and `pnpm catalog:check` pass. The
  specification validates six validators/11 chapters/199 requirements; lint and
  six catalog regressions pass. Full repository/build/browser/strict-comparison
  qualification is delegated to the exact updated hosted source.
- Exact-source specification-first and release-intent checks remain required
  before push. No local browser build, new baselines or Mira publication runs.
- The initial incremental spec-first check rejects two missing mapped chapters:
  root manifest/lock updates require architecture and packages confirmation in
  addition to catalog/governance evidence. Confirm unchanged MIRA-ARCH-020/008
  boundaries in those owning chapters and rerun the original exact-source gate;
  its mapping and requirements remain intact.
- The corrected spec-first gate passes two protected files/five mapped chapters.
  Initial explicit-range release intent cannot locate Git revisions from this
  separate JJ workspace. Select its existing shared store with
  `GIT_DIR="$(jj git root)"` for that read-only command; no source, mapping or
  release-intent assertion is changed. Hosted ordinary Git checkouts need no
  workspace adapter. The exact base/head range remains required before push.
