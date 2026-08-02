import { useEffect, useRef } from "react";
import { mount, unmount } from "svelte";
import { MarkdownOutline, MarkdownPreview } from "@mira-mde/preview";
import type {
  MiraAssetResolver,
  MiraExtension,
  MiraFileAdapter,
  MiraLinkResolver,
} from "@mira-mde/extensions";
import type { MiraFrontmatterConfig } from "./types";
import type { MiraOutlineVariant } from "./types";

export type MarkdownPreviewHostProps = {
  value: string;
  sourcePath?: string;
  extensions?: MiraExtension[];
  linkResolver?: MiraLinkResolver;
  assetResolver?: MiraAssetResolver;
  fileAdapter?: MiraFileAdapter;
  frontmatterOpen?: boolean;
  frontmatterConfig?: MiraFrontmatterConfig;
  headingIds?: boolean;
  headingIdPrefix?: string;
  htmlPolicy?: "trusted" | "safe";
  emoji?: boolean;
  outline?: boolean;
  outlineVariant?: MiraOutlineVariant;
  onChange?: (replacement: string, from: number, to: number) => void;
  onFrontmatterChange?: (nextYaml: string, nextValue: string) => void;
};

export function MarkdownPreviewHost({
  assetResolver,
  extensions = [],
  fileAdapter,
  frontmatterConfig,
  frontmatterOpen = true,
  headingIds = false,
  headingIdPrefix = "",
  htmlPolicy = "trusted",
  emoji = false,
  outline = false,
  outlineVariant = "floating",
  linkResolver,
  onChange,
  onFrontmatterChange,
  sourcePath,
  value,
}: MarkdownPreviewHostProps): React.ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const outlineRef = useRef<HTMLDivElement | null>(null);

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
        headingIds,
        headingIdPrefix,
        htmlPolicy,
        emoji,
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
    headingIds,
    headingIdPrefix,
    htmlPolicy,
    emoji,
    linkResolver,
    onChange,
    onFrontmatterChange,
    sourcePath,
    value,
  ]);

  useEffect(() => {
    if (!outline || !outlineRef.current) {
      return;
    }

    const component = mount(MarkdownOutline, {
      target: outlineRef.current,
      props: {
        headingIdPrefix,
        root: hostRef.current,
        variant: outlineVariant,
        value,
      },
    });

    return () => {
      unmount(component as never);
    };
  }, [headingIdPrefix, outline, outlineVariant, value]);

  return (
    <div
      className={`mira-react-preview-host ${
        outline ? `mira-react-preview-host--outline-${outlineVariant}` : ""
      }`.trim()}
    >
      <div className="mira-react-preview-host__preview" ref={hostRef} />
      {outline ? (
        <div className="mira-react-preview-host__outline" ref={outlineRef} />
      ) : null}
    </div>
  );
}
