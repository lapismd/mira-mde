import type { MermaidConfig } from "mermaid";
import { parse } from "yaml";

export type MermaidSource = {
  config?: MermaidConfig;
  diagram: string;
};

export function parseMermaidSource(value: string): MermaidSource {
  const match = value.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
  if (!match?.[0]) {
    return { diagram: value };
  }

  try {
    const parsed = parse(match[1] ?? "");
    const config =
      parsed && typeof parsed === "object"
        ? (parsed as MermaidConfig)
        : undefined;
    return {
      config,
      diagram: value.slice(match[0].length),
    };
  } catch {
    return { diagram: value };
  }
}
