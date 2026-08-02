#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIR, "..");

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function summaryChapters(source) {
  return [...source.matchAll(/\[[^\]]+]\(([^)#]+\.md)(?:#[^)]+)?\)/g)].map(
    (match) => toPosix(path.normalize(match[1])),
  );
}

function mdxFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mdx"))
    .map((entry) => path.join(directory, entry.name));
}

export function validateSpecStorybook({ repoRoot = DEFAULT_REPO_ROOT } = {}) {
  const summaryPath = path.join(repoRoot, "spec", "src", "SUMMARY.md");
  const storiesDirectory = path.join(repoRoot, "stories", "spec");
  const errors = [];

  if (!existsSync(summaryPath)) {
    return { ok: false, errors: ["spec/src/SUMMARY.md is missing"], stats: {} };
  }
  if (!existsSync(storiesDirectory)) {
    return {
      ok: false,
      errors: ["stories/spec is missing"],
      stats: {},
    };
  }

  const chapters = summaryChapters(readFileSync(summaryPath, "utf8"));
  const mirrors = [];
  for (const file of mdxFiles(storiesDirectory)) {
    const source = readFileSync(file, "utf8");
    const imports = [
      ...source.matchAll(
        /import\s+\w+\s+from\s+["']\.\.\/\.\.\/spec\/src\/([^"']+\.md)\?raw["']/g,
      ),
    ];
    for (const match of imports) {
      mirrors.push({
        chapter: toPosix(path.normalize(match[1])),
        file: toPosix(path.relative(repoRoot, file)),
      });
    }
  }

  for (const chapter of chapters) {
    const matching = mirrors.filter((mirror) => mirror.chapter === chapter);
    if (matching.length !== 1) {
      errors.push(
        `spec/src/${chapter}: expected one Storybook mirror, found ${matching.length}`,
      );
    }
  }
  for (const mirror of mirrors) {
    if (!chapters.includes(mirror.chapter)) {
      errors.push(`${mirror.file}: stale spec mirror ${mirror.chapter}`);
    }
  }

  const registryPath = path.join(storiesDirectory, "spec-chapters.ts");
  if (!existsSync(registryPath)) {
    errors.push("stories/spec/spec-chapters.ts is missing");
  } else {
    const registry = readFileSync(registryPath, "utf8");
    for (const chapter of chapters) {
      const occurrences = registry.split(`source: "${chapter}"`).length - 1;
      if (occurrences !== 1) {
        errors.push(
          `stories/spec/spec-chapters.ts: expected one ${chapter} entry, found ${occurrences}`,
        );
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: { chapters: chapters.length, mirrors: mirrors.length },
  };
}

function main() {
  const result = validateSpecStorybook();
  if (!result.ok) {
    console.error("Storybook specification mirror validation failed:");
    for (const error of result.errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Storybook specification mirrors validated: ${result.stats.mirrors} mirrors for ${result.stats.chapters} chapters.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
