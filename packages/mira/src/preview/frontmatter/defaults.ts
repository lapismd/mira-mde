import type { FrontmatterConfig, FrontmatterPropertyKind } from "./types";
import { resolveFrontmatterWidget, toBuiltinFrontmatterKind } from "./widgets";

export function defaultFrontmatterValue(
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
