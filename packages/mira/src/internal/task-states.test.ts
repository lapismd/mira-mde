import { describe, expect, it } from "vitest";
import { miraTaskStates, normalizeMiraTaskMarker } from "./task-states";

describe("Mira task states", () => {
  it("contains every shipped standard and custom checkbox marker once", () => {
    const markers = miraTaskStates.map(({ marker }) => marker);

    expect(markers).toEqual([
      " ",
      "x",
      "/",
      "?",
      "-",
      "!",
      ">",
      "<",
      "l",
      "*",
      "i",
      "S",
      "I",
      "f",
      "k",
      "u",
      "d",
      "w",
      "p",
      "c",
      "b",
      '"',
    ]);
    expect(new Set(markers).size).toBe(markers.length);
  });

  it("normalizes the alternate completed marker only", () => {
    expect(normalizeMiraTaskMarker("X")).toBe("x");
    expect(normalizeMiraTaskMarker("S")).toBe("S");
  });
});
