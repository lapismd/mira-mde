import { afterEach, describe, expect, it, vi } from "vitest";
import {
  measureIndentSegmentWidth,
  syncMeasuredIndentStyles,
} from "./measured-indent";

function appendLine(root: HTMLElement, from: number): HTMLElement {
  const line = document.createElement("div");
  line.className = "cm-line";
  line.dataset["lineFrom"] = `${from}`;
  root.append(line);
  return line;
}

function domRect(width: number): DOMRect {
  return {
    bottom: 16,
    height: 16,
    left: 0,
    right: width,
    toJSON: () => ({}),
    top: 0,
    width,
    x: 0,
    y: 0,
  };
}

function mockTextRangeMeasurements(characterWidth: number): void {
  vi.spyOn(document, "createRange").mockImplementation(() => {
    let node: Text | null = null;
    let end = 0;
    const range = {
      setStart(nextNode: Text) {
        node = nextNode;
      },
      setEnd(_nextNode: Text, nextEnd: number) {
        end = nextEnd;
      },
      getClientRects() {
        const width = (node?.data.slice(0, end).length ?? 0) * characterWidth;
        return [domRect(width)] as unknown as DOMRectList;
      },
      getBoundingClientRect() {
        const width = (node?.data.slice(0, end).length ?? 0) * characterWidth;
        return domRect(width);
      },
    };
    return range as unknown as Range;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("measured indent styles", () => {
  it("measures plain spacer text instead of its minimum guide slot", () => {
    mockTextRangeMeasurements(8);
    const spacer = document.createElement("span");
    spacer.className = "cm-indent cm-indent-spacer";
    spacer.textContent = "  ";
    vi.spyOn(spacer, "getBoundingClientRect").mockReturnValue(domRect(32));

    expect(measureIndentSegmentWidth(spacer)).toBe(16);
  });

  it("keeps guide segments measured by their rendered slot", () => {
    mockTextRangeMeasurements(8);
    const guide = document.createElement("span");
    guide.className = "cm-indent cm-indent-guide";
    guide.textContent = "    ";
    vi.spyOn(guide, "getBoundingClientRect").mockReturnValue(domRect(32));

    expect(measureIndentSegmentWidth(guide)).toBe(32);
  });

  it("only writes changed measurements", () => {
    const root = document.createElement("div");
    const line = appendLine(root, 10);
    line.style.setProperty("--hmd-indent-padding-measured", "24px");
    line.style.setProperty("--hmd-indent-prefix-measured", "8px");
    const setProperty = vi.spyOn(line.style, "setProperty");

    syncMeasuredIndentStyles(
      root,
      new Map([[10, { paddingPx: 24, prefixPx: 8 }]]),
    );

    expect(setProperty).not.toHaveBeenCalled();
  });

  it("removes measurements from lines that no longer carry a prefix", () => {
    const root = document.createElement("div");
    const line = appendLine(root, 10);
    line.style.setProperty("--hmd-indent-padding-measured", "24px");
    line.style.setProperty("--hmd-indent-prefix-measured", "8px");

    syncMeasuredIndentStyles(root, new Map());

    expect(line.style.getPropertyValue("--hmd-indent-padding-measured")).toBe(
      "",
    );
    expect(line.style.getPropertyValue("--hmd-indent-prefix-measured")).toBe(
      "",
    );
  });

  it("keeps a measured widget width when the parent padding falls back", () => {
    const root = document.createElement("div");
    const line = appendLine(root, 10);
    line.style.setProperty("--hmd-indent-padding-measured", "24px");

    syncMeasuredIndentStyles(
      root,
      new Map([[10, { paddingPx: null, prefixPx: 32 }]]),
    );

    expect(line.style.getPropertyValue("--hmd-indent-padding-measured")).toBe(
      "",
    );
    expect(line.style.getPropertyValue("--hmd-indent-prefix-measured")).toBe(
      "32px",
    );
  });
});
