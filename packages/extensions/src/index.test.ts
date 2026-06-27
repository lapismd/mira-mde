import { describe, expect, it } from "vitest";
import { defineMiraExtension, resolveMiraExtensions } from ".";

describe("resolveMiraExtensions", () => {
  it("merges contribution arrays in extension order", () => {
    const first = defineMiraExtension({
      name: "first",
      remarkPlugins: [() => undefined],
      components: { a: "span" },
    });
    const second = defineMiraExtension({
      name: "second",
      rehypePlugins: [() => undefined],
      components: { b: "div" },
    });

    const resolved = resolveMiraExtensions([first, second], {
      mode: "source",
      readonly: false,
    });

    expect(resolved.remarkPlugins).toHaveLength(1);
    expect(resolved.rehypePlugins).toHaveLength(1);
    expect(resolved.components).toEqual({ a: "span", b: "div" });
  });
});
