import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  validateCatalog,
  validateComprehensivePluginCoverage,
  validateUiPrimitiveStoryCoverage,
} from "./check-catalog.mjs";

function fixture(css = ".surface { color: var(--mira-foreground); }\n") {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "mira-catalog-"));
  const cssPath = path.join(repoRoot, "packages/example/src/styles.css");
  mkdirSync(path.dirname(cssPath), { recursive: true });
  writeFileSync(cssPath, css);
  return repoRoot;
}

const validRegistry = {
  tokens: [
    {
      name: "--mira-foreground",
      purpose: "Text color.",
      defaultValue: "black",
      inherits: true,
      affects: "Text.",
    },
  ],
  entries: [
    {
      id: "example",
      name: "Example",
      packageName: "example",
      importPath: "example",
      description: "Example surface.",
      spec: "styling.md",
      components: ["Example"],
      tokens: ["--mira-foreground"],
      publicSurface: true,
    },
  ],
};

function verify(css, registry, assertion) {
  const repoRoot = fixture(css);
  try {
    assertion(validateCatalog({ repoRoot, registry, publicSurfaces: [] }));
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

test("accepts documented and assigned shipped Mira tokens", () => {
  verify(undefined, validRegistry, (result) => {
    assert.equal(result.ok, true);
    assert.equal(result.stats.tokens, 1);
  });
});

test("ignores explicitly internal layout variables", () => {
  verify(
    ".surface { --mira-property-depth: 2; color: var(--mira-foreground); }\n",
    validRegistry,
    (result) => assert.equal(result.ok, true),
  );
});

test("rejects undocumented and stale tokens", () => {
  verify(
    ".surface { color: var(--mira-new-token); }\n",
    validRegistry,
    (result) => {
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /Undocumented shipped token/);
      assert.match(result.errors.join("\n"), /Stale catalog token/);
    },
  );
});

test("rejects unassigned tokens and incomplete entry metadata", () => {
  const registry = structuredClone(validRegistry);
  registry.entries[0].tokens = [];
  registry.entries[0].description = "";
  verify(undefined, registry, (result) => {
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /missing description/);
    assert.match(result.errors.join("\n"), /Unassigned public token/);
  });
});

test("requires rendered stories for every UI primitive family", () => {
  const repoRoot = fixture();
  const storyPath = path.join(repoRoot, "stories/ui/Primitives.stories.ts");
  mkdirSync(path.dirname(storyPath), { recursive: true });
  writeFileSync(
    storyPath,
    'parameters("ui-core", "Core primitives");\nparameters("ui-dialog", "Dialog");\n',
  );
  const registry = {
    entries: [{ id: "ui-core" }, { id: "ui-dialog" }, { id: "preview" }],
  };

  try {
    assert.equal(
      validateUiPrimitiveStoryCoverage({ repoRoot, registry }).ok,
      true,
    );

    writeFileSync(storyPath, 'parameters("ui-core", "Core primitives");\n');
    const missing = validateUiPrimitiveStoryCoverage({ repoRoot, registry });
    assert.equal(missing.ok, false);
    assert.match(missing.errors.join("\n"), /ui-dialog/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("requires every first-party plugin and opt-in toolbar in the comprehensive demo", () => {
  const repoRoot = fixture();
  const storyPath = path.join(
    repoRoot,
    "stories/demo/ComprehensiveDemoStory.svelte",
  );
  for (const name of ["ai", "mermaid"]) {
    const packagePath = path.join(
      repoRoot,
      `packages/mira-plugin-${name}/package.json`,
    );
    mkdirSync(path.dirname(packagePath), { recursive: true });
    writeFileSync(
      packagePath,
      JSON.stringify({ name: `@lapismd/mira-plugin-${name}` }),
    );
  }
  mkdirSync(path.dirname(storyPath), { recursive: true });
  writeFileSync(
    storyPath,
    `import { aiExtension } from "@lapismd/mira-plugin-ai";
import { mermaidExtension } from "@lapismd/mira-plugin-mermaid";
doodleDividersExtension();
selectionToolbarExtension();
const featureConfigs = { [MiraFeature.BlockControls]: { toolbar: true } };
<Mira {blockControls} />;
`,
  );

  try {
    const valid = validateComprehensivePluginCoverage({ repoRoot });
    assert.equal(valid.ok, true);
    assert.equal(valid.stats.pluginPackages, 2);
    assert.equal(valid.stats.optInExtensions, 2);

    writeFileSync(
      storyPath,
      'import { aiExtension } from "@lapismd/mira-plugin-ai";\n',
    );
    const missing = validateComprehensivePluginCoverage({ repoRoot });
    assert.equal(missing.ok, false);
    assert.match(missing.errors.join("\n"), /mira-plugin-mermaid/);
    assert.match(missing.errors.join("\n"), /selectionToolbarExtension/);
    assert.match(missing.errors.join("\n"), /contextual block toolbar/);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
