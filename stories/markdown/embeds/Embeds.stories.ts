import type { Meta, StoryObj } from "@storybook/svelte-vite";
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

export const Preview: Story = {};

export const LivePreview: Story = {
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
    },
  }),
  parameters: {
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
  name: "Source Mode",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
    },
  }),
  parameters: {
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
  name: "Adapter invalidation",
  render: () => ({
    Component: AdapterInvalidationStory,
  }),
  tags: ["visual-pending"],
};

export const PortableSurfaces: Story = {
  name: "Portable public surfaces",
  render: () => ({
    Component: PortableSurfacesStory,
  }),
  tags: ["visual-pending"],
  parameters: {
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { FileEmbed, MarkdownEmbed, NoteLink } from "@mira-mde/preview";
</script>

<NoteLink id="Embedded Note" text="portable note" {fileAdapter} />
<FileEmbed id="Embedded Note#Next Steps" {fileAdapter} />
<MarkdownEmbed value="## Embedded Markdown" />`,
      },
    },
  },
};
