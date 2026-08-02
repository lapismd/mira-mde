# Mira

Standalone, package-oriented Markdown editor extracted from the Lapis Notes markdown
plugin. Mira is built around CodeMirror 6, Svelte 5, unified/remark/rehype,
and an extension contract that lets feature packages contribute editor,
preview, language, and UI behavior.

## Packages

| Install                        | Use                                                                    |
| ------------------------------ | ---------------------------------------------------------------------- |
| `@lapismd/mira`                | Composable Svelte editor and supported advanced runtime subpaths.      |
| `@lapismd/mira-editor`         | Batteries-included Svelte editor, toolbar, features, and default CSS.  |
| `@lapismd/mira-plugin-ai`      | Optional consumer-configured AI actions.                               |
| `@lapismd/mira-plugin-mermaid` | Mermaid language, rendering, and diagram controls.                     |
| `@lapismd/mira-react`          | React components for `Mira`, `MiraEditor`, and `MiraEditorToolbar`.    |
| `@lapismd/mira-vanilla`        | Plain JavaScript `createMira` and `createMiraEditor` mounting helpers. |

All public packages are currently prepared at `0.0.1`; this repository does
not publish them as part of normal validation. Vue and Solid remain private
placeholders under `internal/adapters`.

### Pre-release migration

| Removed                                     | Replacement                            |
| ------------------------------------------- | -------------------------------------- |
| `@mira-mde/svelte` and runtime workspaces   | `@lapismd/mira` and supported subpaths |
| `@mira-mde/default-ui`                      | `@lapismd/mira-editor`                 |
| `@mira-mde/plugin-ai`                       | `@lapismd/mira-plugin-ai`              |
| `@mira-mde/plugin-mermaid`                  | `@lapismd/mira-plugin-mermaid`         |
| `@mira-mde/react`                           | `@lapismd/mira-react`                  |
| `@mira-mde/vanilla`                         | `@lapismd/mira-vanilla`                |
| `MiraMde` / `MiraDefaultMde`                | `Mira` / `MiraEditor`                  |
| `MiraDefaultToolbar`                        | `MiraEditorToolbar`                    |
| `createMiraMde` / `createMiraDefaultEditor` | `createMira` / `createMiraEditor`      |

This is a hard pre-release migration. The removed names are not exported as
deprecated aliases.

## Development

```sh
pnpm install
pnpm dev                    # Storybook at http://localhost:7007
pnpm spec:check             # normative contract and governance
pnpm packages:check         # six-package boundary and leak checks
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
