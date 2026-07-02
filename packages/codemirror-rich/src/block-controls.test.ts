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
});
