import { describe, expect, it } from "vitest";
import { createImageMarkdown } from "./images";

describe("image markdown insertion", () => {
  it("generates reference-style image markdown by default", () => {
    expect(
      createImageMarkdown({
        alt: "Alt Text",
        doc: "",
        src: "data:image/png;base64,abc=",
        syntax: "reference",
      }),
    ).toBe("![Alt Text][alt-text]\n\n[alt-text]: data:image/png;base64,abc=");
  });

  it("avoids colliding with existing image reference labels", () => {
    expect(
      createImageMarkdown({
        alt: "Alt Text",
        doc: "[alt-text]: old",
        src: "data:image/png;base64,abc=",
        syntax: "reference",
      }),
    ).toContain("[alt-text-2]: data:image/png;base64,abc=");
  });

  it("can generate Carta-compatible inline image markdown", () => {
    expect(
      createImageMarkdown({
        alt: "Alt Text",
        doc: "",
        src: "data:image/png;base64,abc=",
        syntax: "inline",
      }),
    ).toBe("![Alt Text](data:image/png;base64,abc=)");
  });
});
