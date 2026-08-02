import { describe, expect, it, vi } from "vitest";
import { syncMeasuredIndentStyles } from "./measured-indent";

function appendLine(root: HTMLElement, from: number): HTMLElement {
  const line = document.createElement("div");
  line.className = "cm-line";
  line.dataset["lineFrom"] = `${from}`;
  root.append(line);
  return line;
}

describe("measured indent styles", () => {
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
});
