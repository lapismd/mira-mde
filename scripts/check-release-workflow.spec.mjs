import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkReleaseWorkflows,
  validateReleaseWorkflows,
} from "./check-release-workflow.mjs";

test("accepts the repository release and CI workflows", () => {
  assert.deepEqual(checkReleaseWorkflows(), { ok: true, errors: [] });
});

test("retains raw compiler receipts when either packed build fails", () => {
  const sources = {
    releaseSource: readFileSync(".github/workflows/release.yml", "utf8"),
    ciSource: readFileSync(".github/workflows/mira-spec-first.yml", "utf8"),
    pagesSource: readFileSync(
      ".github/workflows/publish-storybook-pages.yml",
      "utf8",
    ),
  };
  for (const field of ["releaseSource", "ciSource"]) {
    for (const filename of [
      "math-development-compile-diagnostics.json",
      "math-production-compile-diagnostics.json",
    ]) {
      const result = validateReleaseWorkflows({
        ...sources,
        [field]: sources[field].replaceAll(filename, "omitted.json"),
      });
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /diagnostic receipt/);
    }
    const result = validateReleaseWorkflows({
      ...sources,
      [field]: sources[field].replace(
        "if: always() && hashFiles",
        "if: success() && hashFiles",
      ),
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /diagnostic receipt/);
  }
});

test("rejects screenshot comparison in every workflow", () => {
  const sources = {
    releaseSource: readFileSync(".github/workflows/release.yml", "utf8"),
    ciSource: readFileSync(".github/workflows/mira-spec-first.yml", "utf8"),
    pagesSource: readFileSync(
      ".github/workflows/publish-storybook-pages.yml",
      "utf8",
    ),
  };
  for (const command of [
    "pnpm exec visual-delta test --all",
    "pnpm test:visual",
    "npm run test:visual",
    "pnpm exec playwright test --update-snapshots",
  ]) {
    for (const field of Object.keys(sources)) {
      const result = validateReleaseWorkflows({
        ...sources,
        [field]: `${sources[field]}\nrun: ${command}\n`,
      });
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /screenshot comparisons/);
    }
    const result = validateReleaseWorkflows({
      ...sources,
      additionalSources: { "new-workflow.yml": `run: ${command}\n` },
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /screenshot comparisons/);
  }
});

test("retains static Storybook, interaction/accessibility and functional browser checks", () => {
  const sources = {
    releaseSource: readFileSync(".github/workflows/release.yml", "utf8"),
    ciSource: readFileSync(".github/workflows/mira-spec-first.yml", "utf8"),
    pagesSource: readFileSync(
      ".github/workflows/publish-storybook-pages.yml",
      "utf8",
    ),
  };
  for (const command of [
    "pnpm build-storybook",
    "pnpm test:storybook",
    "pnpm test:e2e",
  ]) {
    const result = validateReleaseWorkflows({
      ...sources,
      ciSource: sources.ciSource.replace(command, "pnpm omitted"),
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), new RegExp(command));
  }
});

test("rejects automatic publication or missing protected source approval", () => {
  const source = readFileSync(".github/workflows/release.yml", "utf8");
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  );
  const pagesSource = readFileSync(
    ".github/workflows/publish-storybook-pages.yml",
    "utf8",
  );
  for (const releaseSource of [
    source.replace("default: false", "default: true"),
    source.replaceAll(
      "github.event_name == 'workflow_dispatch' && inputs.publish == true",
      "true",
    ),
    source.replace('process.env.MIRA_PUBLISH_REQUESTED === "true" &&', ""),
    source.replace("vars.MIRA_RELEASE_APPROVED_SOURCE", "inputs.source"),
  ]) {
    const result = validateReleaseWorkflows({
      releaseSource,
      ciSource,
      pagesSource,
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /manual|protected source/);
  }
});

test("rejects token credentials in production and direct publication", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8")
    .replace('MIRA_RELEASE_APPROVED: "1"', "NODE_AUTH_TOKEN: unsafe")
    .replace(
      "run: pnpm release:publish .release/release-manifest.json",
      "run: npm publish",
    );
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  );
  const pagesSource = readFileSync(
    ".github/workflows/publish-storybook-pages.yml",
    "utf8",
  );
  const result = validateReleaseWorkflows({
    releaseSource,
    ciSource,
    pagesSource,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /token credentials/);
  assert.match(result.errors.join("\n"), /release:publish/);
});

test("rejects CI without explicit release intent", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8");
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  ).replace("pnpm release:intent", "pnpm omitted:intent");
  const pagesSource = readFileSync(
    ".github/workflows/publish-storybook-pages.yml",
    "utf8",
  );
  const result = validateReleaseWorkflows({
    releaseSource,
    ciSource,
    pagesSource,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /release:intent/);
});

test("rejects deprecated action runtimes and an invalid spec-first separator", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8")
    .replaceAll("actions/checkout@v7", "actions/checkout@v5")
    .replaceAll("pnpm/action-setup@v6", "pnpm/action-setup@v4")
    .replaceAll("actions/setup-node@v7", "actions/setup-node@v5");
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  ).replace("pnpm spec:first\n", "pnpm spec:first --\n");
  const pagesSource = readFileSync(
    ".github/workflows/publish-storybook-pages.yml",
    "utf8",
  );
  const result = validateReleaseWorkflows({
    releaseSource,
    ciSource,
    pagesSource,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /actions\/checkout@v7/);
  assert.match(result.errors.join("\n"), /pnpm\/action-setup@v6/);
  assert.match(result.errors.join("\n"), /actions\/setup-node@v7/);
  assert.match(result.errors.join("\n"), /spec-first gate/);
});

test("rejects Pages workflow without deployment permission", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8");
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  );
  const pagesSource = readFileSync(
    ".github/workflows/publish-storybook-pages.yml",
    "utf8",
  ).replace("pages: write", "pages: read");
  const result = validateReleaseWorkflows({
    releaseSource,
    ciSource,
    pagesSource,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /pages: write/);
});

test("rejects release workflows that skip package GitHub releases", () => {
  const releaseSource = readFileSync(".github/workflows/release.yml", "utf8")
    .replace(
      "name: Create package tags and GitHub releases",
      "name: Skip package GitHub releases",
    )
    .replace(
      "run: pnpm release:notes .release/release-manifest.json",
      "run: echo omitted",
    );
  const ciSource = readFileSync(
    ".github/workflows/mira-spec-first.yml",
    "utf8",
  );
  const pagesSource = readFileSync(
    ".github/workflows/publish-storybook-pages.yml",
    "utf8",
  );
  const result = validateReleaseWorkflows({
    releaseSource,
    ciSource,
    pagesSource,
  });
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /package GitHub releases job/);
  assert.match(result.errors.join("\n"), /verified manifest/);
});
