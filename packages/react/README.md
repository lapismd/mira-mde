# @mira-mde/react

React components for Mira MDE.

```tsx
import { useState } from "react";
import { MiraDefaultMde } from "@mira-mde/react";
import "@mira-mde/react/styles.css";

export function Editor() {
  const [value, setValue] = useState("# Hello");

  return (
    <MiraDefaultMde
      value={value}
      onChange={setValue}
      features={{ mermaid: true, "split-mode": true }}
    />
  );
}
```

Exports:

- `MiraMde`: composable editor component.
- `MiraDefaultMde`: editor plus default toolbar.
- `MiraDefaultToolbar`: standalone toolbar for custom shells.
- `createMiraDefaultEditor`: imperative DOM mount helper.
