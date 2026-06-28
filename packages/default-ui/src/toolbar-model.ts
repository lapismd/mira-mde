import type { MiraMode } from "@mira-mde/extensions";
import type { MiraDefaultEditMode, MiraDefaultToolbarItem } from "./features";

export type MiraViewModeMenuItem = {
  mode: MiraMode;
  label: string;
  checked: boolean;
};

export const miraDefaultModeLabels: Record<MiraMode, string> = {
  source: "Source mode",
  "live-preview": "Live edit",
  preview: "Reading view",
  split: "Split",
};

export const miraDefaultToolbarItemLabels: Record<
  MiraDefaultToolbarItem,
  string
> = {
  heading: "Heading",
  bold: "Bold",
  italic: "Italic",
  quote: "Blockquote",
  bulletList: "Bullet list",
  taskList: "Task list",
  link: "Link",
  table: "Table",
  gridTable: "Grid table",
  code: "Code block",
  math: "Math",
  mermaid: "Mermaid diagram",
};

export function isMiraEditMode(
  mode: MiraMode,
): mode is "live-preview" | "source" {
  return mode === "live-preview" || mode === "source";
}

export function resolveMiraViewModeMenuItems({
  mode,
  modeOptions,
  resolvedDefaultEditMode,
}: {
  mode: MiraMode;
  modeOptions: MiraMode[];
  resolvedDefaultEditMode: MiraDefaultEditMode;
}): MiraViewModeMenuItem[] {
  const itemModes: MiraMode[] = [];

  if (mode === "preview") {
    if (modeOptions.includes("live-preview")) {
      itemModes.push("live-preview");
    }
    if (modeOptions.includes("source")) {
      itemModes.push("source");
    }
  } else {
    const alternateEditMode = resolveMiraAlternateEditMode({
      mode,
      modeOptions,
      resolvedDefaultEditMode,
    });
    if (modeOptions.includes("preview")) {
      itemModes.push("preview");
    }
    if (alternateEditMode) {
      itemModes.push(alternateEditMode);
    }
  }

  return itemModes.map((modeOption) => ({
    checked: mode === modeOption,
    label: miraDefaultModeLabels[modeOption],
    mode: modeOption,
  }));
}

export function resolveMiraAlternateEditMode({
  mode,
  modeOptions,
  resolvedDefaultEditMode,
}: {
  mode: MiraMode;
  modeOptions: MiraMode[];
  resolvedDefaultEditMode: MiraDefaultEditMode;
}): MiraMode | null {
  if (mode === "live-preview" && modeOptions.includes("source")) {
    return "source";
  }
  if (mode === "source" && modeOptions.includes("live-preview")) {
    return "live-preview";
  }
  if (mode === "split") {
    const defaultAlternate =
      resolvedDefaultEditMode === "source" ? "live-preview" : "source";
    if (modeOptions.includes(defaultAlternate)) {
      return defaultAlternate;
    }
    if (modeOptions.includes(resolvedDefaultEditMode)) {
      return resolvedDefaultEditMode;
    }
  }
  return null;
}

export function resolveMiraModeAfterSplit({
  lastNonSplitMode,
  modeOptions,
  resolvedDefaultEditMode,
}: {
  lastNonSplitMode: MiraMode | null | undefined;
  modeOptions: MiraMode[];
  resolvedDefaultEditMode: MiraDefaultEditMode;
}): MiraMode {
  if (
    lastNonSplitMode &&
    lastNonSplitMode !== "split" &&
    modeOptions.includes(lastNonSplitMode)
  ) {
    return lastNonSplitMode;
  }
  if (modeOptions.includes(resolvedDefaultEditMode)) {
    return resolvedDefaultEditMode;
  }
  if (modeOptions.includes("preview")) {
    return "preview";
  }
  return (
    modeOptions.find((modeOption) => modeOption !== "split") ?? "live-preview"
  );
}

export function resolveMiraViewToggleMode(
  mode: MiraMode,
  resolvedDefaultEditMode: MiraDefaultEditMode,
): MiraMode {
  return mode === "preview" ? resolvedDefaultEditMode : "preview";
}

export function miraViewToggleLabel(mode: MiraMode): string {
  return mode === "preview" ? "Edit" : "Reading view";
}

export const miraViewOptionsLabel = "View options";

export function templateForMiraToolbarItem(
  item: MiraDefaultToolbarItem,
): string {
  switch (item) {
    case "heading":
      return "# Heading";
    case "bold":
      return "**strong**";
    case "italic":
      return "_emphasis_";
    case "quote":
      return "> Quote";
    case "bulletList":
      return "- List item";
    case "taskList":
      return "- [ ] Task";
    case "link":
      return "[label](https://example.com)";
    case "table":
      return "\n| Column | Value |\n| --- | --- |\n| Item | Detail |\n";
    case "gridTable":
      return "\n+--------+--------+\n| Column | Value  |\n+========+========+\n| Item   | Detail |\n+--------+--------+\n";
    case "code":
      return '\n```ts\nconsole.log("hello");\n```\n';
    case "math":
      return "$E = mc^2$";
    case "mermaid":
      return "\n```mermaid\nflowchart TD\n  A[Start] --> B[Done]\n```\n";
  }
}
