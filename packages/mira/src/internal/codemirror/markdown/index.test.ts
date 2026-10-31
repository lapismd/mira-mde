import { describe, expect, it, vi } from "vitest";
import { createBaseCodeMirrorExtensions } from "../base";
import { syntaxTree } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createMarkdownCodeMirrorExtensions } from ".";

describe("createMarkdownCodeMirrorExtensions", () => {
  it.each([false, true])(
    "highlights fenced JavaScript with container directive %s in source mode",
    async (nested) => {
      const parent = document.createElement("div");
      document.body.append(parent);
      const view = new EditorView({
        doc: (nested
          ? [
              ':::cell{#code lang="js"}',
              "```js",
              "const answer = 42;",
              "```",
              ":::",
            ]
          : ["```js", "const answer = 42;", "```"]
        ).join("\n"),
        extensions: [
          createBaseCodeMirrorExtensions(),
          createMarkdownCodeMirrorExtensions({ sourceMode: true }),
        ],
        parent,
      });
      try {
        await vi.waitFor(() =>
          expect(parent.querySelector(".cm-keyword")?.textContent).toBe(
            "const",
          ),
        );
        expect(parent.querySelector(".cm-number")?.textContent).toBe("42");
      } finally {
        view.destroy();
        parent.remove();
      }
    },
  );
  it("returns markdown language and decoration extensions", () => {
    expect(createMarkdownCodeMirrorExtensions()).toHaveLength(3);
  });

  it.each([
    ["ts", "const answer: number = 42;", "const"],
    ["sql", "SELECT 42 AS answer;", "SELECT"],
  ])(
    "loads %s highlighting inside nested directives and updates after editing",
    async (language, source, keyword) => {
      const parent = document.createElement("div");
      document.body.append(parent);
      const doc = [
        "::::panel",
        ":::cell{#code}",
        `\`\`\`${language}`,
        source,
        "```",
        ":::",
        "::::",
      ].join("\n");
      const view = new EditorView({
        doc,
        extensions: [
          createBaseCodeMirrorExtensions(),
          createMarkdownCodeMirrorExtensions({ sourceMode: true }),
        ],
        parent,
      });
      try {
        await vi.waitFor(() =>
          expect(parent.querySelector(".cm-keyword")?.textContent).toBe(
            keyword,
          ),
        );
        expect(parent.querySelector(".cm-number")?.textContent).toBe("42");
        const from = view.state.doc.toString().indexOf("42");
        view.dispatch({ changes: { from, to: from + 2, insert: "73" } });
        await vi.waitFor(() =>
          expect(parent.querySelector(".cm-number")?.textContent).toBe("73"),
        );
        expect(parent.querySelector(".cm-keyword")?.textContent).toBe(keyword);
      } finally {
        view.destroy();
        parent.remove();
      }
    },
  );

  it("parses bare http urls as autolinks", () => {
    const state = EditorState.create({
      doc: "See https://example.com for details.",
      extensions: createMarkdownCodeMirrorExtensions(),
    });

    const tree = syntaxTree(state);
    expect(tree.toString()).toContain("URL");
    let url = "";
    tree.iterate({
      enter(node) {
        if (node.name === "URL") {
          url = state.sliceDoc(node.from, node.to);
        }
      },
    });
    expect(url).toBe("https://example.com");
  });

  it("parses Lapis-style grid tables", () => {
    const state = EditorState.create({
      doc: [
        "+---------+----------+",
        "| Feature | Behavior |",
        "+=========+==========+",
        "| Menus   | Actions  |",
        "+---------+----------+",
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });

    expect(syntaxTree(state).toString()).toContain("GridTable");
  });

  it("starts a list after a lazy blockquote before parsing its indented quote", () => {
    const state = EditorState.create({
      doc: [
        "- Unordered parent",
        "  > Quoted paragraph",
        "  > > Nested quote keeps a second quote guide.",
        "3. Blockquote inside a list item:",
        "",
        "    > Skip a line and indent the quote markers four spaces.",
        "    > The rendered blockquote stays attached to its first source line.",
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain(
      "BulletList(ListItem(ListMark,Paragraph,Blockquote(QuoteMark,Paragraph,QuoteMark,Blockquote",
    );
    expect(tree).toContain(
      "OrderedList(ListItem(ListMark,Paragraph,Blockquote(QuoteMark,Paragraph(QuoteMark))))",
    );
    expect(tree).not.toContain("CodeBlock");
  });

  it("marks quoted task delimiters for source-mode styling", async () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      doc: "  >   - [ ] Quoted checklist child",
      extensions: createMarkdownCodeMirrorExtensions({ sourceMode: true }),
      parent,
    });
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const delimiter = parent.querySelector(".cm-formatting-task");
    expect(delimiter?.textContent).toBe("[ ]");

    view.destroy();
    parent.remove();
  });

  it.each([
    ["justify", ["+>-----<+", "| A b C |", "+-------+"]],
    ["center", ["+:-----:+", "|  ABC  |", "+-------+"]],
    ["left", ["+:------+", "| ABC   |", "+------+"]],
    ["right", ["+------:+", "|   ABC |", "+------+"]],
    [
      "top",
      [
        "+---^---+",
        "| Larum |",
        "| Ipsum |",
        "|       |",
        "|       |",
        "+-------+",
      ],
    ],
    [
      "middle",
      [
        "+---x---+",
        "|       |",
        "| Larum |",
        "| Ipsum |",
        "|       |",
        "+-------+",
      ],
    ],
    [
      "bottom",
      [
        "+---v---+",
        "|       |",
        "|       |",
        "| Larum |",
        "| Ipsum |",
        "+-------+",
      ],
    ],
  ])("parses Adobe %s alignment grid table separators", (_, markdown) => {
    const state = EditorState.create({
      doc: markdown.join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });

    expect(syntaxTree(state).toString()).toContain("GridTable");
  });

  it("parses Lapis wikilink, embed, pathlink, and tag nodes", () => {
    const state = EditorState.create({
      doc: [
        "[[Project Plan#Section|Plan]]",
        "![[Architecture Diagram#Overview|Diagram]]",
        "[Project](notes/Project Plan.md)",
        "#mira/editor",
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("WikiLink");
    expect(tree).toContain("WikiLinkPath");
    expect(tree).toContain("WikiLinkAnchor");
    expect(tree).toContain("WikiLinkText");
    expect(tree).toContain("EmbedLink");
    expect(tree).toContain("EmbedLinkPath");
    expect(tree).toContain("EmbedLinkAnchor");
    expect(tree).toContain("EmbedLinkText");
    expect(tree).toContain("PathLink");
    expect(tree).toContain("PathLinkDestination");
    expect(tree).toContain("Tag");
    expect(tree).toContain("TagName");
  });

  it("parses single-backslash bracket math delimiters", () => {
    const state = EditorState.create({
      doc: ["inline \\(x + 1\\)", "\\[", "x + 1", "\\]"].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("InlineMathBracket");
    expect(tree).toContain("BlockMathBracket");
  });

  it("parses container, leaf, and inline directives structurally", () => {
    const state = EditorState.create({
      doc: [
        ':::cell[Load data]{lang="ts"}',
        "```ts",
        "const value = 1;",
        "```",
        ":::",
        "",
        "::badge[Stable]{tone=success}",
        "",
        'Use :abbr[HTML]{title="HyperText Markup Language"}.',
      ].join("\n"),
      extensions: createMarkdownCodeMirrorExtensions(),
    });
    const tree = syntaxTree(state).toString();

    expect(tree).toContain("ContainerDirective");
    expect(tree).toContain("LeafDirective");
    expect(tree).toContain("InlineDirective");
    expect(tree).toContain("DirectiveName");
    expect(tree).toContain("DirectiveArgs");
    expect(tree).toContain("DirectiveAttrName");
    expect(tree).toContain("DirectiveAttrValue");
    expect(tree).toContain("FencedCode");
  });
});
