import { describe, expect, it, vi } from "vitest";

const componentHandle = vi.hoisted(() => ({
  applyMarkdownAction: vi.fn(() => true),
  getMarkdown: vi.fn(() => "_word_"),
  setSelection: vi.fn(),
}));

vi.mock("svelte", async (importOriginal) => ({
  ...(await importOriginal<typeof import("svelte")>()),
  mount: vi.fn(() => componentHandle),
  unmount: vi.fn(),
}));
import { createMira, createMiraEditor } from ".";

describe("createMira", () => {
  it("exports a mount function", () => {
    expect(typeof createMira).toBe("function");
  });

  it("exports the batteries-included editor mount function", () => {
    expect(typeof createMiraEditor).toBe("function");
  });

  it("delegates context-aware Markdown actions through the Vanilla handle", () => {
    const host = document.createElement("div");
    const editor = createMiraEditor({
      root: host,
      value: "word",
      mode: "source",
    });

    const selection = {
      anchor: { line: 0, ch: 2 },
      head: { line: 0, ch: 2 },
    };
    editor.setSelection(selection);
    expect(editor.applyMarkdownAction("italic")).toBe(true);
    expect(editor.getMarkdown()).toBe("_word_");
    expect(componentHandle.setSelection).toHaveBeenCalledWith(selection);
    expect(componentHandle.applyMarkdownAction).toHaveBeenCalledWith("italic");
    editor.destroy();
  });
});
