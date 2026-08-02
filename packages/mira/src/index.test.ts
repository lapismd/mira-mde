import { describe, expect, it } from "vitest";
import MiraMde from "./mira-mde.svelte";

describe("MiraMde", () => {
  it("exports the Svelte component", () => {
    expect(MiraMde).toBeTruthy();
  });
});
