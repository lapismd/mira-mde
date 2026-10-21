import { mount, tick, unmount } from "svelte";
import { expect, it } from "vitest";
import MarkdownPreview from "./markdown-preview.svelte";

it("retains syntax highlighting in safe embedded previews without executable HTML", async () => {
  const target = document.createElement("div");
  const component = mount(MarkdownPreview, {
    target,
    props: {
      value:
        '```typescript\nconst review = "weekly";\n```\n\n```markdown\n# Daily review\n```\n\n<img src="missing" onerror="alert(1)"><script>alert(1)</script>',
      embed: true,
      htmlPolicy: "safe",
    },
  });
  try {
    await tick();
    expect(
      target.querySelector("code.hljs.language-typescript"),
    ).not.toBeNull();
    expect(target.querySelector(".hljs-keyword")?.textContent).toBe("const");
    expect(
      target.querySelector("code.language-markdown .hljs-section")?.textContent,
    ).toBe("# Daily review");
    expect(target.querySelector("script, [onerror]")).toBeNull();
  } finally {
    await unmount(component);
  }
});
