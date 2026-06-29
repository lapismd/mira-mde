import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";

export default defineConfig({
  redirects: {
    "/tables": "/markdown/tables",
    "/mermaid": "/markdown/mermaid",
  },
  integrations: [
    svelte(),
    starlight({
      title: "Mira MDE",
      description:
        "Portable Markdown editor packages with default UI and live examples.",
      customCss: ["./src/styles/global.css"],
      sidebar: [
        { label: "Overview", slug: "index" },
        { label: "Getting Started", slug: "getting-started" },
        { label: "Default Editor", slug: "default-editor" },
        { label: "Toolbar", slug: "toolbar" },
        {
          label: "Markdown",
          items: [
            { label: "Overview", slug: "markdown" },
            {
              label: "Basics",
              items: [
                { label: "Frontmatter", slug: "markdown/frontmatter" },
                { label: "Headings", slug: "markdown/headings" },
                {
                  label: "Inline Formatting",
                  slug: "markdown/inline-formatting",
                },
                { label: "Lists", slug: "markdown/lists" },
                { label: "Task States", slug: "markdown/task-states" },
                { label: "Blockquotes", slug: "markdown/blockquotes" },
                { label: "Code", slug: "markdown/code" },
              ],
            },
            {
              label: "Links & Media",
              items: [
                { label: "Links", slug: "markdown/links" },
                { label: "Wikilinks", slug: "markdown/wikilinks" },
                { label: "Embeds", slug: "markdown/embeds" },
                { label: "Tags", slug: "markdown/tags" },
                { label: "Images", slug: "markdown/images" },
              ],
            },
            {
              label: "Structured Content",
              items: [
                { label: "Tables", slug: "markdown/tables" },
                { label: "Grid Tables", slug: "markdown/grid-tables" },
              ],
            },
            {
              label: "Extended Blocks",
              items: [
                { label: "Callouts", slug: "markdown/callouts" },
                { label: "Math", slug: "markdown/math" },
                { label: "Mermaid", slug: "markdown/mermaid" },
                { label: "Directives", slug: "markdown/directives" },
                { label: "Footnotes", slug: "markdown/footnotes" },
                { label: "Raw HTML", slug: "markdown/raw-html" },
              ],
            },
          ],
        },
        { label: "Live Preview", slug: "live-preview" },
        { label: "Extensions API", slug: "extensions-api" },
        { label: "API Reference", slug: "api-reference" },
      ],
    }),
  ],
});
