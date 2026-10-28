import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import AttachmentTrackingStory from "./AttachmentTrackingStory.svelte";

const meta = {
  title: "Markdown/Embeds/Attachment tracking",
  component: AttachmentTrackingStory,
  tags: ["visual-pending", "!autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AttachmentTrackingStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ReactiveAdmission: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/reactive-admission-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "Adapter admission and observation retain the same captured preview writer while its input lease is held and after editing resumes.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector("[data-registrations]"),
      ).toHaveAttribute("data-registrations", "1"),
    );
    expect(
      canvas.queryByRole("button", { name: "Edit Stable source" }),
    ).toBeNull();
    await userEvent.click(
      canvas.getByRole("button", { name: "Admit source session" }),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Edit Stable source" }),
    );
    const editor = canvasElement.querySelector<HTMLElement>(
      '.cm-content[contenteditable="true"]',
    )!;
    await userEvent.click(editor);
    await userEvent.type(editor, "Retained draft");
    await userEvent.click(
      canvas.getByRole("button", { name: "Update observation" }),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Flush source session" }),
    );
    await waitFor(() =>
      expect(canvas.getByLabelText("Saved Markdown")).toHaveTextContent(
        "Retained draft",
      ),
    );
    expect(canvasElement.querySelector("[data-registrations]")).toHaveAttribute(
      "data-registrations",
      "1",
    );
    expect(editor).toHaveAttribute("contenteditable", "true");
  },
};
