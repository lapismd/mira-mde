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

export async function readFrontmatterValueSuggestions(
  config: FrontmatterConfig | undefined,
  key: string,
  query: string,
): Promise<string[]> {
  const source = config?.valueSuggestions;
  if (!source) {
    return [];
  }
  const values = await source(key, query);
  return filterFrontmatterValueSuggestions(values, query);
}

export function filterFrontmatterValueSuggestions(
  suggestions: readonly string[],
  query: string,
  excludedValues: readonly string[] = [],
): string[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const excluded = new Set(
    excludedValues.map((value) => value.trim().toLocaleLowerCase()),
  );
  const unique = new Map<string, string>();
  for (const suggestion of suggestions) {
    const value = suggestion.trim();
    const key = value.toLocaleLowerCase();
    if (!value || excluded.has(key) || unique.has(key)) {
      continue;
    }
    if (normalizedQuery && !key.includes(normalizedQuery)) {
      continue;
    }
    unique.set(key, value);
  }
  return [...unique.values()]
    .sort((left, right) => {
      const leftName = left.toLocaleLowerCase();
      const rightName = right.toLocaleLowerCase();
      const leftStarts =
        normalizedQuery && leftName.startsWith(normalizedQuery) ? 0 : 1;
      const rightStarts =
        normalizedQuery && rightName.startsWith(normalizedQuery) ? 0 : 1;
      return leftStarts - rightStarts || leftName.localeCompare(rightName);
    })
    .slice(0, 20);
}

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
