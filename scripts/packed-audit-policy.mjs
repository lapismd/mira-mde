import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import semver from "semver";

const advisoryId = "GHSA-238p-pmpm-9mq7";
const advisoryUrl = `https://github.com/advisories/${advisoryId}`;
const knownKatex = "0.16.47";
const mermaidPath =
  /^\.(?:>@lapismd\/(?:mira-editor|mira-react|mira-vanilla))*>@lapismd\/mira-plugin-mermaid>(?:@mermaid-js\/layout-elk>)?mermaid>katex$/;

function fail(message) {
  throw new Error(`Packed production dependency audit failed: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Read identities from the installed cohort, without loading browser modules. */
export function readMermaidRuntime(directory) {
  function manifest(entry, name) {
    let current = path.dirname(entry);
    while (current !== path.dirname(current)) {
      try {
        const value = JSON.parse(
          readFileSync(path.join(current, "package.json"), "utf8"),
        );
        if (value.name === name) return value;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      current = path.dirname(current);
    }
    fail(`missing installed package identity: ${name}`);
  }
  const fixture = createRequire(path.join(directory, "package.json"));
  const adapter = createRequire(
    fixture.resolve("@lapismd/mira-plugin-mermaid"),
  );
  const mermaidEntry = adapter.resolve("mermaid");
  const elk = manifest(
    adapter.resolve("@mermaid-js/layout-elk"),
    "@mermaid-js/layout-elk",
  );
  return {
    mermaid: manifest(mermaidEntry, "mermaid").version,
    layoutElk: elk.version,
    layoutElkPeer: elk.peerDependencies?.mermaid,
    katex: manifest(createRequire(mermaidEntry).resolve("katex"), "katex")
      .version,
  };
}

/** Strict by default. Only the recorded unchanged Mira cohort may use its legacy scope. */
export function checkPackedAudit(result, mermaidRuntime = null) {
  if (result.error || result.signal || ![0, 1].includes(result.status)) {
    fail(
      `audit command failed: ${result.error || result.stderr || result.status}`,
    );
  }
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    fail("invalid audit JSON");
  }
  const counts = report?.metadata?.vulnerabilities;
  if (
    report?.error ||
    !isObject(report?.advisories) ||
    !isObject(counts) ||
    (report.muted !== undefined &&
      (!Array.isArray(report.muted) || report.muted.length > 0))
  ) {
    fail("invalid or incomplete pnpm audit report");
  }
  const advisories = Object.values(report.advisories);
  for (const severity of ["info", "low", "moderate", "high", "critical"]) {
    if (
      !Number.isInteger(counts[severity]) ||
      counts[severity] < 0 ||
      counts[severity] !==
        advisories.filter((entry) => entry?.severity === severity).length
    ) {
      fail("inconsistent vulnerability counts");
    }
  }
  if (advisories.length === 0) {
    if (result.status !== 0) fail("audit failed without reported advisories");
    return "Packed production audit passed with zero findings.";
  }
  if (
    result.status === 1 &&
    counts.low === advisories.length &&
    mermaidRuntime &&
    semver.satisfies(mermaidRuntime.mermaid ?? "", "^11.16.1") &&
    mermaidRuntime.layoutElk === "0.1.9" &&
    mermaidRuntime.layoutElkPeer === "^11.0.2" &&
    mermaidRuntime.katex === knownKatex
  ) {
    const known = advisories.every(
      (entry) =>
        entry.github_advisory_id === advisoryId &&
        entry.url === advisoryUrl &&
        entry.module_name === "katex" &&
        entry.severity === "low" &&
        entry.vulnerable_versions === ">=0.11.0 <0.18.2" &&
        Array.isArray(entry.findings) &&
        entry.findings.length > 0 &&
        entry.findings.every(
          (finding) =>
            finding?.version === knownKatex &&
            Array.isArray(finding.paths) &&
            finding.paths.length > 0 &&
            finding.paths.every(
              (value) => typeof value === "string" && mermaidPath.test(value),
            ),
        ),
    );
    if (known) {
      return `Accepted existing Mira cohort exception: ${advisoryId} (low; unchanged Mermaid 11/layout-ELK path to KaTeX ${knownKatex} only). The vulnerability remains in that path. Base Mira still requires zero findings. Recorded user scope: spec/records/2026-10-11-known-katex-acceptance.md. Full audit: .release/production-consumer-audit.json.`;
    }
  }
  fail(
    `${advisories.length} production finding(s): ${advisories
      .map((entry) => entry.github_advisory_id ?? entry.title)
      .join(", ")}`,
  );
}
