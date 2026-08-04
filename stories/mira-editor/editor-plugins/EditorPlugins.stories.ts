import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import { createSlashCommandExtensions } from "@lapismd/mira/codemirror";
import {
  MiraFeature,
  type MiraEditorToolbarDefinition,
} from "@lapismd/mira-editor";
import {
  createSlashSnippet,
  defineMiraExtension,
} from "@lapismd/mira/extensions";
import {
  aiExtension,
  createMiraAiToolbarAction,
} from "@lapismd/mira-plugin-ai";
import ListPlusIcon from "@lucide/svelte/icons/list-plus";
import SparklesIcon from "@lucide/svelte/icons/sparkles";
import MiraEditorStory from "../_shared/MiraEditorStory.svelte";
import {
  defaultEditorArgs,
  defaultEditorArgTypes,
  defaultEditorDocsParameters,
} from "../_shared/argTypes";
import {
  blockControlsMarkdown,
  imageAttachmentsMarkdown,
  inlineHeadingsMarkdown,
  slashCommandsMarkdown,
} from "../fixtures";

const customSlashSnippet = createSlashSnippet({
  id: "decision",
  label: "Decision",
  description: "Insert a decision callout",
  group: "Project",
  keywords: ["adr", "choice"],
  markdown: "> [!note] Decision\n> <|>",
});

const slashAutocompleteCommands = [
  createSlashSnippet({
    id: "heading1",
    label: "Heading 1",
    description: "Large section heading",
    group: "Basic",
    keywords: ["h1", "title"],
    markdown: "# <|>",
  }),
  createSlashSnippet({
    id: "taskList",
    label: "Task list",
    description: "Checklist item",
    group: "Basic",
    keywords: ["todo", "checkbox"],
    markdown: "- [ ] <|>",
  }),
  createSlashSnippet({
    id: "callout",
    label: "Callout",
    description: "Admonition block",
    group: "Blocks",
    keywords: ["note", "tip"],
    markdown: "> [!note] Title\n> <|>",
  }),
];

const slashAutocompleteExtension = defineMiraExtension({
  name: "storybook-slash-autocomplete",
  codeMirror() {
    return createSlashCommandExtensions({
      commands: slashAutocompleteCommands,
      ui: "autocomplete",
    });
  },
});

const aiDemoExtension = aiExtension({
  run: async () =>
    "Storybook AI demo: wire `aiExtension({ run })` to your model provider.",
});

const markdownAuthoringMarkdown = `# Portable authoring

The built-in authoring layer is backed by the story file adapter.

- Type \`[[pro\` to complete a note.
- Type \`![[dia\` to complete an embed.
- Type \`[[project#Ne\` to complete a heading.
- Select these words and paste a URL to wrap them as a Markdown link.
- Paste rich HTML to convert it to Markdown.
- On an empty line, type three backticks or start the document with three dashes.
`;

const commandContributionExtension = defineMiraExtension({
  name: "storybook-command-contributions",
  commands: [
    {
      id: "insert-decision",
      label: "Insert decision",
      description: "Insert a decision callout",
      keybindings: ["Mod-Shift-d"],
      enabled: (context) => !context.readonly,
      run(context) {
        context.insertMarkdown(
          "\n> [!note] Decision\n> Describe the decision here.\n",
        );
      },
    },
  ],
  toolbarItems: [
    {
      id: "insert-decision",
      label: "Insert decision",
      tooltip: "Insert a decision callout (Mod+Shift+D)",
      command: "insert-decision",
      icon: "wand-sparkles",
      group: "Extension commands",
    },
  ],
  styles: [
    {
      id: "storybook-command-contributions",
      cssText:
        '.mira-editor__toolbar-section[aria-label="Extension commands"] { border-radius: 0.375rem; background: color-mix(in srgb, var(--interactive-accent) 10%, transparent); }',
    },
  ],
});

const customToolbars: MiraEditorToolbarDefinition[] = [
  {
    id: "story-custom",
    label: "Custom",
    align: "start",
    items: [
      {
        id: "insert-tip",
        label: "Insert tip",
        icon: SparklesIcon,
        tooltip: "Insert a tip callout",
        run(context) {
          context.insertMarkdown(
            "\n> [!tip] Custom toolbar\n> This callout came from a declarative toolbar button.\n",
          );
        },
      },
      {
        type: "dropdown",
        id: "templates",
        label: "Templates",
        icon: ListPlusIcon,
        items: [
          { type: "label", label: "Templates" },
          {
            id: "checklist",
            label: "Checklist",
            run(context) {
              context.insertMarkdown("\n- [ ] First task\n- [ ] Second task\n");
            },
          },
        ],
      },
      createMiraAiToolbarAction({
        icon: SparklesIcon,
        label: "Ask AI",
        tooltip: "Open the AI prompt (requires aiExtension)",
      }),
    ],
  },
];

const meta = {
  title: "Mira Editor/Editor Plugins",
  component: MiraEditorStory,
  args: {
    ...defaultEditorArgs,
    mode: "live-preview",
    height: "28rem",
  },
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    ...catalogParameters("mira-editor"),
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Editor chrome plugins: slash commands, block controls, fold/inline headings, image attachments, autocomplete UI, custom toolbars, and @lapismd/mira-plugin-ai.",
      },
    },
  },
} satisfies Meta<typeof MiraEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SlashCommands: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/slash-commands-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Slash Commands",
  args: {
    value: slashCommandsMarkdown,
    features: {
      [MiraFeature.SlashCommands]: true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const editor = canvasElement.querySelector<HTMLElement>(".cm-content");
    if (!editor) throw new Error("Slash command editor did not render");
    await userEvent.click(editor);
    await userEvent.type(editor, "/hea");
    await userEvent.click(canvas.getByRole("option", { name: /Heading 1/ }));
    await userEvent.type(editor, "Inserted heading");
    await expect(editor).toHaveTextContent("Inserted heading");
  },
};

export const CustomSlashSnippet: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/custom-slash-snippet-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Custom Slash Snippet",
  args: {
    value: slashCommandsMarkdown,
    featureConfigs: {
      [MiraFeature.SlashCommands]: {
        commands: [customSlashSnippet],
      },
    },
  },
};

export const SlashAutocomplete: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/slash-autocomplete-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Slash Autocomplete UI",
  args: {
    value: slashCommandsMarkdown,
    features: {
      // Disable the default popover so CodeMirror autocomplete owns `/`.
      [MiraFeature.SlashCommands]: false,
    },
    extensions: [slashAutocompleteExtension],
  },
};

export const BlockControls: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/block-controls-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Block Controls",
  args: {
    value: blockControlsMarkdown,
    features: {
      [MiraFeature.BlockControls]: true,
    },
  },
};

export const FoldAndInlineHeadings: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/fold-and-inline-headings-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Fold And Inline Headings",
  args: {
    value: inlineHeadingsMarkdown,
    features: {
      [MiraFeature.BlockControls]: true,
    },
  },
};

export const ImageAttachments: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/image-attachments-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Image Attachments",
  args: {
    value: imageAttachmentsMarkdown,
    features: {
      [MiraFeature.Images]: true,
    },
    imageConfig: {
      imageSyntax: "inline",
      imageMaxSizeBytes: 5 * 1024 * 1024,
    },
    featureConfigs: {
      [MiraFeature.Toolbar]: {
        items: ["image", "bold", "italic", "heading"],
      },
    },
  },
};

export const CustomToolbar: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/custom-toolbar-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Custom Toolbar",
  args: {
    value: blockControlsMarkdown,
    toolbars: customToolbars,
    extensions: [aiDemoExtension],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Templates" }));
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByText("Checklist", { selector: "span" }));
    await expect(canvas.getByText("First task")).toBeVisible();
    await expect(canvas.getByText("Second task")).toBeVisible();
  },
};

export const ExtensionContributions: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/extension-contributions-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Extension Commands, Toolbar, And Styles",
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  args: {
    value:
      "# Extension contributions\n\nUse the extension toolbar button or press Mod+Shift+D.",
    extensions: [commandContributionExtension],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Insert decision" }),
    );
    await expect(canvas.getByText("Describe the decision here.")).toBeVisible();
  },
};

export const MarkdownAuthoring: Story = {
  parameters: {
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/markdown-authoring-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  name: "Completions, Smart Paste, And Input Handlers",
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  args: {
    value: markdownAuthoringMarkdown,
    sourcePath: "notes/today.md",
    authoring: {
      inputHandlers: {
        ellipsis: true,
      },
    },
  },
};

export const AiPlugin: Story = {
  tags: ["visual-approved", "!visual-pending", "!visual-ready", "!visual-failed"],
  name: "AI Plugin",
  parameters: {
    ...catalogParameters("ai"),
    visualDelta: {
      images: [
        "/visual-baselines/stories/mira-editor/editor-plugins/ai-plugin-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  args: {
    value: blockControlsMarkdown,
    extensions: [aiDemoExtension],
    toolbars: [
      {
        id: "ai-toolbar",
        align: "end",
        items: [
          createMiraAiToolbarAction({
            icon: SparklesIcon,
            label: "Ask AI",
            tooltip: "Open Ask AI",
          }),
        ],
      },
    ],
    features: {
      [MiraFeature.SlashCommands]: true,
      [MiraFeature.BlockControls]: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("open and run the stubbed AI request", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Ask AI" }));
      const dialog = canvas.getByRole("dialog", { name: "Ask AI" });
      await expect(dialog).toBeVisible();
      const prompt = within(dialog).getByRole("textbox", {
        name: "AI prompt",
      });
      await userEvent.type(prompt, "Draft a portable response");
      await userEvent.click(
        within(dialog).getByRole("button", { name: "Run" }),
      );
      await expect(within(dialog).getByText("Ready")).toBeVisible();
      await expect(
        within(dialog).getByText(/Storybook AI demo:/),
      ).toBeVisible();
    });

    await step("accept the generated Markdown", async () => {
      await userEvent.click(
        within(canvas.getByRole("dialog", { name: "Ask AI" })).getByRole(
          "button",
          { name: "Accept" },
        ),
      );
      await expect(canvas.getByText(/Storybook AI demo:/)).toBeVisible();
    });
  },
};
