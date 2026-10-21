# Optional children on preview leaf links

Desktop's exact ACP handoff context exposes a preview crash in a path-link
handler: `state.all` assumes an existing children property contains an array.
The built renderer reports `Cannot read properties of undefined (reading
'length')`. Path, wiki and embed nodes are leaves whose optional children may
be explicitly undefined after extension processing.

MIRA-MD-002/004 remain unchanged: preserve authored link labels, syntax and
host-owned navigation. Their handlers now visit children only when they are
arrays. `state.applyData` still retains declared `hChildren` and properties.
There is no consumer override, new API, navigation policy or HTML permission.

The actual MarkdownPreview mount covers all three leaf kinds using a public
remark extension that retains an explicitly empty optional children field.
An initial ordinary-leaf smoke run passed 3 cases but did not reproduce the
reported shape. The optional-field reproduction failed 3/3 before the fix and
passed 3/3 afterwards.

Commands and results (logs under ignored `.local/leaf-*`):

- `pnpm --filter @lapismd/mira exec vitest run src/preview/leaf-links.test.ts`:
  before 3 failures, after 3 passed and 0 failures.
- `pnpm --filter @lapismd/mira check`: pass, 0 errors and 0 warnings.
- `pnpm --filter @lapismd/mira test`: 74 files, 435 tests passed, 0 failures.
- `pnpm build`: all 8 tasks pass, 0 failures; the existing private Solid/Vue
  tasks report no output files. All public package builds and publint pass.
- `pnpm exec vitest run --project storybook stories/markdown/links/Links.stories.ts stories/markdown/wikilinks/Wikilinks.stories.ts stories/markdown/embeds/Embeds.stories.ts`:
  3 files, 13 stories passed, 0 failures in a fresh test process.
- Initial `pnpm spec:first` and `pnpm spec:check`: each has 1 mapped-chapter
  failure for `spec/src/packages.md`; validation, Markdown lint and book passed.
  Added the explicit unchanged public-package confirmation and reran.
- Final `pnpm spec:first`: pass, 0 failures; `pnpm spec:check`: all 4 lanes
  pass, 0 failures. Changed files pass Prettier.

Source parent: `a332ca3b`; pnpm 10.32.1, Node 26.9.0, Mira 0.1.0.
The patch is also backported onto Desktop's compatible 0.0.5 source for private
archive acceptance. Public manifest ranges, publication and distribution
qualification remain unchanged. Desktop E-AI-113 records the installed archive
revision, checksum and exact cold consumer rerun. Visual baselines, broad
provider/platform qualification and unrelated suites are outside this focused
user-requested repair. Existing milestone and release statuses are unchanged.
