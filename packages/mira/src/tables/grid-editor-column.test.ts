import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import GridEditorColumn from "./grid-editor-column.svelte";

describe("GridEditorColumn", () => {
  it("moves keyboard focus into the inline editor", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(GridEditorColumn, {
      target,
      props: {
        content: "Feature",
        onContentChange: vi.fn(),
      },
    });
    await tick();

    const trigger = target.querySelector<HTMLButtonElement>(
      'button[aria-label="Edit table cell"]',
    );
    expect(trigger).not.toBeNull();
    trigger?.focus();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await tick();

    const editor = target.querySelector<HTMLElement>(
      ".cm-editor.mod-inline .cm-content[contenteditable='true']",
    );
    expect(editor).not.toBeNull();
    expect(document.activeElement).toBe(editor);

    await unmount(component);
    target.remove();
  });
});
