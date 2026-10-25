# Released overlay dependency intake

The six-package public graph and every existing entry point remain unchanged.
The core Mira manifest moves its exact Bits UI dependency from 2.19.5 to the
released 2.20.2; its ordinary registry lockfile is refreshed with pnpm 10.32.1.
This fixes the stale dependency identity identified during the shared Lapis
consumer refresh. It adds no package patch, override or copied overlay code.

Before editing, an exact manifest identity assertion failed once because core
Mira still declared 2.19.5. The identity check now passes, and the existing cold
`tests/storybook/overlay-teardown.spec.ts` regression passes one of one cases in
run `d73c1869-1c30-4afc-93eb-3b288729e9f3`.

The first full source run `b8210e25-8ade-4ce1-9171-88ac348c5cdb` passes audit,
formatting, diagnostics and lint, then reports 498 of 499 package tests passing.
The exact original frontmatter type-selection retry also fails once in
`c8472272-bd63-439a-aaa4-367c7ee45cc4`: the menu is already closed, but its
presence manager removes the transition DOM after an animation-frame callback.
The test now waits for the same existing menu-absence assertion rather than
expecting two reactive ticks to complete that asynchronous lifecycle. No product
markup, threshold or global wait helper changes. The exact rerun passes one
case in `b9c53c87-fef1-491f-bb0b-ee054603a704`, and the complete owning file
passes 17 in `91717d55-790d-44b5-a158-32ee9ee42523`. The full source rerun
`479245f6-ee2c-4d61-bfdb-2c3c108399c0` passes all 499 package cases, sixteen
runner cases, audit with zero findings, checks, lint and every package build.

The first complete Storybook run `af92df5e-0d4c-4aba-9bcc-387e6aeaa700`
passes 169 of 170 interactions. Frontmatter's final pointer-hover submenu
assertion races the parent menu's opening; the unchanged exact cold retry passes
one case in `4b51ecd2-7570-428d-8ecd-f580d87721a8`, recording the intermittent
failure rather than treating that retry as a repair. The final hover now awaits
the same parent opening state already required by the earlier keyboard step.
The exact after case passes in `b5ec58a5-40cd-46b4-9220-ca743944f777`, the
complete four-story family passes in `44399d8f-5229-4433-92b9-b78dd5128ead`,
and all 170 interactions pass in `1b22e2ce-0db3-4342-8523-01ee625c89ab`.

The validation-only Jujutsu workspace has the same candidate tree and an
independent worker lease. Its `packages:check` run
`fc69c8c5-bf45-44b1-bd61-db984507ad41` passes boundaries and all forty release
tests. `packages:pack` run `2310fd91-6fb1-4058-8bb4-5c68fc506624` installs and
validates all six public tarballs, Svelte/React/Vanilla fixtures, stylesheet
resolution and leak checks. The existing advisory-specific low-severity KaTeX
acceptance remains present and unchanged; the workspace audit has zero findings.
The cold `storybook:check` run `51b8a015-17a5-407d-8b3a-0dab47772980` passes
the catalog check, static Storybook build and all sixty functional browser cases.
These remain independent of visual-baseline review.

The first final specification run `9229f7a1-a6af-4efd-9981-709bbedd1068`
passes validation, Markdown lint and mdBook, then reports one missing mapped
editor chapter for the test readiness change. MIRA-MD-040 now records the same
animated-closure acceptance boundary; the unchanged validator is rerun below.
The corrected source passes all four specification lanes in
`db8ed238-b623-4111-9407-3b4fa28a3108`. Complete formatting passes in
`5ec24eb9-5dee-4ca5-accc-3d68c3050864`, and release intent recognizes one
public manifest change and its patch Changeset.
The final status row is explicitly Partial because the additional callback
repair still needs upstream publication. The validator rejected one unsupported
free-text status before that correction; its accepted state vocabulary is unchanged.

Retained candidate tarballs are authored from this source with a separate
ordinary frozen install, explicit native build bounded to four jobs, and normal
`pnpm pack`. Their checksums and exact build source are retained in ignored
`.local/public-archives/bits-intake-20261025/receipt-provisional.json`. These
artifacts are temporary validation inputs, not registry publication evidence.

MIRA-ARCH-043 also covers delayed callbacks after overlay destruction. Notes
consumer run `f76319a3` separately reproduces one delayed LinkPreview selection
callback failure in unpatched released Bits UI 2.20.2. The owning upstream source
repair and checksum-qualified public archive must be distinguished from this
ordinary dependency declaration. No complete runtime-repair, publication or
frozen-registry consumer claim follows from this intake alone.
