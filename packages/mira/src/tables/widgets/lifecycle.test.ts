import { afterEach, expect, it, vi } from "vitest";
import { EditorView } from "@codemirror/view";
import { tick } from "svelte";
import { createMarkdownTableWidget } from "./pipe-table-widget";
import { createMarkdownGridTableWidget } from "./grid-table-widget";
import { destroyTableWidget } from "./lifecycle";
import { inlineLinksExtension } from "../../extensions";

afterEach(() => vi.restoreAllMocks());

it.each([
  [
    createMarkdownTableWidget,
    "| Link |\n| --- |\n| [Issue](https://github.com/o/r) |",
  ],
  [
    createMarkdownGridTableWidget,
    "+-------------------------------------+\n| [Issue](https://github.com/o/r)       |\n+-------------------------------------+",
  ],
] as const)(
  "forwards extensions and disposes table mounts for %s",
  async (create, markdown) => {
    const destroy = vi.spyOn(EditorView.prototype, "destroy");
    const root = create({
      markdown,
      onChange() {},
      extensions: [inlineLinksExtension()],
    });
    document.body.append(root);
    await tick();
    await tick();
    expect(
      root
        .querySelector("a.mira-inline-link svg")
        ?.getAttribute("data-link-site"),
    ).toBe("github");
    destroyTableWidget(root);
    destroyTableWidget(root);
    await tick();
    await tick();
    expect(root.querySelector("a.mira-inline-link")).toBeNull();
    expect(destroy).toHaveBeenCalled();
    root.remove();
  },
);
