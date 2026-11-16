import { describe, expect, it, vi } from "vitest";
import mermaid from "mermaid";
import { mermaidRender } from "./renderer";

vi.mock("mermaid", () => ({
  default: {
    registerLayoutLoaders: vi.fn(),
    registerExternalDiagrams: vi.fn(async () => undefined),
    initialize: vi.fn(),
    render: vi.fn(async () => ({ svg: "<svg></svg>" })),
  },
}));

describe("public Mermaid renderer compatibility", () => {
  it("retains Dagre as Mira's default while preserving explicit ELK options", async () => {
    await mermaidRender("default-id", "flowchart LR\nA --> B");
    expect(mermaid.initialize).toHaveBeenLastCalledWith({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "default",
      layout: "dagre",
    });
    await mermaidRender("elk-id", "flowchart LR\nA --> B", {
      layout: "elk",
      theme: "dark",
    });
    expect(mermaid.initialize).toHaveBeenLastCalledWith({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "dark",
      layout: "elk",
    });
    expect(mermaid.render).toHaveBeenLastCalledWith(
      "elk-id",
      "flowchart LR\nA --> B",
    );
  });
});
