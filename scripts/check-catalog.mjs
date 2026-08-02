#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { catalogRegistry } from "../stories/catalog/catalog.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
export const INTERNAL_STYLE_TOKENS = new Set(["--mira-property-depth"]);

export const PUBLIC_SURFACES = [
  {
    entryId: "mira-mde",
    files: ["packages/svelte/src/index.ts"],
    exports: ["MiraMde"],
  },
  {
    entryId: "default-ui",
    files: ["packages/default-ui/src/svelte.ts"],
    exports: ["MiraDefaultMde", "MiraDefaultToolbar"],
  },
  {
    entryId: "preview",
    files: ["packages/preview/src/index.ts"],
    exports: [
      "MarkdownPreview",
      "MarkdownOutline",
      "Markdown",
      "Renderer",
      "FileEmbed",
      "MarkdownEmbed",
      "NoteLink",
    ],
  },
  {
    entryId: "tables",
    files: ["packages/codemirror-tables/src/index.ts"],
    exports: [
      "EditorTable",
      "EditorColumn",
      "GridEditorTable",
      "GridEditorColumn",
    ],
  },
  {
    entryId: "ai",
    files: ["packages/plugin-ai/src/index.ts"],
    exports: ["aiExtension", "createMiraAiToolbarAction"],
  },
  {
    entryId: "mermaid",
    files: ["packages/plugin-mermaid/src/index.ts"],
    exports: ["Mermaid"],
  },
  {
    entryId: "ui-core",
    files: [
      "packages/ui/src/index.ts",
      "packages/ui/src/toggle-group/index.ts",
    ],
    exports: ["Button", "Separator", "ScrollArea", "Root", "Item"],
  },
  {
    entryId: "ui-context-menu",
    files: ["packages/ui/src/context-menu/index.ts"],
    exports: [
      "Root",
      "Trigger",
      "Content",
      "Item",
      "CheckboxItem",
      "RadioItem",
      "Group",
      "GroupHeading",
      "Label",
      "Separator",
      "Shortcut",
      "Sub",
      "SubTrigger",
      "SubContent",
    ],
  },
  {
    entryId: "ui-dialog",
    files: ["packages/ui/src/dialog/index.ts"],
    exports: [
      "Root",
      "Trigger",
      "Portal",
      "Overlay",
      "Content",
      "Header",
      "Footer",
      "Title",
      "Description",
      "Close",
    ],
  },
  {
    entryId: "ui-dropdown-menu",
    files: ["packages/ui/src/dropdown-menu/index.ts"],
    exports: [
      "Root",
      "Trigger",
      "Content",
      "Item",
      "CheckboxItem",
      "RadioItem",
      "Group",
      "GroupHeading",
      "Label",
      "Separator",
      "Shortcut",
      "Sub",
      "SubTrigger",
      "SubContent",
    ],
  },
  {
    entryId: "ui-table",
    files: ["packages/ui/src/table/index.ts"],
    exports: [
      "Root",
      "Header",
      "Body",
      "Footer",
      "Head",
      "Row",
      "Cell",
      "Caption",
    ],
  },
  {
    entryId: "ui-toolbar",
    files: ["packages/ui/src/toolbar/index.ts"],
    exports: ["Root", "Button", "Group", "GroupItem", "Link"],
  },
  {
    entryId: "ui-tooltip",
    files: ["packages/ui/src/tooltip/index.ts"],
    exports: ["Root", "Trigger", "Content", "Provider", "Portal"],
  },
  {
    entryId: "react-wrapper",
    files: ["packages/react/src/index.ts"],
    exports: ["MiraMde", "MiraDefaultMde", "MiraDefaultToolbar"],
  },
  {
    entryId: "vanilla-wrapper",
    files: ["packages/vanilla/src/index.ts"],
    exports: ["createMiraMde", "MiraMde"],
  },
];

function shippedStyleFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["dist", ".svelte-kit"].includes(entry.name)) return [];
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return shippedStyleFiles(absolutePath);
    if (!entry.isFile() || /\.(?:spec|test)\.[cm]?[jt]s$/u.test(entry.name))
      return [];
    return /\.(?:css|svelte|[cm]?[jt]s)$/u.test(entry.name)
      ? [absolutePath]
      : [];
  });
}

function exported(entry, exportName) {
  return entry.components.some(
    (component) =>
      component === exportName ||
      component.startsWith(`${exportName}.`) ||
      component.endsWith(`.${exportName}`),
  );
}

export function validateCatalog({
  repoRoot = DEFAULT_REPO_ROOT,
  registry = catalogRegistry,
  publicSurfaces = PUBLIC_SURFACES,
} = {}) {
  const errors = [];
  const tokenNames = registry.tokens.map((entry) => entry.name);
  const tokenNameSet = new Set(tokenNames);
  const entriesById = new Map(
    registry.entries.map((entry) => [entry.id, entry]),
  );

  for (const name of tokenNames) {
    if (!/^--mira-[\w-]+$/.test(name))
      errors.push(`Invalid public token name: ${name}`);
    if (tokenNames.filter((candidate) => candidate === name).length !== 1)
      errors.push(`Duplicate token definition: ${name}`);
  }
  for (const definition of registry.tokens) {
    for (const field of ["purpose", "defaultValue", "affects"]) {
      if (!definition[field]?.trim())
        errors.push(`${definition.name}: missing ${field}`);
    }
    if (typeof definition.inherits !== "boolean")
      errors.push(`${definition.name}: inherits must be boolean`);
  }

  for (const entry of registry.entries) {
    if (!entry.description.trim())
      errors.push(`${entry.id}: missing description`);
    if (!entry.spec.trim())
      errors.push(`${entry.id}: missing specification link`);
    if (!entry.components.length)
      errors.push(`${entry.id}: missing components`);
    if (entry.tokensFrom && !entriesById.has(entry.tokensFrom))
      errors.push(`${entry.id}: unknown tokensFrom ${entry.tokensFrom}`);
    for (const name of entry.tokens) {
      if (!tokenNameSet.has(name))
        errors.push(`${entry.id}: stale token ${name}`);
    }
  }

  const cssTokenNames = new Set();
  for (const file of shippedStyleFiles(path.join(repoRoot, "packages"))) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/--mira-[\w-]+/g)) {
      if (!INTERNAL_STYLE_TOKENS.has(match[0])) cssTokenNames.add(match[0]);
    }
  }
  for (const name of cssTokenNames) {
    if (!tokenNameSet.has(name))
      errors.push(`Undocumented shipped token: ${name}`);
  }
  for (const name of tokenNameSet) {
    if (!cssTokenNames.has(name)) errors.push(`Stale catalog token: ${name}`);
  }

  const assignedTokens = new Set(
    registry.entries.flatMap((entry) => entry.tokens),
  );
  for (const name of tokenNameSet) {
    if (!assignedTokens.has(name))
      errors.push(`Unassigned public token: ${name}`);
  }

  for (const surface of publicSurfaces) {
    const entry = entriesById.get(surface.entryId);
    if (!entry) {
      errors.push(
        `Missing catalog entry for public surface: ${surface.entryId}`,
      );
      continue;
    }
    const source = surface.files
      .map((file) => path.join(repoRoot, file))
      .filter(existsSync)
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    if (!source) {
      errors.push(`${surface.entryId}: public export source is missing`);
      continue;
    }
    for (const exportName of surface.exports) {
      if (!new RegExp(`\\b${exportName}\\b`).test(source))
        errors.push(`${surface.entryId}: ${exportName} is no longer exported`);
      if (!exported(entry, exportName))
        errors.push(
          `${surface.entryId}: exported ${exportName} is uncataloged`,
        );
    }
  }

  return {
    ok: errors.length === 0,
    errors: [...new Set(errors)],
    stats: {
      entries: registry.entries.length,
      tokens: registry.tokens.length,
      shippedTokens: cssTokenNames.size,
      publicSurfaces: publicSurfaces.length,
    },
  };
}

export function validateUiPrimitiveStoryCoverage({
  repoRoot = DEFAULT_REPO_ROOT,
  registry = catalogRegistry,
  storyFile = "stories/ui/Primitives.stories.ts",
} = {}) {
  const absoluteStoryFile = path.join(repoRoot, storyFile);
  const expectedEntryIds = registry.entries
    .filter((entry) => entry.id.startsWith("ui-"))
    .map((entry) => entry.id);
  const errors = [];

  if (!existsSync(absoluteStoryFile)) {
    errors.push(`UI primitive story file is missing: ${storyFile}`);
  } else {
    const source = readFileSync(absoluteStoryFile, "utf8");
    for (const entryId of expectedEntryIds) {
      const reference = new RegExp(
        `(?:catalogParameters|parameters)\\(\\s*["']${entryId}["']`,
      );
      if (!reference.test(source)) {
        errors.push(`UI primitive family has no rendered story: ${entryId}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: { families: expectedEntryIds.length },
  };
}

function main() {
  const result = validateCatalog();
  const storyCoverage = validateUiPrimitiveStoryCoverage();
  if (!result.ok || !storyCoverage.ok) {
    console.error("Mira catalog validation failed:");
    for (const error of [...result.errors, ...storyCoverage.errors])
      console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Mira catalog validated: ${result.stats.entries} entries, ${result.stats.tokens} documented tokens, ${result.stats.publicSurfaces} public surface families, ${storyCoverage.stats.families} rendered UI primitive families.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main();
