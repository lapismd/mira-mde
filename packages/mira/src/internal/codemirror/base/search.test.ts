// @vitest-environment jsdom

import {
  getSearchQuery,
  openSearchPanel,
  searchPanelOpen,
} from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import { createBaseCodeMirrorExtensions } from ".";
import {
  createMiraSearchExtension,
  createSearchPanelHost,
  focusSearchPanelInput,
} from "./search";

function createSearchEditor(
  doc = "Alpha beta Alpha",
  selection = { anchor: 0, head: 5 },
) {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    state: EditorState.create({
      doc,
      selection,
      extensions: [createBaseCodeMirrorExtensions()],
    }),
    parent,
  });

  return {
    parent,
    view,
    destroy() {
      view.destroy();
      parent.remove();
    },
  };
}

function inputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("Mira search extension", () => {
  it("opens the Lapis-compatible search interface with the selection", () => {
    const editor = createSearchEditor();

    openSearchPanel(editor.view);

    const panel = editor.parent.querySelector(".mira-search-panel");
    const searchInput = editor.parent.querySelector<HTMLInputElement>(
      ".mira-search-panel__search-input",
    );

    expect(panel).not.toBeNull();
    expect(
      editor.parent.querySelector(".cm-panels-top .mira-search-panel-host"),
    ).not.toBeNull();
    expect(searchInput?.value).toBe("Alpha");
    expect(document.activeElement).toBe(searchInput);
    expect(
      editor.parent.querySelector('[aria-label="Case sensitive"]'),
    ).not.toBeNull();
    expect(
      editor.parent.querySelector('[aria-label="Match whole word"]'),
    ).not.toBeNull();
    expect(
      editor.parent.querySelector('[aria-label="Use regular expression"]'),
    ).not.toBeNull();
    const searchField = editor.parent.querySelector(
      ".mira-search-panel__search-field",
    );
    const searchOptions = editor.parent.querySelector(
      '[role="group"][aria-label="Search options"]',
    );
    expect(searchField?.contains(searchInput)).toBe(true);
    expect(searchField?.contains(searchOptions)).toBe(true);
    expect(searchOptions?.parentElement).toBe(searchField);
    expect(
      searchField?.querySelector(".mira-search-panel__find-icon svg"),
    ).not.toBeNull();
    expect(
      editor.parent.querySelector('[aria-label="Select all matches"]'),
    ).not.toBeNull();

    editor.destroy();
  });

  it("updates search flags and reports missing matches", async () => {
    const editor = createSearchEditor();
    openSearchPanel(editor.view);

    editor.parent
      .querySelector<HTMLButtonElement>('[aria-label="Case sensitive"]')
      ?.click();
    editor.parent
      .querySelector<HTMLButtonElement>('[aria-label="Match whole word"]')
      ?.click();
    editor.parent
      .querySelector<HTMLButtonElement>('[aria-label="Use regular expression"]')
      ?.click();

    expect(getSearchQuery(editor.view.state)).toMatchObject({
      caseSensitive: true,
      wholeWord: true,
      regexp: true,
    });

    const searchInput = editor.parent.querySelector<HTMLInputElement>(
      ".mira-search-panel__search-input",
    );
    if (!searchInput) {
      throw new Error("Expected the search input.");
    }

    inputValue(searchInput, "Missing");
    await tick();

    expect(getSearchQuery(editor.view.state).search).toBe("Missing");
    expect(searchInput.getAttribute("aria-invalid")).toBe("true");
    expect(
      editor.parent.querySelector('[role="status"]')?.textContent,
    ).toContain("No matches found");

    editor.destroy();
  });

  it("expands replace controls and replaces all matches", async () => {
    const editor = createSearchEditor("one two one", { anchor: 0, head: 3 });
    openSearchPanel(editor.view);

    editor.parent
      .querySelector<HTMLButtonElement>('[aria-label="Toggle replace"]')
      ?.click();
    await tick();

    const replaceInput = editor.parent.querySelector<HTMLInputElement>(
      'input[aria-label="Replace"]',
    );
    if (!replaceInput) {
      throw new Error("Expected the replace input.");
    }

    inputValue(replaceInput, "three");
    editor.parent
      .querySelector<HTMLButtonElement>('[aria-label="Replace all matches"]')
      ?.click();

    expect(editor.view.state.doc.toString()).toBe("three two three");

    editor.destroy();
  });

  it("respects initial search configuration and panel placement", () => {
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({
      state: EditorState.create({
        doc: "Alpha alpha",
        extensions: [
          createMiraSearchExtension({
            top: false,
            caseSensitive: true,
            wholeWord: true,
          }),
        ],
      }),
      parent,
    });

    openSearchPanel(view);

    expect(getSearchQuery(view.state)).toMatchObject({
      caseSensitive: true,
      wholeWord: true,
    });
    expect(
      parent.querySelector(".cm-panels-bottom .mira-search-panel-host"),
    ).not.toBeNull();

    view.destroy();
    parent.remove();
  });

  it("closes with Escape from the search panel", () => {
    const editor = createSearchEditor();
    openSearchPanel(editor.view);

    const searchInput = editor.parent.querySelector<HTMLInputElement>(
      ".mira-search-panel__search-input",
    );
    searchInput?.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Escape",
      }),
    );

    expect(searchPanelOpen(editor.view.state)).toBe(false);

    editor.destroy();
  });

  it("creates and focuses the panel host in the editor document", () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const popupDocument = iframe.contentDocument;
    if (!popupDocument) {
      throw new Error("Expected an iframe document.");
    }

    const host = createSearchPanelHost(popupDocument);
    const input = popupDocument.createElement("input");
    input.className = "mira-search-panel__search-input";
    host.append(input);
    popupDocument.body.append(host);

    focusSearchPanelInput(host);

    expect(host.ownerDocument).toBe(popupDocument);
    expect(popupDocument.activeElement).toBe(input);

    iframe.remove();
  });
});
