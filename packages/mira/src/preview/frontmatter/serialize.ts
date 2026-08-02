import { stringify } from "yaml";

export function serializeFrontmatterRecord(
  value: Record<string, unknown>,
): string {
  return stringify(value, {
    lineWidth: 0,
    singleQuote: false,
  }).trimEnd();
}

export function createFrontmatterReplacement(yaml: string): string {
  return `---\n${yaml.trimEnd()}\n---`;
}
