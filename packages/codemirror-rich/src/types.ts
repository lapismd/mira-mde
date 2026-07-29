import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraListCallout,
  MiraLinkResolver,
  MiraBlockAction,
} from "@mira-mde/extensions";

export type MiraRichEditorOptions = {
  enabled?: boolean;
  livePreview?: boolean;
  blockControls?: boolean;
  blockActions?: MiraBlockAction[];
  indentGuides?: boolean;
  extensions?: MiraExtension[];
  sourcePath?: string;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: unknown;
  listCallouts?: MiraListCallout[];
  onChange?: (
    replacement: string,
    from: number,
    to: number,
    nextValue: string,
  ) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};
