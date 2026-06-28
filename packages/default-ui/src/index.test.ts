import { describe, expect, it } from "vitest";
import BoldIcon from "@lucide/svelte/icons/bold";
import { createMiraDefaultEditor } from ".";
import {
  createMiraDefaultExtensions,
  defaultMiraEditMode,
  MiraFeature,
  resolveMiraDefaultEditMode,
  resolveMiraDefaultFeatures,
  resolveMiraDefaultModes,
  resolveMiraDefaultToolbarActions,
  resolveMiraDefaultToolbarDefinitions,
  resolveMiraDefaultToolbarItems,
} from "./features";

describe("default UI feature resolution", () => {
  it("exports the vanilla factory from the package root", () => {
    expect(typeof createMiraDefaultEditor).toBe("function");
  });

  it("enables the onboarding feature set by default", () => {
    const features = resolveMiraDefaultFeatures();

    expect(features[MiraFeature.Toolbar]).toBe(true);
    expect(features[MiraFeature.Mermaid]).toBe(true);
    expect(features[MiraFeature.LivePreviewMode]).toBe(true);
  });

  it("filters toolbar items by feature flags", () => {
    expect(
      resolveMiraDefaultToolbarItems({
        features: {
          [MiraFeature.Mermaid]: false,
          [MiraFeature.Tables]: false,
        },
      }),
    ).not.toEqual(expect.arrayContaining(["mermaid", "table"]));
  });

  it("maps mode features to available modes", () => {
    expect(
      resolveMiraDefaultModes({
        [MiraFeature.SourceMode]: false,
        [MiraFeature.SplitMode]: false,
      }),
    ).toEqual(["live-preview", "preview"]);
  });

  it("resolves the configurable default edit mode", () => {
    expect(defaultMiraEditMode).toBe("live-preview");
    expect(
      resolveMiraDefaultEditMode("source", [
        "source",
        "live-preview",
        "preview",
      ]),
    ).toBe("source");
    expect(
      resolveMiraDefaultEditMode("source", ["live-preview", "preview"]),
    ).toBe("live-preview");
    expect(
      resolveMiraDefaultEditMode("live-preview", ["source", "preview"]),
    ).toBe("source");
  });

  it("merges configured and direct toolbar actions", () => {
    const configured = {
      id: "configured",
      label: "Configured action",
      icon: BoldIcon,
      run: () => undefined,
    };
    const direct = {
      id: "direct",
      label: "Direct action",
      icon: BoldIcon,
      run: () => undefined,
    };

    expect(
      resolveMiraDefaultToolbarActions({
        featureConfigs: {
          [MiraFeature.Toolbar]: {
            actions: [configured],
          },
        },
        toolbarActions: [direct],
      }),
    ).toEqual([configured, direct]);
  });

  it("merges configured and direct toolbar groups", () => {
    const configured = {
      id: "configured",
      items: [],
    };
    const direct = {
      id: "direct",
      align: "end" as const,
      items: [],
    };

    expect(
      resolveMiraDefaultToolbarDefinitions({
        featureConfigs: {
          [MiraFeature.Toolbar]: {
            toolbars: [configured],
          },
        },
        toolbars: [direct],
      }),
    ).toEqual([configured, direct]);
  });

  it("adds Mermaid by default and omits it when disabled", () => {
    expect(createMiraDefaultExtensions()).toHaveLength(1);
    expect(
      createMiraDefaultExtensions({
        features: {
          [MiraFeature.Mermaid]: false,
        },
      }),
    ).toHaveLength(0);
  });
});
