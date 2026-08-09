import MarkdownPreview from "./markdown-preview.svelte";
import MarkdownOutline from "./markdown-outline.svelte";
import Markdown from "./renderer/markdown.svelte";
import FileEmbed from "./file-embed.svelte";
import MarkdownEmbed from "./markdown-embed.svelte";
import NoteLink from "./note-link.svelte";
import FrontmatterEditor from "./components/frontmatter.svelte";

export {
  FileEmbed,
  FrontmatterEditor,
  Markdown,
  MarkdownEmbed,
  MarkdownOutline,
  MarkdownPreview,
  NoteLink,
};
export type { MarkdownOutlineItem, MarkdownOutlineVariant } from "./outline";
export { default as Renderer } from "./renderer/renderer.svelte";
export * from "./code-language";
export type * from "./renderer/types";
export * from "./embed-target";
export * from "./remark";
export {
  FrontmatterController,
  createFrontmatterPropertyManager,
  type FrontmatterControllerCommit,
  type FrontmatterControllerOptions,
  type FrontmatterPropertyManager,
  type CreateFrontmatterPropertyManagerOptions,
  type FrontmatterRenameResult,
  type FrontmatterConfig,
  type FrontmatterProperty,
  type FrontmatterPropertyKind,
  type FrontmatterTypeDefinition,
} from "./frontmatter";
export default MarkdownPreview;
