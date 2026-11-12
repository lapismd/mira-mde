# Controlled preview and scrolling accessibility

Canvas qualification reproduced an inactive button wrapper in the owning Mira
preview. With activateOnPreviewInteraction=false, links and task controls were
still nested inside role=button and an extra tab stop, despite activation being
disabled. The exact controlled-activation.test.ts target failed once before the
source change. It and all 17 existing portable-surface tests pass after the
writable preview branch also checks the public activation input.

Removing that wrapper exposed an overflowing Markdown preview without a
keyboard scrolling target in packaged Canvas acceptance. The source now gives
only overflowing surfaces a named region and tab stop. Root/content resize and
content changes update the state; disposal stops publication. The source unit
test covers growth, shrinking, renamed labels and disposal. The source story
checks focusability; native Playwright proves PageDown scrolling and removal of
the extra tab stop when the frame expands. Synthetic Storybook key events do
not perform native PageDown scrolling, so that assertion lives in Playwright.
The Storybook play leaves the frame unchanged for independent native acceptance.

The wider browser lane found a 0.765625px checkbox text mismatch between reading
and Live Preview. The identical target reproduced on unchanged main ba0ddf7e in
the isolated canvas-mira-baseline workspace. Measurements traced it to inline
component whitespace being counted in reading mode but ignored by the existing
Live Preview inline-flex shell. Both now use inline-flex; authored separators,
source ranges and Markdown bytes remain unchanged. The first larger spacing
attempt failed the same target and was removed. The final one-line CSS change
passes the original unchanged precision assertion.

The first wider task-state play also failed its exact question-marker colour
assertion, and the unchanged narrow target reproduced it. Its assertion ran
before the reactive checkbox paint settled. Waiting for both original exact
colours preserves the contract. The complete interaction suite subsequently
passes. New browser imports also caused zero-test Vite optimizer reloads; exact
targets were rerun without weakening configuration or assertions.

## Completed qualification

- Source check: 11 tasks pass, zero Svelte errors or warnings. Audit, formatting,
  lint and canonical specification lanes pass. The installed Deno-free validator
  is the current 0.2.0 release. Doctor passes with the existing wrapper-alias
  warning; the new discovery aliases expose search/index. QMD is disabled by
  repository configuration, and the semantic discovery command reports its rg
  fallback rather than pretending to run QMD.
- Full unit lane: 527 tests pass; Mira itself has 468 tests in 81 files. The
  focused controlled/scroll/portable target passes all 19 cases.
- Full build/publint: eight tasks pass. All six public tarballs pass combined
  Svelte, React, Vanilla, CSS, leak and math diagnostics acceptance. Base Mira's
  packed production audit is clean; the separately recorded existing Mermaid
  KaTeX cohort exception is unchanged.
- Full cold immutable Storybook interaction lane: 40 files, 180 passes, zero
  failures, run mira-validation-aa30bf1d-6bc4-448c-89e1-6be7e4c2cb89.
- Full cold native browser lane: 61 passes, zero failures, including the exact
  original indentation target and native keyboard scrolling. Static Storybook
  builds successfully. No visual baselines changed.
- Packed upstream Canvas acceptance passed all five new contrast/accessibility
  stories, then the full plugin catalog: 65 files, 305 passes, 57 existing skips,
  zero failures, run af8418c0-e2e0-44c0-a4f4-184baf052f1b. A repeat against the
  final CSS candidate is recorded in the Canvas slice. Temporary archive intake
  changes only the isolated validation container, never consumer source,
  publishable manifests, lockfiles or node_modules in the source workspace.

## Scope and release intent

Changesets selects only @lapismd/mira 0.1.4 to 0.1.5. No publication has occurred.
Canvas will consume the released registry version before its dependent PR can
merge; the packed candidate is isolated source acceptance.

Workspace inventory: default contains this candidate; mira-ci-flake-20261109 is
clean and equivalent to main ba0ddf7e; canvas-mira-baseline is a clean, empty
qualification change on that same main. No unrelated work was included or
removed. Open Dependabot PR queries returned none before push; no empty
consolidation PR was created. The inventory and dependency disposition must be
rechecked at any later release gate. Changed task and new embed stories remain
visual-pending.
