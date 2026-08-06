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
            repository: "https://github.com/lapismd/mira",
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
                repository: "https://github.com/lapismd/mira",
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
