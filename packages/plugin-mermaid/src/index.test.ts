import { describe, expect, it } from "vitest";
import { mermaidExtension } from ".";

describe("mermaidExtension", () => {
  it("contributes a code language and renderer component", () => {
    const extension = mermaidExtension();

    expect(extension.codeLanguages).toHaveLength(1);
    expect(extension.components?.mermaid).toBeTruthy();
  });
});
