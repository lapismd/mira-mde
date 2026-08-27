# Mira

[![Mira CI](https://github.com/lapismd/mira-mde/actions/workflows/mira-spec-first.yml/badge.svg)](https://github.com/lapismd/mira-mde/actions/workflows/mira-spec-first.yml)
[![Release public packages](https://github.com/lapismd/mira-mde/actions/workflows/release.yml/badge.svg)](https://github.com/lapismd/mira-mde/actions/workflows/release.yml)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white)](https://lapismd.github.io/mira-mde/)

![Mira MDE](assets/logo-light.png#gh-light-mode-only)
![Mira MDE](assets/logo-dark.png#gh-dark-mode-only)

Mira is a package-oriented Markdown editor toolkit for applications that need a
portable editing surface, Markdown preview rendering, and optional feature
packages without taking on application state, routing, storage, or AI-provider
policy. It is built around CodeMirror 6, Svelte 5, unified/remark/rehype, and
an extension contract that lets packages contribute editor, preview, language,
and UI behavior.

## Choose a package

| Package                        | Use                                                                    | Version                                                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `@lapismd/mira`                | Composable Svelte editor and supported advanced runtime subpaths.      | [![npm](https://img.shields.io/npm/v/@lapismd/mira.svg)](https://www.npmjs.com/package/@lapismd/mira)                               |
| `@lapismd/mira-editor`         | Batteries-included Svelte editor, toolbar, features, and default CSS.  | [![npm](https://img.shields.io/npm/v/@lapismd/mira-editor.svg)](https://www.npmjs.com/package/@lapismd/mira-editor)                 |
| `@lapismd/mira-plugin-ai`      | Optional consumer-configured AI actions.                               | [![npm](https://img.shields.io/npm/v/@lapismd/mira-plugin-ai.svg)](https://www.npmjs.com/package/@lapismd/mira-plugin-ai)           |
| `@lapismd/mira-plugin-mermaid` | Mermaid language, rendering, and diagram controls.                     | [![npm](https://img.shields.io/npm/v/@lapismd/mira-plugin-mermaid.svg)](https://www.npmjs.com/package/@lapismd/mira-plugin-mermaid) |
| `@lapismd/mira-react`          | React components for `Mira`, `MiraEditor`, and `MiraEditorToolbar`.    | [![npm](https://img.shields.io/npm/v/@lapismd/mira-react.svg)](https://www.npmjs.com/package/@lapismd/mira-react)                   |
| `@lapismd/mira-vanilla`        | Plain JavaScript `createMira` and `createMiraEditor` mounting helpers. | [![npm](https://img.shields.io/npm/v/@lapismd/mira-vanilla.svg)](https://www.npmjs.com/package/@lapismd/mira-vanilla)               |

All public packages begin at `0.0.1` and then version independently. Normal
validation never publishes; the protected release workflow publishes only
verified exact-version tarballs. See [Releasing Mira packages](RELEASING.md).
Vue and Solid remain private placeholders under `internal/adapters`.

## Quick start

For a Svelte application, install the batteries-included editor:

```sh
pnpm add @lapismd/mira-editor
```

```svelte
<script lang="ts">
  import { MiraEditor } from "@lapismd/mira-editor";
  import "@lapismd/mira-editor/styles.css";

  let value = "# Hello Mira";
</script>

<MiraEditor bind:value defaultEditMode="live-preview" />
```

Use `@lapismd/mira` directly when you want the composable editor and your own
feature set. Use `@lapismd/mira-react` or `@lapismd/mira-vanilla` when a Svelte
component is not the right integration boundary.

Mira packages own editor and Markdown behavior only. Consumers remain
responsible for persistence, file/vault models, routing, application commands,
credentials, and provider-specific AI execution.

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
The published static Storybook is deployed to
<https://lapismd.github.io/mira-mde/>.

The catalog runs at the repo root on port **7007**. Visual Delta host wiring
edits trigger a full restart via the run wrapper (the manager is a one-shot
esbuild bundle). Addon: `@lapismd/storybook-addon-visual-delta`.

```sh
pnpm storybook              # http://localhost:7007; restarts on manager / visual wiring edits
pnpm storybook:restart      # kill listeners on 7007 (+ legacy 9009) and start fresh
pnpm build-storybook        # static build → storybook-static/
pnpm test:e2e               # Playwright acceptance against Storybook stories
pnpm test:visual            # explicit Visual Delta review; non-blocking for initial 0.0.1 release
pnpm test:visual:update     # gated baseline create/update (VISUAL_UPDATE_APPROVED=1)
pnpm storybook:check        # catalog + static Storybook + Storybook browser acceptance
```

Override the port with `STORYBOOK_PORT` when needed.
