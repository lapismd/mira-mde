import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { MiraFeature } from "@lapismd/mira-editor";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MiraEditorStory from "../_shared/MiraEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Mira Editor/Features",
  component: MiraEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Feature flags and featureConfigs control toolbar items, mode availability, Mermaid/tables, and slash commands.",
      },
    },
  },
} satisfies Meta<typeof MiraEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Defaults: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/features/defaults-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Defaults",
  args: {
    features: {
      [MiraFeature.Toolbar]: true,
      [MiraFeature.ModeSwitch]: true,
      [MiraFeature.Mermaid]: true,
      [MiraFeature.Tables]: true,
      [MiraFeature.GridTables]: true,
      [MiraFeature.SlashCommands]: true,
    },
  },
};

export const WithoutToolbar: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/features/without-toolbar-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Without Toolbar",
  args: {
    mode: "live-preview",
    features: {
      [MiraFeature.Toolbar]: false,
      [MiraFeature.ModeSwitch]: false,
    },
  },
};

export const WithoutWidgets: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/features/without-widgets-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Without Widgets",
  args: {
    mode: "live-preview",
    features: {
      [MiraFeature.Mermaid]: false,
      [MiraFeature.Tables]: false,
      [MiraFeature.GridTables]: false,
      [MiraFeature.Math]: false,
      [MiraFeature.SlashCommands]: false,
    },
  },
};

export const EditModesOnly: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/features/edit-modes-only-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Edit Modes Only",
  args: {
    mode: "live-preview",
    features: {
      [MiraFeature.SourceMode]: true,
      [MiraFeature.LivePreviewMode]: true,
      [MiraFeature.PreviewMode]: false,
      [MiraFeature.SplitMode]: false,
    },
  },
};

export const CompactToolbarItems: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/features/compact-toolbar-items-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Compact Toolbar",
  args: {
    featureConfigs: {
      [MiraFeature.Toolbar]: {
        items: ["bold", "italic", "heading", "link"],
      },
    },
  },
};

export const NarrowScrollableToolbar: Story = {
  tags: ["visual-pending"],
  name: "Narrow Scrollable Toolbar",
  args: {
    width: "20rem",
    height: "24rem",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toolbar = canvas.getByRole("toolbar", {
      name: "Markdown editor toolbar",
    });
    const buttons = within(toolbar).getAllByRole("button");
    const toolbarItems = Array.from(
      toolbar.querySelectorAll<HTMLButtonElement>("[data-toolbar-item]"),
    );
    const firstButton = toolbarItems[0];
    const lastToolbarItem = toolbarItems.at(-1);
    const finalButton = within(toolbar).getByRole("button", {
      name: "View options",
    });
    if (!firstButton || !lastToolbarItem) {
      throw new Error("The narrow toolbar did not render its controls");
    }

    await step("retain a hidden-scrollbar single row", async () => {
      const style = getComputedStyle(toolbar);
      expect(toolbar.scrollWidth).toBeGreaterThan(toolbar.clientWidth);
      expect(toolbar.scrollHeight).toBe(toolbar.clientHeight);
      expect(style.overflowX).toBe("auto");
      expect(style.overflowY).toBe("hidden");
      expect(style.scrollbarWidth).toBe("none");
      expect(style.overscrollBehaviorX).toBe("contain");
      expect(style.touchAction).toBe("pan-x");

      const firstTop = firstButton.getBoundingClientRect().top;
      for (const button of buttons) {
        expect(
          Math.abs(button.getBoundingClientRect().top - firstTop),
        ).toBeLessThan(2);
      }
    });

    await step(
      "bring the final and first actions into view by keyboard",
      async () => {
        toolbar.scrollLeft = 0;
        firstButton.focus();
        await userEvent.keyboard("{End}");
        await waitFor(() => expect(lastToolbarItem).toHaveFocus());
        await userEvent.tab();
        await waitFor(() => expect(finalButton).toHaveFocus());
        await waitFor(() => expect(toolbar.scrollLeft).toBeGreaterThan(0));
        expect(finalButton.getBoundingClientRect().right).toBeLessThanOrEqual(
          toolbar.getBoundingClientRect().right + 1,
        );

        await userEvent.tab({ shift: true });
        await waitFor(() => expect(lastToolbarItem).toHaveFocus());
        await userEvent.keyboard("{Home}");
        await waitFor(() => expect(firstButton).toHaveFocus());
        await waitFor(() => expect(toolbar.scrollLeft).toBeLessThan(2));
      },
    );
  },
};
