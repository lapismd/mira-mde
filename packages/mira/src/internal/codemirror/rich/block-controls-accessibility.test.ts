import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { expect, it } from "vitest";
import { createRichEditorExtensions } from ".";

const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

it("exposes newly mounted keyboard controls before the next animation frame", async () => {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    state: EditorState.create({
      doc: "# Heading\n\nParagraph",
      extensions: [
        lineNumbers(),
        createRichEditorExtensions({ blockControls: true, livePreview: false }),
      ],
    }),
    parent,
  });
  try {
    await Promise.resolve();
    const handle =
      parent.querySelector<HTMLButtonElement>(".mira-block-handle")!;
    expect(handle).not.toBeNull();
    expect(handle.closest('[aria-hidden="true"]')).toBeNull();
    handle.focus();
    expect(document.activeElement).toBe(handle);
    view.dispatch({ changes: { from: 0, insert: "New paragraph\n\n" } });
    await Promise.resolve();
    expect(
      parent
        .querySelector(".mira-block-handle")
        ?.closest('[aria-hidden="true"]'),
    ).toBeNull();
  } finally {
    view.destroy();
    parent.remove();
  }
});

it("exposes keyboard block controls and restores decorative gutter ownership after reconfiguration", async () => {
  const parent = document.createElement("div");
  document.body.append(parent);
  const controls = new Compartment();
  const extension = () =>
    createRichEditorExtensions({
      blockControls: { toolbar: true },
      livePreview: false,
    });
  const view = new EditorView({
    state: EditorState.create({
      doc: "# Heading\n\nParagraph",
      extensions: [lineNumbers(), controls.of(extension())],
    }),
    parent,
  });
  try {
    await frame();
    const handle =
      parent.querySelector<HTMLButtonElement>(".mira-block-handle")!;
    expect(handle).not.toBeNull();
    expect(handle.closest('[aria-hidden="true"]')).toBeNull();
    handle.focus();
    expect(document.activeElement).toBe(handle);
    expect(handle.tabIndex).toBe(0);
    expect(
      parent.querySelector(".cm-lineNumbers")?.getAttribute("aria-hidden"),
    ).toBe("true");

    view.dispatch({ effects: controls.reconfigure([]) });
    await frame();
    expect(parent.querySelector(".mira-block-handle")).toBeNull();
    expect(
      parent.querySelector(".cm-gutters")?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      parent.querySelector(".cm-lineNumbers")?.hasAttribute("aria-hidden"),
    ).toBe(false);

    view.dispatch({ effects: controls.reconfigure(extension()) });
    await frame();
    expect(
      parent
        .querySelector(".mira-block-handle")
        ?.closest('[aria-hidden="true"]'),
    ).toBeNull();
  } finally {
    view.destroy();
    parent.remove();
  }
});
