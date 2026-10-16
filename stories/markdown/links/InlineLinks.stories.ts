import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import InlineLinksStory from "./InlineLinksStory.svelte";

const meta = {
  title: "Markdown/Inline Links",
  component: InlineLinksStory,
  tags: ["visual-pending"],
  parameters: {
    docs: {
      description: {
        component:
          "Opt-in inlineLinksExtension from @lapismd/mira/extensions. Canonical contract: editor-and-markdown.md#bundled-inline-links.",
      },
    },
  },
} satisfies Meta<typeof InlineLinksStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("link", { name: "issue #42", exact: true }),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-link-site="forgejo"]'),
    ).toBeInTheDocument();
  },
};
export const OverridesAndPrivateHosts: Story = { args: { variant: "custom" } };
export const CustomOnly: Story = { args: { variant: "custom-only" } };
export const LivePreview: Story = { args: { mode: "live-preview" } };
export const Split: Story = { args: { mode: "split" } };
export const Source: Story = { args: { mode: "source" } };
export const Narrow: Story = { args: { narrow: true } };
