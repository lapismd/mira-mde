import {
  defineConfig,
  groupedIdVerification,
  tableRequirements,
} from "@lapismd/spec-validator";

export default defineConfig(tableRequirements(), {
  name: "mira-mde",
  idPattern: /^MIRA-[A-Z]+-\d{3}$/,
  ruleIds: {
    summary: "MIRA-GOV-001",
    governance: "MIRA-GOV-002",
    verification: "MIRA-GOV-002",
    book: "MIRA-GOV-001",
    bookIgnore: "MIRA-GOV-007",
    storybookMirrors: "MIRA-GOV-001",
    packageDocs: "MIRA-GOV-001",
    markdownlint: "MIRA-GOV-001",
    specFirst: "MIRA-GOV-003",
    internal: "MIRA-GOV-006",
  },
  validators: {
    summary: true,
    governance: {
      acceptance: false,
      normative: true,
      proseLimits: false,
      references: true,
      changeMap: true,
    },
    verification: groupedIdVerification({
      headers: {
        ids: ["Requirements"],
        status: ["Status"],
        evidence: ["Evidence"],
        required: [],
      },
      statuses: [
        "Implemented",
        "Partial",
        "In progress",
        "Planned",
        "Visual pending",
      ],
      statusMatch: "prefix",
    }),
    book: true,
    storybookMirrors: {
      style: "stories-spec",
      directory: "stories/spec",
      registryPath: "stories/spec/spec-chapters.ts",
      registryEntryTemplate: 'source: "<chapter>"',
    },
    packageDocs: {
      root: "packages",
      packagePattern: "^(?:mira-)?plugin-(.+)$",
      chapterTemplate: "plugins/<name>.md",
      identityTemplate: "@lapismd/mira-plugin-<name>",
    },
    markdownlint: { config: ".markdownlint-cli2.jsonc" },
    specFirst: {
      mode: "mapped",
      canonicalPattern: "^spec/src/(?!SUMMARY\\.md$).+\\.md$",
      ignore: [
        "(^|/)node_modules/",
        "(^|/)(?:dist|build|\\.svelte-kit|\\.turbo)/",
        "(^|/)(?:coverage|test-results|playwright-report|storybook-static)/",
        "^spec/book/",
        "^tests/",
        "\\.(?:spec|test)\\.[cm]?[jt]sx?$",
        "\\.stories\\.(?:svelte|[cm]?[jt]sx?)$",
        "^stories/(?!catalog/)",
        "\\.(?:actual|diff)\\.png$",
      ],
      rules: [
        {
          pattern:
            "^packages/(?:plugin-ai|mira-plugin-ai)/(?:src/|package\\.json$)",
          chapters: ["spec/src/packages.md", "spec/src/plugins/ai.md"],
        },
        {
          pattern:
            "^packages/(?:plugin-mermaid|mira-plugin-mermaid)/(?:src/|package\\.json$)",
          chapters: ["spec/src/packages.md", "spec/src/plugins/mermaid.md"],
        },
        {
          pattern:
            "^packages/(?:mira|core|extensions|codemirror|codemirror-markdown|codemirror-rich|codemirror-tables|preview)/(?:src/|package\\.json$)",
          chapters: ["spec/src/editor-and-markdown.md", "spec/src/packages.md"],
        },
        {
          pattern:
            "^packages/(?:default-ui|mira-editor|ui)/(?:src/|package\\.json$)",
          chapters: [
            "spec/src/mira-editor-and-frameworks.md",
            "spec/src/packages.md",
          ],
        },
        {
          pattern:
            "^(?:packages/(?:svelte|react|vanilla|mira-react|mira-vanilla)|internal/adapters/(?:vue|solid))/(?:src/|package\\.json$)",
          chapters: [
            "spec/src/mira-editor-and-frameworks.md",
            "spec/src/packages.md",
          ],
        },
        {
          pattern:
            "^packages/(?:theme-obsidian/(?:src/|styles\\.css$|package\\.json$)|(?:mira|mira-editor|mira-react)/src/.+\\.css$)",
          chapters: ["spec/src/packages.md", "spec/src/styling.md"],
        },
        {
          pattern: "^(?:\\.storybook/|stories/catalog/)",
          chapters: ["spec/src/storybook-catalog.md"],
        },
        {
          pattern:
            "^(?:scripts/(?:check-spec-.+|check-catalog(?:\\.spec)?|check-package-boundaries(?:\\.spec)?)\\.mjs|\\.markdownlint-cli2\\.jsonc|spec/book\\.toml|\\.github/workflows/.+\\.ya?ml$|AGENTS\\.md$|spec-validator\\.config\\.mjs$)",
          chapters: ["spec/src/spec-governance.md"],
        },
        {
          pattern:
            "^(?:package\\.json|pnpm-lock\\.yaml|pnpm-workspace\\.yaml|turbo\\.json|tsconfig(?:\\.[^.]+)*\\.json|playwright(?:\\.[^.]+)*\\.config\\.ts)$",
          chapters: ["spec/src/architecture.md", "spec/src/packages.md"],
        },
      ],
      protected: [
        "^(?:packages/[^/]+/src/|\\.storybook/|stories/catalog/|scripts/(?:check-spec-.+|check-catalog(?:\\.spec)?|check-package-boundaries(?:\\.spec)?)\\.mjs|\\.markdownlint-cli2\\.jsonc|spec/book\\.toml|\\.github/workflows/.+\\.ya?ml$|AGENTS\\.md$|spec-validator\\.config\\.mjs$|package\\.json$|pnpm-lock\\.yaml$|pnpm-workspace\\.yaml$|turbo\\.json$|tsconfig(?:\\.[^.]+)*\\.json$|playwright(?:\\.[^.]+)*\\.config\\.ts$)",
      ],
    },
  },
});
