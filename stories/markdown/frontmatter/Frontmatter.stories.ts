import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import {
  markdownEditorDocsSource,
  markdownPreviewDocsSource,
} from "../_shared/docs-source";
import { frontmatterMarkdown } from "../fixtures";
import FrontmatterActionsStory from "./FrontmatterActionsStory.svelte";

const meta = {
  title: "Markdown/Frontmatter",
  component: MarkdownPreviewStory,
  args: {
    value: frontmatterMarkdown,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Frontmatter stores document properties before the Markdown body.",
      },
      source: {
        language: "html",
        type: "code",
        code: markdownPreviewDocsSource("frontmatterMarkdown"),
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
        code: markdownEditorDocsSource("frontmatterMarkdown", "live-preview"),
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
        code: markdownEditorDocsSource("frontmatterMarkdown", "source"),
      },
    },
  },
};

export const PropertyActions: Story = {
  name: "Property actions and suggestions",
  render: () => ({
    Component: FrontmatterActionsStory,
  }),
  tags: ["visual-pending"],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("collapse and expand the property editor", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "Collapse properties" }),
      );
      await expect(
        canvas.getByRole("button", { name: "Expand properties" }),
      ).toHaveAttribute("aria-expanded", "false");
      await userEvent.click(
        canvas.getByRole("button", { name: "Expand properties" }),
      );
    });

    await step("edit and remove a property", async () => {
      const statusValue = canvas.getByRole("textbox", {
        name: "status value",
      });
      await userEvent.clear(statusValue);
      await userEvent.type(statusValue, "approved");
      await userEvent.tab();
      await expect(statusValue).toHaveTextContent("approved");

      await userEvent.click(
        canvas.getByRole("button", { name: "Change status type" }),
      );
      await userEvent.click(canvas.getByRole("menuitem", { name: "Remove" }));
      await expect(
        canvas.queryByRole("textbox", { name: "status value" }),
      ).not.toBeInTheDocument();
    });
  },
};
