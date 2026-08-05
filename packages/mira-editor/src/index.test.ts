import { describe, expect, it } from "vitest";
import BoldIcon from "@lucide/svelte/icons/bold";
import MiraEditor from ".";
import packageManifest from "../package.json";
import {
  createMiraEditorExtensions,
  defaultMiraEditorEditMode,
  MiraFeature,
  resolveMiraEditorEditMode,
  resolveMiraEditorFeatures,
  resolveMiraEditorModes,
  resolveMiraEditorSlashCommands,
  resolveMiraEditorToolbarActions,
  resolveMiraEditorToolbarDefinitions,
  resolveMiraEditorToolbarItems,
} from "./features";
import { MIRA_EDITOR_VERSION } from "./version";

describe("Mira Editor feature resolution", () => {
  it("keeps the public version synchronized with the package manifest", () => {
    expect(MIRA_EDITOR_VERSION).toBe(packageManifest.version);
  });

  it("exports the Svelte editor from the package root", () => {
    expect(MiraEditor).toBeTruthy();
  });

  it("enables the onboarding feature set by default", () => {
    const features = resolveMiraEditorFeatures();

    expect(features[MiraFeature.Toolbar]).toBe(true);
    expect(features[MiraFeature.Mermaid]).toBe(true);
    expect(features[MiraFeature.SlashCommands]).toBe(true);
    expect(features[MiraFeature.BlockControls]).toBe(true);
    expect(features[MiraFeature.LivePreviewMode]).toBe(true);
  });

  it("filters toolbar items by feature flags", () => {
    expect(
      resolveMiraEditorToolbarItems({
        features: {
          [MiraFeature.Mermaid]: false,
          [MiraFeature.Tables]: false,
        },
      }),
    ).not.toEqual(expect.arrayContaining(["mermaid", "table"]));
  });

  it("maps mode features to available modes", () => {
    expect(
      resolveMiraEditorModes({
        [MiraFeature.SourceMode]: false,
        [MiraFeature.SplitMode]: false,
      }),
    ).toEqual(["live-preview", "preview"]);
  });

  it("resolves the configurable default edit mode", () => {
    expect(defaultMiraEditorEditMode).toBe("live-preview");
    expect(
      resolveMiraEditorEditMode("source", [
        "source",
        "live-preview",
        "preview",
      ]),
    ).toBe("source");
    expect(
      resolveMiraEditorEditMode("source", ["live-preview", "preview"]),
    ).toBe("live-preview");
    expect(
      resolveMiraEditorEditMode("live-preview", ["source", "preview"]),
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
      resolveMiraEditorToolbarActions({
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
      resolveMiraEditorToolbarDefinitions({
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
    expect(
      createMiraEditorExtensions().some(
        (extension) => extension.name === "mermaid",
      ),
    ).toBe(true);
    expect(
      createMiraEditorExtensions({
        features: {
          [MiraFeature.Mermaid]: false,
        },
      }),
    ).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "mermaid" })]),
    );
  });

  it("adds slash commands by default and filters them by feature flags", () => {
    expect(
      createMiraEditorExtensions().some(
        (extension) => extension.name === "default-slash-commands",
      ),
    ).toBe(true);
    expect(
      resolveMiraEditorSlashCommands({
        features: {
          [MiraFeature.Tables]: false,
        },
      }).map((command) => command.id),
    ).not.toContain("table");
  });

  it("uses markdown templates for default slash command cursor placement", () => {
    expect(
      resolveMiraEditorSlashCommands().find(
        (command) => command.id === "heading1",
      )?.insert,
    ).toEqual({
      markdown: "# ",
      selection: 2,
    });
  });

  it("supports custom slash commands", () => {
    expect(
      resolveMiraEditorSlashCommands({
        featureConfigs: {
          [MiraFeature.SlashCommands]: {
            disableDefaultCommands: true,
            commands: [
              {
                id: "custom",
                label: "Custom",
                insert: "custom",
              },
            ],
          },
        },
      }),
    ).toEqual([
      {
        id: "custom",
        label: "Custom",
        insert: "custom",
      },
    ]);
  });
});
