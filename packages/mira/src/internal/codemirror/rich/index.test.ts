import { describe, expect, it } from "vitest";
import { EditorView } from "@codemirror/view";
import { defineMiraExtension } from "@lapismd/mira/extensions";
import { createMarkdownCodeMirrorExtensions } from "../markdown";
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

  it("keeps blockquote markers from collapsing when the line is focused", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "> quoted line\n\nAfter",
      extensions: createRichEditorExtensions({ livePreview: true }),
      parent,
    });
    await nextFrame();

    // Caret in quote content (after "> "), not on the marker itself.
    view.dispatch({ selection: { anchor: 4, head: 4 } });
    await nextFrame();

    const quoteLine = [...parent.querySelectorAll(".cm-line")].find((line) =>
      (line.textContent || "").includes("quoted line"),
    );
    expect(quoteLine).toBeTruthy();
    const hiddenQuoteMarks = [
      ...quoteLine!.querySelectorAll(".cm-formatting-hidden"),
    ].filter((node) => (node.textContent || "").includes(">"));
    expect(hiddenQuoteMarks).toHaveLength(0);
    expect(quoteLine!.textContent).toContain(">");

    view.destroy();
    parent.remove();
  });

  it("keeps a blockquote-nested task marker complete while it is edited", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = "  >   - [ ] Quoted checklist child";
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.indexOf("[") + 1 },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({ livePreview: true }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const taskLine = [...parent.querySelectorAll(".cm-line")].find((line) =>
      line.textContent?.includes("Quoted checklist child"),
    );
    expect(taskLine?.textContent).toContain("- [ ] Quoted checklist child");
    expect(
      [...(taskLine?.querySelectorAll(".cm-formatting-hidden") ?? [])].filter(
        (node) => node.textContent?.includes("["),
      ),
    ).toHaveLength(0);
    expect(taskLine?.querySelector(".cm-task-checkbox")).toBeNull();

    view.dispatch({
      selection: { anchor: source.indexOf("Quoted checklist child") + 3 },
    });
    await nextFrame();
    await nextFrame();

    expect(taskLine?.querySelector(".cm-task-checkbox")).not.toBeNull();

    view.destroy();
    parent.remove();
  });

  it("reserves nested border chrome for nested quote prefixes", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "> outer quote\n> > nested quote",
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({ livePreview: true }),
      ],
      parent,
    });
    view.dispatch({ selection: { anchor: 5 } });
    await nextFrame();
    await nextFrame();

    const lines = [...parent.querySelectorAll(".cm-line")];
    const outer = lines.find((line) =>
      line.textContent?.includes("outer quote"),
    );
    const nested = lines.find((line) =>
      line.textContent?.includes("nested quote"),
    );
    expect(outer?.querySelector(".cm-formatting-quote-1")).not.toBeNull();
    expect(outer?.querySelector(".cm-blockquote-border")).toBeNull();
    expect(nested?.querySelector(".cm-formatting-quote-2")).not.toBeNull();
    expect(nested?.querySelector(".cm-blockquote-border")).not.toBeNull();

    view.destroy();
    parent.remove();
  });

  it("resets source whitespace on rendered block widgets", () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "After",
      extensions: createRichEditorExtensions({ livePreview: true }),
      parent,
    });
    const widget = document.createElement("div");
    widget.className =
      "mira-rich-widget mira-rich-widget--block mira-rich-widget--blockquote";
    view.contentDOM.append(widget);

    expect(getComputedStyle(view.contentDOM).whiteSpace).not.toBe("normal");
    expect(getComputedStyle(widget).whiteSpace).toBe("normal");

    view.destroy();
    parent.remove();
  });

  it("renders a four-space list continuation as a blockquote widget", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: [
        "> > Nested quote keeps a second quote guide.",
        "3. Blockquote inside a list item:",
        "",
        "    > Skip a line and indent the quote markers four spaces.",
        "    > The rendered blockquote stays attached to its first source line.",
      ].join("\n"),
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({ livePreview: true }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const widget = [...parent.querySelectorAll(".mira-rich-widget")].find(
      (element) => element.textContent?.includes("Skip a line and indent"),
    );
    expect(widget?.getAttribute("data-node")).toBe("Blockquote");
    expect(widget?.querySelector("blockquote")).not.toBeNull();
    expect(widget?.querySelector(".mira-code-block")).toBeNull();
    expect(widget?.textContent).not.toContain(
      "> The rendered blockquote stays attached",
    );
    expect(parent.querySelector(".cm-indented-codeblock")).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("maps normalized blockquote widget edits back to indented source", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = [
      "3. Blockquote inside a list item:",
      "",
      "    > First quoted line",
      "    > - [ ] Nested task",
    ].join("\n");
    let edit:
      | { from: number; nextValue: string; replacement: string; to: number }
      | undefined;
    const view = new EditorView({
      doc: source,
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          onChange(replacement, from, to, nextValue) {
            edit = { replacement, from, to, nextValue };
          },
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const checkbox = parent.querySelector<HTMLInputElement>(
      'input[aria-label="Toggle task"]',
    );
    expect(checkbox).not.toBeNull();
    checkbox!.checked = true;
    checkbox!.dispatchEvent(new Event("change", { bubbles: true }));
    await nextFrame();

    expect(edit).toBeDefined();
    expect(source.slice(edit!.from, edit!.to)).toBe(" ");
    expect(edit!.replacement).toBe("x");
    expect(edit!.nextValue).toContain("    > - [x] Nested task");

    view.destroy();
    parent.remove();
  });

  it("marks editors that render full-height indentation guides", () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "    Wrapped continuation",
      extensions: createRichEditorExtensions({ indentGuides: true }),
      parent,
    });

    expect(view.dom.classList.contains("cm-show-indentation-guides")).toBe(
      true,
    );

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
