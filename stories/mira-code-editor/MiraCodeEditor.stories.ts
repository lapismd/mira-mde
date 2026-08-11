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
