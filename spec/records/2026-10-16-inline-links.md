# Bundled inline-link extension qualification

The enclosing JJ change owns this record. Base: `18661c45`. Implementation is
isolated in the `inline-links` workspace and preserves the prior external-link
icon/underline fixes. The public release set remains six packages.

Requirements: MIRA-MD-043, MIRA-MD-044, MIRA-ARCH-044, MIRA-CSS-043,
MIRA-CAT-016 and the existing MIRA-GOV-012 catalog boundary.

## Scope and acceptance

Inline icons are bundled, opt-in and local-only. Registry inputs are copied and
frozen; host rules, SVG overrides and disabled/fallback behavior are portable.
Preview preserves anchors and formatted children. Live preview reuses Mira's
source-selection widget, including multiline/reference links and consumer
extensions. Table previews forward extensions and own their mount teardown.
Standalone components use existing Mira CSS exports. A Mira Changeset records
the feature; no package publication or consumer adoption is performed here.
Stories inherit the existing palette and light/dark controls; there is no
dedicated Dark story or forced theme. Decorated link colors match ordinary Mira
links in both palettes and color modes.

## Local results

| Lane                   | Command                                                                                                                                                   | Current result                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Installation           | `pnpm install --frozen-lockfile`                                                                                                                          | Pass; lockfile unchanged                                          |
| Exact regression       | `pnpm --filter @lapismd/mira exec vitest run src/extensions/inline-links.test.ts src/tables/widgets/lifecycle.test.ts src/preview/renderer/utils.test.ts` | 31 passed                                                         |
| Repository gate        | `pnpm check:all`                                                                                                                                          | Pass: audit, formatting, types, lint, 458 unit tests and builds   |
| Catalog                | `pnpm catalog:check`                                                                                                                                      | 6 checker tests pass; six packages retained                       |
| Specification          | `pnpm spec:check`                                                                                                                                         | Validation, Markdown, book and spec-first pass                    |
| Package policy         | `pnpm packages:check`                                                                                                                                     | Boundary checks and 36 release-policy tests pass                  |
| Packed consumers       | `pnpm packages:pack`                                                                                                                                      | Pass: all six packages, Svelte/React/Vanilla, CSS and leak checks |
| Cold static catalog    | `pnpm build-storybook`                                                                                                                                    | Pass on fresh package output                                      |
| Exact browser          | `pnpm exec playwright test -c .local/inline-links/playwright.config.ts tests/storybook/inline-links.spec.ts`                                              | 4 passed on fresh static output                                   |
| Full browser           | `pnpm exec playwright test -c .local/inline-links/playwright.config.ts`                                                                                   | 54 passed                                                         |
| Story interactions/axe | `pnpm test:storybook` and `pnpm test:storybook --no-file-parallelism`                                                                                     | 165 passed across all 36 story files in both runs                 |
| Visual baselines       | Not run                                                                                                                                                   | Separate approval required                                        |

The isolated browser config retains the repository Chromium test configuration
and test directory. Vite preview serves the newly built static catalog on
loopback port 7017 instead of using another workspace's development server.
Command logs live under ignored `.local/inline-links`.

## Repairs encountered during qualification

- Initial component imports exposed a circular preview initialization. Lazy
  widget loading and a pure anchor transform remove that initialization path.
- The first wider run exposed eager Svelte imports in the TypeScript extension
  entry point through the AI consumer. The extension now retains ordinary HAST
  anchors and loads tooltip UI lazily; all four AI tests pass again.
- The first verification edit used two evidence tables; the shared checker reads
  one matrix. All requirement evidence now stays in the existing matrix.
- The first cold Vite browser run timed out in three cases while builds and
  development-module loading overlapped. It is not passing evidence. Final
  browser qualification uses a fresh static build with stable package output.
- Table forwarding exposed unowned table mounts. The CodeMirror owner now
  disposes both pipe and grid mounts; two focused lifecycle tests pass.
- Review exposed invalid `view-box` normalization that clipped SVG geometry.
  Case-sensitive SVG viewport attributes now retain their names. The focused
  renderer regression and real-browser viewport assertions pass.
- Keyboard acceptance found a visible destination popup without a tooltip
  role. Both inline-link tooltip surfaces now declare that role; focus, Escape
  and description cleanup have a unit regression and browser acceptance.
- One full-run table-source test inspected decorations before CodeMirror's
  budgeted parse completed (0 rows instead of 5). The exact file passed on
  rerun; its assertion now explicitly publishes the completed parse with
  `forceParsing` before checking all five rows. The unchanged MIRA-CSS-016
  contract is retained, and all five exact table-extension tests pass.
- The new source/split stories exposed a nested hashtag/link token at 4.47:1
  contrast. Nested link tokens now inherit the existing hashtag foreground;
  the default link palette is unchanged. All seven exact Storybook interaction
  and axe cases pass. The expanded exact unit surface has 53 passing tests.
- The temporary Python static server reset asset connections under concurrent
  chunk loading. A Playwright trace records `net::ERR_CONNECTION_RESET` rather
  than a component exception. The ignored harness now uses Vite preview; the
  four comprehensive-view regressions pass with unchanged assertions.
- The first static harness attempt omitted its workspace `cwd` and failed
  before browser startup. The ignored configuration now sets an explicit root.
- Full browser/interaction attempts were interrupted to diagnose the loading
  and contrast failures; their partial results are not suite qualification.

Qualification uses Node 26.9.0, pnpm 10.32.1, Svelte 5.57.2 and Playwright
1.61.1 on macOS ARM64. Wider interrupted runs are not passing evidence.

The expanded regression command is `pnpm --filter @lapismd/mira exec vitest run
src/internal/codemirror/base/index.test.ts src/tables/extension.test.ts
src/extensions/inline-links.test.ts src/tables/widgets/lifecycle.test.ts
src/preview/renderer/utils.test.ts` (53 passed). The default parallel Storybook
run passed 164 cases with one 15-second Composable timeout. The exact
comprehensive file passed all six cases and the isolated Composable passed;
the complete serial run passed all 165 without changing timeouts or assertions.
A subsequent default parallel run also passed all 165 in 45.59 seconds.
The six changed comprehensive stories retain their old comparison images but
return to `visual-pending`; prior baseline approval does not approve the new
inline icons.

Root dependency audit reports no known findings. Packed production-consumer
audit retains the existing explicit KaTeX low-severity exception
GHSA-238p-pmpm-9mq7; this change neither adds nor broadens that exception.

## Remaining boundaries

Visual approval, npm publication, external consumer adoption and additional
platform qualification remain separate. Mira-only scope does not establish a
released jj-store or Lapis integration. No existing consumer manifests or user
fixtures were changed.
