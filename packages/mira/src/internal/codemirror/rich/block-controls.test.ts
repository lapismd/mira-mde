import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { describe, expect, it, vi } from "vitest";
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

  it("renders the contextual toolbar only when explicitly enabled", async () => {
    const legacyParent = document.createElement("div");
    document.body.append(legacyParent);
    const legacyView = new EditorView({
      doc: "Paragraph",
      extensions: [
        createRichEditorExtensions({
          blockControls: true,
          livePreview: false,
        }),
      ],
      parent: legacyParent,
    });
    await nextFrame();
    expect(
      legacyParent.querySelector(".mira-block-toolbar-trigger"),
    ).toBeNull();
    legacyView.destroy();
    legacyParent.remove();

    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Paragraph",
      extensions: [
        createRichEditorExtensions({
          blockControls: { toolbar: true },
          livePreview: false,
        }),
      ],
      parent,
    });
    await nextFrame();

    expect(view.dom.classList.contains("mira-block-toolbar-enabled")).toBe(
      true,
    );
    expect(
      parent
        .querySelector<HTMLButtonElement>(".mira-block-toolbar-trigger")
        ?.getAttribute("aria-label"),
    ).toBe("Change Paragraph");
    expect(
      getComputedStyle(
        parent.querySelector<HTMLElement>(".mira-block-controls-gutter")!,
      ).width,
    ).toBe("2.375rem");
    expect(
      getComputedStyle(parent.querySelector<HTMLElement>(".cm-gutters")!)
        .marginInlineEnd,
    ).toBe("1.75rem");
    expect(
      getComputedStyle(
        parent.querySelector<HTMLElement>(".mira-block-toolbar-trigger")!,
      ).width,
    ).toBe("1.25rem");

    view.destroy();
    parent.remove();
  });

  it("opens the contextual menu and converts the active block", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "# Heading",
      extensions: [
        createRichEditorExtensions({
          blockControls: { toolbar: true },
          livePreview: false,
        }),
      ],
      parent,
    });
    await nextFrame();

    parent
      .querySelector<HTMLButtonElement>(".mira-block-toolbar-trigger")!
      .click();
    await nextFrame();

    const menu = document.body.querySelector<HTMLElement>(
      ".mira-block-toolbar-menu",
    );
    expect(menu?.hidden).toBe(false);
    expect(menu?.getAttribute("role")).toBe("menu");
    expect(
      menu?.parentElement?.classList.contains("mira-block-toolbar-portal"),
    ).toBe(true);
    expect(
      menu
        ?.querySelector('[data-block-toolbar-item="heading1"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");

    menu
      ?.querySelector<HTMLButtonElement>('[data-block-toolbar-item="heading2"]')
      ?.click();
    expect(view.state.doc.toString()).toBe("## Heading");
    expect(menu?.hidden).toBe(true);

    view.destroy();
    expect(document.body.contains(menu)).toBe(false);
    parent.remove();
  });

  it("hides the contextual trigger for readonly editors", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Paragraph",
      extensions: [
        EditorState.readOnly.of(true),
        createRichEditorExtensions({
          blockControls: { toolbar: true },
          livePreview: false,
        }),
      ],
      parent,
    });
    await nextFrame();

    expect(parent.querySelector(".mira-block-toolbar-trigger")).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("hides contextual triggers for multi-block selections", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Alpha\n\nBeta",
      extensions: [
        createRichEditorExtensions({
          blockControls: { toolbar: true },
          livePreview: false,
        }),
      ],
      parent,
    });
    await nextFrame();
    expect(parent.querySelectorAll(".mira-block-toolbar-trigger")).toHaveLength(
      2,
    );

    view.dispatch({
      selection: { anchor: 0, head: view.state.doc.length },
    });
    await nextFrame();
    expect(parent.querySelector(".mira-block-toolbar-trigger")).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("shows explicitly placed block actions without moving the selection", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    let activeBlock = "";
    const cleanupIcon = vi.fn();
    const view = new EditorView({
      doc: "Alpha\n\nBeta",
      selection: { anchor: 8 },
      extensions: [
        createRichEditorExtensions({
          blockControls: { toolbar: true },
          blockActions: [
            {
              id: "talk",
              label: "Talk",
              icon: "sparkles",
              placements: ["block-menu"],
              renderIcon(target) {
                target.dataset.frameworkIcon = "mounted";
                return cleanupIcon;
              },
              run(context) {
                activeBlock = context.block.text;
              },
            },
          ],
          livePreview: false,
        }),
      ],
      parent,
    });
    await nextFrame();

    parent
      .querySelector<HTMLButtonElement>(
        '[data-mira-block-id="line-1"] + .mira-block-toolbar-trigger',
      )
      ?.click();
    await nextFrame();
    expect(
      document.body.querySelector('[data-framework-icon="mounted"]'),
    ).not.toBeNull();
    document.body
      .querySelector<HTMLButtonElement>('[data-block-toolbar-item="talk"]')
      ?.click();

    expect(activeBlock).toBe("Alpha");
    expect(view.state.selection.main.head).toBe(8);
    expect(parent.querySelector(".mira-block-menu")?.textContent).not.toContain(
      "Talk",
    );
    expect(cleanupIcon).toHaveBeenCalledOnce();

    view.destroy();
    parent.remove();
  });

  it("supports keyboard navigation and returns focus on Escape", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "Paragraph",
      extensions: [
        createRichEditorExtensions({
          blockControls: { toolbar: true },
          livePreview: false,
        }),
      ],
      parent,
    });
    await nextFrame();

    const trigger = parent.querySelector<HTMLButtonElement>(
      ".mira-block-toolbar-trigger",
    )!;
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowDown",
      }),
    );
    await nextFrame();

    const menu = document.body.querySelector<HTMLElement>(
      ".mira-block-toolbar-menu",
    )!;
    const first = menu.querySelector<HTMLButtonElement>(
      ".mira-block-toolbar-menu__item:not(:disabled)",
    )!;
    expect(menu.hidden).toBe(false);
    expect(menu.contains(document.activeElement)).toBe(true);
    first.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "End",
      }),
    );
    expect(document.activeElement).toBe(
      Array.from(
        menu.querySelectorAll<HTMLButtonElement>(
          ".mira-block-toolbar-menu__item:not(:disabled)",
        ),
      ).at(-1),
    );
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Escape",
      }),
    );
    expect(menu.hidden).toBe(true);
    expect(document.activeElement).toBe(
      parent.querySelector(".mira-block-toolbar-trigger"),
    );

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
