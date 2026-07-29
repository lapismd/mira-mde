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

### Storybook

Catalog lives at the repo root (port **7007**). Visual Delta host wiring edits
trigger a full restart via the run wrapper (manager is a one-shot esbuild
bundle). Addon: `@lapismd/storybook-addon-visual-delta`.

```sh
pnpm storybook              # http://localhost:7007; restarts on manager / visual wiring edits
pnpm storybook:restart      # kill listeners on 7007 (+ legacy 9009) and start fresh
pnpm build-storybook        # static build → storybook-static/
pnpm test:visual            # Playwright baselines against storybook-static
pnpm test:visual:update     # gated baseline create/update (VISUAL_UPDATE_APPROVED=1)
pnpm storybook:check        # build-storybook + test:visual
```

Override the port with `STORYBOOK_PORT` when needed.
