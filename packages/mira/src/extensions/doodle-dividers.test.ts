import { history, undo } from "@codemirror/commands";
import { EditorState, Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMiraMarkdownLanguage } from "../internal/codemirror/markdown";
import {
  collectMarkdownBlockRanges,
  duplicateMarkdownBlockRange,
} from "../internal/codemirror/rich/block-ranges";
import {
  defaultMiraDoodleDividerVariants,
  doodleDividersExtension,
  materializeDoodleDividerSeeds,
  type MiraDoodleDividerSeedContext,
} from ".";
import {
  createMiraDoodleDividerRandom,
  resolveMiraDoodleDividerDrawing,
} from "./doodle-dividers";

const editors: EditorView[] = [];

afterEach(() => {
  for (const editor of editors.splice(0)) {
    const parent = editor.dom.parentElement;
    editor.destroy();
    parent?.remove();
  }
});

describe("doodle divider seed materialization", () => {
  it("adds seeds only to semantic unseeded thematic breaks", () => {
    let seed = 1;
    const markdown = `---
title: Demo
---

Setext heading
---

| Column |
| --- |
| Value |

---

> ---

<!-- mira-divider:v1:000000ff -->
***`;

    expect(
      materializeDoodleDividerSeeds(markdown, {
        createSeed: () => seed++,
      }),
    ).toBe(`---
title: Demo
---

Setext heading
---

| Column |
| --- |
| Value |

<!-- mira-divider:v1:00000001 -->
---

> <!-- mira-divider:v1:00000002 -->
> ---

<!-- mira-divider:v1:000000ff -->
***`);
  });

  it("keeps existing, malformed, and orphan comments distinct", () => {
    const markdown = `<!-- mira-divider:v1:0000000a -->
---

<!-- mira-divider:v2:0000000b -->

Paragraph`;

    expect(
      materializeDoodleDividerSeeds(markdown, { createSeed: () => 12 }),
    ).toBe(markdown);
  });
});

describe("doodle divider authoring", () => {
  it("seeds typed rules in the original undoable transaction", () => {
    const createSeed = vi.fn(() => 0x2a);
    const view = createEditor("Intro\n\n", createSeed);
    const before = view.state.doc.toString();

    view.dispatch({
      changes: { from: before.length, insert: "---" },
      annotations: Transaction.userEvent.of("input.type"),
    });

    expect(view.state.doc.toString()).toBe(
      "Intro\n\n<!-- mira-divider:v1:0000002a -->\n---",
    );
    expect(createSeed).toHaveBeenCalledWith({
      line: 3,
      offset: 7,
      reason: "authoring",
      sourcePath: "notes/dividers.md",
    });
    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe(before);
  });

  it("seeds multiple pasted rules and preserves a pasted authored pair", () => {
    let seed = 1;
    const view = createEditor("", () => seed++);
    const pasted = `Intro

---

<!-- mira-divider:v1:000000ff -->
***

> ---`;

    view.dispatch({
      changes: { from: 0, insert: pasted },
      annotations: Transaction.userEvent.of("input.paste"),
    });

    expect(view.state.doc.toString()).toBe(`Intro

<!-- mira-divider:v1:00000001 -->
---

<!-- mira-divider:v1:000000ff -->
***

> <!-- mira-divider:v1:00000002 -->
> ---`);
  });

  it("does not rewrite existing bare rules on mount or unrelated edits", () => {
    const createSeed = vi.fn(() => 1);
    const view = createEditor("---\n\nParagraph", createSeed);

    view.dispatch({ selection: { anchor: view.state.doc.length } });
    view.dispatch({
      changes: { from: view.state.doc.length, insert: "!" },
      annotations: Transaction.userEvent.of("input.type"),
    });

    expect(view.state.doc.toString()).toBe("---\n\nParagraph!");
    expect(createSeed).not.toHaveBeenCalled();
  });

  it("gives an editor-duplicated pair a fresh seed", () => {
    const view = createEditor(
      "<!-- mira-divider:v1:00000001 -->\n---\n\nParagraph\n",
      () => 2,
    );
    const divider = collectMarkdownBlockRanges(view.state)[0]!;

    duplicateMarkdownBlockRange(view, divider);

    expect(view.state.doc.toString()).toBe(`<!-- mira-divider:v1:00000001 -->
---

<!-- mira-divider:v1:00000002 -->
---

Paragraph
`);
  });

  it("materializes existing rules through the contributed command", () => {
    const extension = doodleDividersExtension({ createSeed: () => 9 });
    const view = createEditor("Alpha\n\n---\n", () => 9);
    const command = extension.commands?.find(
      (candidate) => candidate.id === "mira-doodle-dividers-materialize",
    )!;
    const scrollTop = 18;
    view.scrollDOM.scrollTop = scrollTop;

    command.run({
      view,
      mode: "source",
      readonly: false,
      sourcePath: "notes/dividers.md",
      getValue: () => view.state.doc.toString(),
      setValue: () => undefined,
      focus: () => view.focus(),
      insertMarkdown: () => undefined,
    });

    expect(view.state.doc.toString()).toBe(
      "Alpha\n\n<!-- mira-divider:v1:00000009 -->\n---\n",
    );
    expect(view.scrollDOM.scrollTop).toBe(scrollTop);
    expect(undo(view)).toBe(true);
    expect(view.state.doc.toString()).toBe("Alpha\n\n---\n");
  });
});

describe("doodle divider rendering", () => {
  it("enhances only a rule immediately preceded by a valid seed comment", () => {
    const extension = doodleDividersExtension();
    const processor = extension.postProcessors?.[0]!;
    const parent = document.createElement("div");
    const hr = document.createElement("hr");
    parent.append(hr);
    const comment = {
      type: "comment",
      value: " mira-divider:v1:4f32a91c ",
    };
    const node = { type: "element", tagName: "hr" };
    const cleanup = processor(parent.firstElementChild as HTMLElement, node, {
      type: "root",
      children: [comment, node],
    });

    const svg = parent.querySelector<SVGElement>(".mira-doodle-divider");
    expect(hr.classList.contains("mira-doodle-divider__native")).toBe(true);
    expect(hr.getAttribute("role")).toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.dataset.seed).toBe("4f32a91c");
    expect(svg?.querySelectorAll("path").length).toBeGreaterThan(0);

    expect(cleanup).toBeTypeOf("function");
    cleanup?.();
    expect(parent.querySelector(".mira-doodle-divider")).toBeNull();
    expect(hr.classList.contains("mira-doodle-divider__native")).toBe(false);
  });

  it("falls back to the native rule for bare rules and invalid drawings", () => {
    const bare = doodleDividersExtension().postProcessors?.[0]!;
    const invalid = doodleDividersExtension({
      variants: [{ id: "invalid", draw: () => "M NaN Infinity" }],
    }).postProcessors?.[0]!;

    for (const [processor, previous] of [
      [bare, { type: "text", value: "ordinary" }],
      [invalid, { type: "comment", value: " mira-divider:v1:00000001 " }],
    ] as const) {
      const parent = document.createElement("div");
      const hr = document.createElement("hr");
      parent.append(hr);
      const node = { type: "element", tagName: "hr" };
      processor(hr, node, { children: [previous, node] });
      expect(hr.className).toBe("");
      expect(parent.children).toHaveLength(1);
    }
  });

  it("keeps path generation stable and independent from palette changes", () => {
    const first = resolveMiraDoodleDividerDrawing(0x4f32a91c);
    const second = resolveMiraDoodleDividerDrawing(0x4f32a91c, {
      palette: ["red", "blue"],
    });

    expect(second?.variant.id).toBe(first?.variant.id);
    expect(second?.paths).toEqual(first?.paths);
    expect(resolveMiraDoodleDividerDrawing(1, { variants: [] })).toBeNull();
    expect(resolveMiraDoodleDividerDrawing(1, { palette: [] })).toBeNull();
  });

  it("freezes a deterministic golden path for every v1 variant", () => {
    const paths = defaultMiraDoodleDividerVariants.map((entry) => ({
      id: entry.id,
      path: entry.draw({
        seed: 0x12345678,
        width: 1000,
        height: 32,
        random: createMiraDoodleDividerRandom(0x12345678),
      }),
    }));

    expect(paths.map(({ id }) => id)).toEqual([
      "scribble",
      "waves",
      "loop",
      "zigzag",
      "kink",
      "swoop",
      "notch",
      "plain",
    ]);
    expect(
      paths.every(({ path }) => !String(path).match(/NaN|Infinity/u)),
    ).toBe(true);
    expect(paths.map(({ path }) => stableHash(String(path)))).toEqual([
      130672128, 416521323, 3443166597, 3285835217, 218412563, 1401374405,
      4002757954, 1422833353,
    ]);
  });
});

function createEditor(
  markdown: string,
  createSeed: (context: MiraDoodleDividerSeedContext) => number,
): EditorView {
  const extension = doodleDividersExtension({ createSeed });
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    state: EditorState.create({
      doc: markdown,
      extensions: [
        history(),
        createMiraMarkdownLanguage(),
        extension.codeMirror?.({
          mode: "source",
          readonly: false,
          sourcePath: "notes/dividers.md",
        }) ?? [],
      ],
    }),
    parent,
  });
  editors.push(view);
  return view;
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
