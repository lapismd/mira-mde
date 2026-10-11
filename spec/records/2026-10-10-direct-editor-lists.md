# Direct CodeMirror list presentation

The Tasks inline editor composes the public API Editor with the App-registered
Markdown stack. It places the Markdown surface and live-preview classes on the
CodeMirror root. Mira's list CSS previously required those classes on an
ancestor, so decorated inactive list markers displayed raw dashes. The full
wrapped editor matched those selectors and painted bullets.

The source fix accepts both mount shapes at the same selector specificity.
Marker slots, hanging indentation, indentation guides, and bullet paint share
their existing tokens. No Tasks runtime override or wrapper was added.

## Exact regressions

```sh
pnpm exec vitest run --project storybook \
  stories/markdown/indentation/Indentation.stories.ts -t 'Bare Code'

pnpm --filter @lapismd/mira exec vitest run \
  src/preview/styles/source-mode.test.ts --maxWorkers=1

pnpm exec playwright test -c playwright.storybook.config.ts \
  tests/storybook/bare-codemirror.spec.ts
```

The bullet story failed once before the source change because `::after` had
`content: none`; it now passes. An initial post-edit attempt still loaded old
compiled styles. Root `pnpm build` refreshed the package exports before
repeating the exact story.

The existing CSS unit test failed once because it matched the old selector
string. Its acceptance now matches real guide and partial-indent elements in
both wrapped and direct mount shapes, preserving the complete-guide-only width
contract. The exact unit test passes.

Caret acceptance uses native Playwright pointer and keyboard input. Storybook's
synthetic keyboard driver rejected the initial key sequence, and synthetic
clicks did not move CodeMirror's caret. A native attempt during simultaneous
cold builds timed out before the editor mounted; another used platform-specific
document navigation and landed on the following asterisk item. The final test
clicks the actual dash marker and moves into its text with arrow keys.
After caret movement, CodeMirror can split a formatting decoration into
adjacent spans. Acceptance counts the three painted `cm-meta` marker glyphs,
matching the initial story, rather than the variable number of formatting
containers.

The first broad run found two unit failures: the selector-string assertion and
an internal-link card dismissal assertion. The latter passed its unchanged
exact target when rerun with one worker. The interrupted broad Storybook run
also reported one property-action failure; its unchanged exact target passed
with one browser worker. Final full lanes use serial workers with unchanged
assertions, timeouts, and accessibility settings.

The strengthened selector test initially exposed three strict TypeScript
diagnostics for potentially absent RegExp capture groups. Mapping the known
captures into typed selector/declaration records fixes those diagnostics
without changing the assertions. A concurrent static build also hit an
`ENOENT` in Svelte Package's temporary declaration directory; package-producing
checks are serialized for the final build and browser evidence. Native caret
acceptance is run after that build to avoid HMR resetting its editor mid-test.
The fresh development server also exceeded the unchanged 30-second navigation
budget while compiling. Final native acceptance uses a fresh Vite preview of
the completed static Storybook build on port 7007, retaining the configured
browser assertions and timeouts and exercising packaged output without HMR.

## Consumer refresh

The rebuilt Mira package was packed into
`/tmp/lapis-mira-inline-bullets-review-2043/lapismd-mira-0.0.2.tgz`.
Tasks validation uses `/tmp/lapis-tasks-mira-inline-bullets-pnpmfile.cjs`, which
composes the existing host-package hook and retains the previously reviewed
KaTeX and DOMPurify resolutions. `CI=true pnpm install --lockfile=false --force`
with that hook refreshed the consumer without changing tracked dependency
declarations. Tasks and Mira Storybook were restarted for cold acceptance.

This is temporary local package acceptance. Registry publication and released
consumer refresh remain a separate release gate. Visual review remains pending;
no visual baselines were changed.

## Final validation

The complete serial unit lane passes 418 tests in 71 files across all six public
packages. The complete serial Storybook lane passes 156 stories in 35 files,
including all 11 indentation stories and enabled axe acceptance. The previously
failing selector, internal-link, and property-action targets now pass.
Mira package checks report zero Svelte errors or warnings. Lint, specification,
catalog, and package-boundary/release checks pass; the workspace audit remains
at zero advisories.

Tasks passes its exact populated-fixture regression, 201 unit tests, all 59
Storybook interaction/axe stories, spec/check/build/publint, and static build.
Its review server remains on port 7030 with the Applications inline editor
expanded and both Focus bullets visible.

The final exact native caret target passes once, and the full built-Storybook
browser lane passes all 49 cases in 57.4 seconds. The retained indented-quote
expected-failure marker remains unchanged. Full root check, lint, spec check,
build/static build, catalog, and package checks pass. All six packed packages
install together and pass Svelte, React, Vanilla, CSS, and import-leak checks.

The full unit command was `pnpm exec turbo run test --concurrency=1 --
--maxWorkers=1`. The full Storybook command used
`pnpm exec vitest run --config /tmp/mira-bullets-vitest.config.mjs --project
storybook`; that temporary configuration sets only one worker and disables
file parallelism. It preserves all discovered stories, assertions, timeouts,
and enabled accessibility checks. Built browser acceptance used
`pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port 7007
--strictPort` and the exact/full Playwright commands above.
