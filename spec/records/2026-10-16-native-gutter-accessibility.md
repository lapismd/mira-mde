# Native consumer accessibility and asset URLs

Lapis Desktop's real WebView reported one `aria-hidden-focus` violation for
keyboard-operable Mira block buttons inside CodeMirror's hidden gutter wrapper.
The owning-source regression is
`src/internal/codemirror/rich/block-controls-accessibility.test.ts` in Mira.

- Before: `pnpm --filter @lapismd/mira exec vitest run src/internal/codemirror/rich/block-controls-accessibility.test.ts` — 0 passed, 1 failed.
- After the extension-owned accessibility lease: the exact target passes 1/1.
- The test covers focusability, decorative line numbers, removal, restoration
  and reconfiguration. Block Toolbar story interactions also require exposed
  semantic controls.

MIRA-MD-043 governs this behavior. The extension exposes its interactive column,
keeps decorative columns hidden, and restores only attributes it still owns.
Styling, keymaps and Markdown transactions retain their existing contracts.

The initial gutter-only source check:all passed 426 unit cases, audit, lint and builds; the full Storybook lane passed 158 interactions and specification checking passed. The first Storybook launch preceded public builds, and a later launch reused a failed dependency scan; both imported zero tests. A cold cache after completed builds passed the exact Block Toolbar target (3/3), then the full lane.

Native attachment acceptance then found encoded filenames and missing asset-URL delegation. New URI/image/lifetime targets reproduced 3 failures with 14 passing cases. An additional compatibility target rejects decoding literal file IDs; its before run failed 1 case. The final asset target passes 18/18, including URI decoding, raw-ID compatibility, URL replacement, cancellation and teardown.

MIRA-MD-044 makes URI decoding explicit while preserving raw IDs. MIRA-MD-045 adds optional releaseAssetUrl ownership to images, embeds and link previews; adapters without that hook keep their previous behavior.

Final source qualification on Node 26.9.0 / pnpm 10.34.5:

- `pnpm check:all`: audit, formatting, Svelte/type checks, lint, 430 unit tests
  and all eight build tasks pass. The unit split is core 371, AI 4, Mermaid 7,
  Vanilla 4, React 12 and Editor 32.
- `pnpm test:storybook`: 158 interactions pass across 35 files after public
  builds, including exposed block controls and the asset preview surfaces.
- `pnpm spec:check`: all four configured lanes pass.
- `pnpm packages:check`: boundaries and release configuration pass; 36 release
  tooling tests pass.
- `CI=1 pnpm test:e2e` initially stopped before tests because port 7007 belongs
  to the independent original Mira checkout. That process was preserved.
- `pnpm exec playwright test -c .local/desktop-playwright.config.ts`: all 50
  browser cases pass against a cold source-owned server on port 7047. The
  temporary config changes only the server port and absolute test directory; it
  is removed from the checkout after the run.
- `pnpm packages:pack`: six public packages install together with Svelte,
  React, Vanilla, stylesheet resolution and source-leak checks passing. The
  production consumer audit retains the existing user-approved low KaTeX
  advisory GHSA-238p-pmpm-9mq7; no advisory exception changed in this slice.

No visual baselines were captured or updated. Packed native consumer acceptance
remains a separate desktop gate and cannot be inferred from these source lanes.
The source fix will be consumed through verified local pnpm archives during the
desktop migration. Package publication remains deferred.
