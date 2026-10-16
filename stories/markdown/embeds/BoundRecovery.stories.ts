import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import BoundRecoveryStory from "./BoundRecoveryStory.svelte";

const meta = {
  title: "Markdown/Embeds",
  component: BoundRecoveryStory,
  tags: [
    "visual-pending",
    "!visual-approved",
    "!visual-ready",
    "!visual-failed",
  ],
} satisfies Meta<typeof BoundRecoveryStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BoundRecovery: Story = {
  name: "Bound writes and recovery",
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/bound-recovery-chromium.png",
      ],
    },
    docs: {
      description: {
        story:
          "A bound source session preserves failed drafts, protects a recovery decision, and retains detached writes until explicitly resolved.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { EditableMarkdownPreview } from "@lapismd/mira/preview";
  import type { MiraFileAdapter } from "@lapismd/mira/extensions";

  // The storage owner validates the destination and any external snapshot.
  const fileAdapter: MiraFileAdapter = {
    ...adapter,
    bindMarkdownEditingSession(path, session) {
      return storage.bind(path, session);
    },
  };
  async function useReviewedExternal(session, reviewedContents) {
    const lease = await session.text.protectRecovery();
    try { lease.useExternal(reviewedContents); }
    finally { lease.release(); }
  }
</script>

<EditableMarkdownPreview {file} {fileAdapter} />`,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const content = () =>
      canvasElement.querySelector<HTMLElement>(".cm-content")!;
    const click = (name: string) =>
      userEvent.click(canvas.getByRole("button", { name }));
    async function replace(value: string) {
      await userEvent.click(content());
      await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
      await waitFor(() => expect(content().textContent).toBe(""));
      await userEvent.keyboard(value);
      await expect(canvas.getByLabelText("Draft Markdown")).toHaveTextContent(
        value,
      );
    }
    await waitFor(() =>
      expect(canvas.getByLabelText("Bound sessions")).toHaveTextContent("1"),
    );
    await userEvent.click(canvas.getByText("A source-bound preview."));
    await step(
      "recover a failed active preview through its protected text session",
      async () => {
        await click("Fail persistence");
        await replace("# Failed draft");
        await waitFor(() =>
          expect(canvas.getByRole("alert")).toHaveTextContent(
            "External file changed",
          ),
        );
        await expect(canvas.getByLabelText("Disk Markdown")).toHaveTextContent(
          "# Original",
        );
        await click("Protect recovery");
        await waitFor(() =>
          expect(canvas.getByLabelText("Recovery status")).toHaveTextContent(
            "Protected",
          ),
        );
        await expect(content()).toHaveAttribute("contenteditable", "false");
        await click("Use external content");
        await waitFor(() =>
          expect(content()).toHaveTextContent("Reviewed disk content."),
        );
        await expect(content()).toHaveAttribute("contenteditable", "true");
        await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
        await replace("# Saved after recovery");
        await waitFor(() =>
          expect(canvas.getByLabelText("Disk Markdown")).toHaveTextContent(
            "# Saved after recovery",
          ),
        );
      },
    );
    await step(
      "retain a detached failed binding until its original draft is acknowledged",
      async () => {
        await click("Fail persistence");
        await replace("Retained draft after detach.");
        await expect(content()).toHaveTextContent(
          "Retained draft after detach.",
        );
        await expect(canvas.getByLabelText("Draft Markdown")).toHaveTextContent(
          "Retained draft after detach.",
        );
        await waitFor(() =>
          expect(canvas.getByRole("alert")).toHaveTextContent(
            "External file changed",
          ),
        );
        await click("Detach preview");
        await waitFor(() => expect(content()).toBeNull());
        await expect(canvas.getByLabelText("Bound sessions")).toHaveTextContent(
          "1",
        );
        await click("Protect recovery");
        await waitFor(() =>
          expect(canvas.getByLabelText("Recovery status")).toHaveTextContent(
            "Protected",
          ),
        );
        await click("Accept retained draft");
        await waitFor(() =>
          expect(canvas.getByLabelText("Bound sessions")).toHaveTextContent(
            "0",
          ),
        );
        await expect(canvas.getByLabelText("Disk Markdown")).toHaveTextContent(
          "Retained draft after detach.",
        );
        await click("Show preview");
        await waitFor(() =>
          expect(
            within(
              canvasElement.querySelector("[data-editable-markdown-preview]")!,
            ).getByText("Retained draft after detach."),
          ).toBeInTheDocument(),
        );
        await expect(canvas.getByLabelText("Bound sessions")).toHaveTextContent(
          "1",
        );
      },
    );
  },
};

export const InternalLinkRecovery: Story = {
  name: "Internal link recovery",
  args: { internalLink: true },
  parameters: {
    docs: {
      description: {
        story:
          "Re-resolving the same internal link retains its failed editor and applies explicit recovery to that visible session.",
      },
      source: BoundRecovery.parameters!.docs.source,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/markdown/embeds/internal-link-recovery-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole("button", { name: "Fail persistence" }),
    );
    const trigger = await canvas.findByRole("button", {
      name: "Original",
      exact: true,
    });
    trigger.focus();
    await userEvent.click(
      await body.findByRole("button", { name: "Edit Original", exact: true }),
    );
    const content = () =>
      canvasElement.ownerDocument.querySelector<HTMLElement>(
        "[data-mira-link-preview-content] .cm-content",
      )!;
    await userEvent.click(content());
    await userEvent.keyboard("{Control>}a{/Control}{Backspace}");
    await waitFor(() => expect(content().textContent).toBe(""));
    await userEvent.keyboard("Failed internal link draft.");
    await waitFor(() =>
      expect(body.getByRole("alert")).toHaveTextContent(
        "External file changed",
      ),
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Refresh link resolution" }),
    );
    await waitFor(() =>
      expect(canvas.getByLabelText("Bound sessions")).toHaveTextContent("1"),
    );
    await expect(content()).toHaveTextContent("Failed internal link draft.");
  },
};
