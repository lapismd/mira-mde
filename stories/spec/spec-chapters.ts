export type SpecChapter = {
  source: string;
  storyId: string;
  title: string;
};

export const specChapters: SpecChapter[] = [
  {
    source: "index.md",
    storyId: "mira-specification-system-specification--docs",
    title: "System specification",
  },
  {
    source: "architecture.md",
    storyId: "mira-specification-architecture-and-boundaries--docs",
    title: "Architecture and boundaries",
  },
  {
    source: "packages.md",
    storyId: "mira-specification-public-packages-and-entry-points--docs",
    title: "Public packages and entry points",
  },
  {
    source: "editor-and-markdown.md",
    storyId: "mira-specification-portable-markdown-and-editor--docs",
    title: "Portable Markdown and editor",
  },
  {
    source: "mira-editor-and-frameworks.md",
    storyId: "mira-specification-mira-editor-and-frameworks--docs",
    title: "Mira Editor and frameworks",
  },
  {
    source: "styling.md",
    storyId: "mira-specification-styling-and-css-tokens--docs",
    title: "Styling and CSS tokens",
  },
  {
    source: "plugins/ai.md",
    storyId: "mira-specification-ai-plugin--docs",
    title: "AI plugin",
  },
  {
    source: "plugins/mermaid.md",
    storyId: "mira-specification-mermaid-plugin--docs",
    title: "Mermaid plugin",
  },
  {
    source: "storybook-catalog.md",
    storyId: "mira-specification-storybook-catalog--docs",
    title: "Storybook catalog",
  },
  {
    source: "spec-governance.md",
    storyId: "mira-specification-specification-governance--docs",
    title: "Specification governance",
  },
  {
    source: "verification.md",
    storyId: "mira-specification-verification--docs",
    title: "Verification",
  },
];

function normalizeSource(sourcePath: string, href: string): string {
  const sourceDirectory = sourcePath.includes("/")
    ? sourcePath.slice(0, sourcePath.lastIndexOf("/") + 1)
    : "";
  const parts = `${sourceDirectory}${href}`.split("/");
  const normalized: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") normalized.pop();
    else normalized.push(part);
  }
  return normalized.join("/");
}

export function specStoryHref(sourcePath: string, href: string): string {
  if (/^(?:https?:|mailto:|tel:|#)/.test(href)) return href;
  const [filePart, anchor] = href.split("#", 2);
  const target = normalizeSource(sourcePath, filePart || sourcePath);
  const chapter = specChapters.find((entry) => entry.source === target);
  if (!chapter) return href;
  return `?path=/docs/${chapter.storyId}${anchor ? `#${anchor}` : ""}`;
}
