# @lapismd/mira

## 0.1.4

### Patch Changes

- [#26](https://github.com/lapismd/mira-mde/pull/26) [`c69a7cf`](https://github.com/lapismd/mira-mde/commit/c69a7cf6288fb3b189c648a1111aa2f8d90dda82) Thanks [@stevejuma](https://github.com/stevejuma)! - Bundle the unchanged math adapters and parser helpers behind the existing private
  preview boundary while retaining patched KaTeX as an explicit runtime dependency.
  Dispose delayed pipe/grid cell focus work with its owning inline editor so table
  teardown cannot focus or dispatch into a destroyed CodeMirror view.
  Preserve browser/Node behavior, development diagnostics and MIT notices without
  requiring consumers to override vulnerable transitive renderer ranges. Packed
  production audits require a clean base Mira graph. The existing cohort acceptance
  is narrowed to the unchanged Mermaid 11/layout-ELK path and does not apply to
  other consumers or base math rendering.

## 0.1.3

### Patch Changes

- [#23](https://github.com/lapismd/mira-mde/pull/23) [`7e1f2c0`](https://github.com/lapismd/mira-mde/commit/7e1f2c0747a1cbc4cffb5edb3f233ea3fa1676ef) Thanks [@stevejuma](https://github.com/stevejuma)! - Stop recursive Markdown embeds when a custom renderer is removed, preserving
  independent sibling embeds and same-file section embeds.

  Restore source and live-preview syntax highlighting for fenced code inside
  Markdown cell directives.

## 0.1.2

### Patch Changes

- [#21](https://github.com/lapismd/mira-mde/pull/21) [`377bfc8`](https://github.com/lapismd/mira-mde/commit/377bfc805eac2961fd879f03e28e80273cb8702c) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose immutable previous frontmatter records and retain focused text edits through external metadata refresh and deferred commits.

- [#21](https://github.com/lapismd/mira-mde/pull/21) [`caa2452`](https://github.com/lapismd/mira-mde/commit/caa24527be436a706ef083c63e76694a180044b7) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose an optional synchronous Markdown input lease that leaves persistence and recovery under the existing save barriers.

- [#21](https://github.com/lapismd/mira-mde/pull/21) [`9142fa4`](https://github.com/lapismd/mira-mde/commit/9142fa4ed786d63fc54a04654f3b2c5ef48bfe47) Thanks [@stevejuma](https://github.com/stevejuma)! - Retain preview source sessions when adapter admission or diagnostic callbacks observe reactive state.

- [#21](https://github.com/lapismd/mira-mde/pull/21) [`a7ab556`](https://github.com/lapismd/mira-mde/commit/a7ab556fc55e612210097a060d1b96917fbb2ed3) Thanks [@stevejuma](https://github.com/stevejuma)! - Align the portable overlay runtime with released Bits UI 2.20.2 while preserving
  the existing public editor and preview contracts.

## 0.1.1

### Patch Changes

- [#18](https://github.com/lapismd/mira-mde/pull/18) [`bbbf943`](https://github.com/lapismd/mira-mde/commit/bbbf943ce79148d07ba5cf2b06252b7401488510) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep block-toolbar actions on current document ranges after replacement and
  align live-preview collapse controls without a fixed font offset.

- [#18](https://github.com/lapismd/mira-mde/pull/18) [`89be5a6`](https://github.com/lapismd/mira-mde/commit/89be5a696f5e3d7b401b089eb0ac064ec5449492) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose the existing editor line-number option on Mira so embedded composers can disable the extension without CSS overrides.

- [#18](https://github.com/lapismd/mira-mde/pull/18) [`1f65315`](https://github.com/lapismd/mira-mde/commit/1f65315f7d77b799d4fd1e8fc564eb9f06386065) Thanks [@stevejuma](https://github.com/stevejuma)! - Align live-preview list and checkbox indentation with reading mode, keep wrapped task text aligned beneath its label, and preserve asterisk bullets during inline formatting.

- [#18](https://github.com/lapismd/mira-mde/pull/18) [`fef951d`](https://github.com/lapismd/mira-mde/commit/fef951d8f78989c174a18e188a814e1443a5c1bb) Thanks [@stevejuma](https://github.com/stevejuma)! - Render path, wiki and embed leaf nodes when an extension preserves an explicitly
  undefined optional children field, avoiding a crash in forwarded chat context.

- [#18](https://github.com/lapismd/mira-mde/pull/18) [`bce7ba8`](https://github.com/lapismd/mira-mde/commit/bce7ba8ed344824f577d5a0917ac66b9f65ec50f) Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve checked and custom task-checkbox artwork in safe Markdown previews by retaining parser-produced task metadata through sanitization.

## 0.1.0

### Minor Changes

- Expose the immutable TableReader composition with source-row annotation slots
  and preserve safe syntax highlighting in Markdown previews. Existing authoring
  table behavior and HTML safety policy remain intact.

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`5add37f`](https://github.com/lapismd/mira-mde/commit/5add37fed32dcbc24c1e99fc7e3a4bdae6870078) Thanks [@stevejuma](https://github.com/stevejuma)! - Add the opt-in bundled inline-links extension, immutable site-icon registries,
  consumer SVG/host overrides, and standalone InlineLink/LinkSiteIcon components.
  Preserve formatted Markdown and source editing across preview/editor surfaces,
  including optional extension forwarding into table widgets.

### Patch Changes

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`cc46795`](https://github.com/lapismd/mira-mde/commit/cc4679504c91cd9469b64a81cc883b5e90d173ce) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose mounted keyboard block controls before the next paint instead of waiting for a layout measurement.

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`cf2e5b7`](https://github.com/lapismd/mira-mde/commit/cf2e5b7d380add00b5481f783f05ab89cbf774c8) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose keyboard-operable block gutter controls to assistive technology while keeping decorative gutters hidden. Decode file-target URI paths once and add optional asset URL release ownership for image, embed, and link previews, including cancelled reads.

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`92d8601`](https://github.com/lapismd/mira-mde/commit/92d860136fdcffc5a76dd8a343ef55c6284ff895) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep a single external-link icon in live preview, including while a labeled link is edited. Style plain https URLs as external links, and underline them once, the same as other links.

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`3861e91`](https://github.com/lapismd/mira-mde/commit/3861e915786e00f2878aa2693437209f79e1bbef) Thanks [@stevejuma](https://github.com/stevejuma)! - Expose optional source-bound Markdown write bindings and protected recovery leases. Retain failed drafts and detached editing sessions until persistence or explicit recovery succeeds.

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`832ba35`](https://github.com/lapismd/mira-mde/commit/832ba35f6c8967446eff9a591e30ed1e8f4c7255) Thanks [@stevejuma](https://github.com/stevejuma)! - Render reference definitions and reference images clearly in live preview with
  their defined reference names, while preserving complete source editing and existing image and
  link resolution.

- [#14](https://github.com/lapismd/mira-mde/pull/14) [`307481b`](https://github.com/lapismd/mira-mde/commit/307481ba05cc4494d740e3de570ffa1724f50596) Thanks [@stevejuma](https://github.com/stevejuma)! - Retain the visible Markdown preview session across equivalent link resolutions
  and empty saves so protected external recovery updates the active editor.

## 0.0.5

### Patch Changes

- [#12](https://github.com/lapismd/mira-mde/pull/12) [`91f88d8`](https://github.com/lapismd/mira-mde/commit/91f88d8e4c2afab3b18a5a7596bec0fde872ce3a) Thanks [@stevejuma](https://github.com/stevejuma)! - Add optional source-bound Markdown editing sessions to file adapters so hosts
  can drain pending saves and protect embedded editors during external updates.
  Retain failed teardown saves for retry, preserve the original write destination,
  and exclude emitted test modules from published tarballs.

## 0.0.4

### Patch Changes

- [#10](https://github.com/lapismd/mira-mde/pull/10) [`32cd876`](https://github.com/lapismd/mira-mde/commit/32cd876b208dffd703d614bb66fc21b0b787d086) Thanks [@stevejuma](https://github.com/stevejuma)! - Update Bits UI so destroying an opening property menu cancels pending overlay
  registration and focus work without Svelte lifecycle warnings or pointer locks.

## 0.0.3

### Patch Changes

- [#3](https://github.com/lapismd/mira-mde/pull/3) [`31e2502`](https://github.com/lapismd/mira-mde/commit/31e2502e185f883390165851e146a3823c6b9274) Thanks [@stevejuma](https://github.com/stevejuma)! - Relicense the public Mira packages to Apache 2.0.

- [#7](https://github.com/lapismd/mira-mde/pull/7) [`215a690`](https://github.com/lapismd/mira-mde/commit/215a6906130dbcf06f0a649e8a76074c6e24612f) Thanks [@stevejuma](https://github.com/stevejuma)! - Render list bullets, hanging indentation, and indentation guides when a consumer
  mounts a Markdown editor directly on CodeMirror's root. Wrapped editors retain
  the same marker geometry and caret behavior.

- [#7](https://github.com/lapismd/mira-mde/pull/7) [`215a690`](https://github.com/lapismd/mira-mde/commit/215a6906130dbcf06f0a649e8a76074c6e24612f) Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve inline checkbox labels in live-preview editors embedded inside rendered
  Markdown by excluding CodeMirror cursor-buffer images from Markdown image styles.

  Refresh the repository's renderer and release-tool dependencies to patched
  versions, retaining math rendering and trust restrictions in regression coverage.

- [#7](https://github.com/lapismd/mira-mde/pull/7) [`215a690`](https://github.com/lapismd/mira-mde/commit/215a6906130dbcf06f0a649e8a76074c6e24612f) Thanks [@stevejuma](https://github.com/stevejuma)! - Declare the reviewed KaTeX stylesheet package as a runtime dependency so public
  Mira, editor, and React CSS resolves in isolated package-manager installations.

## 0.0.2

### Patch Changes

- [`dd83f89`](https://github.com/lapismd/mira-mde/commit/dd83f89e474e9ae0e4fdd8c7cdfc9825e62b4a0d) Thanks [@stevejuma](https://github.com/stevejuma)! - Refresh unfocused frontmatter text controls after an external controller update, including after prior user editing, and preserve Live Preview disclosure across CodeMirror widget remounts.

- [`9e5d84f`](https://github.com/lapismd/mira-mde/commit/9e5d84f8148cd2d0a6008b31f04d943e1c0d9477) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep ordinary parentheses visible in live preview, wrap editable table cells without overflow, and let source table rows scroll without scrollbar chrome.

- [`99fdddc`](https://github.com/lapismd/mira-mde/commit/99fdddcbe134eec42abfdfe4de951cc4a48f3aab) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep Find and Replace input and placeholder typography compact across consumer base styles with a public size token.

- [`a9ea809`](https://github.com/lapismd/mira-mde/commit/a9ea8098a843452d7c4e122ab7ed190c48c84dcd) Thanks [@stevejuma](https://github.com/stevejuma)! - Present Find and Replace with pill-shaped fields, a search glyph, inline options, borderless actions, and no panel divider.

- [`990662d`](https://github.com/lapismd/mira-mde/commit/990662d2f7fc9fbdfa1cff6ee9c643aa2f9478b0) Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve an internal-link trigger's inherited Mira theme and color mode when its hover preview portals to the owner document.

- [`bfc57f4`](https://github.com/lapismd/mira-mde/commit/bfc57f4fe8084e20644a34a7bb6c5b96719fb442) Thanks [@stevejuma](https://github.com/stevejuma)! - Avoid repeating an image embed's visible figure caption through its nested image alternative text.

- [`937ecd0`](https://github.com/lapismd/mira-mde/commit/937ecd04fe49b5c83b64df7d3dcd31257e2e57ff) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep live-preview continuation indentation stable while CodeMirror rebuilds
  line decorations after focus and selection changes.

- [`5165834`](https://github.com/lapismd/mira-mde/commit/5165834d3dd32a21f9d9703cd282511341c1ecf0) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep contextual block-toolbar portals out of document layout and remove them
  with their owning CodeMirror view.

- [`f83553a`](https://github.com/lapismd/mira-mde/commit/f83553a5fbf6f3fc9dfb6b1057ddac82b6a1b2c8) Thanks [@stevejuma](https://github.com/stevejuma)! - Align editable Markdown hover cards around a minimal padded presentation and persistence-safe outside-click dismissal.

- [`74963d2`](https://github.com/lapismd/mira-mde/commit/74963d237be51561a6d5282ec6f48e90736a1dd1) Thanks [@stevejuma](https://github.com/stevejuma)! - Preserve the active pipe-table column when Enter moves to the next row.

- [`7d2dd4b`](https://github.com/lapismd/mira-mde/commit/7d2dd4bdb2f9d78a760589f1e11450e4de5eb501) Thanks [@stevejuma](https://github.com/stevejuma)! - Keep the Find and Replace panel wrapper transparent so it does not paint a separate surface behind the editor controls.

- [`f573127`](https://github.com/lapismd/mira-mde/commit/f573127bb1d89c7da313eb897ba23ceef3b2236a) Thanks [@stevejuma](https://github.com/stevejuma)! - Allow consumers to compose Mira's complete portable authoring stack without its duplicate base CodeMirror setup.

## 0.0.1

### Patch Changes

- Initial public release.
