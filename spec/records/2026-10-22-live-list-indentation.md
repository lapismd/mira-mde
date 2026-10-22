# Live-preview list indentation

This slice implements MIRA-MD-007 and the existing list styling contract. The
user's top-level list after formatted prose now retains the reading-mode inset.
Rendered tasks retain that inset, and wrapped task text hangs beneath its
label. Asterisk-authored items render the same bullet and hanging alignment as
dash-authored items while inactive, while editing their marker, and after the
caret leaves again. Authored Markdown remains unchanged.

## Reproduction and implementation

Before editing, the new `matches reading indentation for top-level bullets and
checkboxes` Playwright case failed once, with all four item comparisons failing.
Live bullet text was inset 15px versus 26.484375px in reading mode; task text was
25.640625px versus 44.25px. The existing indent/measured-indent unit targets had
11 passes and did not cover this browser geometry defect.

The open `markdown-indentation--wrapped-list-items-live-preview` example also
showed its final asterisk item with a missing bullet and continuation rows at
the page edge. Inline-formatting fallback incorrectly hid the parsed `ListMark`,
reducing its measured width to zero. The new rich-editor unit regression failed
once before the fix (21 unrelated cases deselected), then passed unchanged.

The package stylesheet now assigns live unordered markers the reading-mode
`3ch` slot. Rendered tasks retain that list inset, their checkbox uses inline
flex layout, and measured hanging indentation includes the complete checkbox
prefix and surviving separator. Parsed list markers are excluded from hidden
inline formatting. Source-mode marker sizing remains unchanged.

Regression coverage compares reading/live offsets, toggles tasks, reveals and
hides task source, compares dash/asterisk row positions, and moves the caret to
and away from both bullet markers. The in-app browser was reloaded after the
fresh build: both inactive bullet items have visible bullets and aligned rows.

## Source verification

Commands run from the repository root unless a package directory is specified:

- From `packages/mira`, `pnpm exec vitest run
src/internal/codemirror/rich/index.test.ts -t 'keeps asterisk list markers'`:
  1 failed before, 1 passed after; 21 deselected.
- `pnpm --filter @lapismd/mira exec vitest run
src/internal/codemirror/rich/utils/indent.test.ts
src/internal/codemirror/rich/utils/measured-indent.test.ts`: 11 passed before
  and after.
- `pnpm exec playwright test -c playwright.storybook.config.ts
tests/storybook/indentation.spec.ts -g 'matches reading indentation for
top-level|keeps wrapped task text aligned|keeps wrapped ordered and
unordered|renders inactive dash and asterisk'`: 4 passed after the fresh build.
- `pnpm exec playwright test -c playwright.storybook.config.ts
tests/storybook/indentation.spec.ts tests/storybook/task-states.spec.ts
tests/storybook/list-callouts.spec.ts tests/storybook/bare-codemirror.spec.ts`:
  29 passed, including the existing expected blockquote-whitespace failure.
- `pnpm check`: audit clear, formatting passed, 11 check tasks passed.
- `pnpm lint`: passed.
- `pnpm spec:check`, `pnpm catalog:check`, `pnpm packages:check`: passed.
- `pnpm build-storybook`: root build (8 tasks), publint and fresh static catalog
  passed. Existing circular-chunk/size warnings remain.
- `pnpm packages:pack`: all six products installed into a clean isolated fixture;
  Svelte, React, Vanilla, CSS and private-import checks passed. The previously
  approved KaTeX packed-consumer advisory exception remains explicit.

The initial broad Storybook run had 169 passes and one Source Mode timeout.
Its exact rerun, `pnpm exec vitest run --project storybook
stories/markdown/inline-formatting/InlineFormatting.stories.ts -t 'Source Mode'`,
passed (1 case, 2 deselected). A later unrestricted package run encountered
20 timeout/timing failures while concurrent builds were running (15 Mira and
5 Mira Editor); Turbo cancelled remaining work after Mira Editor failed. No timeout or assertion
was loosened. A concurrent Storybook retry was interrupted before completing.
The complete reruns use two workers to avoid overloading the shared machine.

- `pnpm test -- --maxWorkers=2`: 496 tests passed (437 Mira, 32 Mira Editor,
  12 React, 4 Vanilla, 7 Mermaid, 4 AI); all 11 orchestration tasks passed.
- `pnpm test:storybook --maxWorkers=2`: 170 interaction/accessibility cases
  passed across 38 story files, zero failures.
- `pnpm test:e2e`: 60 cases passed, including the existing explicitly expected
  blockquote-whitespace failure; zero unexpected failures.
- After adding this record, `pnpm spec:check` and `pnpm check:format` passed.

## Required audit repair

The mandatory audit initially reported four advisories in Storybook and Vitest
mocker tooling. Core Storybook ranges now require at least 10.6.2 and resolve
10.6.3; Vitest/browser/mocker use 4.1.12. Overrides remain on the 4.x major line.
The refreshed portable registry lockfile passes audit with zero findings.
No public package dependency range or consumer lockfile is redirected locally.

## Packed consumer setup

Consumer qualification uses an isolated copy of Agent UI from `76d84918` at
`/tmp/mira-list-consumer.KROI08`, preserving active sibling checkouts. Temporary
workspace overrides select the existing Design Core chat-reference review v10
and JJ History review archives plus the newly packed Mira archive. No original
consumer loader configuration, manifest or lockfile is edited.

The Mira archive is `archives/lapismd-mira-0.1.0.tgz` within that temporary copy,
SHA-256 `21e854227d7e02c9150415f0f5f44de27ac0ed013466b278d124901201f93b7f`.
An identical archive is preserved under Mira's ignored
`.local/packages/list-indentation-2026-10-22/` directory.
The custom acceptance inserts the user's list plus wrapped asterisk/task items
into each of the three reference-composer variants and compares the production
composer, reading preview and plain Mira surface. Existing chat-reference
browser cases also run unchanged.

The initial cold development-server attempt had 4 passes and 6 failures:
three existing cases timed out while loading/using stories, and the custom
acceptance had one startup timeout plus two ambiguous editor locators caused by
table-cell editors. The custom locator now names the Message textbox explicitly.
Final acceptance uses a fresh static consumer build and the same assertions.

`pnpm build-storybook` in the isolated consumer passed both package builds,
publint, the static build and catalog audit. The seven unchanged chat-reference
browser cases all passed on that fresh build. `pnpm test:storybook
packages/agent-ui/src/chat/message-composer/ChatMessageComposer.stories.ts
--maxWorkers=2` passed all six composer stories in each light/dark and
desktop/narrow combination: 24 interaction/accessibility cases, zero failures.

The first static geometry attempt had three failures in the temporary probe:
`Range.getClientRects()` reports trailing soft-wrap separator fragments as well
as content fragments. Actual row content positions were already equal. The
probe now groups fragments by visual row and takes each row's first content
position, matching the source regression helper, while retaining the one-pixel
alignment threshold and the requirement for multiple wrapped rows.

That broader probe also exposed a separate safe-HTML reading behavior: its
native checkbox prefix is 23.9375px wide and wrapped task rows return to the
list content column. This is distinct from Mira's component-based reading
story and live task widget. This slice does not change the safe-HTML renderer
or its checkbox styling. The consumer probe therefore tests the requested
ordinary-list parity across all three surfaces and task hanging alignment in
both live surfaces; the separate reading-task mismatch remains recorded here,
not claimed fixed. The source reading/live first-row checkbox parity regression
continues to pass unchanged.

An unnecessary concurrent repeat of the seven already-passing consumer cases
hit two classic-view reference interaction failures (a virtualized off-screen
remove button and an inline-comment chip). Their exact sequential rerun passed
both cases unchanged, using `pnpm exec playwright test -c
tests/mira-list-acceptance.config.ts tests/chat-references.pw.ts -g 'Composer and
preview share references: classic-references|Complete chat retains rich actions
and usable tool toggles: chat-references-classic'`: 2 passed, zero failures.

Final `pnpm exec playwright test -c tests/mira-list-acceptance.config.ts
tests/mira-list-acceptance.pw.ts` passed all three geometry cases, zero failures.
This confirms the user's ordinary list inset across composer, reading and plain
Mira, the asterisk bullet and its wrapped rows at rest, and hanging checkbox
labels in both live surfaces. The seven existing browser cases and 24 composer
interaction/accessibility cases passed separately as recorded above.

## Delivery boundary

This is source and temporary packed-consumer validation. No npm publication,
application upgrade, push or deployment is performed. Changed stories remain
`visual-pending`; screenshot baselines are unchanged. The corrected wrapped
list example remains open on port 7007 for review.
