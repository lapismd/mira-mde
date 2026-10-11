// Explicitly accepted on 2026-10-11; remove once upstream math ranges are patched.
const advisoryId = "GHSA-238p-pmpm-9mq7";
const advisoryUrl = `https://github.com/advisories/${advisoryId}`;
const approvedVersions = {
  "@lapismd/mira": ["0.0.2", "0.0.3"],
  "@lapismd/mira-editor": ["0.0.1", "0.0.2"],
  "@lapismd/mira-plugin-ai": ["0.0.1", "0.0.2"],
  "@lapismd/mira-plugin-mermaid": ["0.0.1", "0.0.2"],
  "@lapismd/mira-react": ["0.0.1", "0.0.2"],
  "@lapismd/mira-vanilla": ["0.0.1", "0.0.2"],
};

function fail(message) {
  throw new Error(`Packed production dependency audit failed: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function checkPackedAudit(result, versions) {
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
  if (result.status !== 1 || counts.low !== advisories.length) {
    fail("unexpected audit exit status or severity");
  }
  for (const entry of advisories) {
    if (
      entry.github_advisory_id !== advisoryId ||
      entry.url !== advisoryUrl ||
      entry.module_name !== "katex" ||
      entry.severity !== "low" ||
      entry.vulnerable_versions !== ">=0.11.0 <0.18.2" ||
      !Array.isArray(entry.findings) ||
      entry.findings.length === 0 ||
      entry.findings.some(
        (finding) =>
          typeof finding?.version !== "string" ||
          !Array.isArray(finding.paths) ||
          finding.paths.length === 0 ||
          finding.paths.some((value) => typeof value !== "string"),
      )
    ) {
      fail(`unaccepted advisory: ${entry.github_advisory_id ?? entry.title}`);
    }
  }
  if (
    !isObject(versions) ||
    Object.keys(versions).length !== Object.keys(approvedVersions).length ||
    Object.entries(approvedVersions).some(
      ([name, allowed]) => !allowed.includes(versions[name]),
    )
  ) {
    fail("KaTeX exception expired outside approved Mira release versions");
  }
  return `Accepted release exception: ${advisoryId} (low, KaTeX); Mira 0.0.3 and companion 0.0.2 releases only, including preparation versions. Full audit evidence: .release/production-consumer-audit.json.`;
}
