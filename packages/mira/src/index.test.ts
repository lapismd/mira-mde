import { describe, expect, it } from "vitest";
import Mira from "./mira.svelte";

describe("Mira", () => {
  it("exports the Svelte component", () => {
    expect(Mira).toBeTruthy();
  });
});
