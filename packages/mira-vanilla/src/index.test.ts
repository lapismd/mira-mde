import { describe, expect, it } from "vitest";
import { createMira, createMiraEditor } from ".";

describe("createMira", () => {
  it("exports a mount function", () => {
    expect(typeof createMira).toBe("function");
  });

  it("exports the batteries-included editor mount function", () => {
    expect(typeof createMiraEditor).toBe("function");
  });
});
