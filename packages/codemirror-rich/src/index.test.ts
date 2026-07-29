import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { defineMiraExtension } from "@mira-mde/extensions";
import { createRichEditorExtensions } from ".";

describe("createRichEditorExtensions", () => {
  it("can be disabled", () => {
    expect(createRichEditorExtensions({ enabled: false })).toEqual([]);
  });

  it("keeps inline mark decorations when live preview is off", () => {
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

    // Source keeps marks/theme/fold/block-controls but drops block widgets,
    // indent guides, and live-preview editor attributes.
    expect(sourceMode.length).toBeGreaterThan(0);
    expect(sourceMode.length).toBeLessThan(livePreview.length);
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
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(parent.querySelector(".cm-line[data-callout='^']")).not.toBeNull();
    expect(parent.querySelector(".cm-line[data-callout='%']")).toBeNull();
    expect(parent.querySelector("[data-callout-char='^']")).not.toBeNull();

    view.destroy();
    parent.remove();
  });
});
