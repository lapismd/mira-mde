import { readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

function fail(message) {
  throw new Error(`Packed production dependency audit failed: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Read identities from the installed cohort, without loading browser modules. */
export function readMermaidRuntime(directory) {
  function installed(request, name) {
    for (const search of request.resolve.paths(name) ?? []) {
      try {
        const filename = realpathSync(path.join(search, name, "package.json"));
        const value = JSON.parse(readFileSync(filename, "utf8"));
        if (value.name !== name) fail(`unexpected installed identity: ${name}`);
        return { value, request: createRequire(filename) };
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
    fail(`missing installed package identity: ${name}`);
  }
  const fixture = createRequire(path.join(directory, "package.json"));
  const adapter = installed(fixture, "@lapismd/mira-plugin-mermaid");
  const mermaid = installed(adapter.request, "mermaid");
  if (!/^12\./.test(mermaid.value.version))
    fail("unknown bundled Mermaid layout contract");
  return {
    mermaid: mermaid.value.version,
    layoutElk: "bundled",
    layoutElkPeer: null,
    katex: installed(mermaid.request, "katex").value.version,
  };
}

/** Every newly packed base and peer cohort requires zero production findings. */
export function checkPackedAudit(result) {
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
  fail(
    `${advisories.length} production finding(s): ${advisories
      .map((entry) => entry.github_advisory_id ?? entry.title)
      .join(", ")}`,
  );
}
