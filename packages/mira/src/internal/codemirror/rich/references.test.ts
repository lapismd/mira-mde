import { afterEach, expect, it, vi } from "vitest";
import { EditorView } from "@codemirror/view";
import { createMarkdownCodeMirrorExtensions } from "../markdown";
import { createRichEditorExtensions } from ".";
import { Text } from "@codemirror/state";
import {
  markdownReferenceDefinitions,
  markdownReferenceTarget,
} from "./utils/references";

const views: EditorView[] = [];
afterEach(() => {
  for (const view of views.splice(0)) {
    const parent = view.dom.parentElement;
    view.destroy();
    parent?.remove();
  }
});
function editor(doc: string, anchor = 0, livePreview = true) {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    parent,
    doc,
    selection: { anchor },
    extensions: [
      createMarkdownCodeMirrorExtensions({ sourceMode: !livePreview }),
      createRichEditorExtensions({ livePreview }),
    ],
  });
  views.push(view);
  return view;
}

it("reveals an entire reference definition while its URL is being edited", async () => {
  const doc = "Before\n\n[ref]: https://codeberg.org/forgejo/forgejo\n\nAfter";
  const view = editor(doc, doc.indexOf("codeberg"));
  await vi.waitFor(() => {
    const line = [...view.dom.querySelectorAll(".cm-line")].find((e) =>
      e.textContent?.includes("codeberg"),
    );
    expect(line?.textContent).toBe(
      "[ref]: https://codeberg.org/forgejo/forgejo",
    );
    expect(line?.querySelector(".cm-formatting-hidden")).toBeNull();
  });
});

it("renders inactive definitions with their authored name and preserves source on activation", async () => {
  const doc =
    "Before\n\n[Forge Docs]: https://codeberg.org/forgejo/forgejo\n\nAfter";
  const view = editor(doc);
  await vi.waitFor(() =>
    expect(view.dom.querySelector(".mira-reference-definition")).not.toBeNull(),
  );
  const row = view.dom.querySelector<HTMLElement>(
    ".mira-reference-definition",
  )!;
  expect(row.querySelector(".mira-reference__label")?.textContent).toBe(
    "Forge Docs",
  );
  expect(row.querySelector("a")?.getAttribute("href")).toBe(
    "https://codeberg.org/forgejo/forgejo",
  );
  row.querySelector<HTMLButtonElement>("button")!.click();
  expect(
    view.state.sliceDoc(
      view.state.selection.main.from,
      view.state.selection.main.to,
    ),
  ).toBe("[Forge Docs]: https://codeberg.org/forgejo/forgejo");
  expect(view.state.doc.toString()).toBe(doc);
});

it("marks reference images and their definitions while retaining authored alt text", async () => {
  const doc =
    'Before\n\n![Photo][picture]\n\n[Picture]: /mira-markdown-demo.svg "Mountain"\n\nAfter';
  const view = editor(doc);
  await vi.waitFor(() =>
    expect(view.dom.querySelectorAll(".mira-reference--image")).toHaveLength(2),
  );
  const usage = view.dom.querySelector(".mira-rich-widget--image");
  expect(usage?.querySelector(".mira-reference__label")?.textContent).toBe(
    "Picture",
  );
  expect(
    view.dom.querySelector(".mira-reference-definition .mira-reference__label")
      ?.textContent,
  ).toBe("Picture");
  expect(usage?.querySelector("img")?.alt).toBe("Photo");
  expect(view.state.doc.toString()).toBe(doc);
});

it("keeps reference definitions literal in source mode and code fences", async () => {
  const source = editor("Before\n\n[ref]: https://example.com\n", 0, false);
  const code = editor(
    "Before\n\n```md\n[ref]: https://example.com\n```\n\nAfter",
  );
  await vi.waitFor(() =>
    expect(source.dom.textContent).toContain("[ref]: https://example.com"),
  );
  expect(source.dom.querySelector(".mira-reference-definition")).toBeNull();
  expect(code.dom.querySelector(".mira-reference-definition")).toBeNull();
});

it("refreshes definition names and destinations when the document changes", async () => {
  const doc = "Before\n\n![Photo][picture]\n\n[Picture]: /old.svg\n\nAfter";
  const view = editor(doc);
  await vi.waitFor(() =>
    expect(
      view.dom.querySelectorAll('[data-reference-label="Picture"]'),
    ).toHaveLength(2),
  );
  view.dispatch({
    changes: {
      from: doc.indexOf("[Picture]"),
      to: doc.indexOf("\n\nAfter"),
      insert: "[PICTURE]: /new.svg",
    },
  });
  await vi.waitFor(() => {
    expect(
      view.dom.querySelectorAll('[data-reference-label="PICTURE"]'),
    ).toHaveLength(2);
    expect(view.dom.querySelector("img")?.getAttribute("src")).toBe("/new.svg");
  });
});

it("uses parsed first definitions, normalized matching and complete multiline source ranges", () => {
  const doc = Text.of([
    "Before",
    "",
    "[My  Docs]: <https://example.com/a%20b>",
    '  "A title"',
    "",
    "[my docs]: https://ignored.example",
    "",
    "```md",
    "[Fake]: https://fake.example",
    "```",
  ]);
  const target = markdownReferenceTarget(doc, "my docs");
  expect(target?.label).toBe("My  Docs");
  expect(target?.definition).toContain('"A title"');
  expect(target?.definition).not.toContain("ignored.example");
  expect(markdownReferenceTarget(doc, "fake")).toBeNull();
  const definitions = markdownReferenceDefinitions(doc);
  expect(definitions).toHaveLength(2);
  expect(doc.sliceString(definitions[0]!.from, definitions[0]!.to)).toBe(
    '[My  Docs]: <https://example.com/a%20b>\n  "A title"',
  );
  expect(markdownReferenceDefinitions(doc)).toBe(definitions);
});

it("retains safe navigation when presenting a reference definition", async () => {
  const doc = "Before\n\n[Unsafe]: javascript:alert(1)\n\nAfter";
  const view = editor(doc);
  await vi.waitFor(() =>
    expect(
      view.dom.querySelector(".mira-reference-definition")?.textContent,
    ).toContain("Unsafe"),
  );
  expect(view.dom.querySelector('a[href^="javascript:"]')).toBeNull();
  expect(view.state.doc.toString()).toBe(doc);
});
