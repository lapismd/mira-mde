import { useEffect, useRef } from "react";
import { mount, unmount } from "svelte";
import { MarkdownPreview } from "@mira-mde/preview";
import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraLinkResolver,
} from "@mira-mde/extensions";
import type { MiraFrontmatterConfig } from "./types";

export type MarkdownPreviewHostProps = {
  value: string;
  sourcePath?: string;
  extensions?: MiraExtension[];
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
  onChange?: (replacement: string, from: number, to: number) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export function MarkdownPreviewHost({
  assetResolver,
  extensions = [],
  fileAdapter,
  frontmatterConfig,
  frontmatterOpen = true,
  linkResolver,
  onChange,
  onFrontmatterChange,
  sourcePath,
  value,
}: MarkdownPreviewHostProps): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }

    const component = mount(MarkdownPreview, {
      target: hostRef.current,
      props: {
        assetResolver,
        class: "markdown-reading-view",
        extensions,
        fileAdapter,
        frontmatterConfig,
        frontmatterOpen,
        linkResolver,
        onChange,
        onFrontmatterChange,
        sourcePath,
        value,
      } as any,
    });

    return () => {
      unmount(component as never);
    };
  }, [
    assetResolver,
    extensions,
    fileAdapter,
    frontmatterConfig,
    frontmatterOpen,
    linkResolver,
    onChange,
    onFrontmatterChange,
    sourcePath,
    value,
  ]);

  return <div className="mira-react-preview-host" ref={hostRef} />;
}
