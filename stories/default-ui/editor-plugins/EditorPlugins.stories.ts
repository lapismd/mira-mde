import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { createSlashCommandExtensions } from "@mira-mde/codemirror";
import {
  MiraFeature,
  type MiraDefaultToolbarDefinition,
} from "@mira-mde/default-ui/svelte";
import { createSlashSnippet, defineMiraExtension } from "@mira-mde/extensions";
import { aiExtension, createMiraAiToolbarAction } from "@mira-mde/plugin-ai";
import ListPlusIcon from "@lucide/svelte/icons/list-plus";
import SparklesIcon from "@lucide/svelte/icons/sparkles";
import DefaultEditorStory from "../_shared/DefaultEditorStory.svelte";
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

const customToolbars: MiraDefaultToolbarDefinition[] = [
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
  title: "Default UI/Editor Plugins",
  component: DefaultEditorStory,
  args: {
    ...defaultEditorArgs,
    mode: "live-preview",
    height: "28rem",
  },
  argTypes: defaultEditorArgTypes,
  parameters: {
    ...defaultEditorDocsParameters,
    docs: {
      ...defaultEditorDocsParameters.docs,
      description: {
        component:
          "Editor chrome plugins: slash commands, block controls, fold/inline headings, image attachments, autocomplete UI, custom toolbars, and @mira-mde/plugin-ai.",
      },
    },
  },
} satisfies Meta<typeof DefaultEditorStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SlashCommands: Story = {
  name: "Slash Commands",
  args: {
    value: slashCommandsMarkdown,
    features: {
      [MiraFeature.SlashCommands]: true,
    },
  },
};

export const CustomSlashSnippet: Story = {
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
  name: "Block Controls",
  args: {
    value: blockControlsMarkdown,
    features: {
      [MiraFeature.BlockControls]: true,
    },
  },
};

export const FoldAndInlineHeadings: Story = {
  name: "Fold And Inline Headings",
  args: {
    value: inlineHeadingsMarkdown,
    features: {
      [MiraFeature.BlockControls]: true,
    },
  },
};

export const ImageAttachments: Story = {
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
  name: "Custom Toolbar",
  args: {
    value: blockControlsMarkdown,
    toolbars: customToolbars,
    extensions: [aiDemoExtension],
  },
};

export const AiPlugin: Story = {
  name: "AI Plugin",
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
};
