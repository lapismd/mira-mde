import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import svelte from "@astrojs/svelte";

export default defineConfig({
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
        { label: "Markdown", slug: "markdown" },
        { label: "Live Preview", slug: "live-preview" },
        { label: "Tables", slug: "tables" },
        { label: "Mermaid", slug: "mermaid" },
        { label: "Extensions API", slug: "extensions-api" },
        { label: "API Reference", slug: "api-reference" },
      ],
    }),
  ],
});
