// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { defineMiraExtension } from "../extensions";
import { createBaseCodeMirrorExtensions } from "../internal/codemirror/base";
import { createMiraCodeMirrorExtensions } from "./code-mirror";

const runtimeContext = (view: EditorView) => ({
  view,
  mode: "source" as const,
  getValue: () => view.state.doc.toString(),
  setValue: (value: string) => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  },
  focus: () => view.focus(),
  insertMarkdown: () => undefined,
});

describe("createMiraCodeMirrorExtensions", () => {
  it("includes the base CodeMirror layer by default", () => {
    const parent = document.createElement("div");
    const view = new EditorView({
      extensions: createMiraCodeMirrorExtensions({
        mode: "source",
        runtimeContext,
      }),
      parent,
    });

    expect(view.dom.classList.contains("mira-codemirror")).toBe(true);
    expect(view.contentDOM.getAttribute("aria-label")).toBe("Markdown editor");

    view.destroy();
  });

  it("omits only the base layer while retaining portable contributions", () => {
    const contribution = defineMiraExtension({
      name: "consumer-authoring",
      codeMirror: () =>
        EditorView.editorAttributes.of({ class: "consumer-authoring" }),
      slashCommands: [
        {
          id: "consumer-command",
          label: "Consumer command",
          insert: "Consumer command",
        },
      ],
    });
    const shared = {
      mode: "source" as const,
      extensions: [contribution],
      blockControls: true,
      runtimeContext,
    };
    const withBase = createMiraCodeMirrorExtensions(shared);
    const withoutBase = createMiraCodeMirrorExtensions({
      ...shared,
      includeBaseExtensions: false,
    });

    expect(withBase).toHaveLength(
      withoutBase.length + createBaseCodeMirrorExtensions().length,
    );

    const parent = document.createElement("div");
    const view = new EditorView({
      doc: "/",
      extensions: withoutBase,
      parent,
    });

    expect(view.dom.classList.contains("mira-codemirror")).toBe(false);
    expect(view.dom.classList.contains("consumer-authoring")).toBe(true);
    expect(parent.querySelector(".mira-block-controls-gutter")).not.toBeNull();

    view.destroy();
  });
});
