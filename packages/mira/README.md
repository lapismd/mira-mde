# `@lapismd/mira`

Composable Svelte Markdown editor and Mira's shared portable runtime.

```svelte
<script lang="ts">
  import Mira from "@lapismd/mira";
  import "@lapismd/mira/styles.css";

  let value = "# Hello Mira";
</script>

<Mira bind:value mode="live-preview" />
```

Supported advanced entrypoints are `/core`, `/extensions`, `/codemirror`,
`/preview`, `/tables`, `/ui`, `/ui/*`, `/themes/mira.css`,
`/themes/obsidian.css`, `/themes.css`, and `/styles.css`. Source under
`src/internal` is not a consumer API.

`theme` accepts an opaque whitespace-separated token list such as
`"obsidian company-brand"`; `colorMode` independently accepts `inherit`,
`light`, `dark`, or `system`. Consumer CSS loaded after Mira can override any
documented `--mira-*` token for its own theme token.

See Storybook for examples and `spec/src/packages.md` for the normative package
contract.
