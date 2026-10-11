import assert from "node:assert/strict";
import test from "node:test";
import { checkPackedAudit } from "./packed-audit-policy.mjs";

const preparation = {
  "@lapismd/mira": "0.0.2",
  "@lapismd/mira-editor": "0.0.1",
  "@lapismd/mira-plugin-ai": "0.0.1",
  "@lapismd/mira-plugin-mermaid": "0.0.1",
  "@lapismd/mira-react": "0.0.1",
  "@lapismd/mira-vanilla": "0.0.1",
};
const release = Object.fromEntries(
  Object.keys(preparation).map((name) => [
    name,
    name === "@lapismd/mira" ? "0.0.3" : "0.0.2",
  ]),
);
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

test("accepts only the recorded KaTeX advisory during preparation and release", () => {
  for (const versions of [preparation, release]) {
    for (const hasMutedField of [true, false]) {
      const value = report();
      if (!hasMutedField) delete value.muted;
      assert.match(
        checkPackedAudit(result(value), versions),
        /Accepted release exception: GHSA-238p-pmpm-9mq7/,
      );
    }
  }
});

test("exception expires for every package's next release or missing scope", () => {
  for (const name of Object.keys(release)) {
    assert.throws(
      () => checkPackedAudit(result(report()), { ...release, [name]: "0.0.4" }),
      /expired/,
    );
  }
  assert.throws(() => checkPackedAudit(result(report()), {}), /expired/);
});

test("rejects different low and high advisories alongside the accepted advisory", () => {
  for (const severity of ["low", "high"]) {
    const value = report();
    value.advisories.other = {
      ...value.advisories[1241206],
      github_advisory_id: "GHSA-other",
      severity,
    };
    value.metadata.vulnerabilities[severity] += 1;
    assert.throws(
      () => checkPackedAudit(result(value), release),
      /unaccepted|severity/,
    );
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
    assert.throws(() => checkPackedAudit(result(value), release));
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
    assert.throws(() =>
      checkPackedAudit({ ...result(report()), ...command }, release),
    );
  }
  for (const value of [
    {},
    { ...report(), error: { message: "registry unavailable" } },
    { ...report(), muted: ["hidden"] },
  ]) {
    assert.throws(() => checkPackedAudit(result(value), release));
  }
  const value = report();
  value.metadata.vulnerabilities.low = 0;
  assert.throws(() => checkPackedAudit(result(value), release), /counts/);
  value.metadata.vulnerabilities.low = 1;
  value.advisories[1241206].findings = [];
  assert.throws(() => checkPackedAudit(result(value), release), /unaccepted/);
});

test("clean audits pass beyond the exception's versions without using it", () => {
  const value = report();
  value.advisories = {};
  value.metadata.vulnerabilities.low = 0;
  assert.match(checkPackedAudit(result(value, 0), {}), /zero findings/);
  assert.throws(
    () => checkPackedAudit(result(value), release),
    /without reported/,
  );
});
