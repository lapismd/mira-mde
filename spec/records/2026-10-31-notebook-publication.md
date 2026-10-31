# Notebook dependency publication diagnostics

The Notebook source and version PRs #23/#24 are merged. All required hosted
source and version checks pass. The protected manual release run
`41168215720` builds the verified `@lapismd/mira@0.1.3` artifact from
`6affc50a19fc23fb789eef2cf444e5d25af4c023`; its checksum is independently
verified before the authorized environment approval.

Publication then stops correctly at the existing integrity guard: npm's process
returns success, but the exact version remains absent from the registry after
the bounded lookup. The command's successful output was captured and discarded,
so this evidence does not establish why npm did not publish.

The private publisher now prints npm's response and explicitly forces real
publication after all existing CI, exact-source, protected environment and OIDC
checks. No guard, timeout, integrity requirement or package version changes.
The npm configuration regression uses the real npm CLI with inherited
case-variant dry-run settings: one failure before, one pass after. All eight
publisher cases pass. Full owning-tool qualification and the next protected
attempt follow; publication is not claimed until registry verification succeeds.

The private-tool change passes `pnpm check:all` (520 package cases and complete
build), all 41 `pnpm release:test` cases, and `pnpm spec:check`. Quality report:
`mira-validation-6fcd3b62-5a59-404a-9c7f-735f80adfdab`. Component source, public
exports and the 0.1.3 package metadata are unchanged; no additional package
version or visual baseline is introduced. Hosted CI still gates the repair.
