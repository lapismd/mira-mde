import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { catalogParameters } from "../catalog/catalog.mjs";
import { MIRA_EDITOR_VERSION } from "@lapismd/mira-editor";
import ComprehensiveDemoStory from "./ComprehensiveDemoStory.svelte";
import comprehensiveMarkdown from "./comprehensive-demo.md?raw";

const meta = {
  title: "Demo/Comprehensive",
  component: ComprehensiveDemoStory,
  tags: ["visual-pending"],
  args: {
    value: comprehensiveMarkdown,
    mode: "live-preview",
    theme: "",
    colorMode: "inherit",
    editorShell: "default",
    mermaidEnabled: true,
    outline: true,
    outlineVariant: "floating",
    indentGuides: true,
    indentWithTabs: true,
    indentWidth: 4,
    height: "min(68rem, calc(100vh - 5rem))",
  },
  argTypes: {
    value: { control: "object", table: { category: "Content" } },
    mode: {
      control: "select",
      options: ["live-preview", "source", "preview", "split"],
      table: { category: "View" },
    },
    theme: {
      control: "text",
      table: { category: "Appearance" },
    },
    colorMode: {
      control: "select",
      options: ["inherit", "light", "dark", "system"],
      table: { category: "Appearance" },
    },
    editorShell: {
      control: "inline-radio",
      options: ["default", "composable"],
      table: { category: "Composition" },
    },
    mermaidEnabled: {
      control: "boolean",
      table: { category: "Features" },
    },
    outline: {
      control: "boolean",
      description: "Show heading navigation beside reading and split views.",
      table: { category: "Features" },
    },
    outlineVariant: {
      control: "inline-radio",
      options: ["floating", "sidebar"],
      description: "Use the floating marker rail or persistent side panel.",
      table: { category: "Features" },
    },
    indentGuides: {
      control: "boolean",
      table: { category: "Indentation" },
    },
    indentWithTabs: {
      control: "boolean",
      table: { category: "Indentation" },
    },
    indentWidth: {
      control: { type: "number", min: 1, max: 8, step: 1 },
      table: { category: "Indentation" },
    },
    height: { control: "text", table: { category: "Layout" } },
  },
  parameters: {
    ...catalogParameters("storybook-comprehensive"),
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "The canonical full-content Mira playground. Every fixed view uses the same Storybook-owned Markdown fixture and portable file adapter.",
      },
    },
  },
} satisfies Meta<typeof ComprehensiveDemoStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectRenderedDoodleDivider(
  canvasElement: HTMLElement,
): Promise<void> {
  await waitFor(() => {
    expect(
      canvasElement.querySelectorAll(
        'svg.mira-doodle-divider[data-seed="00000008"]',
      ),
    ).toHaveLength(1);
  });
  expect(
    canvasElement.querySelectorAll(
      'hr.mira-doodle-divider__native[data-mira-doodle-divider="true"]',
    ),
  ).toHaveLength(1);
}

async function expectComprehensivePluginConfiguration(
  canvasElement: HTMLElement,
  { editor = true }: { editor?: boolean } = {},
): Promise<void> {
  const root = canvasElement.querySelector<HTMLElement>(".mira-comprehensive");
  if (!root) throw new Error("Comprehensive story root did not render");
  expect(root).toHaveAttribute(
    "data-mira-comprehensive-extensions",
    "selection-toolbar doodle-dividers",
  );
  expect(root).toHaveAttribute("data-mira-comprehensive-plugins", "ai mermaid");
  await waitFor(() => {
    expect(
      canvasElement.querySelectorAll(".mira-block-toolbar-enabled"),
    ).toHaveLength(editor ? 1 : 0);
  });
}

async function expectLineNumberGutterTypography(
  canvasElement: HTMLElement,
): Promise<void> {
  const gutter = await waitFor(() => {
    const element = canvasElement.querySelector<HTMLElement>(
      ".cm-gutter.cm-lineNumbers",
    );
    expect(element).not.toBeNull();
    return element!;
  });
  const number = gutter.querySelector<HTMLElement>(".cm-gutterElement");
  expect(number).not.toBeNull();

  const probe = canvasElement.ownerDocument.createElement("span");
  probe.style.color = "var(--text-faint, var(--mira-muted-foreground))";
  probe.style.fontFamily = "var(--font-monospace, var(--mira-font-mono))";
  gutter.append(probe);
  const expectedColor = getComputedStyle(probe).color;
  const expectedFont = getComputedStyle(probe).fontFamily;
  probe.remove();

  const gutterStyle = getComputedStyle(gutter);
  expect(gutterStyle.color).toBe(expectedColor);
  expect(gutterStyle.fontFamily).toBe(expectedFont);
  expect(gutterStyle.fontVariantNumeric).toContain("tabular-nums");
  expect(getComputedStyle(number!).justifyContent).toBe("end");

  const visibleNumbers = Array.from(
    gutter.querySelectorAll<HTMLElement>(".cm-gutterElement"),
  ).filter((element) => element.getBoundingClientRect().width > 0);
  expect(visibleNumbers.some((element) => element.innerText.length > 1)).toBe(
    true,
  );
  const rightEdges = visibleNumbers.map(
    (element) => element.getBoundingClientRect().right,
  );
  expect(Math.max(...rightEdges) - Math.min(...rightEdges)).toBeLessThan(0.5);
}

export const Playground: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/playground-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const editor = canvasElement.querySelector<HTMLElement>(".mira");
    if (!editor) throw new Error("Comprehensive editor did not render");

    await step("render the seeded doodle divider", async () => {
      await expectRenderedDoodleDivider(canvasElement);
    });

    await step(
      "enable every first-party plugin and contextual toolbar",
      async () => {
        await expectComprehensivePluginConfiguration(canvasElement);
        await expect(
          canvas.getByRole("button", { name: "Ask AI" }),
        ).toBeEnabled();
      },
    );

    await step("align muted monospaced line numbers", async () => {
      await expectLineNumberGutterTypography(canvasElement);
    });

    await step("show the inline toolbar for selected text", async () => {
      const content = canvasElement.querySelector<HTMLElement>(".cm-content");
      if (!content)
        throw new Error("Comprehensive CodeMirror content is missing");
      content.focus();
      await userEvent.keyboard("{Shift>}{ArrowRight}{/Shift}");
      await expect(
        canvas.getByRole("toolbar", { name: "Text formatting" }),
      ).toBeVisible();
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(() => {
        expect(
          canvas.queryByRole("toolbar", { name: "Text formatting" }),
        ).not.toBeInTheDocument();
      });
    });

    await step("run the deterministic local AI plugin", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Ask AI" }));
      const dialog = canvas.getByRole("dialog", { name: "Ask AI" });
      await expect(dialog).toBeVisible();
      await userEvent.type(
        within(dialog).getByRole("textbox", { name: "AI prompt" }),
        "Demonstrate the comprehensive plugin",
      );
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Run" }),
      );
      await expect(within(dialog).getByText("Ready")).toBeVisible();
      await expect(
        within(dialog).getByText(
          "Mira comprehensive demo: deterministic local AI response.",
        ),
      ).toBeVisible();
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Discard" }),
      );
      await expect(dialog).not.toBeInTheDocument();
    });

    await step("switch between full editor views", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Split" }));
      await expect(editor).toHaveAttribute("data-mode", "split");

      await userEvent.click(
        canvas.getByRole("button", { name: "Reading view" }),
      );
      await expect(editor).toHaveAttribute("data-mode", "preview");
      await expect(
        canvas.getByRole("group", { name: "Document outline" }),
      ).toBeVisible();

      await userEvent.click(canvas.getByRole("button", { name: "Edit" }));
      await expect(editor).toHaveAttribute("data-mode", "live-preview");
    });

    await step("select source mode from the overflow menu", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: "View options" }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await userEvent.click(
        body.getByText("Source mode", { selector: "span" }),
      );
      await expect(editor).toHaveAttribute("data-mode", "source");
    });

    await step("show package details from the toolbar menu", async () => {
      await waitFor(() =>
        expect(canvasElement.ownerDocument.body).not.toHaveStyle({
          pointerEvents: "none",
        }),
      );
      await userEvent.click(
        canvas.getByRole("button", { name: "View options" }),
      );
      const body = within(canvasElement.ownerDocument.body);
      await userEvent.click(body.getByRole("menuitem", { name: "About Mira" }));

      const dialog = await body.findByRole("dialog", { name: "About Mira" });
      await expect(dialog).toBeVisible();
      await expect(
        within(dialog).getByRole("img", {
          name: "Mira MDE logo",
        }),
      ).toBeVisible();
      await expect(
        within(dialog).getByText(`Version ${MIRA_EDITOR_VERSION}`),
      ).toBeVisible();

      await userEvent.click(
        within(dialog).getByRole("button", { name: "Close" }),
      );
      await expect(dialog).not.toBeVisible();
    });
  },
};

export const LivePreview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/live-preview-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Live Preview",
  args: { mode: "live-preview" },
  play: async ({ canvasElement }) => {
    await expectComprehensivePluginConfiguration(canvasElement);
    await expectRenderedDoodleDivider(canvasElement);
    await expectLineNumberGutterTypography(canvasElement);
  },
};

export const Source: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/source-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "source" },
  play: async ({ canvasElement }) => {
    await expectComprehensivePluginConfiguration(canvasElement);
    await expectLineNumberGutterTypography(canvasElement);
    expect(
      canvasElement.querySelector("svg.mira-doodle-divider"),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(canvasElement.textContent).toContain("mira-divider:v1:00000008");
    });
  },
};

export const ReadingPreview: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/reading-preview-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Reading / Preview",
  args: { mode: "preview" },
  play: async ({ canvasElement }) => {
    await expectComprehensivePluginConfiguration(canvasElement, {
      editor: false,
    });
    await expect(
      within(canvasElement).getByRole("button", { name: "Ask AI" }),
    ).toBeDisabled();
    await expectRenderedDoodleDivider(canvasElement);
  },
};

export const Split: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/split-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { mode: "split" },
};

export const Composable: Story = {
  tags: [
    "visual-approved",
    "!visual-pending",
    "!visual-ready",
    "!visual-failed",
  ],
  parameters: {
    visualDelta: {
      images: ["/visual-baselines/stories/demo/composable-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: { editorShell: "composable", mode: "live-preview" },
  play: async ({ canvasElement }) => {
    await expectComprehensivePluginConfiguration(canvasElement);
    await expectRenderedDoodleDivider(canvasElement);
  },
};
