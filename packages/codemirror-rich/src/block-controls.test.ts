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
});
