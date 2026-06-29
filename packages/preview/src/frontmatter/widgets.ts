import type {
  BuiltinFrontmatterPropertyKind,
  FrontmatterConfig,
  FrontmatterPropertyKind,
  FrontmatterTypeDefinition,
} from "./types";
import {
  frontmatterPropertyKindLabels,
  frontmatterPropertyKindOptions,
} from "./types";

export function frontmatterPropertyIcon(
  kind: FrontmatterPropertyKind,
  config?: FrontmatterConfig,
): string {
  const configured = resolveFrontmatterWidget(config, kind);
  if (configured?.icon) {
    return configured.icon;
  }

  const icons: Record<BuiltinFrontmatterPropertyKind, string> = {
    aliases: "lucide-at-sign",
    array: "lucide-brackets",
    checkbox: "lucide-check-square",
    date: "lucide-calendar",
    datetime: "lucide-clock",
    multitext: "lucide-list",
    null: "lucide-file-question",
    number: "lucide-binary",
    object: "lucide-braces",
    tags: "lucide-tags",
    text: "lucide-text",
    unknown: "lucide-file-question",
  };

  return icons[toBuiltinFrontmatterKind(kind)] ?? icons.unknown;
}

export function frontmatterPropertyLabel(
  kind: FrontmatterPropertyKind,
  config?: FrontmatterConfig,
): string {
  const configured = resolveFrontmatterWidget(config, kind);
  if (configured?.label) {
    return configured.label;
  }
  return (
    frontmatterPropertyKindLabels[toBuiltinFrontmatterKind(kind)] ??
    String(kind)
  );
}

export function frontmatterTypeOptions(
  config?: FrontmatterConfig,
): FrontmatterTypeDefinition[] {
  const options = new Map<string, FrontmatterTypeDefinition>();
  for (const kind of frontmatterPropertyKindOptions) {
    options.set(kind, {
      type: kind,
      label: frontmatterPropertyKindLabels[kind],
      icon: frontmatterPropertyIcon(kind),
    });
  }
  for (const definition of Object.values(config?.properties ?? {})) {
    const normalized = normalizeTypeDefinition(definition);
    options.set(normalized.type, {
      ...normalized,
      label: normalized.label ?? frontmatterPropertyLabel(normalized.type),
      icon: normalized.icon ?? frontmatterPropertyIcon(normalized.type),
    });
  }
  for (const definition of Object.values(config?.types ?? {})) {
    const normalized = normalizeTypeDefinition(definition);
    options.set(normalized.type, {
      ...normalized,
      label: normalized.label ?? frontmatterPropertyLabel(normalized.type),
      icon: normalized.icon ?? frontmatterPropertyIcon(normalized.type),
    });
  }
  for (const definition of config?.widgets ?? []) {
    options.set(definition.type, {
      ...definition,
      label: definition.label ?? frontmatterPropertyLabel(definition.type),
      icon: definition.icon ?? frontmatterPropertyIcon(definition.type),
    });
  }
  return [...options.values()];
}

function normalizeTypeDefinition(
  definition: FrontmatterPropertyKind | FrontmatterTypeDefinition,
): FrontmatterTypeDefinition {
  if (typeof definition === "string") {
    return { type: definition };
  }
  return definition;
}

export function resolveConfiguredFrontmatterType(
  config: FrontmatterConfig | undefined,
  pathString: string,
  key: string,
): FrontmatterTypeDefinition | null {
  const candidate =
    config?.types?.[pathString] ??
    config?.types?.[key] ??
    config?.properties?.[pathString] ??
    config?.properties?.[key];
  return candidate ? normalizeTypeDefinition(candidate) : null;
}

export function resolveFrontmatterWidget(
  config: FrontmatterConfig | undefined,
  kind: FrontmatterPropertyKind,
): FrontmatterTypeDefinition | null {
  const configured =
    config?.widgets?.find((widget) => widget.type === kind) ??
    Object.values(config?.properties ?? {})
      .map(normalizeTypeDefinition)
      .find((definition) => definition.type === kind) ??
    Object.values(config?.types ?? {})
      .map(normalizeTypeDefinition)
      .find((definition) => definition.type === kind);
  return configured ?? null;
}

export function toBuiltinFrontmatterKind(
  kind: FrontmatterPropertyKind,
): BuiltinFrontmatterPropertyKind {
  return isBuiltinFrontmatterKind(kind) ? kind : "text";
}

export function isBuiltinFrontmatterKind(
  kind: FrontmatterPropertyKind,
): kind is BuiltinFrontmatterPropertyKind {
  return (
    kind === "unknown" ||
    kind === "tags" ||
    kind === "aliases" ||
    kind === "multitext" ||
    kind === "array" ||
    kind === "object" ||
    kind === "text" ||
    kind === "number" ||
    kind === "checkbox" ||
    kind === "date" ||
    kind === "datetime" ||
    kind === "null"
  );
}
