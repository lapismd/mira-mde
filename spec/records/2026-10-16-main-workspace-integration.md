# Main workspace integration and release intent

The enclosing JJ merge change owns this record. The default workspace at
`mira-mde` combines `b46e9fd1` (inline links and references) and `bdb5ae1b`
(native editing recovery, asset lifetimes and gutter accessibility). Both
descend from the fetched remote main `f18200b6`; their eleven pending commits
remain in the PR history. Other workspaces and running services are preserved.

## Inventory and Changesets

Seven pending Changesets cover all public changes:

| Changeset                            | Package | Intent                                                          |
| ------------------------------------ | ------- | --------------------------------------------------------------- |
| bundled-inline-links                 | mira    | Minor: bundled extension, registry and standalone components    |
| live-preview-external-links          | mira    | Patch: external-link icon and underline parity                  |
| reference-live-preview               | mira    | Patch: named reference rows, images and complete source editing |
| gutter-controls-accessibility        | mira    | Patch: accessible gutters, URI parsing and asset URL ownership  |
| expose-mounted-block-controls        | mira    | Patch: synchronous semantic gutter exposure                     |
| portable-markdown-recovery           | mira    | Patch: source-bound writes and protected recovery leases        |
| retain-internal-link-preview-editing | mira    | Patch: visible-session retention and empty saves                |

Only Mira's public implementation changed. The editor story shell does not
change the mira-editor public package. Changesets owns dependent version bumps;
this integration does not edit package versions, publish or merge remote main.
The local ignore and evidence-only commits need no additional release note.

All workspace heads were inspected. The npm-release and static-registry-ci
workspaces have empty changes on an already-landed release ancestor. Historical
prefetch/reconciled snapshots and the unlabelled conflicted release snapshot
are recovery artifacts, not additional pending product work. In particular,
`b16f0937` has the same tree as the already-landed `91f88d8e`; its earlier
dependency and release fixes must not be replayed over released versions.

## Integration review

The two branches merge without production source conflicts. Both canonical
package introductions and both verification matrices are retained in one
matrix. Parallel branches allocated MIRA-MD-043/044/045 independently. The
older native requirements retain those IDs; inline links, registry policy and
named references now use MIRA-MD-051/052/053. The two inline evidence records
retain explicit notes mapping their original source-commit identifiers.

MIRA-GOV-002, MIRA-GOV-003, MIRA-GOV-009, MIRA-ARCH-044 and MIRA-CAT-016 are
reviewed without weakening their contracts. The two prior source records
remain branch-specific evidence. The combined tree requires fresh full
checks/tests/builds, interaction/accessibility, cold browser and packed-consumer
qualification because it combines shared editor and preview lifecycle changes.

## Verification

The combined tree was qualified at `cb137a8a` before the final evidence and CI
step edits. Logs are retained locally under ignored `.local/integration/`.
These results do not replace the branch-specific records or claim that every
gate passed.

| Command or lane                                                                                                          | Result                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                                                                                         | Passed                                                                                         |
| Focused Mira regressions, seven files (`focused.log`)                                                                    | 60 passed                                                                                      |
| `pnpm check:all`                                                                                                         | Audit, formatting, workspace types/Svelte, lint, 488 package tests and all eight builds passed |
| `pnpm spec:check`                                                                                                        | All four specification lanes passed                                                            |
| `pnpm spec:first --base f18200b672622d49b9defc1d93fa36420ff7e11b --head cb137a8a2b9c32ed7b3f2dec5fe76949a16b2a6c`        | 57 protected files and seven canonical chapters passed                                         |
| `pnpm catalog:check`                                                                                                     | Catalog validation and six policy tests passed                                                 |
| `pnpm packages:check`                                                                                                    | Boundaries and five fixtures, release checks and 36 tests passed                               |
| `pnpm exec changeset status --output .local/integration/changesets.json`                                                 | Seven Changesets; Mira 0.1.0 and five dependent patch bumps to 0.0.3 planned                   |
| `pnpm release:intent -- --base f18200b672622d49b9defc1d93fa36420ff7e11b --head cb137a8a2b9c32ed7b3f2dec5fe76949a16b2a6c` | 40 public changes and seven Changesets validated                                               |
| `pnpm test:storybook`                                                                                                    | 166 passed, one failed across 37 files / 167 cases                                             |
| `pnpm build-storybook`                                                                                                   | Cancelled at the user's request; process exited 143                                            |
| Combined-tree `pnpm test:e2e` and `pnpm packages:pack`                                                                   | Not run locally; delegated to CI                                                               |

The failed Storybook case is
`stories/markdown/task-states/TaskStates.stories.ts > Embedded Live Preview`
at line 150: it exceeded the 15,000ms timeout. The run overlapped the static
build; the cause is unproven. No assertion or timeout was weakened and no rerun
was performed after the user's instruction to stop local tests/builds to reduce
memory pressure. Existing development services were preserved.

The final workflow edit adds `pnpm test:storybook` to CI, which previously ran
static browser acceptance but omitted the interaction/axe suite. Both test
steps run unless cancelled, including after an earlier failed step. This is an
explicit MIRA-GOV-014 governance review; the exact base/head, audit, release
intent and six-package contracts remain unchanged. Execution of the added step
and all final-tree qualification remain pending remote CI. Only exact-file
Markdown/YAML formatting is performed locally after this edit.

MIRA-GOV-002/003/009, MIRA-ARCH-044 and MIRA-CAT-016 remain reviewed with the
gaps above. Visual-baseline approval, additional platform qualification and
publication remain separate. The next action is to commit, push the combined
feature bookmark and open a pull request for CI qualification.
