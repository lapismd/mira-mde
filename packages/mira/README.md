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
`/preview`, `/tables`, `/ui`, `/ui/*`, `/themes/obsidian.css`, and
`/styles.css`. Source under `src/internal` is not a consumer API.

See Storybook for examples and `spec/src/packages.md` for the normative package
contract.
