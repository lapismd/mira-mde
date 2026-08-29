import { history, undo } from "@codemirror/commands";
import { describe, expect, it, vi } from "vitest";
import { EditorView } from "@codemirror/view";
import {
  defineMiraExtension,
  doodleDividersExtension,
} from "@lapismd/mira/extensions";
import { createMarkdownCodeMirrorExtensions } from "../markdown";
import { createRichEditorExtensions } from ".";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

describe("createRichEditorExtensions", () => {
  it("can be disabled", () => {
    expect(createRichEditorExtensions({ enabled: false })).toEqual([]);
  });

  it("preserves a local frontmatter disclosure across preview widget remounts", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = "---\ntitle: Portable\n---\n\n# Note";
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.length },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          frontmatterOpen: false,
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const expand = parent.querySelector<HTMLButtonElement>(
      '.mira-rich-widget--frontmatter button[aria-label="Expand properties"]',
    );
    expect(expand).not.toBeNull();
    expand?.click();
    await nextFrame();
    expect(parent.querySelector(".md-frontmatter__content")).not.toBeNull();

    view.dispatch({ selection: { anchor: 2 } });
    await nextFrame();
    expect(parent.querySelector(".mira-rich-widget--frontmatter")).toBeNull();

    view.dispatch({ selection: { anchor: source.length } });
    await nextFrame();
    await nextFrame();
    expect(
      parent.querySelector(
        '.mira-rich-widget--frontmatter button[aria-label="Collapse properties"]',
      ),
    ).not.toBeNull();
    expect(parent.querySelector(".md-frontmatter__content")).not.toBeNull();

    view.destroy();
    parent.remove();
  });

  it("keeps an interactive frontmatter menu mounted while its trigger receives focus", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = "---\ntitle: Portable\n---\n\n# Note";
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.length },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          frontmatterOpen: true,
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const trigger = parent.querySelector<HTMLButtonElement>(
      'button[aria-label="Property options for title"]',
    );
    expect(trigger).not.toBeNull();
    trigger?.focus();
    trigger?.click();
    await nextFrame();

    expect(trigger?.isConnected).toBe(true);
    expect(trigger?.getAttribute("aria-expanded")).toBe("true");
    expect(
      document.body.querySelector(
        '[role="menu"][aria-label="Property options for title"]',
      ),
    ).not.toBeNull();

    view.destroy();
    parent.remove();
  });

  it("renders and reveals a seeded divider comment and rule as one widget", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = `<!-- mira-divider:v1:4f32a91c -->
---

After`;
    const doodles = doodleDividersExtension();
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.length },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          extensions: [doodles],
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const widget = parent.querySelector<HTMLElement>(
      ".mira-rich-widget--horizontalrule",
    );
    const divider = widget?.querySelector<SVGElement>(".mira-doodle-divider");
    expect(widget).not.toBeNull();
    expect(divider?.dataset.seed).toBe("4f32a91c");
    expect(parent.textContent).not.toContain("mira-divider:v1");

    divider?.dispatchEvent(
      new MouseEvent("click", { bubbles: true, button: 0 }),
    );
    await nextFrame();

    expect(view.state.selection.main.from).toBe(0);
    expect(view.state.selection.main.to).toBe(source.indexOf("\n\nAfter"));
    expect(parent.textContent).toContain("mira-divider:v1:4f32a91c");

    view.destroy();
    parent.remove();
  });

  it("rerolls and selects a seeded divider family from its Live Preview controls", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = `<!-- mira-divider:v1:00000008 -->
---

After`;
    const createSeed = vi
      .fn()
      .mockReturnValueOnce(0x00000008)
      .mockReturnValue(0);
    const doodles = doodleDividersExtension({ createSeed });
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.length },
      extensions: [
        history(),
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          sourcePath: "notes/dividers.md",
          extensions: [doodles],
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const initialVariant = parent.querySelector<SVGElement>(
      ".mira-doodle-divider",
    )?.dataset.variant;
    const refresh = parent.querySelector<HTMLButtonElement>(
      'button[aria-label="Refresh divider style"]',
    );
    expect(initialVariant).toBe("scribble");
    expect(refresh).not.toBeNull();
    refresh?.click();
    await nextFrame();
    await nextFrame();

    expect(view.state.doc.toString()).not.toContain(
      "<!-- mira-divider:v1:00000008 -->",
    );
    expect(
      parent.querySelector<SVGElement>(".mira-doodle-divider")?.dataset.variant,
    ).not.toBe("scribble");
    expect(view.state.selection.main.anchor).toBe(source.length);
    expect(createSeed).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        line: 2,
        reason: "reroll",
        sourcePath: "notes/dividers.md",
      }),
    );

    expect(undo(view)).toBe(true);
    await nextFrame();
    await nextFrame();
    expect(view.state.doc.toString()).toBe(source);

    const picker = parent.querySelector<HTMLButtonElement>(
      'button[aria-label="Choose divider style"]',
    );
    picker?.click();
    const menu = parent.querySelector<HTMLElement>(
      '[role="menu"][aria-label="Divider style"]',
    );
    expect(picker?.getAttribute("aria-expanded")).toBe("true");
    expect(menu?.hidden).toBe(false);
    expect(menu?.querySelectorAll('[role="menuitemradio"]')).toHaveLength(8);
    expect(
      menu?.querySelector('[role="menuitemradio"][aria-checked="true"]')
        ?.textContent,
    ).toContain("Scribble");

    await nextFrame();
    const plain = [
      ...(menu?.querySelectorAll<HTMLButtonElement>("button") ?? []),
    ].find((button) => button.textContent?.includes("Plain"));
    menu?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
    );
    expect(document.activeElement).toBe(plain);
    menu?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
    );
    expect(menu?.hidden).toBe(true);
    expect(document.activeElement).toBe(picker);

    picker?.click();
    await nextFrame();
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(menu?.hidden).toBe(true);

    picker?.click();
    plain?.click();
    await nextFrame();
    await nextFrame();

    expect(
      parent.querySelector<SVGElement>(".mira-doodle-divider")?.dataset.variant,
    ).toBe("plain");
    expect(view.state.doc.toString()).not.toContain("00000008");
    expect(createSeed).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        line: 2,
        reason: "variant",
        sourcePath: "notes/dividers.md",
      }),
    );
    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe(source);

    view.destroy();
    parent.remove();
  });

  it("allows consumers to disable Live Preview divider controls", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const doodles = doodleDividersExtension({ controls: false });
    const view = new EditorView({
      doc: "<!-- mira-divider:v1:00000008 -->\n---",
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          extensions: [doodles],
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    expect(parent.querySelector(".mira-doodle-divider")).not.toBeNull();
    expect(parent.querySelector(".mira-doodle-divider__controls")).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("keeps readonly Live Preview dividers decorative", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const doodles = doodleDividersExtension();
    const view = new EditorView({
      doc: "<!-- mira-divider:v1:00000008 -->\n---",
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          readonly: true,
          extensions: [doodles],
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    expect(parent.querySelector(".mira-doodle-divider")).not.toBeNull();
    expect(parent.querySelector(".mira-doodle-divider__controls")).toBeNull();

    view.destroy();
    parent.remove();
  });

  it("renders an indented seeded divider inside a list item", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = `- Parent item

  <!-- mira-divider:v1:00000004 -->
  ---

  Content after the divider`;
    const doodles = doodleDividersExtension();
    const view = new EditorView({
      doc: source,
      selection: { anchor: 0 },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({
          livePreview: true,
          extensions: [doodles],
        }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    expect(
      parent.querySelector<SVGElement>(".mira-doodle-divider")?.dataset.seed,
    ).toBe("00000004");
    expect(parent.textContent).not.toContain("mira-divider:v1");

    view.destroy();
    parent.remove();
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

  it("keeps ordinary parentheses visible while hiding real link closers", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = [
      "You might mean tools (what I can run in Cursor) next.",
      "",
      "## Agent tools (what I can use in this chat)",
      "",
      "See [docs](https://example.com) after.",
    ].join("\n");
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.length },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({ livePreview: true }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const proseLine = [...parent.querySelectorAll(".cm-line")].find((line) =>
      line.textContent?.includes("what I can run in Cursor"),
    );
    const headingLine = [...parent.querySelectorAll(".cm-line")].find((line) =>
      line.textContent?.includes("what I can use in this chat"),
    );
    const linkLine = [...parent.querySelectorAll(".cm-line")].find((line) =>
      line.textContent?.includes("https://example.com"),
    );

    expect(proseLine).toBeDefined();
    expect(headingLine).toBeDefined();
    expect(linkLine).toBeDefined();

    const hiddenProseParens = [
      ...(proseLine?.querySelectorAll(".cm-formatting-hidden") ?? []),
    ].filter((node) => (node.textContent || "").includes(")"));
    const hiddenHeadingParens = [
      ...(headingLine?.querySelectorAll(".cm-formatting-hidden") ?? []),
    ].filter((node) => (node.textContent || "").includes(")"));
    const hiddenLinkClosers = [
      ...(linkLine?.querySelectorAll(".cm-formatting-hidden") ?? []),
    ].filter((node) => {
      const text = node.textContent || "";
      return text.includes(")") || text.includes("](");
    });

    expect(hiddenProseParens).toHaveLength(0);
    expect(hiddenHeadingParens).toHaveLength(0);
    expect(proseLine?.textContent).toContain("Cursor)");
    expect(headingLine?.textContent).toContain("chat)");
    expect(hiddenLinkClosers.length).toBeGreaterThan(0);
    expect(
      hiddenLinkClosers.some((node) => (node.textContent || "").includes(")")),
    ).toBe(true);

    view.destroy();
    parent.remove();
  });

  it("keeps hidden heading syntax out of the live-preview line box", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = "# Visible heading\n\nParagraph";
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.length },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({ livePreview: true }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    const hiddenFormatting = parent.querySelector<HTMLElement>(
      ".cm-header .cm-formatting-hidden",
    );
    expect(hiddenFormatting).not.toBeNull();
    const style = getComputedStyle(hiddenFormatting!);
    expect(style.display).toBe("inline-block");
    expect(Number.parseFloat(style.height)).toBe(0);
    expect(Number.parseFloat(style.lineHeight)).toBe(0);

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

  it("replaces only the task marker when a custom task type is selected", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const source = "- [?] Needs decision";
    const view = new EditorView({
      doc: source,
      selection: { anchor: source.indexOf("Needs") + 2 },
      extensions: [
        createMarkdownCodeMirrorExtensions(),
        createRichEditorExtensions({ livePreview: true }),
      ],
      parent,
    });
    await nextFrame();
    await nextFrame();

    parent
      .querySelector<HTMLButtonElement>('button[aria-label="Change task type"]')
      ?.click();
    await nextFrame();
    document.body
      .querySelector<HTMLButtonElement>(
        '.mira-task-state-option__action[aria-label="Starred"]',
      )
      ?.click();
    await nextFrame();
    await nextFrame();

    expect(view.state.doc.toString()).toBe("- [*] Needs decision");

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
    const trigger = parent.querySelector<HTMLElement>(
      "[data-callout-char='^']",
    );
    expect(trigger?.tagName).toBe("BUTTON");
    expect(trigger?.getAttribute("aria-label")).toBe(
      "Change list highlight (^)",
    );

    view.destroy();
    parent.remove();
  });
});
