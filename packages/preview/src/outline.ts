export type MarkdownOutlineVariant = "floating" | "sidebar";

export type MarkdownOutlineItem = {
  id: string;
  text: string;
  level: number;
};

export function slugHeadingText(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "heading"
  );
}
