import { parseDocument, stringify } from "yaml";

export type BuiltinFrontmatterPropertyKind =
  | "unknown"
  | "tags"
  | "aliases"
  | "multitext"
  | "array"
  | "object"
  | "text"
  | "number"
  | "checkbox"
  | "date"
  | "datetime"
  | "null";

export type FrontmatterPropertyKind =
  | BuiltinFrontmatterPropertyKind
  | (string & {});

export type FrontmatterPathSegment = string | number;

export type FrontmatterWidgetContext = {
  property: FrontmatterProperty;
  sourcePath?: string;
  setValue: (value: unknown) => void;
};

export type FrontmatterWidgetRenderer = (
  element: HTMLElement,
  context: FrontmatterWidgetContext,
) => void | (() => void);

export type FrontmatterTypeDefinition = {
  type: FrontmatterPropertyKind;
  label?: string;
  icon?: string;
  fallbackKind?: BuiltinFrontmatterPropertyKind;
  defaultValue?: unknown | (() => unknown);
  validate?: (value: unknown, property: FrontmatterProperty) => boolean;
  normalize?: (value: unknown, property?: FrontmatterProperty) => unknown;
  render?: FrontmatterWidgetRenderer;
};

export type FrontmatterConfig = {
  types?: Record<string, FrontmatterPropertyKind | FrontmatterTypeDefinition>;
  properties?: Record<
    string,
    FrontmatterPropertyKind | FrontmatterTypeDefinition
  >;
  widgets?: FrontmatterTypeDefinition[];
};

export type FrontmatterParseResult =
  | {
      ok: true;
      value: Record<string, unknown>;
      yaml: string;
    }
  | {
      ok: false;
      error: string;
      yaml: string;
    };

export type FrontmatterProperty = {
  children: FrontmatterProperty[];
  depth: number;
  icon: string;
  id: string;
  key: string;
  parent: string;
  path: FrontmatterPathSegment[];
  pathString: string;
  type: FrontmatterPropertyKind;
  value: unknown;
  kind: FrontmatterPropertyKind;
  valid: boolean;
};

export const frontmatterPropertyKindOptions = [
  "text",
  "number",
  "checkbox",
  "date",
  "datetime",
  "tags",
  "aliases",
  "multitext",
  "array",
  "object",
  "null",
] as const satisfies readonly BuiltinFrontmatterPropertyKind[];

export const frontmatterPropertyKindLabels: Record<
  BuiltinFrontmatterPropertyKind,
  string
> = {
  aliases: "Aliases",
  array: "List",
  checkbox: "Checkbox",
  date: "Date",
  datetime: "Date and time",
  multitext: "Text list",
  null: "Empty",
  number: "Number",
  object: "Object",
  tags: "Tags",
  text: "Text",
  unknown: "Unknown",
};

export function normalizeFrontmatterYaml(frontmatter: string): string {
  const trimmed = frontmatter.trim();
  if (!trimmed.startsWith("---")) {
    return frontmatter.trimEnd();
  }

  return trimmed
    .replace(/^---\r?\n/, "")
    .replace(/\r?\n---$/, "")
    .trimEnd();
}

export function parseFrontmatterYaml(yaml: string): FrontmatterParseResult {
  const normalizedYaml = normalizeFrontmatterYaml(yaml);
  try {
    const document = parseDocument(normalizedYaml, { prettyErrors: false });
    const error = document.errors[0] ?? document.warnings[0];
    if (error) {
      return {
        ok: false,
        error: error.message,
        yaml: normalizedYaml,
      };
    }

    const value = document.toJS();
    if (value === null || value === undefined) {
      return { ok: true, value: {}, yaml: normalizedYaml };
    }
    if (!isRecord(value)) {
      return {
        ok: false,
        error: "Frontmatter must be a YAML mapping.",
        yaml: normalizedYaml,
      };
    }

    return {
      ok: true,
      value,
      yaml: normalizedYaml,
    };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : String(cause),
      yaml: normalizedYaml,
    };
  }
}

export function frontmatterProperties(
  value: Record<string, unknown>,
  config?: FrontmatterConfig,
  parentPath: FrontmatterPathSegment[] = [],
  depth = 0,
): FrontmatterProperty[] {
  return Object.entries(value).map(([key, propertyValue]) =>
    createFrontmatterProperty(
      key,
      propertyValue,
      [...parentPath, key],
      depth,
      config,
    ),
  );
}

export function frontmatterPropertyKind(
  value: unknown,
  key = "",
  config?: FrontmatterConfig,
  pathString = key,
): FrontmatterPropertyKind {
  return (
    resolveConfiguredFrontmatterType(config, pathString, key)?.type ??
    deriveFrontmatterPropertyType(key, value)
  );
}

export function deriveFrontmatterPropertyType(
  key: string,
  value: unknown,
): FrontmatterPropertyKind {
  const normalizedKey = key.toLowerCase();
  if (normalizedKey === "tags" || normalizedKey === "tag") {
    return "tags";
  }
  if (normalizedKey === "aliases" || normalizedKey === "alias") {
    return "aliases";
  }
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return isTextNumberArray(value) ? "multitext" : "array";
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return "date";
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value)) {
      return "datetime";
    }
    return "text";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "boolean") {
    return "checkbox";
  }
  if (isRecord(value)) {
    return "object";
  }
  return "unknown";
}

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

export function formatFrontmatterValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (isTextNumberArray(value)) {
      return value.map((item) => String(item)).join(", ");
    }
    return stringify(value).trimEnd();
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return stringify(value).trimEnd();
  }
  return String(value);
}

export function parseFrontmatterValue(
  value: string,
  kind: FrontmatterPropertyKind,
): unknown {
  const builtinKind = toBuiltinFrontmatterKind(kind);
  if (builtinKind === "number") {
    const nextNumber = Number(value);
    return Number.isFinite(nextNumber) ? nextNumber : value;
  }
  if (builtinKind === "checkbox") {
    return value === "true";
  }
  if (
    builtinKind === "tags" ||
    builtinKind === "aliases" ||
    builtinKind === "multitext"
  ) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (
    builtinKind === "array" ||
    builtinKind === "object" ||
    builtinKind === "unknown"
  ) {
    const document = parseDocument(value, { prettyErrors: false });
    if (document.errors.length || document.warnings.length) {
      return value;
    }
    return document.toJS();
  }
  if (builtinKind === "null") {
    return value.trim() ? value : null;
  }
  return value;
}

export function updateFrontmatterRecord(
  value: Record<string, unknown>,
  path: FrontmatterPathSegment[],
  nextValue: unknown,
): Record<string, unknown> {
  const next = setValueAtPath(value, path, nextValue);
  return isRecord(next) ? next : value;
}

export function renameFrontmatterRecordProperty(
  value: Record<string, unknown>,
  path: FrontmatterPathSegment[],
  nextKey: string,
): Record<string, unknown> {
  const currentKey = path.at(-1);
  if (typeof currentKey !== "string" || !nextKey || currentKey === nextKey) {
    return value;
  }

  const parentPath = path.slice(0, -1);
  const parent = getValueAtPath(value, parentPath);
  if (!isRecord(parent) || Object.hasOwn(parent, nextKey)) {
    return value;
  }

  const renamedParent = Object.fromEntries(
    Object.entries(parent).map(([key, propertyValue]) =>
      key === currentKey ? [nextKey, propertyValue] : [key, propertyValue],
    ),
  );

  if (!parentPath.length) {
    return renamedParent;
  }

  const next = setValueAtPath(value, parentPath, renamedParent);
  return isRecord(next) ? next : value;
}

export function addFrontmatterRecordProperty(
  value: Record<string, unknown>,
  kind: FrontmatterPropertyKind = "text",
  config?: FrontmatterConfig,
): { name: string; value: Record<string, unknown> } {
  const name = createUniquePropertyName(value, "property");
  return {
    name,
    value: {
      ...value,
      [name]: defaultFrontmatterValue(kind, config),
    },
  };
}

export function coerceFrontmatterValue(
  value: unknown,
  kind: FrontmatterPropertyKind,
  config?: FrontmatterConfig,
  property?: FrontmatterProperty,
): unknown {
  const widget = resolveFrontmatterWidget(config, kind);
  if (widget?.normalize) {
    return widget.normalize(value, property);
  }
  const builtinKind = toBuiltinFrontmatterKind(widget?.fallbackKind ?? kind);
  if (builtinKind === "number") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
  if (builtinKind === "checkbox") {
    return Boolean(value);
  }
  if (
    builtinKind === "date" ||
    builtinKind === "datetime" ||
    builtinKind === "text"
  ) {
    return value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join(", ")
        : String(value);
  }
  if (
    builtinKind === "tags" ||
    builtinKind === "aliases" ||
    builtinKind === "multitext"
  ) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/[,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }
  if (builtinKind === "array") {
    return Array.isArray(value) ? value : [];
  }
  if (builtinKind === "object") {
    return isRecord(value) ? value : {};
  }
  if (builtinKind === "null") {
    return null;
  }
  return value;
}

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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isTextNumberArray(
  value: unknown,
): value is Array<string | number> {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" || typeof item === "number")
  );
}

function createFrontmatterProperty(
  key: string,
  value: unknown,
  path: FrontmatterPathSegment[],
  depth: number,
  config?: FrontmatterConfig,
): FrontmatterProperty {
  const pathString = formatPath(path);
  const kind = frontmatterPropertyKind(value, key, config, pathString);
  const children = shouldDeriveChildren(kind, value)
    ? deriveChildren(value, path, depth + 1, config)
    : [];
  const property: FrontmatterProperty = {
    children,
    depth,
    icon: frontmatterPropertyIcon(children.length ? "object" : kind, config),
    id: pathString,
    key,
    kind,
    parent: formatPath(path.slice(0, -1)),
    path,
    pathString,
    type: kind,
    valid: true,
    value,
  } satisfies FrontmatterProperty;

  property.valid = validateFrontmatterPropertyValue(
    kind,
    value,
    property,
    config,
  );
  return property;
}

function deriveChildren(
  value: unknown,
  parentPath: FrontmatterPathSegment[],
  depth: number,
  config?: FrontmatterConfig,
): FrontmatterProperty[] {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      createFrontmatterProperty(
        String(index),
        item,
        [...parentPath, index],
        depth,
        config,
      ),
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).map(([key, childValue]) =>
    createFrontmatterProperty(
      key,
      childValue,
      [...parentPath, key],
      depth,
      config,
    ),
  );
}

function shouldDeriveChildren(
  kind: FrontmatterPropertyKind,
  value: unknown,
): boolean {
  const builtinKind = toBuiltinFrontmatterKind(kind);
  if (builtinKind === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return builtinKind === "array" && Array.isArray(value) && value.length > 0;
}

function validateFrontmatterPropertyValue(
  kind: FrontmatterPropertyKind,
  value: unknown,
  property?: FrontmatterProperty,
  config?: FrontmatterConfig,
): boolean {
  const widget = resolveFrontmatterWidget(config, kind);
  if (widget?.validate && property) {
    return widget.validate(value, property);
  }
  const builtinKind = toBuiltinFrontmatterKind(widget?.fallbackKind ?? kind);
  if (
    builtinKind === "tags" ||
    builtinKind === "aliases" ||
    builtinKind === "multitext"
  ) {
    return isTextNumberArray(value) || typeof value === "string";
  }
  if (builtinKind === "array") {
    return Array.isArray(value) && !isTextNumberArray(value);
  }
  if (builtinKind === "object") {
    return isRecord(value);
  }
  if (
    builtinKind === "text" ||
    builtinKind === "date" ||
    builtinKind === "datetime"
  ) {
    return typeof value === "string";
  }
  if (builtinKind === "number") {
    return typeof value === "number";
  }
  if (builtinKind === "checkbox") {
    return typeof value === "boolean";
  }
  if (builtinKind === "null") {
    return value === null;
  }
  return true;
}

function setValueAtPath(
  current: unknown,
  path: FrontmatterPathSegment[],
  nextValue: unknown,
): unknown {
  if (!path.length) {
    return nextValue;
  }

  const [segment, ...rest] = path;
  if (Array.isArray(current)) {
    const next = [...current];
    if (typeof segment === "number") {
      next[segment] = setValueAtPath(next[segment], rest, nextValue);
    }
    return next;
  }

  if (isRecord(current) && typeof segment === "string") {
    return {
      ...current,
      [segment]: setValueAtPath(current[segment], rest, nextValue),
    };
  }

  return current;
}

function getValueAtPath(
  current: unknown,
  path: FrontmatterPathSegment[],
): unknown {
  let value = current;
  for (const segment of path) {
    if (Array.isArray(value) && typeof segment === "number") {
      value = value[segment];
      continue;
    }
    if (isRecord(value) && typeof segment === "string") {
      value = value[segment];
      continue;
    }
    return undefined;
  }
  return value;
}

function createUniquePropertyName(
  value: Record<string, unknown>,
  base: string,
): string {
  if (!Object.hasOwn(value, base)) {
    return base;
  }

  let index = 2;
  while (Object.hasOwn(value, `${base}${index}`)) {
    index += 1;
  }
  return `${base}${index}`;
}

function defaultFrontmatterValue(
  kind: FrontmatterPropertyKind,
  config?: FrontmatterConfig,
): unknown {
  const widget = resolveFrontmatterWidget(config, kind);
  if (typeof widget?.defaultValue === "function") {
    return widget.defaultValue();
  }
  if (widget && "defaultValue" in widget) {
    return widget.defaultValue;
  }
  const builtinKind = toBuiltinFrontmatterKind(widget?.fallbackKind ?? kind);
  if (builtinKind === "number") {
    return 0;
  }
  if (builtinKind === "checkbox") {
    return false;
  }
  if (
    builtinKind === "tags" ||
    builtinKind === "aliases" ||
    builtinKind === "multitext"
  ) {
    return [];
  }
  if (builtinKind === "array") {
    return [];
  }
  if (builtinKind === "object") {
    return {};
  }
  if (builtinKind === "null") {
    return null;
  }
  return "";
}

function normalizeTypeDefinition(
  definition: FrontmatterPropertyKind | FrontmatterTypeDefinition,
): FrontmatterTypeDefinition {
  if (typeof definition === "string") {
    return { type: definition };
  }
  return definition;
}

function resolveConfiguredFrontmatterType(
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

function formatPath(path: FrontmatterPathSegment[]): string {
  return path
    .map((segment, index) =>
      typeof segment === "number"
        ? `[${segment}]`
        : index === 0
          ? segment
          : `.${segment}`,
    )
    .join("");
}
