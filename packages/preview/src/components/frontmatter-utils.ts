import { parseDocument, stringify } from "yaml";

export type FrontmatterPropertyKind =
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

export type FrontmatterPathSegment = string | number;

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
  parentPath: FrontmatterPathSegment[] = [],
  depth = 0,
): FrontmatterProperty[] {
  return Object.entries(value).map(([key, propertyValue]) =>
    createFrontmatterProperty(key, propertyValue, [...parentPath, key], depth),
  );
}

export function frontmatterPropertyKind(
  value: unknown,
  key = "",
): FrontmatterPropertyKind {
  return deriveFrontmatterPropertyType(key, value);
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

export function frontmatterPropertyIcon(kind: FrontmatterPropertyKind): string {
  const icons: Record<FrontmatterPropertyKind, string> = {
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

  return icons[kind];
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
  if (kind === "number") {
    const nextNumber = Number(value);
    return Number.isFinite(nextNumber) ? nextNumber : value;
  }
  if (kind === "checkbox") {
    return value === "true";
  }
  if (kind === "tags" || kind === "aliases" || kind === "multitext") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (kind === "array" || kind === "object" || kind === "unknown") {
    const document = parseDocument(value, { prettyErrors: false });
    if (document.errors.length || document.warnings.length) {
      return value;
    }
    return document.toJS();
  }
  if (kind === "null") {
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
): FrontmatterProperty {
  const kind = deriveFrontmatterPropertyType(key, value);
  const children = shouldDeriveChildren(kind, value)
    ? deriveChildren(value, path, depth + 1)
    : [];
  const pathString = formatPath(path);

  return {
    children,
    depth,
    icon: frontmatterPropertyIcon(children.length ? "object" : kind),
    id: pathString,
    key,
    kind,
    parent: formatPath(path.slice(0, -1)),
    path,
    pathString,
    type: kind,
    valid: validateFrontmatterPropertyValue(kind, value),
    value,
  };
}

function deriveChildren(
  value: unknown,
  parentPath: FrontmatterPathSegment[],
  depth: number,
): FrontmatterProperty[] {
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      createFrontmatterProperty(
        String(index),
        item,
        [...parentPath, index],
        depth,
      ),
    );
  }

  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).map(([key, childValue]) =>
    createFrontmatterProperty(key, childValue, [...parentPath, key], depth),
  );
}

function shouldDeriveChildren(
  kind: FrontmatterPropertyKind,
  value: unknown,
): boolean {
  if (kind === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return kind === "array" && Array.isArray(value) && value.length > 0;
}

function validateFrontmatterPropertyValue(
  kind: FrontmatterPropertyKind,
  value: unknown,
): boolean {
  if (kind === "tags" || kind === "aliases" || kind === "multitext") {
    return isTextNumberArray(value) || typeof value === "string";
  }
  if (kind === "array") {
    return Array.isArray(value) && !isTextNumberArray(value);
  }
  if (kind === "object") {
    return isRecord(value);
  }
  if (kind === "text" || kind === "date" || kind === "datetime") {
    return typeof value === "string";
  }
  if (kind === "number") {
    return typeof value === "number";
  }
  if (kind === "checkbox") {
    return typeof value === "boolean";
  }
  if (kind === "null") {
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
