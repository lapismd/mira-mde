import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { embedsMarkdown } from "../fixtures";
import AdapterInvalidationStory from "./AdapterInvalidationStory.svelte";
import EditablePreviewStory from "./EditablePreviewStory.svelte";
import EditingProtectionStory from "./EditingProtectionStory.svelte";
import PortableSurfacesStory from "./PortableSurfacesStory.svelte";
import RecursiveEmbedsStory from "./RecursiveEmbedsStory.svelte";

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

export const RecursiveEmbeds: Story = {
  name: "Recursive embeds",
  render: () => ({ Component: RecursiveEmbedsStory }),
  tags: [
    "visual-pending",
    "!visual-approved",
    "!visual-ready",
    "!visual-failed",
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    for (let replay = 0; replay < 2; replay += 1) {
      await step(
        "withdraw custom rendering without recursive fallback",
        async () => {
          await expect(
            canvas.getAllByText("Custom embed active."),
          ).toHaveLength(6);
          await userEvent.click(
            canvas.getByRole("button", { name: "Withdraw custom renderer" }),
          );
          await waitFor(() =>
            expect(
              canvasElement.querySelectorAll('[data-embed-state="recursive"]'),
            ).toHaveLength(3),
          );
          await expect(
            canvas.getAllByText("Repeated sibling content."),
          ).toHaveLength(2);
          await expect(
            canvas.getAllByText("Safe same-note section."),
          ).toHaveLength(2);
          await expect(
            canvas.getAllByText("Safe same-note block."),
          ).toHaveLength(2);
          await expect(canvas.getByLabelText("Embed reads")).toHaveAttribute(
            "data-exceeded",
            "false",
          );
          await expect(
            Number(canvas.getByLabelText("Embed reads").textContent),
          ).toBeLessThanOrEqual(12);
        },
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "Restore custom renderer" }),
      );
    }
    await expect(canvas.getAllByText("Custom embed active.")).toHaveLength(6);
  },
};

export const Preview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
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

export const EditablePreview: Story = {
  name: "Editable Markdown preview",
  render: () => ({
    Component: EditablePreviewStory,
  }),
  tags: [
    "visual-pending",
    "!visual-approved",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    docs: {
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
</script>

<EditableMarkdownPreview {file} {fileAdapter} bind:editing />`,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("activate the writable rendered preview", async () => {
      await userEvent.click(
        canvas.getByText(
          "Click this rendered paragraph to edit the note in place.",
        ),
      );
      await expect(
        canvasElement.querySelector("[data-editable-markdown-editor]"),
      ).toBeInTheDocument();
      await expect(canvas.getByText("Editing is pinned open")).toBeVisible();
    });

    await step("edit and autosave after 500ms", async () => {
      const editor = canvasElement.querySelector<HTMLElement>(".cm-content");
      await expect(editor).toBeInTheDocument();
      await userEvent.click(editor as HTMLElement);
      await userEvent.keyboard("{Control>}a{/Control}# Saved Preview");
      await new Promise((resolve) => setTimeout(resolve, 550));
      await expect(
        canvas.getByLabelText("Persisted Markdown"),
      ).toHaveTextContent("# Saved Preview");
    });

    await step("Escape flushes and returns to rendered preview", async () => {
      await userEvent.keyboard("{Escape}");
      await expect(canvas.getByText("Rendered preview")).toBeVisible();
      await expect(
        canvas.getByRole("heading", { name: "Saved Preview" }),
      ).toBeVisible();
    });
  },
};

export const EditingProtection: Story = {
  name: "External editing protection",
  render: () => ({ Component: EditingProtectionStory }),
  tags: [
    "visual-pending",
    "!visual-approved",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/editing-protection-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "A registered Markdown session drains in-flight persistence and becomes read-only before external apply. A pending draft keeps its original document when the preview switches files.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraMarkdownEditingSession } from "@lapismd/mira/extensions";

  const sessions = new Map<string, Set<MiraMarkdownEditingSession>>();
  const fileAdapter = {
    ...adapter,
    registerEditingSession(path, session) {
      const entries = sessions.get(path) ?? new Set();
      entries.add(session);
      sessions.set(path, entries);
      return () => { entries.delete(session); };
    },
  };
  async function updateFromOutside(path, apply) {
    const releases = [];
    try {
      for (const session of sessions.get(path) ?? [])
        releases.push(await session.protect());
      await apply();
    } finally {
      releases.reverse().forEach(release => release());
    }
  }
</script>

<EditableMarkdownPreview {file} {fileAdapter} />`,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-session-registered="true"]'),
      ).toBeInTheDocument(),
    );
    await userEvent.click(
      canvas.getByText("Edit this note before an external update."),
    );
    const content = () =>
      canvasElement.querySelector<HTMLElement>(".cm-content")!;
    await step("join a held save and block further typing", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Pause persistence" }),
      );
      await userEvent.click(content());
      await userEvent.keyboard("{Control>}a{/Control}# Local draft");
      await userEvent.click(
        canvas.getByRole("button", { name: "Protect editor" }),
      );
      await expect(canvas.getByLabelText("Protection state")).toHaveTextContent(
        "Waiting for persistence",
      );
      await expect(
        canvas.getByLabelText("Original Markdown"),
      ).toHaveTextContent("# First");
      await userEvent.click(
        canvas.getByRole("button", { name: "Finish save" }),
      );
      await waitFor(() =>
        expect(canvas.getByLabelText("Protection state")).toHaveTextContent(
          "Protected",
        ),
      );
      await expect(content()).toHaveAttribute("contenteditable", "false");
      await expect(
        canvas.getByLabelText("Original Markdown"),
      ).toHaveTextContent("# Local draft");
      await userEvent.click(content());
      await userEvent.keyboard("blocked");
      await expect(content()).toHaveTextContent("Local draft");
      await userEvent.click(
        canvas.getByRole("button", { name: "Apply external change" }),
      );
      await waitFor(() => expect(content()).toHaveTextContent("Incoming"));
      await userEvent.click(
        canvas.getByRole("button", { name: "Release editor" }),
      );
      await waitFor(() =>
        expect(content()).toHaveAttribute("contenteditable", "true"),
      );
    });
    await step(
      "preserve the original persistence destination on document switch",
      async () => {
        await userEvent.click(content());
        await userEvent.keyboard("{Control>}a{/Control}# First final");
        await userEvent.click(
          canvas.getByRole("button", { name: "Switch document" }),
        );
        await waitFor(() =>
          expect(canvas.getByLabelText("Original Markdown")).toHaveTextContent(
            "# First final",
          ),
        );
        await expect(canvas.getByLabelText("Other Markdown")).toHaveTextContent(
          "# Second",
        );
        await waitFor(() =>
          expect(
            canvasElement.querySelector("[data-editable-markdown-preview]"),
          ).toHaveTextContent("Second"),
        );
      },
    );
  },
};
