#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { DEFAULT_REPO_ROOT } from "./public-packages.mjs";

const RELEASE_WORKFLOW = ".github/workflows/release.yml";
const CI_WORKFLOW = ".github/workflows/mira-spec-first.yml";

function requireText(source, pattern, label, errors) {
  if (!pattern.test(source)) errors.push(`missing ${label}`);
}

export function validateReleaseWorkflows({ releaseSource, ciSource }) {
  const errors = [];
  requireText(
    releaseSource,
    /uses: changesets\/action@v1\.8\.0/,
    "pinned Changesets action",
    errors,
  );
  requireText(
    releaseSource,
    /commitMode: github-api/,
    "GitHub API version commit mode",
    errors,
  );
  requireText(
    releaseSource,
    /environment:\s*\n\s+name: npm-production/,
    "npm-production environment",
    errors,
  );
  requireText(
    releaseSource,
    /environment:\s*\n\s+name: npm-bootstrap/,
    "npm-bootstrap environment",
    errors,
  );
  requireText(releaseSource, /id-token: write/, "OIDC permission", errors);
  if ((releaseSource.match(/id-token: write/g) ?? []).length !== 2) {
    errors.push("only the two publish jobs may request OIDC permission");
  }
  for (const command of [
    "pnpm release:plan",
    "pnpm release:prepare",
    "pnpm release:publish",
    "pnpm release:verify",
    "pnpm release:notes",
  ]) {
    requireText(releaseSource, new RegExp(command), command, errors);
  }
  requireText(
    releaseSource,
    /cancel-in-progress: false/,
    "non-cancelling release concurrency",
    errors,
  );
  if (/run:\s*(?:npm|pnpm changeset) publish\b/.test(releaseSource)) {
    errors.push("workflow must publish only through release:publish");
  }
  const production = releaseSource.match(
    /publish-production:[\s\S]*?(?=\n {2}publish-bootstrap:)/,
  )?.[0];
  if (!production) errors.push("missing publish-production job");
  else if (/NPM_BOOTSTRAP_TOKEN|NODE_AUTH_TOKEN/.test(production)) {
    errors.push("production job must not receive npm token credentials");
  }

  for (const command of [
    "pnpm release:intent",
    "pnpm packages:check",
    "pnpm packages:pack",
    "pnpm check:all",
    "pnpm build-storybook",
    "pnpm test:e2e",
  ]) {
    requireText(ciSource, new RegExp(command), `CI ${command}`, errors);
  }
  return { ok: errors.length === 0, errors };
}

export function checkReleaseWorkflows(repoRoot = DEFAULT_REPO_ROOT) {
  return validateReleaseWorkflows({
    releaseSource: readFileSync(path.join(repoRoot, RELEASE_WORKFLOW), "utf8"),
    ciSource: readFileSync(path.join(repoRoot, CI_WORKFLOW), "utf8"),
  });
}

function main() {
  const result = checkReleaseWorkflows();
  if (!result.ok) {
    console.error("Mira release workflow validation failed:");
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("Mira release workflows validated.");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
