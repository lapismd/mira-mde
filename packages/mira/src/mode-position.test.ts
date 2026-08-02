import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureModeSwitchPosition,
  capturePreviewPosition,
  restorePreviewPosition,
} from "./mode-position";

afterEach(() => {
  document.body.replaceChildren();
});

describe("mode position continuity", () => {
  it("captures the nearest visible preview source line and restores it", () => {
    const scroller = document.createElement("div");
    const first = appendAnchor(scroller, 5, -30);
    const second = appendAnchor(scroller, 12, 20);
    vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(rect(0, 100));
    const scrollTo = vi.fn();
    Object.defineProperty(scroller, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    scroller.scrollTop = 50;

    const position = capturePreviewPosition(scroller);
    expect(position).toMatchObject({ line: 12, topDelta: 20 });

    vi.mocked(first.getBoundingClientRect).mockReturnValue(rect(-20, 20));
    vi.mocked(second.getBoundingClientRect).mockReturnValue(rect(40, 80));
    restorePreviewPosition(scroller, position);

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 70 });
  });

  it("captures the surface that becomes hidden when entering preview or split", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = new EditorView({
      parent: host,
      state: EditorState.create({ doc: "one\ntwo\nthree" }),
    });
    const preview = document.createElement("div");

    expect(
      captureModeSwitchPosition("source", "preview", view, preview)?.target,
    ).toBe("preview");
    expect(
      captureModeSwitchPosition("preview", "split", view, preview)?.target,
    ).toBe("editor");
    expect(
      captureModeSwitchPosition("live-preview", "source", view, preview),
    ).toBeNull();

    view.destroy();
  });
});

function appendAnchor(
  root: HTMLElement,
  line: number,
  top: number,
): HTMLElement {
  const anchor = document.createElement("p");
  anchor.dataset["line"] = `${line}`;
  vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(
    rect(top, top + 20),
  );
  root.append(anchor);
  return anchor;
}

function rect(top: number, bottom: number): DOMRect {
  return {
    bottom,
    height: bottom - top,
    left: 0,
    right: 100,
    top,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}
