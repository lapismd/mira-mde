import type {
  FrontmatterConfig,
  FrontmatterPropertySuggestion,
  FrontmatterPropertySuggestionInput,
} from "./types";
import { frontmatterPropertyIcon } from "./widgets";

export async function readFrontmatterPropertySuggestions(
  config?: FrontmatterConfig,
): Promise<FrontmatterPropertySuggestion[]> {
  const source = config?.propertySuggestions;
  if (!source) {
    return [];
  }

  const inputs = typeof source === "function" ? await source() : source;
  return normalizeSuggestions(inputs, config);
}

export function filterFrontmatterPropertySuggestions(
  suggestions: readonly FrontmatterPropertySuggestion[],
  query: string,
  excludedNames: readonly string[] = [],
): FrontmatterPropertySuggestion[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const excluded = new Set(
    excludedNames.map((name) => name.trim().toLocaleLowerCase()),
  );

  return suggestions
    .filter((suggestion) => {
      const name = suggestion.name.trim().toLocaleLowerCase();
      return (
        name &&
        !excluded.has(name) &&
        (!normalizedQuery || name.includes(normalizedQuery))
      );
    })
    .sort((left, right) => {
      const leftName = left.name.toLocaleLowerCase();
      const rightName = right.name.toLocaleLowerCase();
      const leftStarts =
        normalizedQuery && leftName.startsWith(normalizedQuery) ? 0 : 1;
      const rightStarts =
        normalizedQuery && rightName.startsWith(normalizedQuery) ? 0 : 1;
      return leftStarts - rightStarts || leftName.localeCompare(rightName);
    })
    .slice(0, 20);
}

export type FrontmatterPillWikilink = {
  target: string;
  text: string;
};

export function parseFrontmatterPillWikilink(
  value: string,
): FrontmatterPillWikilink | null {
  const match = /^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/u.exec(value.trim());
  const target = match?.[1]?.trim();
  if (!target) {
    return null;
  }
  return {
    target,
    text: match?.[2]?.trim() || target,
  };
}

function normalizeSuggestions(
  inputs: readonly FrontmatterPropertySuggestionInput[],
  config?: FrontmatterConfig,
): FrontmatterPropertySuggestion[] {
  const byName = new Map<string, FrontmatterPropertySuggestion>();
  for (const input of inputs) {
    const suggestion =
      typeof input === "string" ? { name: input } : { ...input };
    const name = suggestion.name.trim();
    if (!name) {
      continue;
    }
    byName.set(name.toLocaleLowerCase(), {
      ...suggestion,
      name,
      icon:
        suggestion.icon ??
        (suggestion.kind
          ? frontmatterPropertyIcon(suggestion.kind, config)
          : undefined),
    });
  }
  return [...byName.values()];
}
