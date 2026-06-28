import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraLinkResolver,
} from "@mira-mde/extensions";

export type MiraRichEditorOptions = {
  enabled?: boolean;
  livePreview?: boolean;
  extensions?: MiraExtension[];
  sourcePath?: string;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: unknown;
  onChange?: (
    replacement: string,
    from: number,
    to: number,
    nextValue: string,
  ) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};
