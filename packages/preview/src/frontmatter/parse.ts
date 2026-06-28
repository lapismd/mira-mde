import { parseDocument } from "yaml";
import { isRecord } from "./predicates";
import type { FrontmatterParseResult } from "./types";

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
