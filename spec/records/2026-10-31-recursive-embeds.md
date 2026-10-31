# Recursive embed qualification

Notebook embed teardown exposed unbounded generic Markdown recursion after its
custom renderer was withdrawn. This source fix belongs to Mira, independently
of Notebook's public embed registration and its own component lifecycle.

## Exact regression

`pnpm test:storybook -- stories/markdown/embeds/Embeds.stories.ts -t '^Recursive embeds$'`
records one failed story and seven skipped before the source fix: expected three
recursive feedback nodes, received zero. The fixture limits reads so the broken
implementation fails without freezing the browser. Report:
`.local/validation/runs/mira-validation-c56f23ff-9c5d-4b18-a89d-fec682001aef`.

The story withdraws and restores a custom renderer twice, covering direct and
indirect cycles, repeated sibling embeds, and a safe same-file heading fragment.
Each component branch carries a private context ancestry keyed by the resolved
file and fragment; no global visited set or public contract is introduced.

New stories remain `visual-pending`; existing visual baselines are unchanged.
Package publication and downstream registry intake are separate from temporary
archive acceptance in the isolated Notebook workspace.

The first full `pnpm check:all` stops at the mandatory audit with two moderate
Minimatch findings (GHSA-g3hv-75wg-m249) through ESLint and markdownlint-cli.
Report `mira-validation-924df91b-ac6d-4d5d-893d-05db9f8ff08c`. Scoped workspace
overrides select patched 11.x for those development tools and their ESLint and
TypeScript ESLint helpers. Subsequent audit runs expose two then one remaining
moderate paths before all five tool-owned paths are patched. No new advisory is
ignored. The final audit, complete lint and specification validation pass.

## Executed source qualification

| Command                                                            | Result                                                                                                           | Report suffix                          |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Exact recursion story above                                        | 1 passed, 7 skipped                                                                                              | `6b024b53-0109-4a45-aadf-219818c10918` |
| `pnpm test:storybook -- stories/markdown/embeds/Embeds.stories.ts` | 8 passed with accessibility                                                                                      | `f41d0b25-498d-4075-bfa3-0f8be52dc8d7` |
| `pnpm check:all`                                                   | Audit, routing, formatting, strict diagnostics, lint, 520 tests and builds pass                                  | `2f53a2e1-7002-40f3-b78e-d09972d8adee` |
| `pnpm test:storybook`                                              | 178 interaction/accessibility stories pass, including same-file heading and block fragments                      | `e98d1370-bcc5-469b-91d9-50209af3478c` |
| `pnpm test:e2e`                                                    | 60 cold browser acceptances pass                                                                                 | `65b7eb0a-0ba1-4bf1-b7f6-f8bdb9fc5f96` |
| `pnpm packages:check`                                              | Boundary, release metadata and release-tool regressions pass                                                     | `fb47fa51-bd6b-45cd-bbf0-e77910a5bd2a` |
| `pnpm packages:pack`                                               | Six public Svelte/React/Vanilla/CSS packages and production audit pass with the existing approved math exception | `21c8870d-c1b5-4ea0-a55f-558eca8d94c5` |
| `pnpm build-storybook`                                             | Static catalog passes                                                                                            | `76d60158-ad78-4539-b2dc-a13d06fa8087` |

Reports live under `.local/validation/runs/mira-validation-<suffix>/`.
The initial final specification lane reports 206 unmapped requirements because
a new first verification table shadows the existing canonical matrix. Moving
the new requirement into that matrix restores all 207 mappings; native
diagnostic `MIRA_VALIDATION_RUNTIME=native pnpm spec:validate` passes. The
portable specification check then passes validation and book generation but
reports one missing mapped architecture chapter for the audit override. Both
owning canonical chapters now describe that development-only intake; the full
specification check is rerun. No validator or assertion is weakened.

`spec-validator doctor` passes its health checks with the existing portable
wrapper-alias warning. QMD is explicitly disabled in this repository; semantic
discovery reports its `rg` fallback. Notebook retains its own QMD-backed index
and search acceptance. Registry manifests and lockfiles remain portable.

The final portable `pnpm spec:check` passes validation, Markdown lint, book
generation and spec-first mapping. Report
`mira-validation-d9b66f9d-91df-4c35-a9b7-6734d53fa488`.
