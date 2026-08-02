import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { defineMiraExtension } from "@mira-mde/extensions";
import { createRichEditorExtensions } from ".";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("createRichEditorExtensions", () => {
  it("can be disabled", () => {
    expect(createRichEditorExtensions({ enabled: false })).toEqual([]);
  });

  it("keeps source mode free of live-preview hide/replace decorations", async () => {
    const nonempty = (
      extensions: ReturnType<typeof createRichEditorExtensions>,
    ) =>
      extensions.filter((extension) => {
        if (Array.isArray(extension)) {
          return extension.length > 0;
        }
        return extension != null;
      });

    const livePreview = nonempty(
      createRichEditorExtensions({ livePreview: true }),
    );
    const sourceMode = nonempty(
      createRichEditorExtensions({ livePreview: false }),
    );

    expect(sourceMode.length).toBeGreaterThan(0);
    expect(sourceMode.length).toBeLessThan(livePreview.length);

    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: [
        "> quoted line",
        "",
        "Has `inline code` here",
        "",
        "```js",
        "const value = 1;",
        "```",
      ].join("\n"),
      extensions: createRichEditorExtensions({ livePreview: false }),
      parent,
    });
    await nextFrame();

    expect(parent.querySelector(".cm-formatting-hidden")).toBeNull();
    expect(parent.querySelector(".cm-inline-code")).toBeNull();
    expect(parent.querySelector(".mira-rich-widget")).toBeNull();
    expect(parent.querySelector(".cm-formatting-quote")).toBeNull();
    // Source keeps fence chrome (bg + start/end radius) with visible markers.
    expect(parent.querySelector(".cm-formatting-code-start")).not.toBeNull();
    expect(parent.querySelector(".cm-formatting-code-end")).not.toBeNull();
    expect(parent.textContent).toContain("> quoted line");
    expect(parent.textContent).toContain("`inline code`");
    expect(parent.textContent).toContain("```js");

    view.destroy();
    parent.remove();
  });

  it("uses list-callout contributions from Mira extensions", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "- ^ Decision\n- % Plain",
      extensions: [
        createRichEditorExtensions({
          extensions: [
            defineMiraExtension({
              name: "list-callouts",
              listCallouts: [
                { char: "^", color: "99, 102, 241" },
                { char: "%", enabled: false },
              ],
            }),
          ],
        }),
      ],
      parent,
    });
    await nextFrame();

    expect(parent.querySelector(".cm-line[data-callout='^']")).not.toBeNull();
    expect(parent.querySelector(".cm-line[data-callout='%']")).toBeNull();
    expect(parent.querySelector("[data-callout-char='^']")).not.toBeNull();

    view.destroy();
    parent.remove();
  });
});
