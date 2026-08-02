// @vitest-environment jsdom
import { EditorView } from "@codemirror/view";
import { describe, expect, it, vi } from "vitest";
import {
  createImageMarkdown,
  createUploadingImageMarkdown,
  insertImageFiles,
  miraUploadingImageScheme,
} from "./images";

function createView(doc = ""): { view: EditorView; destroy: () => void } {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({ doc, parent });
  return {
    view,
    destroy() {
      view.destroy();
      parent.remove();
    },
  };
}

function pngFile(name = "shot.png"): File {
  return new File([new Uint8Array([137, 80, 78, 71])], name, {
    type: "image/png",
  });
}

describe("image markdown insertion", () => {
  it("generates reference-style image markdown by default", () => {
    expect(
      createImageMarkdown({
        alt: "Alt Text",
        doc: "",
        src: "data:image/png;base64,abc=",
        syntax: "reference",
      }),
    ).toBe("![Alt Text][alt-text]\n\n[alt-text]: data:image/png;base64,abc=");
  });

  it("avoids colliding with existing image reference labels", () => {
    expect(
      createImageMarkdown({
        alt: "Alt Text",
        doc: "[alt-text]: old",
        src: "data:image/png;base64,abc=",
        syntax: "reference",
      }),
    ).toContain("[alt-text-2]: data:image/png;base64,abc=");
  });

  it("can generate Carta-compatible inline image markdown", () => {
    expect(
      createImageMarkdown({
        alt: "Alt Text",
        doc: "",
        src: "data:image/png;base64,abc=",
        syntax: "inline",
      }),
    ).toBe("![Alt Text](data:image/png;base64,abc=)");
  });

  it("creates GitHub-style uploading placeholders with unique tokens", () => {
    const placeholder = createUploadingImageMarkdown(pngFile(), "abc-123");
    expect(placeholder).toBe(
      `![Uploading shot.png…](${miraUploadingImageScheme}abc-123)`,
    );
  });

  it("inserts uploading placeholders then replaces them when upload finishes", async () => {
    const { view, destroy } = createView("Before ");
    view.dispatch({
      selection: { anchor: view.state.doc.length },
    });

    let resolveUpload!: (src: string) => void;
    const upload = new Promise<string>((resolve) => {
      resolveUpload = resolve;
    });

    const insertPromise = insertImageFiles(view, [pngFile()], {
      imageUpload: () => upload,
      imageSyntax: "inline",
    });

    expect(view.state.doc.toString()).toMatch(
      /^Before !\[Uploading shot\.png…\]\(mira-uploading:[^)]+\)$/,
    );

    resolveUpload("https://cdn.example/shot.png");
    await insertPromise;

    expect(view.state.doc.toString()).toBe(
      "Before ![shot](https://cdn.example/shot.png)",
    );
    destroy();
  });

  it("removes the placeholder when upload fails", async () => {
    const { view, destroy } = createView("Hello");
    view.dispatch({
      selection: { anchor: view.state.doc.length },
    });
    const onImageUploadError = vi.fn();

    await insertImageFiles(view, [pngFile()], {
      imageUpload: async () => {
        throw new Error("upload failed");
      },
      imageSyntax: "inline",
      onImageUploadError,
    });

    expect(view.state.doc.toString()).toBe("Hello");
    expect(onImageUploadError).toHaveBeenCalledOnce();
    destroy();
  });

  it("uploads multiple images in parallel with distinct placeholders", async () => {
    const { view, destroy } = createView("");
    const resolvers: Array<(src: string) => void> = [];
    const uploads = [
      new Promise<string>((resolve) => resolvers.push(resolve)),
      new Promise<string>((resolve) => resolvers.push(resolve)),
    ];
    let uploadIndex = 0;

    const insertPromise = insertImageFiles(
      view,
      [pngFile("a.png"), pngFile("b.png")],
      {
        imageUpload: () => uploads[uploadIndex++]!,
        imageSyntax: "inline",
      },
    );

    const during = view.state.doc.toString();
    expect(during).toContain("![Uploading a.png…](");
    expect(during).toContain("![Uploading b.png…](");
    expect(during.match(/mira-uploading:/g)?.length).toBe(2);

    resolvers[1]!("https://cdn.example/b.png");
    resolvers[0]!("https://cdn.example/a.png");
    await insertPromise;

    expect(view.state.doc.toString()).toBe(
      "![a](https://cdn.example/a.png)\n\n![b](https://cdn.example/b.png)",
    );
    destroy();
  });
});
