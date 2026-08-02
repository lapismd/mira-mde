# `@lapismd/mira-vanilla`

Plain JavaScript mounting factories for both public editor products.

```ts
import { createMiraEditor } from "@lapismd/mira-vanilla";
import "@lapismd/mira-editor/styles.css";

const editor = createMiraEditor({
  root: document.getElementById("editor")!,
  value: "# Hello Mira",
});

editor.setMode("preview");
editor.destroy();
```

Use `createMira(target, props)` for the composable editor and
`createMiraEditor(options)` for the batteries-included editor.
