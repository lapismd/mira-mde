# Docker tooling portability qualification

This private tooling follow-up leaves the published Mira 0.1.1 runtime,
package archives and public entry points unchanged.

The exact separate-Jujutsu-workspace snapshot and trailing-archive-padding
regressions initially produced two failures. Source export now discovers the
shared Git object store with `jj git root`, and worker files come from the exact
snapshot through `jj file show`. Report collection receives the complete archive
before checked extraction, preserving failures for corrupt archives and failed
transfers. The expanded runner suite passes all sixteen cases natively and in
Docker, including dirty source, history and exact worker-byte restoration.

Full Storybook initially passed 169 of 170 cases. Frontmatter's
`Property actions and suggestions` could send ArrowRight before its parent menu
finished opening and focused the intended item. The unchanged exact case passed
alone; after waiting for opening and actual focus, all four frontmatter stories
and all 170 interaction/accessibility cases pass. The final hover also awaits
its submenu. Assertions, timeouts and accessibility requirements are unchanged.

Qualification used the remote `omarchy` Docker context over `ssh-cli`, with
4 CPUs, 12 GiB memory, 2 GiB shared memory and one browser worker:

- `pnpm check:all` passed audit with zero findings, formatting, diagnostics,
  lint, sixteen runner regressions, 499 package tests and all package builds
  in `mira-validation-f970bf72-b70f-4889-92d3-03b5dcde3549`.
- `pnpm test:storybook` passed all 170 stories in four sequential cold shards
  in `mira-validation-0537c372-1421-4600-ad52-8cd7fa66cb36`.
- `pnpm storybook:check` passed the static Storybook build and all 60 functional
  browser cases in `mira-validation-c4bca50b-7f28-441a-9a4f-752162cb30e7`.
- `MIRA_VALIDATION_RUNTIME=native pnpm spec:check` passed all four lanes.

The package checks preceded the final private story readiness edit; the complete
Storybook and browser runs followed it. Reports and source identities are retained
under `.local/validation/runs/`. No visual baselines or package versions change,
and no additional publication is needed for this private follow-up.
