import { describe, expect, it } from "vitest";
import { createTableExtensions } from ".";

describe("codemirror tables public API", () => {
  it("creates the default table extensions", () => {
    expect(createTableExtensions()).toHaveLength(1);
  });
});
