import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { createRichEditorExtensions } from ".";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("block controls", () => {
  it("renders block handles in a dedicated gutter", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Alpha\n\nBeta",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const blockGutter = parent.querySelector(".mira-block-controls-gutter");
    expect(blockGutter).not.toBeNull();
    expect(blockGutter?.querySelector(".mira-block-handle")).not.toBeNull();
    expect(
      parent.querySelector(".cm-lineNumbers .mira-block-handle"),
    ).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("pins block handles to the first line and matches line-number band", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Alpha\n\nBeta",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const gutterElement = parent.querySelector<HTMLElement>(
      ".mira-block-controls-gutter .cm-gutterElement",
    );
    const handle = parent.querySelector<HTMLElement>(".mira-block-handle");
    expect(gutterElement).not.toBeNull();
    expect(handle).not.toBeNull();
    expect(getComputedStyle(gutterElement!).alignItems).toBe("flex-start");
    expect(handle!.classList.contains("mira-block-handle")).toBe(true);

    view.destroy();
    parent.remove();
  });

  it("keeps the active block handle visible without hover", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Alpha\ncontinues\n\nBeta",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const firstHandle = () =>
      parent.querySelector<HTMLButtonElement>('[data-mira-block-id="line-1"]');
    const secondHandle = () =>
      parent.querySelector<HTMLButtonElement>('[data-mira-block-id="line-4"]');

    expect(firstHandle()?.classList.contains("mira-block-handle--active")).toBe(
      true,
    );
    expect(
      secondHandle()?.classList.contains("mira-block-handle--active"),
    ).toBe(false);

    view.dispatch({
      selection: { anchor: view.state.doc.line(4).from },
    });
    await nextFrame();

    expect(firstHandle()?.classList.contains("mira-block-handle--active")).toBe(
      false,
    );
    expect(
      secondHandle()?.classList.contains("mira-block-handle--active"),
    ).toBe(true);

    view.dispatch({
      selection: {
        anchor: view.state.doc.line(1).from,
        head: view.state.doc.line(4).to,
      },
    });
    await nextFrame();

    expect(firstHandle()?.classList.contains("mira-block-handle--active")).toBe(
      true,
    );
    expect(
      secondHandle()?.classList.contains("mira-block-handle--active"),
    ).toBe(true);

    view.destroy();
    parent.remove();
  });

  it("renders one handle for each list item", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "- parent\n  - child\n- sibling",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const handles = Array.from(
      parent.querySelectorAll<HTMLButtonElement>(".mira-block-handle"),
    ).map((handle) => handle.dataset.miraBlockId);

    expect(handles).toEqual(["list-item-1", "list-item-2", "list-item-3"]);
    expect(parent.querySelector('[data-mira-block-id="line-1"]')).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("left-clicks a handle to highlight the affected range without selecting text", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "# One\n\nBody\n\n# Two",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const handle = parent.querySelector<HTMLButtonElement>(
      '[data-mira-block-id="line-1"]',
    )!;
    handle.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await nextFrame();

    expect(view.state.selection.main.empty).toBe(true);
    expect(parent.querySelector(".mira-block-menu[hidden]")).not.toBeNull();
    expect(parent.querySelectorAll(".mira-block-affected-line")).toHaveLength(
      3,
    );
    expect(
      parent
        .querySelector<HTMLButtonElement>('[data-mira-block-id="line-1"]')
        ?.classList.contains("mira-block-handle--selected"),
    ).toBe(true);

    view.destroy();
    parent.remove();
  });

  it("opens block actions from the handle context menu", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Alpha\n\nBeta",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const handle = parent.querySelector<HTMLButtonElement>(
      '[data-mira-block-id="line-1"]',
    )!;
    handle.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
    );
    await nextFrame();

    const menu = parent.querySelector(".mira-block-menu");
    expect(menu?.hasAttribute("hidden")).toBe(false);
    expect(menu?.textContent).toContain("Duplicate");
    expect(parent.querySelectorAll(".mira-block-affected-line")).toHaveLength(
      1,
    );

    view.destroy();
    parent.remove();
  });

  it("opens block actions from the keyboard context-menu shortcut", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Alpha\n\nBeta",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent,
    });

    await nextFrame();

    const handle = parent.querySelector<HTMLButtonElement>(
      '[data-mira-block-id="line-1"]',
    )!;
    handle.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "F10",
        shiftKey: true,
      }),
    );
    await nextFrame();

    const menu = parent.querySelector(".mira-block-menu");
    expect(menu?.hasAttribute("hidden")).toBe(false);
    expect(menu?.textContent).toContain("Delete");

    view.destroy();
    parent.remove();
  });
});
