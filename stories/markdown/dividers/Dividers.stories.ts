import { doodleDividersExtension } from "@lapismd/mira/extensions";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import EditorModeStory from "../_shared/EditorModeStory.svelte";
import MarkdownPreviewStory from "../_shared/MarkdownPreviewStory.svelte";
import DoodleDividerGalleryStory from "./DoodleDividerGalleryStory.svelte";
import RefreshableDoodleDividerStory from "./RefreshableDoodleDividerStory.svelte";
import {
  customDoodleDividerGalleryMarkdown,
  customDoodleDividerVariant,
  defaultDoodleDividerGalleryMarkdown,
  doodleDividersMarkdown,
} from "./fixtures";

const seededDoodleDividers = doodleDividersExtension();
const customDoodleDividers = doodleDividersExtension({
  variants: [customDoodleDividerVariant],
  palette: ["#e11d48", "#7c3aed"],
  height: 40,
  strokeWidth: 2.75,
});

const meta = {
  title: "Markdown/Dividers",
  component: MarkdownPreviewStory,
  tags: ["visual-pending"],
  args: {
    value: doodleDividersMarkdown,
    extensions: [seededDoodleDividers],
  },
  parameters: {
    ...catalogParameters("mira"),
    docs: {
      description: {
        component:
          "Seeded horizontal rules render as deterministic responsive SVG doodles while bare rules remain native separators.",
      },
    },
  },
} satisfies Meta<typeof MarkdownPreviewStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Reading: Story = {
  play: async ({ canvasElement, step }) => {
    await step("render only valid seeded dividers as doodles", async () => {
      await waitFor(() => {
        expect(
          canvasElement.querySelectorAll("svg.mira-doodle-divider"),
        ).toHaveLength(4);
      });

      const doodles = [
        ...canvasElement.querySelectorAll<SVGElement>(
          "svg.mira-doodle-divider",
        ),
      ];
      const nativeRules = [
        ...canvasElement.querySelectorAll<HTMLHRElement>("hr"),
      ];

      expect(nativeRules).toHaveLength(5);
      expect(
        nativeRules.filter((rule) =>
          rule.classList.contains("mira-doodle-divider__native"),
        ),
      ).toHaveLength(4);
      expect(
        nativeRules.filter(
          (rule) => !rule.classList.contains("mira-doodle-divider__native"),
        ),
      ).toHaveLength(1);
      expect(doodles.every((doodle) => doodle.ariaHidden === "true")).toBe(
        true,
      );
      expect(
        doodles.every(
          (doodle) => doodle.getAttribute("viewBox") === "0 0 1000 32",
        ),
      ).toBe(true);
    });
  },
};

export const LivePreview: Story = {
  name: "Live Preview",
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "live-preview",
      exposeValue: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const editor = canvasElement.querySelector<HTMLElement>(
      ".mira-story-surface--editor",
    );
    if (!editor) throw new Error("Doodle-divider editor did not render");

    await step("keep the inactive live-preview geometry stable", async () => {
      await waitFor(() => {
        expect(
          canvasElement.querySelectorAll("svg.mira-doodle-divider"),
        ).toHaveLength(4);
      });
      const contentLeft = canvasElement
        .querySelector<HTMLElement>(".cm-content")!
        .getBoundingClientRect().left;
      const firstDoodle = canvasElement.querySelector<SVGElement>(
        "svg.mira-doodle-divider",
      )!;
      expect(firstDoodle.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        contentLeft - 1,
      );
    });

    await step(
      "reveal and restore the complete authored source pair",
      async () => {
        const firstDoodleWidget = canvasElement.querySelector<HTMLElement>(
          ".mira-rich-widget--horizontalrule",
        )!;
        await userEvent.click(firstDoodleWidget);
        await waitFor(() => {
          expect(editor.dataset.markdownValue).toContain(
            "<!-- mira-divider:v1:00000000 -->\n---",
          );
          expect(
            canvasElement.querySelectorAll("svg.mira-doodle-divider").length,
          ).toBeLessThan(4);
        });

        await userEvent.click(
          canvasElement.querySelector<HTMLElement>(".cm-line")!,
        );
        await waitFor(() => {
          expect(
            canvasElement.querySelectorAll("svg.mira-doodle-divider"),
          ).toHaveLength(4);
        });
      },
    );
  },
};

export const Source: Story = {
  render: (args) => ({
    Component: EditorModeStory,
    props: {
      ...args,
      mode: "source",
      exposeValue: true,
    },
  }),
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector<HTMLElement>(
      ".mira-story-surface--editor",
    );
    if (!editor) throw new Error("Doodle-divider source editor did not render");

    expect(editor.dataset.markdownValue).toContain(
      "<!-- mira-divider:v1:00000000 -->\n---",
    );
    expect(editor.dataset.markdownValue).toContain(
      "This next rule is deliberately unseeded and remains a normal horizontal rule.\n\n---",
    );
    expect(
      canvasElement.querySelector("svg.mira-doodle-divider"),
    ).not.toBeInTheDocument();
  },
};

export const CustomGallery: Story = {
  name: "Custom Gallery",
  args: {
    value: customDoodleDividerGalleryMarkdown,
    extensions: [customDoodleDividers],
  },
  parameters: {
    docs: {
      description: {
        story:
          "A custom multi-path variant and palette rendered from Markdown explicitly migrated with materializeDoodleDividerSeeds.",
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step(
      "render the consumer variant and deterministic palette",
      async () => {
        await waitFor(() => {
          expect(
            canvasElement.querySelectorAll(
              'svg[data-variant="storybook-double-wave"]',
            ),
          ).toHaveLength(3);
        });
        expect(
          canvasElement.querySelectorAll(
            'svg[data-variant="storybook-double-wave"] path',
          ),
        ).toHaveLength(6);
      },
    );
  },
};

export const FixedV1Gallery: Story = {
  name: "Fixed v1 Gallery",
  args: {
    value: defaultDoodleDividerGalleryMarkdown,
  },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        canvasElement.querySelectorAll("svg.mira-doodle-divider"),
      ).toHaveLength(8);
    });
    expect(
      [
        ...canvasElement.querySelectorAll<SVGElement>(
          "svg.mira-doodle-divider",
        ),
      ].map((doodle) => doodle.dataset.variant),
    ).toEqual([
      "scribble",
      "waves",
      "loop",
      "zigzag",
      "kink",
      "swoop",
      "notch",
      "plain",
    ]);
  },
};

export const TwentyFourDividerGallery: Story = {
  name: "24 Divider Gallery",
  render: () => ({
    Component: DoodleDividerGalleryStory,
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        canvasElement.querySelectorAll("svg.mira-doodle-divider"),
      ).toHaveLength(24);
    });
    expect(
      canvasElement.querySelectorAll(
        "hr.mira-doodle-divider__native[data-mira-doodle-divider]",
      ),
    ).toHaveLength(24);
  },
};

export const RefreshableDivider: Story = {
  name: "Refreshable Divider",
  render: () => ({
    Component: RefreshableDoodleDividerStory,
  }),
  play: async ({ canvasElement, step }) => {
    const surface = canvasElement.querySelector<HTMLElement>(
      ".mira-refreshable-divider-story",
    );
    if (!surface) throw new Error("Refreshable divider did not render");

    const button = canvasElement.querySelector<HTMLButtonElement>("button");
    if (!button) throw new Error("Refresh divider button did not render");

    await step("cycle the persisted seed and rendered family", async () => {
      const initialVariant = canvasElement.querySelector<SVGElement>(
        "svg.mira-doodle-divider",
      )?.dataset.variant;
      expect(surface.dataset.currentSeed).toBe("00000008");

      await userEvent.click(button);

      await waitFor(() => {
        expect(surface.dataset.currentSeed).toBe("00000006");
        expect(
          canvasElement.querySelector<SVGElement>("svg.mira-doodle-divider")
            ?.dataset.variant,
        ).not.toBe(initialVariant);
      });
    });
  },
};
