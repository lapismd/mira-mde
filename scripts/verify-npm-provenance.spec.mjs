import assert from "node:assert/strict";
import test from "node:test";

import {
  npmPackagePurl,
  PROVENANCE_PREDICATE,
  verifyNpmProvenance,
} from "./verify-npm-provenance.mjs";

function auditFor(record, overrides = {}) {
  const statement = {
    subject: [
      {
        name: npmPackagePurl(record.name, record.version),
        digest: {
          sha512: Buffer.from("verified bytes").toString("hex"),
        },
      },
    ],
    predicateType: PROVENANCE_PREDICATE,
    predicate: {
      buildDefinition: {
        externalParameters: {
          workflow: {
            repository: "https://github.com/lapismd/mira-mde",
            path: ".github/workflows/release.yml",
            ref: "refs/heads/main",
            ...overrides,
          },
        },
      },
    },
  };
  return {
    verified: [
      {
        name: record.name,
        version: record.version,
        attestations: {
          provenance: { predicateType: PROVENANCE_PREDICATE },
        },
        attestationBundles: [
          {
            predicateType: PROVENANCE_PREDICATE,
            bundle: {
              dsseEnvelope: {
                payload: Buffer.from(JSON.stringify(statement)).toString(
                  "base64url",
                ),
              },
            },
          },
        ],
      },
    ],
  };
}

const record = {
  name: "@lapismd/mira",
  version: "0.0.1",
  integrity: `sha512-${Buffer.from("verified bytes").toString("base64")}`,
};

test("uses an encoded scoped npm PURL and verifies the exact tarball", () => {
  assert.equal(
    npmPackagePurl(record.name, record.version),
    "pkg:npm/%40lapismd/mira@0.0.1",
  );
  assert.equal(verifyNpmProvenance(auditFor(record), [record]).ok, true);
});

test("recovery binds signed provenance to the original workflow source and run", () => {
  const audit = auditFor(record);
  const bundle = audit.verified[0].attestationBundles[0].bundle;
  const statement = JSON.parse(
    Buffer.from(bundle.dsseEnvelope.payload, "base64url").toString(),
  );
  const workflowCommit = "a".repeat(40);
  const runId = "123";
  statement.predicate.buildDefinition.resolvedDependencies = [
    {
      uri: "git+https://github.com/lapismd/mira-mde@refs/heads/main",
      digest: { gitCommit: workflowCommit },
    },
  ];
  statement.predicate.runDetails = {
    metadata: {
      invocationId:
        "https://github.com/lapismd/mira-mde/actions/runs/123/attempts/3",
    },
  };
  bundle.dsseEnvelope.payload = Buffer.from(JSON.stringify(statement)).toString(
    "base64url",
  );
  assert.equal(
    verifyNpmProvenance(audit, [record], { workflowCommit, runId }).ok,
    true,
  );
  for (const options of [
    { workflowCommit: "b".repeat(40), runId },
    { workflowCommit, runId: "12" },
    { workflowCommit, runId: "1234" },
  ])
    assert.equal(verifyNpmProvenance(audit, [record], options).ok, false);
  delete statement.predicate.buildDefinition.resolvedDependencies;
  delete statement.predicate.runDetails;
  bundle.dsseEnvelope.payload = Buffer.from(JSON.stringify(statement)).toString(
    "base64url",
  );
  assert.equal(
    verifyNpmProvenance(audit, [record], { workflowCommit, runId }).ok,
    false,
  );
});

test("rejects the wrong workflow source or tarball digest", () => {
  const audit = auditFor(record, { path: ".github/workflows/other.yml" });
  audit.verified[0].attestationBundles[0].bundle.dsseEnvelope.payload =
    Buffer.from(
      JSON.stringify({
        subject: [
          {
            name: npmPackagePurl(record.name, record.version),
            digest: { sha512: "wrong" },
          },
        ],
        predicateType: PROVENANCE_PREDICATE,
        predicate: {
          buildDefinition: {
            externalParameters: {
              workflow: {
                repository: "https://github.com/lapismd/mira-mde",
                path: ".github/workflows/other.yml",
                ref: "refs/heads/main",
              },
            },
          },
        },
      }),
    ).toString("base64url");
  const result = verifyNpmProvenance(audit, [record]);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /digest/);
  assert.match(result.errors.join("\n"), /workflow/);
});
