import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const reviewedAuditSource = "63e64958e9b271d36feba06a162ee02b079a3206";

/** Delegate collection and policy evaluation to the same immutable shared CLI. */
export function runDevelopmentAudit({
  run = spawnSync,
  root = fileURLToPath(new URL("../", import.meta.url)),
  env = process.env,
} = {}) {
  const result = run(
    "pnpm",
    [
      "--config.ignore-scripts=true",
      `--package=github:lapismd/lapis-ci#${reviewedAuditSource}`,
      "dlx",
      "lapis-development-audit",
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: {
        ...env,
        GITHUB_WORKSPACE: root,
        LAPIS_AUDIT_WORKING_DIRECTORY: ".",
        LAPIS_AUDIT_POLICY_FILE: ".github/development-audit-policy.json",
        LAPIS_AUDIT_REPORT_DIRECTORY: ".release/development-audit",
      },
    },
  );
  if (result.error || result.signal || ![0, 1].includes(result.status))
    return 1;
  return result.status;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  process.exitCode = runDevelopmentAudit();
