import { describe, expect, it } from "vitest";
import {
  activeMarkdownOutlineId,
  findMarkdownOutlineScrollRoot,
  type MarkdownOutlineItem,
} from "./outline";

function setVerticalLayout(
  element: HTMLElement,
  layout: { clientHeight: number; scrollHeight: number; top?: number },
): void {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: layout.clientHeight },
    scrollHeight: { configurable: true, value: layout.scrollHeight },
  });
  element.getBoundingClientRect = () =>
    ({
      top: layout.top ?? 0,
      bottom: (layout.top ?? 0) + layout.clientHeight,
      height: layout.clientHeight,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: layout.top ?? 0,
      toJSON: () => ({}),
    }) as DOMRect;
}

describe("Markdown outline scroll tracking", () => {
  it("uses Mira's preview when it owns the scroll range", () => {
    const outer = document.createElement("div");
    const preview = document.createElement("div");
    const heading = document.createElement("h1");
    outer.style.overflowY = "auto";
    preview.style.overflowY = "auto";
    outer.append(preview);
    preview.append(heading);
    setVerticalLayout(outer, { clientHeight: 400, scrollHeight: 800 });
    setVerticalLayout(preview, { clientHeight: 300, scrollHeight: 700 });

    expect(findMarkdownOutlineScrollRoot(heading, preview)).toBe(preview);
  });

  it("finds a consumer scroll owner when the preview overflow is visible", () => {
    const viewport = document.createElement("div");
    const preview = document.createElement("div");
    const heading = document.createElement("h1");
    viewport.style.overflowY = "scroll";
    preview.style.overflowY = "visible";
    viewport.append(preview);
    preview.append(heading);
    setVerticalLayout(viewport, { clientHeight: 300, scrollHeight: 900 });
    setVerticalLayout(preview, { clientHeight: 900, scrollHeight: 900 });

    expect(findMarkdownOutlineScrollRoot(heading, preview)).toBe(viewport);
  });

  it("selects the last heading that crosses the active-section threshold", () => {
    const items: MarkdownOutlineItem[] = [
      { id: "intro", text: "Intro", level: 1 },
      { id: "details", text: "Details", level: 2 },
      { id: "finish", text: "Finish", level: 2 },
    ];
    const scrollRoot = document.createElement("div");
    setVerticalLayout(scrollRoot, {
      clientHeight: 300,
      scrollHeight: 900,
      top: 40,
    });
    const tops = new Map([
      ["intro", 8],
      ["details", 118],
      ["finish", 390],
    ]);
    const resolveHeading = (item: MarkdownOutlineItem) => {
      const element = document.createElement("h2");
      setVerticalLayout(element, {
        clientHeight: 32,
        scrollHeight: 32,
        top: tops.get(item.id)!,
      });
      return element;
    };

    expect(activeMarkdownOutlineId(items, resolveHeading, scrollRoot)).toBe(
      "details",
    );
  });
});
