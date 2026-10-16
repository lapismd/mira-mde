import { EditorView } from "@codemirror/view";
import { mount, tick, unmount } from "svelte";
import { expect, it, vi } from "vitest";
import type {
  MiraFileAdapter,
  MiraMarkdownEditingSession,
} from "../../extensions";
import EditableMarkdownPreview from "../editable-markdown-preview.svelte";

it("renders the accepted recovery text without rereading or rebinding the source", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  let session!: MiraMarkdownEditingSession;
  const bind = vi.fn((_path: string, captured: MiraMarkdownEditingSession) => {
    session = captured;
    return {
      write: () => {
        throw new Error("external change");
      },
      release: vi.fn(),
    };
  });
  const read = vi.fn(() => "# Original\n\nOld disk text.");
  const adapter: MiraFileAdapter = {
    resolveLink: () => null,
    readMarkdown: read,
    writeMarkdown: vi.fn(),
    bindMarkdownEditingSession: bind,
  };
  const component = mount(EditableMarkdownPreview, {
    target,
    props: {
      file: { path: "note.md", name: "Note", kind: "markdown" },
      fileAdapter: adapter,
      returnToPreviewOnBlur: false,
    },
  });
  try {
    await vi.waitFor(() =>
      expect(target.querySelector('[role="button"]')).not.toBeNull(),
    );
    (target.querySelector('[role="button"]') as HTMLElement).click();
    await tick();
    const editor = target.querySelector<HTMLElement>(".cm-editor")!;
    const view = EditorView.findFromDOM(editor)!;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: "Draft" },
    });
    await tick();
    await expect(session.flush()).rejects.toThrow("external change");
    const lease = await session.text!.protectRecovery();
    lease.useExternal("Reviewed disk text.");
    await tick();
    lease.release();
    await tick();
    expect(session.text!.state.value).toBe("Reviewed disk text.");
    expect(view.state.doc.toString()).toBe("Reviewed disk text.");
    expect(target.querySelector(".cm-content")?.textContent).toBe(
      "Reviewed disk text.",
    );
    expect(bind).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
  } finally {
    await unmount(component);
    target.remove();
  }
});
