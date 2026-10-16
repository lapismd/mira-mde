# Named references in live preview

The enclosing JJ change is the revision for this record. The workspace is
`inline-links`; parent `e3d1870b` contains the bundled inline-links extension.

## Scope and review

MIRA-MD-053 and MIRA-CSS-044 govern definition rows and named image frames.
The definition's original spelling and case are displayed even when a usage
has different case. The renderer retains alternative text, titles, navigation
policy and authored Markdown. Source mode and code remain literal.

MIRA-ARCH-044 and MIRA-CAT-016 retain their package and catalog contracts.
There are still six public packages, no new entry points, and no consumer
dependency changes. Inline Links uses MiraEditor's standard toolbar and small
inline renderer instances for the comparison links. Changed visuals remain
pending separate approval.

The fallback formatting regex hid an opening bracket without recognizing
Lezer's LinkReference node. Parsed definitions now own their entire source
range. Inactive definitions render through the existing preview widget and
Edit source lifecycle; active definitions are protected from partial hiding.
Image references use the first parsed matching definition, including full,
collapsed and shortcut references. Document-identity caches avoid reparsing
the same immutable CodeMirror document for every image.

## Verification

Shared rich-editor widgets, helpers and shipped CSS affect multiple surfaces.
The workspace test-scope ladder therefore requires exact regressions first,
then repository checks, package tests/builds, Storybook interaction/axe,
cold browser acceptance and packed consumers.

| Command                                                                                                                                         | Result                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `pnpm --filter @lapismd/mira exec vitest run src/internal/codemirror/rich/references.test.ts` before                                            | 3 failed, 1 passed; partial source hiding and missing presentations reproduced |
| `pnpm --filter @lapismd/mira exec vitest run src/internal/codemirror/rich/references.test.ts src/internal/codemirror/rich/utils/images.test.ts` | 14 passed                                                                      |
| `pnpm --filter @lapismd/mira check`                                                                                                             | Passed; Svelte 0 errors / 0 warnings and TypeScript passed                     |
| `pnpm build`                                                                                                                                    | 8 tasks passed; existing private Solid/Vue no-output warnings retained         |

Additional gates:

| Command                                                                                                       | Result                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check:all`                                                                                              | Passed: audit, formatting, workspace checks, ESLint, 469 package tests (Mira 410, Editor 32, React 12, Vanilla 4, AI 4, Mermaid 7), and builds |
| `pnpm test:storybook stories/markdown/links/InlineLinks.stories.ts stories/markdown/images/Images.stories.ts` | 10 interaction/axe cases passed; repeated after final frame CSS and story spacing                                                              |
| `pnpm test:storybook`                                                                                         | 165 cases across 36 files passed                                                                                                               |
| `pnpm catalog:check`                                                                                          | Catalog validation and 6 policy tests passed                                                                                                   |
| `pnpm packages:check`                                                                                         | Package/release validation and 36 policy tests passed                                                                                          |
| `pnpm packages:pack`                                                                                          | All six tarballs passed Svelte, React, Vanilla, stylesheet resolution and leak checks                                                          |
| `pnpm spec:check`                                                                                             | Validation, Markdown lint, mdBook and spec-first passed                                                                                        |
| `pnpm --filter @lapismd/mira check` after final sizing CSS                                                    | Passed with 0 Svelte errors/warnings and no TypeScript errors                                                                                  |

The focused regressions cover source activation, definition spelling/case,
image alternative text, document changes/cache invalidation, normalized and
first-definition matching, multiline source ranges, code/source exclusions,
unsafe destination sanitization, and repeated image matcher calls.

Qualification found the previous image test expected a generated direct link;
it now asserts the original reference plus the parsed definition, preserving
titles and escaped destinations. An additional unsafe-destination regression
failed once: generated definition previews now explicitly use the shared safe
HTML policy. The final focused run above has zero failures.

Browser review found a viewBox-only SVG shrinking to 2px through intrinsic
button sizing. Block reference frames now give the image trigger a definite
width. Comparison links use the existing embedded surface/token bridge without
full-document padding. The replacement-icon button has a 0.75rem gap below it;
live measurement confirmed 12px. The new narrow browser case scrolls the owning
CodeMirror scroller before querying virtualized image widgets.

An initial cold browser run against the earlier static build passed 4/6 cases:
it predates the button gap and its image case queried an unmounted virtualized
widget. Neither result qualifies the final build. The first fresh-build run
also passed 4/6: the theme test sampled the comparison color before Storybook
applied the requested palette, and the new image case matched table-cell
previews as well as the owning editor. The tests now await the requested theme
and target the owning textbox/scroller, without changing timeouts or weakening
the color, source, image-size or layout assertions. A development-tab reload
during package rebuilding also timed out. Final review used a restarted server
and fresh tab; reference SVGs measured about 608 by 267px instead of 2px.

Final cold qualification:

- `pnpm build-storybook` passed twice; the final build contains all frame CSS
  and story-spacing changes.
- `pnpm exec playwright test -c .local/inline-links/playwright.config.ts
tests/storybook/inline-links.spec.ts` passed all 6 cases.
- `pnpm exec playwright test -c .local/inline-links/playwright.config.ts`
  passed all 56 Chromium cases against the final static build, using a fresh
  isolated Vite preview process on port 7017.
- `pnpm test:storybook` passed all 165 cases again with the final package CSS.
- `pnpm lint` passed after the browser-regression updates. Package policy
  validation includes 5 boundary and 36 release tests, all passing.

Review of MIRA-MD-053 and MIRA-CSS-044 is complete: source editing, named
presentation, theme tokens, keyboard controls and narrow layouts are qualified.
MIRA-ARCH-044 and MIRA-CAT-016 remain unchanged. The full check/test/build gate
passed before the last image sizing rule; the final package check, lint,
packed consumers, exact and full Storybook/browser lanes cover that rule and
the story spacing. No visual baselines were changed.

The first specification run rejected an unsupported progress label. The
existing matrix now uses the supported status vocabulary and the rerun passed.
The existing packed-consumer KaTeX low-severity acceptance
GHSA-238p-pmpm-9mq7 remains unchanged; root audit reports no known findings.

Logs are ignored under `.local/references`. Node 26.9.0 and pnpm 10.32.1 on
macOS ARM64. Final document formatting and `pnpm spec:check` also passed.
Publication, consumer adoption, additional platform qualification and
visual-baseline approval remain separate. The review server remains on port
7027; task verification did not alter the other workspace or its services.

Integration note: source change `b46e9fd1` used MIRA-MD-045 before the parallel
branches were combined. The canonical named-reference requirement is now
MIRA-MD-053; the earlier number remains assigned to native asset URL ownership.
