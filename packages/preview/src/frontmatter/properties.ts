import type { FrontmatterConfig, FrontmatterPathSegment, FrontmatterProperty, FrontmatterPropertyKind } from "./types";
import { isRecord, isTextNumberArray } from "./predicates";
import { defaultFrontmatterValue } from "./defaults";
import { frontmatterPropertyIcon, resolveConfiguredFrontmatterType, resolveFrontmatterWidget, toBuiltinFrontmatterKind } from "./widgets";

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

