import { describe, expect, it } from "vitest";
import { getListCalloutMarkerRange } from "./list-callouts";

describe("list callout utilities", () => {
  it("resolves Lapis default list callout markers", () => {
    expect(getListCalloutMarkerRange("- & Highlighted item", 0)).toEqual({
      markerStart: 2,
      markerEnd: 3,
      marker: "&",
      color: "255, 214, 0",
    });
    expect(getListCalloutMarkerRange("  1. ? Question", 10)).toEqual({
      markerStart: 15,
      markerEnd: 16,
      marker: "?",
      color: "255, 145, 0",
    });
  });

  it("supports task list callout markers after the checkbox token", () => {
    expect(getListCalloutMarkerRange("- [ ] ! Warning", 0)).toEqual({
      markerStart: 6,
      markerEnd: 7,
      marker: "!",
      color: "255, 23, 68",
    });
  });
});
