import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import semver from "semver";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const mathExternals = Object.freeze([
  "devlop",
  "hast-util-from-html-isomorphic",
  "katex",
  "unist-util-visit-parents",
]);
const adapters = ["remark-math", "rehype-katex"];
const digest = (value) => createHash("sha256").update(value).digest("hex");
const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
const artifactName = "math-plugins.js";
const manifestName = "math-plugins.manifest.json";
const noticesName = "math-plugins.LICENSE.txt";

function assertRuntimeManifest(manifest) {
  for (const name of adapters) {
    if (
      manifest.dependencies?.[name] ||
      manifest.optionalDependencies?.[name]
    ) {
      throw Error(`Math adapter must be build-only: ${name}`);
    }
  }
  for (const name of mathExternals) {
    if (!manifest.dependencies?.[name]) {
      throw Error(`Missing explicit math runtime dependency: ${name}`);
    }
  }
  if (!semver.subset(manifest.dependencies.katex, ">=0.18.2 <0.19")) {
    throw Error("Math runtime must declare patched KaTeX >=0.18.2 <0.19");
  }
}

function assertImports(metafile) {
  const outputs = Object.values(metafile.outputs);
  const imports = outputs.flatMap((output) => output.imports);
  const actual = [...new Set(imports.map((entry) => entry.path))].sort();
  if (JSON.stringify(actual) !== JSON.stringify(mathExternals)) {
    throw Error(`Unexpected private math imports: ${actual.join(", ")}`);
  }
  if (
    outputs.some(
      (output) =>
        JSON.stringify([...output.exports].sort()) !==
        JSON.stringify(["rehypeKatex", "remarkMath"]),
    )
  ) {
    throw Error("Private math bundle must retain both upstream plugins");
  }
}

function bundledLicenses(inputs, directory) {
  const packages = new Map();
  const fallbackDirectory = path.join(
    directory,
    "packages/mira/licenses/math-adapters",
  );
  const fallbacks = readJson(path.join(fallbackDirectory, "provenance.json"));
  for (const input of inputs) {
    const absolute = path.resolve(directory, input);
    if (!absolute.includes(`${path.sep}node_modules${path.sep}`)) continue;
    let current = path.dirname(absolute);
    while (current !== path.dirname(current)) {
      const manifestPath = path.join(current, "package.json");
      if (existsSync(manifestPath)) {
        const manifest = readJson(manifestPath);
        if (manifest.name && manifest.version) {
          if (manifest.license !== "MIT") {
            throw Error(`Unreviewed bundled license: ${manifest.name}`);
          }
          const licenseFile = readdirSync(current).find((name) =>
            /^licen[cs]e(?:\.(?:md|txt))?$/i.test(name),
          );
          const fallback = fallbacks.find(
            (entry) =>
              entry.name === manifest.name &&
              entry.version === manifest.version,
          );
          if (!licenseFile && !fallback)
            throw Error(`Missing license: ${manifest.name}`);
          const license = readFileSync(
            licenseFile
              ? path.join(current, licenseFile)
              : path.join(fallbackDirectory, fallback.licenseFile),
            "utf8",
          );
          if (!licenseFile && digest(license) !== fallback.sha256) {
            throw Error(`Changed upstream license: ${manifest.name}`);
          }
          packages.set(`${manifest.name}@${manifest.version}`, {
            name: manifest.name,
            version: manifest.version,
            license: "MIT",
            licenseSha256: digest(license),
            ...(licenseFile ? {} : { licenseSource: fallback }),
            text: license,
          });
          break;
        }
      }
      current = path.dirname(current);
    }
  }
  const inventory = [...packages.values()].sort((a, b) =>
    `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`),
  );
  for (const name of [
    ...adapters,
    "micromark-extension-math",
    "mdast-util-math",
  ]) {
    if (!inventory.some((entry) => entry.name === name)) {
      throw Error(`Missing bundled upstream implementation: ${name}`);
    }
  }
  return inventory;
}

export async function buildMathAdapters(directory = root) {
  const packageDirectory = path.join(directory, "packages/mira");
  const manifest = readJson(path.join(packageDirectory, "package.json"));
  assertRuntimeManifest(manifest);
  const output = path.join(packageDirectory, "dist/preview", artifactName);
  const result = await build({
    absWorkingDir: directory,
    entryPoints: [path.join(packageDirectory, "src/preview/math-plugins.ts")],
    outfile: output,
    bundle: true,
    format: "esm",
    platform: "neutral",
    external: [...mathExternals],
    legalComments: "inline",
    metafile: true,
    write: false,
    logLevel: "silent",
  });
  assertImports(result.metafile);
  const inventory = bundledLicenses(
    Object.keys(result.metafile.inputs),
    directory,
  );
  const notices = inventory
    .map((entry) => `${entry.name}@${entry.version}\n${entry.text.trim()}\n`)
    .join("\n-----\n\n");
  const bytes = result.outputFiles[0].contents;
  const receipt = {
    schemaVersion: 1,
    bundle: artifactName,
    sha256: digest(bytes),
    notices: noticesName,
    noticesSha256: digest(notices),
    externalDependencies: Object.fromEntries(
      mathExternals.map((name) => [name, manifest.dependencies[name]]),
    ),
    packages: inventory.map((entry) => ({
      name: entry.name,
      version: entry.version,
      license: entry.license,
      licenseSha256: entry.licenseSha256,
      ...(entry.licenseSource ? { licenseSource: entry.licenseSource } : {}),
    })),
  };
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, bytes);
  writeFileSync(path.join(path.dirname(output), noticesName), notices);
  writeFileSync(
    path.join(path.dirname(output), manifestName),
    `${JSON.stringify(receipt, null, 2)}\n`,
  );
  console.log(
    `Built private math plugins; retained ${inventory.length} MIT notices.`,
  );
  return receipt;
}

export async function checkMathArtifact(packageDirectory) {
  const manifest = readJson(path.join(packageDirectory, "package.json"));
  assertRuntimeManifest(manifest);
  const directory = path.join(packageDirectory, "dist/preview");
  const receipt = readJson(path.join(directory, manifestName));
  if (
    receipt.schemaVersion !== 1 ||
    receipt.bundle !== artifactName ||
    receipt.notices !== noticesName ||
    receipt.sha256 !==
      digest(readFileSync(path.join(directory, artifactName))) ||
    receipt.noticesSha256 !==
      digest(readFileSync(path.join(directory, noticesName)))
  ) {
    throw Error("Invalid or incomplete private math artifact");
  }
  if (
    JSON.stringify(receipt.externalDependencies) !==
    JSON.stringify(
      Object.fromEntries(
        mathExternals.map((name) => [name, manifest.dependencies[name]]),
      ),
    )
  ) {
    throw Error("Private math runtime declarations do not match the artifact");
  }
  const parsed = await build({
    entryPoints: [path.join(directory, artifactName)],
    bundle: false,
    format: "esm",
    platform: "neutral",
    metafile: true,
    write: false,
    logLevel: "silent",
  });
  assertImports(parsed.metafile);
  if (
    !Array.isArray(receipt.packages) ||
    receipt.packages.some(
      (entry) =>
        entry.license !== "MIT" ||
        !/^[a-f0-9]{64}$/.test(entry.licenseSha256 ?? ""),
    )
  ) {
    throw Error("Invalid bundled math license inventory");
  }
  for (const name of [
    ...adapters,
    "micromark-extension-math",
    "mdast-util-math",
  ]) {
    if (
      !receipt.packages?.some(
        (entry) => entry.name === name && entry.license === "MIT",
      )
    ) {
      throw Error(`Missing bundled math provenance: ${name}`);
    }
  }
  return receipt;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await buildMathAdapters();
}
