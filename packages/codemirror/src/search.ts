import { search as codeMirrorSearch } from "@codemirror/search";
import type { Extension, SelectionRange, StateEffect } from "@codemirror/state";
import { EditorView, type Panel } from "@codemirror/view";
import { mount, unmount } from "svelte";
import SearchPanelComponent from "./search-panel.svelte";

export type MiraSearchConfig = {
  /**
   * Position the search panel above the editor content.
   *
   * @default true
   */
  top: boolean;
  /**
   * Match letter case when the panel is first opened.
   *
   * @default false
   */
  caseSensitive: boolean;
  /**
   * Disable backslash escape handling in string searches.
   *
   * @default false
   */
  literal: boolean;
  /**
   * Match complete words when the panel is first opened.
   *
   * @default false
   */
  wholeWord: boolean;
  /**
   * Treat the initial query as a regular expression.
   *
   * @default false
   */
  regexp: boolean;
  /**
   * Customize how the editor scrolls a selected match into view.
   */
  scrollToMatch: (
    range: SelectionRange,
    view: EditorView,
  ) => StateEffect<unknown>;
};

class MiraSearchPanel implements Panel {
  readonly dom: HTMLElement;
  readonly top: boolean;

  private readonly component: ReturnType<typeof mount>;

  constructor(
    readonly view: EditorView,
    top: boolean,
  ) {
    this.top = top;
    this.dom = createSearchPanelHost(view.dom.ownerDocument);
    this.component = mount(SearchPanelComponent, {
      target: this.dom,
      props: { view },
    });
  }

  mount(): void {
    focusSearchPanelInput(this.dom);
  }

  destroy(): void {
    void unmount(this.component);
  }
}

export function createSearchPanelHost(doc: Document): HTMLDivElement {
  const host = doc.createElement("div");
  host.className = "mira-search-panel-host";
  return host;
}

export function focusSearchPanelInput(container: ParentNode): void {
  container
    .querySelector<HTMLInputElement>("input.mira-search-panel__search-input")
    ?.focus();
}

/**
 * Creates Mira's Lapis-compatible CodeMirror search and replace panel.
 */
export function search(config: Partial<MiraSearchConfig> = {}): Extension {
  const resolved: MiraSearchConfig = {
    top: true,
    caseSensitive: false,
    literal: false,
    wholeWord: false,
    regexp: false,
    scrollToMatch: (range) => EditorView.scrollIntoView(range),
    ...config,
  };

  return codeMirrorSearch({
    caseSensitive: resolved.caseSensitive,
    literal: resolved.literal,
    wholeWord: resolved.wholeWord,
    regexp: resolved.regexp,
    scrollToMatch: resolved.scrollToMatch,
    createPanel: (view) => new MiraSearchPanel(view, resolved.top),
  });
}

export const createMiraSearchExtension = search;
