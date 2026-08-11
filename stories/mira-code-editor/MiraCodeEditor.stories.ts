import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { catalogParameters } from "../catalog/catalog.mjs";
import MiraCodeEditorStory from "./MiraCodeEditorStory.svelte";

const meta = {
  title: "Mira/Code Editor",
  component: MiraCodeEditorStory,
  tags: ["visual-pending"],
  parameters: {
    ...catalogParameters("mira"),
    docs: {
      description: {
        component:
          "Language-neutral CodeMirror shell from @lapismd/mira. The YAML language extension is supplied by this consumer story.",
      },
      source: {
        language: "svelte",
        type: "code",
        code: `<script lang="ts">
  import { yaml } from "@codemirror/lang-yaml";
  import { MiraCodeEditor } from "@lapismd/mira";

  let value = "name: Mira\\n";
</script>

<MiraCodeEditor bind:value extensions={[yaml()]} ariaLabel="YAML editor" />`,
      },
    },
  },
} satisfies Meta<typeof MiraCodeEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FramedYaml: Story = {
  name: "Framed YAML",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = canvas.getByRole("textbox", { name: "YAML editor" });
    await userEvent.click(editor);
    await userEvent.type(editor, "{End}{Enter}enabled: true");
    await expect(canvas.getByTestId("editor-status")).toHaveTextContent(
      "Changes:",
    );
    await expect(editor).toHaveFocus();
  },
};

export const FramelessFill: Story = {
  name: "Frameless Fill",
  args: { surface: "frameless", height: "fill" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = canvas.getByRole("textbox", { name: "YAML editor" });
    const scroller = canvasElement.querySelector(".cm-scroller");
    await expect(scroller).toHaveAttribute("tabindex", "0");
    await userEvent.click(editor);
    await expect(editor).toHaveFocus();
  },
};

export const FindAndReplace: Story = {
  name: "Find and Replace",
  parameters: {
    docs: {
      description: {
        story:
          "Opens Mira's real CodeMirror search surface with pill-shaped fields and query options embedded in the Find field.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = canvas.getByRole("textbox", { name: "YAML editor" });
    await userEvent.click(editor);
    await userEvent.keyboard("{Control>}f{/Control}");
    if (!canvas.queryByRole("textbox", { name: "Find" })) {
      await userEvent.keyboard("{Meta>}f{/Meta}");
    }

    const find = canvas.getByRole("textbox", { name: "Find" });
    const options = canvas.getByRole("group", { name: "Search options" });
    const searchField = find.closest(".mira-search-panel__search-field");
    await expect(find).toBeVisible();
    await expect(searchField).toContainElement(options);

    const wholeWord = canvas.getByRole("button", { name: "Match whole word" });
    await expect(wholeWord).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(wholeWord);
    await expect(wholeWord).toHaveAttribute("aria-pressed", "true");
  },
};
