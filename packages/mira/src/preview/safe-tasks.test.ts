import { mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vitest";
import MarkdownPreview from "./markdown-preview.svelte";

describe("task markers in immutable Markdown", () => {
  it.each(["trusted", "safe"] as const)(
    "%s HTML retains checked, unchecked and custom task artwork identities",
    async (htmlPolicy) => {
      const target = document.createElement("div");
      const component = mount(MarkdownPreview, {
        target,
        props: {
          value: "- [x] Done\n- [ ] Pending\n- [/] In progress\n",
          htmlPolicy,
        },
      });
      await tick();
      await Promise.resolve();
      await tick();
      const inputs = Array.from(
        target.querySelectorAll<HTMLInputElement>(
          "input.task-list-item-checkbox",
        ),
      );
      expect(inputs.map((input) => input.checked)).toEqual([true, false, true]);
      expect(inputs.map((input) => input.dataset.task)).toEqual([
        "x",
        " ",
        "/",
      ]);
      expect(inputs.every((input) => input.disabled)).toBe(true);
      await unmount(component);
    },
  );
});
