import type {
  MiraAssetResolver,
  MiraExtension,
  MiraLinkResolver,
  MiraMode,
  MiraTheme,
} from "@mira-mde/extensions";

export type MiraMdeProps = {
  value: string;
  mode?: MiraMode;
  extensions?: MiraExtension[];
  readonly?: boolean;
  placeholder?: string;
  lineWrapping?: boolean;
  spellcheck?: boolean;
  theme?: MiraTheme;
  sourcePath?: string;
  class?: string;
  toolbar?: boolean;
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  onChange?: (value: string) => void;
};
