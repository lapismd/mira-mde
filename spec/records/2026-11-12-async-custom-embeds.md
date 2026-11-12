# Asynchronous custom embed qualification

Notebook's existing portable embed adapter needs to await plugin activation
before selecting a custom renderer. Mira previously treated a returned Promise
as an already handled embed and never selected ordinary fallback. The cold
`Markdown/Embeds/Async renderer` story reproduced one failure at missing fallback.

`MiraFileAdapter.renderEmbed` now optionally resolves a Promise of its existing
result. Its optional third context carries an AbortSignal. A private lease owns
one render decision, aborts retired work and releases both mounted cleanup and
cleanup returned after retirement. Portable Markdown retains its existing
recursion, fragment, synchronous-renderer and ordinary fallback contracts.

## Source evidence

Receipts are under `.local/validation/` on the isolated
`mira-notebook-activation` workspace; all execution uses Docker context `omarchy`.

- Original async-renderer target: one failure (`async-renderer-before.log`).
- Final exact target: one pass (`async-renderer-lifetime-after.log`).
- Four private lease cases cover sync compatibility, async fallback, abort/late
  cleanup and rejected rendering. The story separately proves cancelled
  activation, one active mount, ordinary fallback and mounted-content cleanup.
- Complete check/lint/test/build: 531 tests, including 472 Mira cases, pass
  (`async-renderer-check-all.log`, run `mira-validation-1102d117-af3e-4373-85b5-c54422fa65df`).
- All 14 embed-family interactions and all 181 cold catalog interaction/axe
  cases pass (`async-renderer-family.log`, `async-renderer-storybook-full.log`).
- All 61 cold Playwright journeys pass (`async-renderer-browser-full.log`, run
  `mira-validation-6c6b1973-9a91-4caa-b9a5-91b513f985a3`).
- Static catalog builds (`async-renderer-static.log`).
- Six public package tarballs install together and pass Svelte/React/Vanilla,
  stylesheet, declaration and leak checks (`async-renderer-pack.log`). A public
  declaration fixture accepts the async renderer and signal and rejects an
  invalid async result.

The first repaired story used one changing Markdown document for three embeds;
its cancellation total included legitimate retirement of other nodes. The
fixture now gives each embed its own preview, retains the exact one-cancellation
and one-mount assertions, and additionally requires active cleanup. Both attempt
logs are retained. No assertion, timeout or visual baseline was loosened.

## Existing audit boundary

The configured source audit passes with its existing one low ignored Mermaid
11/layout-ELK KaTeX path. Packed Base Mira has zero findings; the six-package
audit retains the explicit existing GHSA-238p-pmpm-9mq7 exception documented in
the original known-KaTeX acceptance record. No exception changed. The pack lane
also retains its existing raw third-party compiler-diagnostic reporting.

## Release boundary

The pre-push Dependabot query on November 12 returned no open PRs. This source
slice carries a minor Changeset; exact-head hosted CI, merged-source release
qualification, publication/provenance and Markdown/Notebook/Server/Desktop
registry intake remain separate gates. The new story remains visual-pending;
no production application or vault was modified.
