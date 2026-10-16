import { expect, it } from "vitest";
import { normalizeProperties } from "./utils";

it("preserves case-sensitive SVG viewport attributes while normalizing presentation attributes", () => {
  expect(
    normalizeProperties({
      viewBox: "0 0 24 24",
      preserveAspectRatio: "xMidYMid meet",
      strokeWidth: 2,
      fillRule: "evenodd",
    }),
  ).toEqual({
    viewBox: "0 0 24 24",
    preserveAspectRatio: "xMidYMid meet",
    "stroke-width": 2,
    "fill-rule": "evenodd",
  });
});
