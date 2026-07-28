import type { Extension } from "@codemirror/state";
import type {
  MiraFileAdapter,
  MiraMarkdownAuthoringConfig,
} from "@mira-mde/extensions";
import { createMarkdownCompletionExtensions } from "./completion";
import { createMarkdownInputHandlerExtensions } from "./input-handlers";
import { createMarkdownSmartPasteExtension } from "./paste";

export type MiraMarkdownAuthoringOptions = {
  config?: MiraMarkdownAuthoringConfig;
  fileAdapter?: MiraFileAdapter;
  sourcePath?: string;
};

export function createMarkdownAuthoringExtensions(
  options: MiraMarkdownAuthoringOptions = {},
): Extension[] {
  return [
    createMarkdownCompletionExtensions({
      config: options.config?.completions,
      fileAdapter: options.fileAdapter,
      sourcePath: options.sourcePath,
    }),
    createMarkdownSmartPasteExtension(options.config?.smartPaste),
    createMarkdownInputHandlerExtensions(options.config?.inputHandlers),
  ].flat();
}
