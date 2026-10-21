import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, within } from "storybook/test";
import { catalogParameters } from "../../catalog/catalog.mjs";
import TableReaderStory from "./TableReaderStory.svelte";

const meta = {
  title: "Markdown/Tables/Reader",
  component: TableReaderStory,
  tags: ["visual-pending"],
  parameters: {
    ...catalogParameters("tables"),
    docs: {
      description: {
        component:
          "Immutable public TableReader with an annotation after an original source row.",
      },
      source: {
        language: "html",
        code: `<script>
  import { TableReader } from "@lapismd/mira/tables";
</script>
<TableReader {markdown} breakAfterRows={[1]}>
  {#snippet afterRow(row)}<aside>Review of source row {row}</aside>{/snippet}
</TableReader>`,
      },
    },
  },
} satisfies Meta<typeof TableReaderStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AnnotatedRows: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tables = canvas.getAllByRole("table", { name: "Release review" });
    await expect(tables).toHaveLength(2);
    const comment = canvas.getByRole("complementary", {
      name: "Review comment",
    });
    await expect(comment).toHaveAttribute("data-source-row", "1");
    await expect(tables[0]).toHaveTextContent("Safe syntax highlighting");
    await expect(tables[1]).toHaveTextContent("Annotated table reading");
    await expect(tables[1]).toHaveTextContent("Public registry adoption");
    await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
  },
};
