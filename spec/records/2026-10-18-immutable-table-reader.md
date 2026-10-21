# Immutable annotated table surface

The Notes transcript review requests compact cursor-enabled cells, comments
between table rows and captured row context. The Markdown plugin enables Mira's
table features through createMiraEditorExtensions; Mira's authoring Table owns
mutable menus, drag/drop and writes. Its public API has no row-annotation slot.
TableReader adds an immutable composition using the same TableNode parser,
table primitives and safe MarkdownPreview cells. Hosts can supply source-aware
cell snippets and insert annotations after exact zero-based source rows.
Fragments retain fixed aligned columns and original row indices. The context
header can be omitted without renumbering source rows. No editing menus,
gutters, drag/drop or writes are enabled. Existing editor behavior is unchanged
(MIRA-MD-005, MIRA-ARCH-008).

`pnpm --filter @lapismd/mira exec vitest run src/tables/table-reader.test.ts
src/tables/widgets/lifecycle.test.ts` passes four cases in two files. The
complete table family passes 10 files/32 tests. `pnpm --filter @lapismd/mira
check` passes formatting and strict Svelte/TS checks with zero warnings; the
package build and publint pass. Source logs: `/tmp/lapis-ai-table-reader-*`.
Initial spec-first rejects the missing packages chapter; the additive export is
now described there. Specification validation passes six validators, 11 chapters
and 199 requirements. Consumer row-splitting, exact anchors, highlight, cursor
and context acceptance are recorded in Design Core and Notes E-AI-039.

This is the enclosing Jujutsu change kmzosutk. Original milestone and visual
approval statuses are unchanged. No publication or global installation. Broad
provider/platform/release checks remain deferred by the visible-review scope.
