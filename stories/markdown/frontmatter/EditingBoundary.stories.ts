import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import EditingBoundaryStory from "./EditingBoundaryStory.svelte";

const meta = {
  title: "Markdown/Frontmatter/Editing boundary",
  component: EditingBoundaryStory,
  tags: ["visual-pending", "!autodocs"],
} satisfies Meta<typeof EditingBoundaryStory>;
export default meta;
type Story = StoryObj<typeof meta>;

async function editThroughRefresh(canvasElement: HTMLElement, queued: boolean) {
  const canvas = within(canvasElement);
  const input = await canvas.findByRole("combobox", { name: "status value" });
  if (queued) {
    await userEvent.click(
      canvas.getByRole("button", { name: "Queue refresh and focus property" }),
    );
  } else {
    await userEvent.click(input);
  }
  await userEvent.clear(input);
  await userEvent.type(input, "local");
  if (!queued)
    await userEvent.click(
      canvas.getByRole("button", { name: "Refresh external record" }),
    );
  await expect(input).toHaveFocus();
  await expect(input).toHaveTextContent("local");
  await userEvent.keyboard("{Enter}");
  await waitFor(() =>
    expect(canvas.getByLabelText("Submitted value")).toHaveTextContent("local"),
  );
  await expect(canvas.getByLabelText("Committed baseline")).toHaveTextContent(
    "ready",
  );
  await expect(
    canvasElement.querySelector("[data-baseline-frozen]"),
  ).toHaveAttribute("data-baseline-frozen", "true");
}

export const FocusedRefresh: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A focused local property retains the immutable record shown before external metadata refresh.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/frontmatter/focused-refresh-chromium.png",
      ],
    },
  },
  play: ({ canvasElement }) => editThroughRefresh(canvasElement, false),
};

export const QueuedRefresh: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A refresh queued immediately before focus cannot replace the record already rendered in the property.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/frontmatter/queued-refresh-chromium.png",
      ],
    },
  },
  play: ({ canvasElement }) => editThroughRefresh(canvasElement, true),
};

export const ReplacedTarget: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "A focused edit refuses after its controller changes source file, preserving the replacement record without writing either target.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/frontmatter/replaced-target-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "status value" });
    await userEvent.click(input);
    await userEvent.clear(input);
    await userEvent.type(input, "old target draft");
    await userEvent.click(
      canvas.getByRole("button", { name: "Replace source target" }),
    );
    await expect(input).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() =>
      expect(canvas.getByLabelText("Refused action")).toHaveTextContent("edit"),
    );
    await expect(canvas.getByLabelText("Write count")).toHaveTextContent("0");
    await expect(canvas.getByLabelText("Current status")).toHaveTextContent(
      "second",
    );
  },
};
