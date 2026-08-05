import { describe, expect, it } from "vitest";
import { getListCalloutMarkerRange } from "./list-callouts";

describe("list callout utilities", () => {
  it("resolves Lapis default list callout markers", () => {
    expect(getListCalloutMarkerRange("- & Highlighted item", 0)).toMatchObject({
      markerStart: 2,
      markerEnd: 3,
      removeEnd: 4,
      marker: "&",
      color: "255, 214, 0",
    });
    expect(getListCalloutMarkerRange("  1. ? Question", 10)).toMatchObject({
      markerStart: 15,
      markerEnd: 16,
      removeEnd: 17,
      marker: "?",
      color: "255, 145, 0",
    });
  });

  it("supports task list callout markers after the checkbox token", () => {
    expect(getListCalloutMarkerRange("- [ ] ! Warning", 0)).toMatchObject({
      markerStart: 6,
      markerEnd: 7,
      removeEnd: 8,
      marker: "!",
      color: "255, 23, 68",
    });
  });

  it("uses injected markers and disabled defaults", () => {
    const callouts = [
      { char: "&", enabled: false },
      { char: "^^", color: "80, 70, 220", icon: "bookmark" },
    ];

    expect(getListCalloutMarkerRange("- ^^ Custom", 4, callouts)).toMatchObject(
      {
        markerStart: 6,
        markerEnd: 8,
        removeEnd: 9,
        marker: "^^",
        color: "80, 70, 220",
        callout: {
          char: "^^",
          icon: "bookmark",
        },
      },
    );
    expect(getListCalloutMarkerRange("- & Plain", 0, callouts)).toBeNull();
  });
});
