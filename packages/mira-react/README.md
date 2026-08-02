# @lapismd/mira-react

React components for Mira.

```tsx
import { useState } from "react";
import { MiraEditor } from "@lapismd/mira-react";
import "@lapismd/mira-react/styles.css";

export function Editor() {
  const [value, setValue] = useState("# Hello");

  return (
    <MiraEditor
      value={value}
      defaultEditMode="live-preview"
      onChange={setValue}
      features={{ mermaid: true, "split-mode": true }}
    />
  );
}
```

Exports:

- `Mira`: composable editor component.
- `MiraEditor`: batteries-included editor plus toolbar.
- `MiraEditorToolbar`: standalone toolbar for custom shells.

Imperative DOM factories live in `@lapismd/mira-vanilla`.
