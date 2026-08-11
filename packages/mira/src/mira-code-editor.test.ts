import { undo } from "@codemirror/commands";
import { Transaction } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import MiraCodeEditor from "./mira-code-editor.svelte";
import Mira from "./mira.svelte";
import type { MiraCodeEditorHandle } from "./mira-code-editor";
import type { MiraHandle } from "./types";

describe("MiraCodeEditor", () => {
  it("keeps the gutter and search panel on the editor surface", () => {
    const shellCss = readFileSync(
      resolve(process.cwd(), "src/mira-code-editor.css"),
      "utf8",
    );
    const searchPanel = readFileSync(
      resolve(
        process.cwd(),
        "src/internal/codemirror/base/search-panel.svelte",
      ),
      "utf8",
    );

    expect(shellCss).toMatch(
      /background:\s*var\(\s*--mira-code-editor-gutter-background,\s*var\(--mira-code-editor-background/,
    );
    expect(shellCss).toMatch(
      /\[data-surface="framed"\]:focus-within\s*\{[\s\S]*?border-color:\s*transparent/,
    );
    expect(shellCss).not.toMatch(/^\s*--mira-code-editor-focus-ring:\s*var\(/m);
    expect(searchPanel).toMatch(
      /background:\s*var\(\s*--mira-code-editor-background/,
    );
    expect(searchPanel).toContain("--mira-code-editor-search-input-background");
    expect(searchPanel).toContain(
      "--mira-code-editor-search-button-hover-background",
    );
    expect(searchPanel).toContain("--mira-code-editor-search-focus-ring");
    expect(searchPanel).toMatch(
      /__search-field:focus-within,[\s\S]*?__button:focus-visible\s*\{[\s\S]*?border-color:\s*transparent/,
    );
    expect(searchPanel).toMatch(
      /--mira-code-editor-search-radius,[\s\S]*?999px/,
    );
    expect(searchPanel).toMatch(
      /\.cm-panels-top:has\(\.mira-search-panel-host\)[\s\S]*?background:\s*transparent;[\s\S]*?border-bottom:\s*0/,
    );
  });

  it("owns a controlled accessible CodeMirror lifecycle", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const onChange = vi.fn();
    const component = mount(MiraCodeEditor, {
      target,
      props: {
        value: "name: Mira",
        ariaLabel: "YAML editor",
        invalid: true,
        minHeight: "12rem",
        scrollerTabIndex: 0,
        onChange,
      },
    }) as unknown as MiraCodeEditorHandle;

    await tick();
    const view = component.getView();
    expect(view).not.toBeNull();
    expect(view?.contentDOM.getAttribute("aria-label")).toBe("YAML editor");
    expect(view?.contentDOM.getAttribute("aria-invalid")).toBe("true");
    expect(view?.scrollDOM.getAttribute("tabindex")).toBe("0");
    expect(
      target.querySelector(".mira-code-editor")?.getAttribute("data-surface"),
    ).toBe("framed");

    view?.dispatch({
      changes: { from: view.state.doc.length, insert: "\nrole: editor" },
      annotations: Transaction.userEvent.of("input"),
    });
    expect(onChange).toHaveBeenLastCalledWith("name: Mira\nrole: editor");

    component.setValue("external: value");
    expect(component.getValue()).toBe("external: value");
    expect(onChange).toHaveBeenCalledTimes(1);

    component.setSelection({
      anchor: { line: 0, ch: 0 },
      head: { line: 0, ch: 8 },
    });
    expect(component.getSelection()).toEqual({
      anchor: { line: 0, ch: 0 },
      head: { line: 0, ch: 8 },
    });

    await unmount(component as never);
    expect(target.querySelector(".cm-editor")).toBeNull();
    target.remove();
  });

  it("preserves edit history when the Markdown consumer reconfigures", async () => {
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(Mira, {
      target,
      props: { value: "alpha", mode: "source" },
    }) as unknown as MiraHandle;

    await tick();
    const editorElement = target.querySelector<HTMLElement>(".cm-editor");
    const view = editorElement ? EditorView.findFromDOM(editorElement) : null;
    expect(view).not.toBeNull();
    view?.dispatch({
      changes: { from: 5, insert: " beta" },
      annotations: Transaction.userEvent.of("input"),
    });
    expect(component.getMarkdown()).toBe("alpha beta");

    component.setReadonly(true);
    await tick();
    component.setReadonly(false);
    await tick();

    expect(view && undo(view)).toBe(true);
    expect(component.getMarkdown()).toBe("alpha");

    await unmount(component as never);
    target.remove();
  });
});
