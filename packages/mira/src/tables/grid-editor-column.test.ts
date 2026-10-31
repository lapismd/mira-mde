import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import GridEditorColumn from "./grid-editor-column.svelte";
import EditorColumn from "./editor-column.svelte";
import { EditorView } from "@codemirror/view";

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

const cells = [
  {
    name: "grid",
    create: (target: HTMLElement) =>
      mount(GridEditorColumn, {
        target,
        props: { content: "Feature", onContentChange: vi.fn() },
      }),
  },
  {
    name: "pipe",
    create: (target: HTMLElement) =>
      mount(EditorColumn, {
        target,
        props: {
          node: {
            type: "tableCell",
            children: [{ type: "text", value: "Feature" }],
          },
          onContentChange: vi.fn(),
        },
      }),
  },
];

describe.each(cells)("$name cell focus lifetime", ({ create }) => {
  it.each([false, true])(
    "does not focus or dispatch after unmount (tick settled: %s)",
    async (settleTick) => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const focus = vi.spyOn(EditorView.prototype, "focus");
      const dispatch = vi.spyOn(EditorView.prototype, "dispatch");
      const target = document.createElement("div");
      document.body.append(target);
      const component = create(target);
      let mounted = true;
      try {
        await tick();
        const trigger = target.querySelector<HTMLButtonElement>(
          'button[aria-label="Edit table cell"]',
        );
        expect(trigger).not.toBeNull();
        trigger!.focus();
        if (settleTick) await tick();
        await unmount(component);
        mounted = false;
        await tick();
        focus.mockClear();
        dispatch.mockClear();
        await vi.runOnlyPendingTimersAsync();
        expect(focus).not.toHaveBeenCalled();
        expect(dispatch).not.toHaveBeenCalled();
      } finally {
        if (mounted) await unmount(component);
        target.remove();
        vi.restoreAllMocks();
        vi.useRealTimers();
      }
    },
  );
});
