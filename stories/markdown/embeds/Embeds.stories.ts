import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { embedsMarkdown } from "../fixtures";
import AdapterInvalidationStory from "./AdapterInvalidationStory.svelte";
import PortableSurfacesStory from "./PortableSurfacesStory.svelte";

const meta = {
  title: "Markdown/Embeds",
  component: MarkdownPreviewStory,
  args: {
    value: embedsMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Embed another note or asset with Obsidian-style embed syntax.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("embedsMarkdown"),
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Preview: Story = {
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
};

export const LivePreview: Story = {
  tags: ["visual-pending"],
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/live-preview-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("embedsMarkdown", "live-preview"),
      },
    },
  },
};

export const SourceMode: Story = {
  tags: ["visual-pending"],
  name: "Source Mode",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
    },
  }),
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/source-mode-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "html",
        type: "code",
        code: markdownEditorDocsSource("embedsMarkdown", "source"),
      },
    },
  },
};

export const AdapterInvalidation: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/adapter-invalidation-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Adapter invalidation",
  render: () => ({
    Component: AdapterInvalidationStory,
  }),
  tags: ["visual-pending"],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("resolve a previously missing target", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Create missing note" }),
      );
      await expect(
        canvas.getByText("Future Note was created and resolved."),
      ).toBeVisible();
      const futureNote = canvasElement.querySelector<HTMLElement>(
        '[data-embed="Future Note"]',
      );
      await expect(futureNote).toHaveTextContent(
        "This unresolved embed recovered through watchTarget.",
      );
    });

    await step("refresh an already resolved target", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Update resolved note" }),
      );
      await expect(
        canvas.getByText("Mutable Note content was refreshed."),
      ).toBeVisible();
      const mutableNote = canvasElement.querySelector<HTMLElement>(
        '[data-embed="Mutable Note"]',
      );
      await expect(mutableNote).toHaveTextContent(
        "watchFile refreshed this content in place.",
      );
    });
  },
};

export const PortableSurfaces: Story = {
  name: "Portable public surfaces",
  render: () => ({
    Component: PortableSurfacesStory,
  }),
  tags: ["visual-pending"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/portable-surfaces-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { FileEmbed, MarkdownEmbed, NoteLink } from "@lapismd/mira/preview";
</script>

<NoteLink id="Embedded Note" text="portable note" {fileAdapter} />
<FileEmbed id="Embedded Note#Next Steps" {fileAdapter} />
<MarkdownEmbed value="## Embedded Markdown" />`,
      },
    },
  },
};
