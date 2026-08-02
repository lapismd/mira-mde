# Mira MDE

Standalone, package-oriented Markdown editor extracted from the Lapis Notes markdown
plugin. Mira MDE is built around CodeMirror 6, Svelte 5, unified/remark/rehype,
and an extension contract that lets feature packages contribute editor,
preview, language, and UI behavior.

## Packages

- `@lapismd/mira/extensions` - extension contract and resolver.
- `@lapismd/mira/core` - framework-agnostic CodeMirror controller.
- `@lapismd/mira/codemirror` - base CodeMirror editing setup.
- `@lapismd/mira/codemirror` - markdown language and source decorations.
- `@lapismd/mira/codemirror` - live-preview mode hooks.
- `@lapismd/mira/tables` - table parsing and editor decorations.
- `@lapismd/mira/preview` - Svelte markdown preview renderer.
- `@mira-mde/plugin-mermaid` - Mermaid language and preview extension.
- `@lapismd/mira/ui` - editor UI primitives and theme CSS.
- `@lapismd/mira` - primary Svelte 5 editor component.
- `@mira-mde/vanilla` - plain JavaScript mounting API.

React, Vue, and Solid package folders are reserved for thin wrappers once the
core API stabilizes.

## Development

```sh
pnpm install
pnpm dev                    # Storybook at http://localhost:7007
pnpm spec:check             # normative contract and governance
pnpm check:all
```

## Documentation and demos

Storybook is Mira's only browsable documentation and demo application. The
canonical behavioral contract is the mdBook source under [`spec/src`](spec/src),
which Storybook renders directly. Component descriptions, examples, fixture
data, interactions, and CSS-token metadata live in the Storybook catalog.

The catalog runs at the repo root on port **7007**. Visual Delta host wiring
edits trigger a full restart via the run wrapper (the manager is a one-shot
esbuild bundle). Addon: `@lapismd/storybook-addon-visual-delta`.

```sh
pnpm storybook              # http://localhost:7007; restarts on manager / visual wiring edits
pnpm storybook:restart      # kill listeners on 7007 (+ legacy 9009) and start fresh
pnpm build-storybook        # static build → storybook-static/
pnpm test:e2e               # Playwright acceptance against Storybook stories
pnpm test:visual            # Playwright baselines against storybook-static
pnpm test:visual:update     # gated baseline create/update (VISUAL_UPDATE_APPROVED=1)
pnpm storybook:check        # build-storybook + test:visual
```

Override the port with `STORYBOOK_PORT` when needed.
