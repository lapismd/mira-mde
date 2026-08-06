// @vitest-environment jsdom

import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { createMarkdownCodeMirrorExtensions } from "../markdown";
import {
  createSelectionToolbarExtension,
  defaultMiraSelectionToolbarActions,
} from "./selection-toolbar";

function createEditor({
  actions,
  ariaLabel,
  labels,
  placement,
  readonly = false,
}: Parameters<typeof createSelectionToolbarExtension>[0] & {
  readonly?: boolean;
} = {}) {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    state: EditorState.create({
      doc: "Format this text",
      selection: EditorSelection.single(7, 11),
      extensions: [
        createMarkdownCodeMirrorExtensions({ sourceMode: true }),
        EditorState.readOnly.of(readonly),
        createSelectionToolbarExtension({
          actions,
          ariaLabel,
          labels,
          placement,
        }),
      ],
    }),
    parent,
  });

  return {
    parent,
    view,
    destroy() {
      view.destroy();
      parent.remove();
    },
  };
}

function toolbar(parent: HTMLElement): HTMLElement | null {
  return parent.querySelector('[role="toolbar"]');
}

describe("createSelectionToolbarExtension", () => {
  it("shows the default accessible actions in screenshot order", () => {
    const editor = createEditor();
    const selectionToolbar = toolbar(editor.parent);

    expect(defaultMiraSelectionToolbarActions).toEqual([
      "link",
      "bold",
      "italic",
      "strikethrough",
    ]);
    expect(selectionToolbar?.getAttribute("aria-label")).toBe(
      "Text formatting",
    );
    expect(selectionToolbar?.dataset.placement).toBe("below");
    expect(
      Array.from(
        selectionToolbar?.querySelectorAll<HTMLButtonElement>("button") ?? [],
        (button) => ({
          action: button.dataset.miraSelectionAction,
          label: button.getAttribute("aria-label"),
          title: button.title,
          icon: button.querySelector("svg")?.getAttribute("aria-hidden"),
        }),
      ),
    ).toEqual([
      { action: "link", label: "Link", title: "Link", icon: "true" },
      { action: "bold", label: "Bold", title: "Bold", icon: "true" },
      { action: "italic", label: "Italic", title: "Italic", icon: "true" },
      {
        action: "strikethrough",
        label: "Strikethrough",
        title: "Strikethrough",
        icon: "true",
      },
    ]);
    expect(editor.view.state.doc.toString()).toBe("Format this text");

    editor.destroy();
  });

  it("delegates button activation to the shared Markdown action engine", () => {
    const editor = createEditor();
    const bold = editor.parent.querySelector<HTMLButtonElement>(
      '[data-mira-selection-action="bold"]',
    );

    bold?.click();

    expect(editor.view.state.doc.toString()).toBe("Format **this** text");
    expect(editor.view.state.selection.main.from).toBe(9);
    expect(editor.view.state.selection.main.to).toBe(13);
    expect(toolbar(editor.parent)).not.toBeNull();

    editor.destroy();
  });

  it("supports configured action order, labels, placement, and toolbar name", () => {
    const editor = createEditor({
      actions: ["inlineCode", "italic", "inlineCode"],
      ariaLabel: "Quick formatting",
      labels: { inlineCode: "Code selection" },
      placement: "above",
    });
    const selectionToolbar = toolbar(editor.parent);

    expect(selectionToolbar?.getAttribute("aria-label")).toBe(
      "Quick formatting",
    );
    expect(selectionToolbar?.dataset.placement).toBe("above");
    expect(
      Array.from(
        selectionToolbar?.querySelectorAll<HTMLButtonElement>("button") ?? [],
        (button) => button.getAttribute("aria-label"),
      ),
    ).toEqual(["Code selection", "Italic"]);

    editor.destroy();
  });

  it("moves keyboard focus into and through the toolbar", () => {
    const editor = createEditor();
    editor.view.focus();

    editor.view.contentDOM.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Tab",
      }),
    );
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Link");

    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "ArrowRight",
      }),
    );
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Bold");

    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Escape",
      }),
    );
    expect(document.activeElement).toBe(editor.view.contentDOM);

    editor.destroy();
  });

  it("hides for collapsed selections and readonly editors", () => {
    const editor = createEditor();

    editor.view.dispatch({ selection: EditorSelection.cursor(7) });
    expect(toolbar(editor.parent)).toBeNull();
    editor.destroy();

    const readonlyEditor = createEditor({ readonly: true });
    expect(toolbar(readonlyEditor.parent)).toBeNull();
    readonlyEditor.destroy();
  });
});
