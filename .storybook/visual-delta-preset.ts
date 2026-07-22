/**
 * Load the Visual Delta addon from package source (not via the node_modules
 * package name alone). Storybook's manager builder is a one-shot esbuild
 * bundle and its watchers ignore node_modules / do not follow symlinks —
 * resolving manager + preview to absolute `src/` paths keeps them outside
 * those ignores.
 */
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const packageJsonPath =
  require.resolve("storybook-addon-visual-delta/package.json");
const addonRoot = path.dirname(packageJsonPath);
const addonSrc = (entry: string) => path.join(addonRoot, "src", entry);

export function previewAnnotations(entry: string[] = []) {
  return [...entry, addonSrc("preview.ts")];
}

export function managerEntries(entry: string[] = []) {
  return [...entry, addonSrc("manager.tsx")];
}

export async function viteFinal<T>(config: T): Promise<T> {
  return config;
}

export async function webpack<T>(config: T): Promise<T> {
  return config;
}
