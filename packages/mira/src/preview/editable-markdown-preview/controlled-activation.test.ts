import { mount, tick, unmount } from "svelte";
import { expect, it, vi } from "vitest";
import EditableMarkdownPreview from "../editable-markdown-preview.svelte";

it("leaves host-controlled preview content out of the button and tab order", async () => {
  const target = document.createElement("div");
  const write = vi.fn();
  const component = mount(EditableMarkdownPreview, {
    target,
    props: {
      file: { path: "virtual.md", name: "Card", kind: "markdown" },
      fileAdapter: {
        resolveLink: () => null,
        readMarkdown: () => "[A link](https://example.com)\n\n- [ ] A task",
        writeMarkdown: write,
      },
      activateOnPreviewInteraction: false,
    },
  });
  try {
    await vi.waitFor(() => expect(target.querySelector("a")).not.toBeNull());
    const preview = target.querySelector<HTMLElement>(
      ".mira-editable-markdown-preview__preview",
    )!;
    expect(preview.getAttribute("role")).not.toBe("button");
    expect(preview.hasAttribute("tabindex")).toBe(false);
    preview.click();
    preview.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    await tick();
    expect(target.querySelector("[data-editable-markdown-editor]")).toBeNull();
    const checkbox = target.querySelector<HTMLInputElement>(
      'input[aria-label="Toggle task"]',
    )!;
    expect(checkbox.disabled).toBe(false);
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(write).toHaveBeenCalled());
    expect(write.mock.calls.at(-1)?.[1]).toContain("- [x] A task");
  } finally {
    await unmount(component);
  }
});
