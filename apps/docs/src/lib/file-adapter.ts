import type { MiraFileAdapter, MiraFileRef } from "@mira-mde/extensions";

type DocsFile = MiraFileRef & {
  assetUrl?: string;
  markdown?: string;
};

const docsFiles = new Map<string, DocsFile>([
  [
    "notes/markdown.md",
    {
      kind: "markdown",
      markdown:
        "# Markdown Note\n\nThis hover preview is resolved through the docs `MiraFileAdapter`.",
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
        "# Embedded Note\n\nThis note is rendered inline through `![[Embedded Note]]` and the docs `MiraFileAdapter`.",
      name: "Embedded Note",
      path: "Embedded Note",
    },
  ],
]);

export const docsFileAdapter: MiraFileAdapter = {
  resolveLink({ href }) {
    const path = href.split("#", 1)[0] ?? href;
    return docsFiles.get(path) ?? null;
  },
  readMarkdown(file) {
    return docsFiles.get(file.path)?.markdown ?? null;
  },
  readAssetUrl(file) {
    return docsFiles.get(file.path)?.assetUrl ?? null;
  },
  openFile(file) {
    console.info("Mira docs openFile", file.path);
  },
  listFiles() {
    return Array.from(docsFiles.values());
  },
};
