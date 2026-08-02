import type { MiraFileAdapter, MiraFileRef } from "@lapismd/mira/extensions";

type StoryFile = MiraFileRef & {
  assetUrl?: string;
  markdown?: string;
};

const storyFiles = new Map<string, StoryFile>([
  [
    "notes/markdown.md",
    {
      kind: "markdown",
      markdown:
        "# Markdown Note\n\nThis hover preview is resolved through the Storybook `MiraFileAdapter`.",
      name: "Markdown Note",
      path: "notes/markdown.md",
    },
  ],
  [
    "Daily Note",
    {
      kind: "markdown",
      markdown:
        "# Daily Note\n\nWikilinks, path links, and embeds share one portable adapter.",
      name: "Daily Note",
      path: "Daily Note",
    },
  ],
  [
    "Editor Architecture",
    {
      kind: "markdown",
      markdown:
        "# Editor Architecture\n\nThe default editor composes CodeMirror, preview rendering, Mermaid, and table widgets.",
      name: "Editor Architecture",
      path: "Editor Architecture",
    },
  ],
  [
    "Architecture Diagram",
    {
      assetUrl: "/mira-markdown-demo.svg",
      kind: "image",
      name: "Architecture Diagram",
      path: "Architecture Diagram",
    },
  ],
  [
    "Embedded Note",
    {
      kind: "markdown",
      markdown:
        "# Embedded Note\n\nThis note is rendered inline through `![[Embedded Note]]` and the Storybook `MiraFileAdapter`.\n\n## Next Steps\n\nSection embeds stop at the next sibling heading.\n\nA portable referenced paragraph. ^portable-block\n\n## Decisions\n\nThis sibling section is excluded from the Next Steps embed.",
      name: "Embedded Note",
      path: "Embedded Note",
    },
  ],
  [
    "notes/project.md",
    {
      kind: "markdown",
      markdown:
        "# Project\n\n## Next Steps\n\n## Decisions\n\nPortable completion target.",
      name: "project.md",
      path: "notes/project.md",
    },
  ],
]);

export const storyFileAdapter: MiraFileAdapter = {
  resolveLink({ href }) {
    const path = href.split("#", 1)[0] ?? href;
    return storyFiles.get(path) ?? null;
  },
  readMarkdown(file) {
    return storyFiles.get(file.path)?.markdown ?? null;
  },
  readAssetUrl(file) {
    return storyFiles.get(file.path)?.assetUrl ?? null;
  },
  openFile(file) {
    console.info("Mira storybook openFile", file.path);
  },
  listFiles() {
    return Array.from(storyFiles.values());
  },
  getHeadings(file) {
    if (file.path === "notes/project.md") {
      return [
        { id: "project", level: 1, text: "Project" },
        { id: "next-steps", level: 2, text: "Next Steps" },
        { id: "decisions", level: 2, text: "Decisions" },
      ];
    }
    return [];
  },
};
