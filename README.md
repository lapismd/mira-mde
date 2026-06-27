# Mira MDE

Standalone, package-oriented Markdown editor extracted from the Lapis Notes markdown
plugin. Mira MDE is built around CodeMirror 6, Svelte 5, unified/remark/rehype,
and an extension contract that lets feature packages contribute editor,
preview, language, and UI behavior.

## Packages

- `@mira-mde/extensions` - extension contract and resolver.
- `@mira-mde/core` - framework-agnostic CodeMirror controller.
- `@mira-mde/codemirror` - base CodeMirror editing setup.
- `@mira-mde/codemirror-markdown` - markdown language and source decorations.
- `@mira-mde/codemirror-rich` - live-preview mode hooks.
- `@mira-mde/codemirror-tables` - table parsing and editor decorations.
- `@mira-mde/preview` - Svelte markdown preview renderer.
- `@mira-mde/plugin-mermaid` - Mermaid language and preview extension.
- `@mira-mde/ui` - editor UI primitives and theme CSS.
- `@mira-mde/svelte` - primary Svelte 5 editor component.
- `@mira-mde/vanilla` - plain JavaScript mounting API.

React, Vue, and Solid package folders are reserved for thin wrappers once the
core API stabilizes.

## Development

```sh
pnpm install
pnpm dev
pnpm check:all
```
