import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { realpathSync } from "node:fs";
import { readFileSync } from "node:fs";
import test from "node:test";

test("completion caller is a parsed read-only pinned wake-up without recursion", () => {
  const require = createRequire(
    realpathSync(
      new URL("../node_modules/@changesets/cli/package.json", import.meta.url),
    ),
  );
  const { parse } = require("yaml");
  const caller = parse(
    readFileSync(
      new URL("../.github/workflows/dependency-completed.yml", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(Object.keys(caller).sort(), [
    "jobs",
    "name",
    "on",
    "permissions",
  ]);
  assert.equal(caller.name, "Notify dependency completion");
  assert.deepEqual(caller.on, {
    workflow_run: {
      workflows: [
        "Mira CI",
        "Publish Storybook to GitHub Pages",
        "Release public packages",
        "Verify existing public release",
      ],
      types: ["completed"],
    },
  });
  assert.deepEqual(caller.permissions, {
    contents: "read",
    actions: "read",
    "pull-requests": "read",
  });
  assert.deepEqual(caller.jobs, {
    notify: {
      if: "github.event.workflow_run.conclusion == 'success'",
      uses: "lapismd/dependency-automation/.github/workflows/completion.yml@e3c91cb3bc19f19299842054a9309b0ca44da5b6",
      with: { "automation-ref": "e3c91cb3bc19f19299842054a9309b0ca44da5b6" },
      secrets: {
        "app-private-key": "${{ secrets.LAPIS_DEPENDENCY_APP_PRIVATE_KEY }}",
      },
    },
  });
});

test("qualified runtime guard precedes writer authority without changing the version recipe", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  const version = workflow.match(
    /\n {2}version:[\s\S]*?(?=\n {2}[\w-]+:|$)/,
  )?.[0];
  const guard = version?.match(
    /- name: Guard qualified version runtime[\s\S]*?(?=\n {6}- )/,
  )?.[0];
  assert.ok(guard, "source-owned shared runtime guard exists");
  assert.match(
    guard,
    /uses: lapismd\/lapis-ci\/actions\/guard-version-runtime@6511f29ec5ecd5f5dd0bd90287e3f7761e6886a3/,
  );
  const condition =
    "if: github.event_name == 'push' && github.repository == 'lapismd/mira-mde' && github.ref == 'refs/heads/main'";
  assert(guard.includes(condition));
  assert.match(guard, /qualification-file: \.github\/versioning-runtime\.json/);
  assert.doesNotMatch(
    guard,
    /continue-on-error|secrets\.|GITHUB_TOKEN|create-github-app-token/,
  );
  assert(
    version.indexOf("Install dependencies") <
      version.indexOf("Guard qualified version runtime"),
  );
  assert(
    version.indexOf("Guard qualified version runtime") <
      version.indexOf("Create repository version token"),
  );
  assert.equal(
    (
      version.match(
        new RegExp(condition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      ) ?? []
    ).length,
    3,
  );
  assert.match(
    version,
    /has_changesets: \$\{\{ steps\.changesets\.outputs\.hasChangesets \|\| 'false' \}\}/,
  );
  assert.match(
    workflow,
    /if: needs\.version\.outputs\.has_changesets != 'true'/,
  );
  const qualification = JSON.parse(
    readFileSync(
      new URL("../.github/versioning-runtime.json", import.meta.url),
    ),
  );
  const manifest = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url)),
  );
  assert.equal(qualification.cliVersion, "3.0.3");
  assert.equal(qualification.packageManager, manifest.packageManager);
  assert.equal(
    qualification.scripts["release:version"],
    manifest.scripts["release:version"],
  );
  const hash = (file) =>
    createHash("sha256")
      .update(readFileSync(new URL("../" + file, import.meta.url)))
      .digest("hex");
  assert.equal(qualification.configSha256, hash(".changeset/config.json"));
  for (const [file, digest] of Object.entries(qualification.files))
    assert.equal(digest, hash(file), file);
});

import {
  checkReleaseWorkflows,
  validateReleaseWorkflows,
} from "./check-release-workflow.mjs";

test("accepts the repository release and CI workflows", () => {
  assert.deepEqual(checkReleaseWorkflows(), { ok: true, errors: [] });
});

test("each cold packed-host job installs its own Chromium prerequisite", () => {
  const sources = {
    releaseSource: readFileSync(".github/workflows/release.yml", "utf8"),
    ciSource: readFileSync(".github/workflows/mira-spec-first.yml", "utf8"),
    pagesSource: readFileSync(
      ".github/workflows/publish-storybook-pages.yml",
      "utf8",
    ),
  };
  for (const field of ["releaseSource", "ciSource"]) {
    const result = validateReleaseWorkflows({
      ...sources,
      [field]: sources[field].replace(
        "      - name: Install Chromium for packed hosts\n        run: pnpm exec playwright install --with-deps chromium\n",
        "",
      ),
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /packed-host Chromium/);
  }
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
      'run: pnpm --dir .release/tooling release:publish "$GITHUB_WORKSPACE/.release/release-manifest.json"',
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
  ).replace(/pnpm spec:first(?=\s)/, "pnpm spec:first --");
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
      'run: pnpm --dir .release/tooling release:notes "$GITHUB_WORKSPACE/.release/release-manifest.json"',
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

test("rejects maintenance workflows without source or exact-version guards", () => {
  const sources = {
    releaseSource: readFileSync(".github/workflows/release.yml", "utf8"),
    ciSource: readFileSync(".github/workflows/mira-spec-first.yml", "utf8"),
    pagesSource: readFileSync(
      ".github/workflows/publish-storybook-pages.yml",
      "utf8",
    ),
  };
  for (const [before, after, error] of [
    [
      "node scripts/check-release-source.mjs source",
      "echo omitted",
      /validated main-ancestor/,
    ],
    [
      'node "$RUNNER_TEMP/mira-check-release-source.mjs" selection .release/release-plan.json',
      "echo omitted",
      /exact requested package-version/,
    ],
    [
      "ref: ${{ needs.artifact.outputs.source_commit }}",
      "ref: main",
      /artifact source/,
    ],
    [
      'GITHUB_SHA="$MIRA_RELEASE_SOURCE" pnpm release:prepare',
      "pnpm release:prepare",
      /source-bound release:prepare/,
    ],
    [
      "source-sha: ${{ needs.artifact.outputs.source_commit }}",
      "source-sha: ${{ github.sha }}",
      /source-bound dependency/,
    ],
  ]) {
    const result = validateReleaseWorkflows({
      ...sources,
      releaseSource: sources.releaseSource.replace(before, after),
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), error);
  }
});

test("rejects publication that replaces OIDC identity or bypasses reviewed tooling", () => {
  const sources = {
    releaseSource: readFileSync(".github/workflows/release.yml", "utf8"),
    ciSource: readFileSync(".github/workflows/mira-spec-first.yml", "utf8"),
    pagesSource: readFileSync(
      ".github/workflows/publish-storybook-pages.yml",
      "utf8",
    ),
  };
  for (const [before, after, error] of [
    [
      "run: pnpm --dir .release/tooling release:publish",
      'run: GITHUB_SHA="$MIRA_RELEASE_SOURCE" pnpm --dir .release/tooling release:publish',
      /OIDC workflow identity/,
    ],
    [
      "path: .release/tooling",
      "path: .release/unreviewed",
      /reviewed workflow tooling/,
    ],
    [
      "MIRA_RELEASE_SOURCE_ROOT: ${{ github.workspace }}",
      "MIRA_RELEASE_SOURCE_ROOT: wrong",
      /selected product checkout/,
    ],
  ]) {
    const result = validateReleaseWorkflows({
      ...sources,
      releaseSource: sources.releaseSource.replace(before, after),
    });
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), error);
  }
});

test("version PR authority is confined to the canonical main App boundary", () => {
  const workflow = readFileSync(
    new URL("../.github/workflows/release.yml", import.meta.url),
    "utf8",
  );
  const version = workflow.match(
    /\n {2}version:[\s\S]*?(?=\n {2}[\w-]+:|$)/,
  )?.[0];
  assert.ok(version, "version job exists");
  assert.match(
    version,
    /if: github\.event_name == 'push' && github\.repository == 'lapismd\/mira-mde' && github\.ref == 'refs\/heads\/main'/,
  );
  assert.match(version, /permissions:\n {6}contents: read\n/);
  assert.doesNotMatch(version, /\n {6}[\w-]+: write|environment:|id-token:/);
  const checkout = version.match(
    /- name: Check out main[\s\S]*?(?=\n {6}- )/,
  )?.[0];
  assert.match(checkout, /actions\/checkout@[a-f0-9]{40}/);
  assert.match(checkout, /fetch-depth: 0/);
  assert.match(checkout, /persist-credentials: false/);
  assert.doesNotMatch(checkout, /\n {10}token:/);
  const app = version.match(
    /- name: Create repository version token[\s\S]*?(?=\n {6}- )/,
  )?.[0];
  assert.ok(app, "App token mint exists");
  assert.match(app, /id: version-app/);
  assert.match(
    app,
    /actions\/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510/,
  );
  assert.match(
    app,
    /client-id: \$\{\{ vars\.LAPIS_DEPENDENCY_APP_CLIENT_ID \}\}/,
  );
  assert.match(
    app,
    /private-key: \$\{\{ secrets\.LAPIS_DEPENDENCY_APP_PRIVATE_KEY \}\}/,
  );
  assert.match(app, /owner: lapismd\n {10}repositories: mira-mde\n/);
  assert.deepEqual(
    [...app.matchAll(/permission-([\w-]+): (\w+)/g)].map(([, key, value]) => [
      key,
      value,
    ]),
    [
      ["contents", "write"],
      ["pull-requests", "write"],
    ],
  );
  assert.doesNotMatch(app, /skip-token-revoke: true/);
  const changesets = version.match(
    /- name: Create or update Version Packages pull request[\s\S]*/,
  )?.[0];
  assert.match(
    changesets,
    /changesets\/action@63a615b9cd06ba9a3e6d13796c7fbcb080a60a0b/,
  );
  assert.match(changesets, /version: pnpm release:version/);
  assert.match(changesets, /commitMode: github-api/);
  assert.match(changesets, /createGithubReleases: false/);
  assert.match(
    changesets,
    /GITHUB_TOKEN: \$\{\{ steps\.version-app\.outputs\.token \}\}/,
  );
  assert.doesNotMatch(
    changesets,
    /github-token:|publish:|secrets\.GITHUB_TOKEN|github\.token|\|\|/,
  );
  assert.equal((version.match(/GITHUB_TOKEN:/g) ?? []).length, 1);
  assert.equal(
    (workflow.match(/steps\.version-app\.outputs\.token/g) ?? []).length,
    1,
  );
  assert.equal((workflow.match(/create-github-app-token@/g) ?? []).length, 1);
  assert.ok(
    version.indexOf("Install dependencies") <
      version.indexOf("Create repository version token"),
  );
  assert.ok(
    version.indexOf("Create repository version token") <
      version.indexOf("Create or update Version Packages"),
  );
});
