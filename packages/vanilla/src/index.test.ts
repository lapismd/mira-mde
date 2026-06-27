import { describe, expect, it } from "vitest";
import { createMiraMde } from ".";

describe("createMiraMde", () => {
  it("exports a mount function", () => {
    expect(typeof createMiraMde).toBe("function");
  });
});
