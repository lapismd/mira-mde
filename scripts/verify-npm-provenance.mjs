#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PROVENANCE_PREDICATE = "https://slsa.dev/provenance/v1";
export const PUBLISH_REPOSITORY = "https://github.com/lapismd/mira-mde";
export const PUBLISH_WORKFLOW = ".github/workflows/release.yml";

export function npmPackagePurl(packageName, version) {
  const separator = packageName.indexOf("/");
  const packagePath =
    packageName.startsWith("@") && separator > 1
      ? `${encodeURIComponent(packageName.slice(0, separator))}/${encodeURIComponent(
          packageName.slice(separator + 1),
        )}`
      : encodeURIComponent(packageName);
  return `pkg:npm/${packagePath}@${encodeURIComponent(version)}`;
}

function decodeStatement(bundle) {
  const payload = bundle?.dsseEnvelope?.payload;
  if (typeof payload !== "string") return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function integrityHex(integrity) {
  const match = /^sha512-(.+)$/.exec(integrity ?? "");
  return match ? Buffer.from(match[1], "base64").toString("hex") : null;
}

export function verifyNpmProvenance(
  audit,
  packageRecords,
  {
    repository = PUBLISH_REPOSITORY,
    workflow = PUBLISH_WORKFLOW,
    ref = "refs/heads/main",
  } = {},
) {
  const errors = [];
  const verified = Array.isArray(audit?.verified) ? audit.verified : [];
  for (const record of packageRecords) {
    const entry = verified.find(
      (candidate) =>
        candidate?.name === record.name &&
        candidate?.version === record.version,
    );
    if (!entry) {
      errors.push(
        `no verified registry package matched ${record.name}@${record.version}`,
      );
      continue;
    }
    if (
      entry?.attestations?.provenance?.predicateType !== PROVENANCE_PREDICATE
    ) {
      errors.push(`${record.name}: missing SLSA provenance attestation`);
    }
    const bundle = entry.attestationBundles?.find(
      (candidate) => candidate?.predicateType === PROVENANCE_PREDICATE,
    )?.bundle;
    const statement = decodeStatement(bundle);
    if (!statement) {
      errors.push(
        `${record.name}: missing readable Sigstore provenance bundle`,
      );
      continue;
    }
    const subject = statement.subject?.find(
      (candidate) =>
        candidate?.name === npmPackagePurl(record.name, record.version),
    );
    const expectedDigest = integrityHex(record.integrity);
    if (!subject?.digest?.sha512 || subject.digest.sha512 !== expectedDigest) {
      errors.push(`${record.name}: provenance tarball digest does not match`);
    }
    if (statement.predicateType !== PROVENANCE_PREDICATE) {
      errors.push(`${record.name}: provenance predicate is not SLSA v1`);
    }
    const source =
      statement.predicate?.buildDefinition?.externalParameters?.workflow;
    if (source?.repository !== repository) {
      errors.push(
        `${record.name}: provenance repository must be ${repository}`,
      );
    }
    if (source?.path !== workflow) {
      errors.push(`${record.name}: provenance workflow must be ${workflow}`);
    }
    if (source?.ref !== ref) {
      errors.push(`${record.name}: provenance ref must be ${ref}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function main() {
  const auditPath = process.argv[2];
  const manifestPath = process.argv[3];
  if (!auditPath || !manifestPath) {
    throw new Error(
      "Usage: node scripts/verify-npm-provenance.mjs audit.json release-manifest.json",
    );
  }
  const audit = JSON.parse(readFileSync(auditPath, "utf8"));
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const result = verifyNpmProvenance(audit, manifest.packages);
  if (!result.ok) throw new Error(result.errors.join("\n"));
  console.log(
    `Verified npm provenance for ${manifest.packages.length} package(s).`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    main();
  } catch (error) {
    console.error(
      `npm provenance verification failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
