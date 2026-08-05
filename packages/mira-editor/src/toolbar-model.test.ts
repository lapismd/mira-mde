import { describe, expect, it } from "vitest";
import {
  isMiraEditMode,
  markdownActionForMiraToolbarItem,
  miraEditorToolbarItemLabels,
  miraViewToggleLabel,
  resolveMiraModeAfterSplit,
  resolveMiraViewModeMenuItems,
  resolveMiraViewToggleMode,
  templateForMiraToolbarItem,
} from "./toolbar-model";

describe("toolbar model", () => {
  it("resolves view menu items for edit and preview modes", () => {
    expect(
      resolveMiraViewModeMenuItems({
        mode: "live-preview",
        modeOptions: ["source", "live-preview", "preview", "split"],
        resolvedDefaultEditMode: "live-preview",
      }),
    ).toEqual([
      { mode: "preview", label: "Reading view", checked: false },
      { mode: "source", label: "Source mode", checked: false },
    ]);

    expect(
      resolveMiraViewModeMenuItems({
        mode: "preview",
        modeOptions: ["source", "live-preview", "preview", "split"],
        resolvedDefaultEditMode: "live-preview",
      }),
    ).toEqual([
      { mode: "live-preview", label: "Live edit", checked: false },
      { mode: "source", label: "Source mode", checked: false },
    ]);
  });

  it("resolves split fallback and view toggle behavior", () => {
    expect(
      resolveMiraModeAfterSplit({
        lastNonSplitMode: "source",
        modeOptions: ["source", "live-preview", "preview", "split"],
        resolvedDefaultEditMode: "live-preview",
      }),
    ).toBe("source");
    expect(resolveMiraViewToggleMode("preview", "live-preview")).toBe(
      "live-preview",
    );
    expect(resolveMiraViewToggleMode("live-preview", "live-preview")).toBe(
      "preview",
    );
    expect(miraViewToggleLabel("preview")).toBe("Edit");
  });

  it("exposes labels and templates for framework renderers", () => {
    expect(isMiraEditMode("source")).toBe(true);
    expect(miraEditorToolbarItemLabels.bold).toBe("Bold");
    expect(miraEditorToolbarItemLabels.strikethrough).toBe("Strikethrough");
    expect(miraEditorToolbarItemLabels.inlineCode).toBe("Inline code");
    expect(miraEditorToolbarItemLabels.numberedList).toBe("Numbered list");
    expect(templateForMiraToolbarItem("bold")).toBe("**strong**");
    expect(templateForMiraToolbarItem("strikethrough")).toBe(
      "~~strikethrough~~",
    );
    expect(templateForMiraToolbarItem("inlineCode")).toBe("`code`");
    expect(templateForMiraToolbarItem("numberedList")).toBe("1. List item");
    expect(markdownActionForMiraToolbarItem("bold")).toBe("bold");
    expect(markdownActionForMiraToolbarItem("code")).toBeNull();
    expect(templateForMiraToolbarItem("gridTable")).toContain("+========+");
  });
});
