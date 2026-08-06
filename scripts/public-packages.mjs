import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import semver from "semver";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");

export const PUBLIC_PACKAGE_GRAPH = Object.freeze([
  Object.freeze({ name: "@lapismd/mira", directory: "mira", dependencies: [] }),
  Object.freeze({
    name: "@lapismd/mira-plugin-ai",
    directory: "mira-plugin-ai",
    dependencies: ["@lapismd/mira"],
  }),
  Object.freeze({
    name: "@lapismd/mira-plugin-mermaid",
    directory: "mira-plugin-mermaid",
    dependencies: ["@lapismd/mira"],
  }),
  Object.freeze({
    name: "@lapismd/mira-editor",
    directory: "mira-editor",
    dependencies: ["@lapismd/mira", "@lapismd/mira-plugin-mermaid"],
  }),
  Object.freeze({
    name: "@lapismd/mira-react",
    directory: "mira-react",
    dependencies: [
      "@lapismd/mira",
      "@lapismd/mira-editor",
      "@lapismd/mira-plugin-mermaid",
    ],
  }),
  Object.freeze({
    name: "@lapismd/mira-vanilla",
    directory: "mira-vanilla",
    dependencies: ["@lapismd/mira", "@lapismd/mira-editor"],
  }),
]);

export const PUBLIC_PACKAGE_DEPENDENCIES = new Map(
  PUBLIC_PACKAGE_GRAPH.map(({ name, dependencies }) => [
    name,
    new Set(dependencies),
  ]),
);

export function packageDirectory(
  packageDefinition,
  repoRoot = DEFAULT_REPO_ROOT,
) {
  return path.join(repoRoot, "packages", packageDefinition.directory);
}

export function readPackageManifest(
  packageDefinition,
  repoRoot = DEFAULT_REPO_ROOT,
) {
  const directory = packageDirectory(packageDefinition, repoRoot);
  const manifest = JSON.parse(
    readFileSync(path.join(directory, "package.json"), "utf8"),
  );
  return { ...packageDefinition, directory, manifest };
}

export function readPublicPackages(repoRoot = DEFAULT_REPO_ROOT) {
  return PUBLIC_PACKAGE_GRAPH.map((definition) =>
    readPackageManifest(definition, repoRoot),
  );
}

export function isStableVersion(version) {
  return (
    semver.valid(version) === version && semver.prerelease(version) === null
  );
}
