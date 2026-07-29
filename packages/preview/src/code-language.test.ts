import { describe, expect, it } from "vitest";
import { codeLanguageLabel } from "./code-language";

describe("code language labels", () => {
  it("uses readable labels for common fenced-code aliases", () => {
    expect(codeLanguageLabel("hljs language-ts")).toBe("TypeScript");
    expect(codeLanguageLabel("language-yml hljs")).toBe("YAML");
  });

  it("preserves unknown language ids and omits unlabelled blocks", () => {
    expect(codeLanguageLabel("hljs language-gleam")).toBe("gleam");
    expect(codeLanguageLabel("hljs")).toBe("");
  });
});
