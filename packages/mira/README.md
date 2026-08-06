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

Add the optional selected-text formatting toolbar through the portable
extension API:

```svelte
<script lang="ts">
  import Mira from "@lapismd/mira";
  import { selectionToolbarExtension } from "@lapismd/mira/extensions";
  import "@lapismd/mira/styles.css";

  let value = "Select text to format it.";
  const extensions = [
    selectionToolbarExtension({
      actions: ["link", "bold", "italic", "strikethrough"],
      placement: "below",
    }),
  ];
</script>

<Mira bind:value mode="live-preview" {extensions} />
```

The four actions above are the defaults. Configure their order, labels, and
preferred `above` or `below` placement without adding framework-specific
behavior.

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
