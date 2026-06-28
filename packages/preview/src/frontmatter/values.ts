import { parseDocument, stringify } from "yaml";
import type { FrontmatterConfig, FrontmatterProperty, FrontmatterPropertyKind } from "./types";
import { isRecord, isTextNumberArray } from "./predicates";
import { resolveFrontmatterWidget, toBuiltinFrontmatterKind } from "./widgets";

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
