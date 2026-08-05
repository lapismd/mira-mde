import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import MiraEditorStory from "../_shared/MiraEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";

const meta = {
  title: "Mira Editor/Themes",
  component: MiraEditorStory,
  args: defaultEditorArgs,
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Open-ended palette tokens and independent color modes for MiraEditor, including composable consumer themes and targeted overlays.",
      },
    },
  },
} satisfies Meta<typeof MiraEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

type ExpectedAppearance = {
  background: string;
  calloutChannels: string;
  foreground: string;
  colorScheme: "light" | "dark";
};

async function expectAppearance(
  canvasElement: HTMLElement,
  expected: ExpectedAppearance,
): Promise<HTMLElement> {
  const shell = canvasElement.querySelector<HTMLElement>(".mira-editor");
  if (!shell) throw new Error("Mira Editor shell did not render");
  const style = getComputedStyle(shell);
  await expect(style.backgroundColor).toBe(expected.background);
  await expect(style.color).toBe(expected.foreground);
  await expect(style.colorScheme).toContain(expected.colorScheme);
  await expect(
    style.getPropertyValue("--mira-callout-default").replaceAll(" ", ""),
  ).toBe(expected.calloutChannels);

  const probe = shell.ownerDocument.createElement("span");
  probe.style.backgroundColor = "rgba(var(--mira-callout-default), 0.1)";
  probe.style.boxShadow = "var(--mira-widget-shadow)";
  shell.append(probe);
  const probeStyle = getComputedStyle(probe);
  await expect(probeStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  await expect(probeStyle.boxShadow).not.toBe("none");
  probe.remove();
  return shell;
}

function visual(image: string) {
  return {
    visualDelta: {
      images: [image],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  };
}

function resolveTokenColor(element: HTMLElement, token: string): string {
  const probe = element.ownerDocument.createElement("span");
  probe.style.color = `var(${token})`;
  element.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

export const MiraLight: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/mira-light-chromium.png",
  ),
  args: { theme: "mira", colorMode: "light" },
  play: async ({ canvasElement }) => {
    const shell = await expectAppearance(canvasElement, {
      background: "rgb(251, 251, 252)",
      calloutChannels: "8,109,221",
      foreground: "rgb(29, 29, 32)",
      colorScheme: "light",
    });
    await expect(shell).toHaveAttribute("data-mira-theme", "mira");
  },
};

export const MiraDark: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/mira-dark-chromium.png",
  ),
  args: { theme: "mira", colorMode: "dark" },
  play: async ({ canvasElement }) => {
    await expectAppearance(canvasElement, {
      background: "rgb(23, 24, 28)",
      calloutChannels: "125,188,255",
      foreground: "rgb(241, 243, 247)",
      colorScheme: "dark",
    });
  },
};

export const ObsidianLight: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/obsidian-light-chromium.png",
  ),
  args: { theme: "obsidian", colorMode: "light" },
  play: async ({ canvasElement }) => {
    await expectAppearance(canvasElement, {
      background: "rgb(255, 255, 255)",
      calloutChannels: "8,109,221",
      foreground: "rgb(34, 34, 34)",
      colorScheme: "light",
    });
  },
};

export const ObsidianDark: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/obsidian-dark-chromium.png",
  ),
  args: { theme: "obsidian", colorMode: "dark" },
  play: async ({ canvasElement }) => {
    await expectAppearance(canvasElement, {
      background: "rgb(30, 30, 30)",
      calloutChannels: "2,122,255",
      foreground: "rgb(218, 218, 218)",
      colorScheme: "dark",
    });
  },
};

export const PageInheritanceAndSystem: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/page-inheritance-and-system-chromium.png",
  ),
  args: {
    theme: "",
    colorMode: "system",
    pageTheme: "obsidian",
    pageColorMode: "dark",
  },
  play: async ({ canvasElement }) => {
    const shell = await expectAppearance(canvasElement, {
      background: "rgb(255, 255, 255)",
      calloutChannels: "8,109,221",
      foreground: "rgb(34, 34, 34)",
      colorScheme: "light",
    });
    await expect(shell).not.toHaveAttribute("data-mira-theme");
    await expect(shell).toHaveAttribute("data-mira-color-mode", "system");
  },
};

export const CustomThemeExtendingMira: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/custom-theme-extending-mira-chromium.png",
  ),
  args: { theme: "mira story-mira-brand", colorMode: "light" },
  play: async ({ canvasElement }) => {
    const shell = await expectAppearance(canvasElement, {
      background: "rgb(251, 251, 252)",
      calloutChannels: "8,109,221",
      foreground: "rgb(29, 29, 32)",
      colorScheme: "light",
    });
    await expect(resolveTokenColor(shell, "--mira-accent")).toBe(
      "rgb(0, 106, 220)",
    );
  },
};

export const CustomThemeExtendingObsidian: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/custom-theme-extending-obsidian-chromium.png",
  ),
  args: { theme: "obsidian story-obsidian-brand", colorMode: "dark" },
  play: async ({ canvasElement }) => {
    const shell = await expectAppearance(canvasElement, {
      background: "rgb(30, 30, 30)",
      calloutChannels: "2,122,255",
      foreground: "rgb(218, 218, 218)",
      colorScheme: "dark",
    });
    await expect(resolveTokenColor(shell, "--mira-accent")).toBe(
      "rgb(255, 139, 213)",
    );
  },
};

export const TargetedOverride: Story = {
  tags: [
    "visual-failed",
    "!visual-pending",
    "!visual-approved",
    "!visual-ready",
  ],
  parameters: visual(
    "/visual-baselines/stories/mira-editor/themes/targeted-override-chromium.png",
  ),
  args: {
    theme: "obsidian",
    colorMode: "light",
    pageTheme: "mira",
    pageColorMode: "dark",
  },
  play: async ({ canvasElement }) => {
    const shell = await expectAppearance(canvasElement, {
      background: "rgb(255, 255, 255)",
      calloutChannels: "8,109,221",
      foreground: "rgb(34, 34, 34)",
      colorScheme: "light",
    });
    await expect(shell).toHaveAttribute("data-mira-theme", "obsidian");

    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "View options" }));
    const menu = canvasElement.ownerDocument.body.querySelector<HTMLElement>(
      '[data-slot="dropdown-menu-content"]',
    );
    if (!menu) throw new Error("View options menu did not render");
    await expect(menu).toHaveAttribute("data-mira-theme", "obsidian");
    await expect(menu).toHaveAttribute("data-mira-color-mode", "light");
    await expect(getComputedStyle(menu).backgroundColor).toBe(
      "rgb(255, 255, 255)",
    );
  },
};
