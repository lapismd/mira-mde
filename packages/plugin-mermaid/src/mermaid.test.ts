import { mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vitest";
import Mermaid from "./mermaid.svelte";
import type { PanZoomState } from "./pan-zoom";

vi.mock("./renderer", () => ({
  mermaidRender: vi.fn(async () => ({
    svg: '<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"></svg>',
  })),
}));

describe("Mermaid dialog controls", () => {
  it("names every icon-only control and keeps its action keyboard-native", async () => {
    const panZoomState = {
      disconnect: vi.fn(),
      panBy: vi.fn(),
      reset: vi.fn(),
      updateElement: vi.fn(async () => undefined),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    } as unknown as PanZoomState;
    const target = document.createElement("div");
    const component = mount(Mermaid, {
      target,
      props: {
        id: "accessible-mermaid",
        diagram: "flowchart LR\nA --> B",
        dialog: true,
        panZoomState,
      },
    });
    await Promise.resolve();
    await tick();

    const labels = [
      "Zoom in",
      "Zoom out",
      "Pan up",
      "Pan down",
      "Pan left",
      "Pan right",
      "Reset view",
    ];
    const buttons = Array.from(
      target.querySelectorAll<HTMLButtonElement>(
        ".mermaid-viewer-control-panel button",
      ),
    );

    expect(buttons.map((button) => button.ariaLabel)).toEqual(labels);
    expect(buttons.map((button) => button.title)).toEqual(labels);
    buttons.forEach((button) => {
      expect(button.tabIndex).toBe(0);
      button.click();
    });
    expect(panZoomState.zoomIn).toHaveBeenCalledOnce();
    expect(panZoomState.zoomOut).toHaveBeenCalledOnce();
    expect(panZoomState.panBy).toHaveBeenCalledTimes(4);
    expect(panZoomState.reset).toHaveBeenCalledOnce();

    await unmount(component);
  });
});
