import assert from "node:assert/strict";
import test from "node:test";
import {
  checkPackedAudit,
  readMermaidRuntime,
} from "./packed-audit-policy.mjs";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

test("reads import-only cohort identities without executing browser modules", () => {
  const directory = mkdtempSync(
    path.join(os.tmpdir(), "mira-cohort-metadata-"),
  );
  function install(parent, name, version, extra = {}) {
    const root = path.join(parent, "node_modules", name);
    mkdirSync(root, { recursive: true });
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        name,
        version,
        type: "module",
        exports: { import: "./index.js" },
        ...extra,
      }),
    );
    writeFileSync(
      path.join(root, "index.js"),
      "throw new Error('Browser module must not execute');",
    );
    return root;
  }
  try {
    writeFileSync(path.join(directory, "package.json"), "{}");
    const adapter = install(directory, "@lapismd/mira-plugin-mermaid", "0.0.3");
    const mermaid = install(adapter, "mermaid", "11.17.2");
    install(adapter, "@mermaid-js/layout-elk", "0.1.9", {
      peerDependencies: { mermaid: "^11.0.2" },
    });
    install(mermaid, "katex", "0.16.47");
    assert.deepEqual(readMermaidRuntime(directory), {
      mermaid: "11.17.2",
      layoutElk: "0.1.9",
      layoutElkPeer: "^11.0.2",
      katex: "0.16.47",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function report() {
  return {
    advisories: {
      1241206: {
        github_advisory_id: "GHSA-238p-pmpm-9mq7",
        url: "https://github.com/advisories/GHSA-238p-pmpm-9mq7",
        module_name: "katex",
        severity: "low",
        vulnerable_versions: ">=0.11.0 <0.18.2",
        findings: [
          { version: "0.16.22", paths: [".>@lapismd/mira>rehype-katex>katex"] },
        ],
      },
    },
    muted: [],
    metadata: {
      vulnerabilities: { info: 0, low: 1, moderate: 0, high: 0, critical: 0 },
    },
  };
}
const result = (value, status = 1) => ({
  stdout: JSON.stringify(value),
  status,
});
const runtime = {
  mermaid: "11.17.2",
  layoutElk: "0.1.9",
  layoutElkPeer: "^11.0.2",
  katex: "0.16.47",
};
function mermaidReport(
  paths = [".>@lapismd/mira-plugin-mermaid>mermaid>katex"],
) {
  const value = report();
  value.advisories[1241206].findings = [{ version: "0.16.47", paths }];
  return value;
}

test("rejects the formerly accepted KaTeX advisory", () => {
  assert.throws(() => checkPackedAudit(result(report())), /finding|advisory/);
});

test("retains only the recorded unchanged Mermaid cohort path", () => {
  for (const path of [
    ".>@lapismd/mira-plugin-mermaid>mermaid>katex",
    ".>@lapismd/mira-editor>@lapismd/mira-plugin-mermaid>mermaid>katex",
    ".>@lapismd/mira-react>@lapismd/mira-editor>@lapismd/mira-plugin-mermaid>@mermaid-js/layout-elk>mermaid>katex",
  ]) {
    assert.match(
      checkPackedAudit(result(mermaidReport([path])), runtime),
      /existing Mira cohort exception/,
    );
  }
});

test("base production audits never inherit the cohort acceptance", () => {
  assert.throws(() => checkPackedAudit(result(mermaidReport())), /finding/);
});

test("mixed base, external consumer and new ELK paths remain blocking", () => {
  for (const path of [
    ".>@lapismd/mira>rehype-katex>katex",
    ".>@lapis-notes/api>@lapismd/mira-plugin-mermaid>mermaid>katex",
    ".>@lapismd/mira>@lapismd/mira-plugin-mermaid>mermaid>katex",
    ".>@lapismd/mira-plugin-mermaid>@mermaid-js/layout-elk>katex",
  ]) {
    const value = mermaidReport([
      ".>@lapismd/mira-plugin-mermaid>mermaid>katex",
      path,
    ]);
    assert.throws(() => checkPackedAudit(result(value), runtime), /finding/);
  }
});

test("changed runtime identity or vulnerable version cannot use the old scope", () => {
  for (const changed of [
    { mermaid: "12.2.0" },
    { mermaid: "11.15.0" },
    { layoutElk: "1.0.1" },
    { layoutElkPeer: "^12.0.0" },
    { katex: "0.16.48" },
  ]) {
    assert.throws(
      () =>
        checkPackedAudit(result(mermaidReport()), { ...runtime, ...changed }),
      /finding/,
    );
  }
  const value = mermaidReport();
  value.advisories[1241206].findings[0].version = "0.16.48";
  assert.throws(() => checkPackedAudit(result(value), runtime), /finding/);
});

test("the cohort scope rejects changed advisory, severity, URL, package and range", () => {
  for (const [key, changed] of Object.entries({
    github_advisory_id: "GHSA-other",
    severity: "moderate",
    module_name: "other",
    url: "https://example.com",
    vulnerable_versions: "*",
  })) {
    const value = mermaidReport();
    value.advisories[1241206][key] = changed;
    assert.throws(() => checkPackedAudit(result(value), runtime));
  }
});

test("rejects other advisories at every severity alongside the former KaTeX advisory", () => {
  for (const severity of ["info", "low", "moderate", "high", "critical"]) {
    const value = report();
    value.advisories.other = {
      ...value.advisories[1241206],
      github_advisory_id: "GHSA-other",
      severity,
    };
    value.metadata.vulnerabilities[severity] += 1;
    assert.throws(() => checkPackedAudit(result(value)), /finding|severity/);
  }
});

test("rejects severity escalation and changed package, URL, or vulnerable range", () => {
  for (const [key, changed] of Object.entries({
    severity: "moderate",
    module_name: "other",
    url: "https://example.com",
    vulnerable_versions: "*",
  })) {
    const value = report();
    value.advisories[1241206][key] = changed;
    assert.throws(() => checkPackedAudit(result(value)));
  }
});

test("rejects failed commands, malformed responses, suppressed and inconsistent findings", () => {
  for (const command of [
    { status: 2 },
    { status: null, error: new Error("timeout") },
    { status: 1, signal: "SIGTERM" },
    { status: 0 },
    { stdout: "not JSON" },
  ]) {
    assert.throws(() => checkPackedAudit({ ...result(report()), ...command }));
  }
  for (const value of [
    {},
    { ...report(), error: { message: "registry unavailable" } },
    { ...report(), muted: ["hidden"] },
  ]) {
    assert.throws(() => checkPackedAudit(result(value)));
  }
  const value = report();
  value.metadata.vulnerabilities.low = 0;
  assert.throws(() => checkPackedAudit(result(value)), /counts/);
  value.metadata.vulnerabilities.low = 1;
  value.advisories[1241206].findings = [];
  assert.throws(() => checkPackedAudit(result(value)), /finding/);
});

test("clean audits pass with zero findings", () => {
  const value = report();
  value.advisories = {};
  value.metadata.vulnerabilities.low = 0;
  assert.match(checkPackedAudit(result(value, 0)), /zero findings/);
  assert.throws(() => checkPackedAudit(result(value)), /without reported/);
});
